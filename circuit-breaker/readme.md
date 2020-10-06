https://blog.bearer.sh/build-a-circuit-breaker-in-node-js/

https://blog.bearer.sh/build-a-circuit-breaker-in-node-js-part-2/

Now, run node test.js and observe the logs. You should see logs that contain details about the current request (inside CircuitBreaker), and the response (from unstableRequest).

Depending on the order of randomness from unstableRequest, you should see the breaker transition from CLOSED, to OPEN, to HALF-OPEN, and back to CLOSED or OPEN.