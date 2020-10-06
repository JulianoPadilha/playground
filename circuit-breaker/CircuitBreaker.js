class CircuitBreaker {
  // Above (1), the constructor now takes an options argument in addition to the request. Next, we declare some defaults (2) for the user-configurable properties. Object.assign is then used to add the defaults, the user options, and our internal properties (3) plus the request to this. Why all the mixing of objects? We want to make sure users cannot override our internal properties. The result is a version of CircuitBreaker that behaves like our original, but now accepts options for failureThreshold, successThreshold, and timeout on instantiation.

  // 1
  constructor(request, options = {}) {
    // 2
    const defaults = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 6000,
      fallback: null,
    }

    Object.assign(this, defaults, options, {
      // 3
      request: request,
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      nextAttempt: Date.now()
    });
  }

  open() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.timeout;
  }

  close() {
    this.successCount = 0;
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  half() {
    this.state = 'HALF';
  }

  async tryFallback() {
    try {
      const response = await this.fallback();
      return response;
    } catch (error) {
      return error;
    }
  }

  async fire() {
    // Logic to fire the request

    // The fire method does the following. First, it checks if the state is OPEN because the open state requires no action to be made. It swallows the request and never sends it, but throws an Error with a message to the user.

    // If the current time has surpassed the timeout represented by nextAttempt, the state switches into HALF-OPEN. 
    if (this.state === 'OPEN') {
      if (this.nextAttempt <= Date.now()) {
        this.state = 'HALF';
      } else {
        if (this.fallback) {
          return this.tryFallback();
        }
        throw new Error('Curcuit is currently OPEN');
      }
    }

    // If the state isn't OPEN, the try/catch will run. This means CLOSED is handled. On a successful request, we trigger our success method. It takes over the responsibility of handling the half-open logic and returning the response back to the client.

    // We are relying on async/await in the try block. If an error occurs in request(), an error will be thrown into the catch block. In the same way that a success in the try block calls this.success, the catch block delegates responsibility over to this.fail where the error is eventually sent to the client.
    try {
      const response = await this.request();
      return this.success(response);
    } catch (error) {
      return this.fail(error);
    }
  }

  status(action) {
    console.table({
      Action: action,
      Timestamp: Date.now(),
      Successes: this.successCount,
      Failures: this.failureCount,
      State: this.state,
    });
  }

  success(response) {
    // Logic to handle successful request

    // If the request was successful from the HALF state, we increase the successCount by 1. If the new successCount is greater than the threshold we've set for consecutive successful requests, we reset the breaker to it's CLOSED state. We also want any successful call to reset the failureCount, so we set it to 0 outside of the HALF condition. Finally, we return the response.
    if (this.state === 'HALF') {
      this.successCount++;
      if (this.successCount > this.successThreshold) {
        this.successCount = 0;
        this.state = 'CLOSED';
      }
    }

    this.failureCount = 0;
    this.status('Success');
    return response;
  }

  fail(error) {
    // Logic to handle failed request

    // Here, we are increasing our failureCount by 1 for each failure, similar to how we did with the successCount. Then, we are performing a check to decide if our state should change from CLOSED to OPEN. If we've hit more than failureThreshold failures in a row (as tracked by failureCount), then the state is changed and we set nextAttempt to the time + timeout. This sets up our OPEN state and prevents any request from being made until the timeout period has passed. We then return the error back to the client.
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
    this.status('Failure');
    if (this.fallback) {
      return this.tryFallback();
    }
    return error;
  }
}

module.exports = CircuitBreaker;