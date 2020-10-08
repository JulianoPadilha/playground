import debug from 'debug';
const log = debug('agent:test');

import { readdir } from 'fs/promises'
import { resolve } from 'path'
import { Server } from 'http';
import assert from 'assert';
import { start as InjectMiddleware } from './agent.js';

const tracker = new assert.CallTracker();

const eventName = 'request';

const database = [{
  "id": 1,
  "name": "Juliano",
  "paidIn": "USD",
  "speaks": "fr"
}];

const user = database[0];
const request = {
  headers: {
    'x-app-id': user.id
  }
};
const response = {
  setHeader: () => { },
  on(m, cb) { cb() }
}

InjectMiddleware(database);
const serverInstance = new Server();

{
  const expectedCallCount = 1;
  const setHeader = tracker.calls(expectedCallCount);
  serverInstance.emit(eventName, request, { ...response, setHeader });

  log('user', JSON.stringify(request.user));

  assert.ok(request.user.requestId);
  assert.deepStrictEqual(request.user.name, user.name);
}

{
  const reportsFolder = `${resolve()}/reports`
  const dirBefore = await readdir(reportsFolder)

  const { headers, user, ...requestData } = request
  const messageError = "Cannot read property 'x-app-id' of undefined"

  process.on('uncaughtException', async (err) => {
      if (!(!!~err.message.indexOf(messageError)))
          return log(err);

      const dirAfter = await readdir(reportsFolder) 
      assert.notEqual(dirBefore.length, dirAfter.length) 
  });
  serverInstance.emit(eventName, requestData, response)
}

process.on('exit', () => tracker.verify());