const CircuitBreaker = require('./CircuitBreaker.js');

// What's going on here? unstableRequest is returning a promise that randomly resolves or rejects. If you aren't familiar with how promises work, you can think of resolve and reject as pass/fail. Throw in a Math.random() check and we have a function that resolves about 60% of the time.
const unstableRequest = function() {
  return new Promise((resolve, reject) => {
    if (Math.random() > .6) {
      resolve({ data: 'Success' });
    } else {
      reject({ data: 'Failed' });
    }
  });
}

// Imagine an API you use or perhaps a regional resource (AWS East vs West) is having problems. You'd like your code to adapt and call an alternate resource. Let's add a fallback to CircuitBreaker. First, we will create a new test request. In part 1 we had unstableRequest in our test.js file. This is still our main resource, but let's create an additional function to call if a problem happens with our main resource.
const expensiveResource = function() {
  return new Promise((resolve, reject) => {
    resolve({ data: 'Expensive Fallback Successful' });
  })
}

const options = {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 6000,
  fallback: expensiveResource,
}

const breaker = new CircuitBreaker(unstableRequest, options);

// We need a way to simulate multiple calls going through the breaker. We can fire all of these off at once, but that will be hard to observe. Instead, add the following after the previous code block:
setInterval(() => {
  breaker
    .fire()
    .then(console.log)
    .catch(console.error)
}, 1000);

// The above code wraps our fake API request in a setInterval that will run once per second
