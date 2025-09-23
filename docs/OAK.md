## [Oak](https://jsr.io/@oak/oak) Integration

Oak is a Deno, Nodejs and Bun friendly implementation based on [Koa](https://koajs.com/#application).

This shows how to integrate our logger into the request handler stack, thereby allowing log messages to be tracked by
request. This sample output shows a request ID of `00001` that is generated from a counter. You can use any information
from the request to use as the request ID. If you have session information (eg. username) you can also add that via a
`sid` value in the `getChild` method and by setting `sid` to true in `showOpts`.

```log
21.982s [INFO ] 00001   HTTP GET "http://localhost:8080/alive"  -  200 8ms
```

### Perform the usual logger configuration

Enable display of the reqId in log output, along with elapsed time since the server was launched and log level.

```typescript
import { Log } from '@epdoc/logger';

type M = Log.MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const showOpts: Log.EmitterShowOpts = {
  level: true,
  timestamp: 'elapsed',
  reqId: true,
};

// Create a new Log Manager instance.
const logMgr = new Log.Mgr<M>();

// Get a logger instance from the manager.
const rootLogger = logMgr.getLogger<L>();
logMgr.threshold = 'verbose';
```

### Implement middleware to add the logger

```typescript
const addLogger = async (context: Context, next: Next) => {
  context.state.log = rootLogger.getChild({ reqId: newReqId() });

  context.state.log.verbose.text('Received request').emit();
  await next();
  const rt = context.response.headers.get('X-Response-Time');
};

// Optional: Add response time header middleware
const addResponseTimeHeader = async (ctx: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set('X-Response-Time', `${ms}ms`);
};
```

### Add the middleware

```typescript
import { Application, type Context, type Next, Router } from '@oak/oak'; // Or directly from oak URL

const appHttp = new Application();
const router = new Router();

this.appHttp.use(addLogger);
this.appHttp.use(addResponseTimeHeader);

// Set up your routes and add those as well (setup not shown)
this.appHttp.use(this.router.routes());
```

### Sample code to generate an auto incremented reqId

```ts
let reqId = 0;
const REQ_LEN = 5;
const REQ_MAX = Math.pow(10, REQ_LEN);

export function newReqId(): string {
  reqId = (reqId + 1) % REQ_MAX;
  return String(reqId).padStart(REQ_LEN, '0');
}
```
