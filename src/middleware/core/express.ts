import { dateUtil } from '@epdoc/timeutil';
import { NextFunction, Request, Response } from 'express';
import { Logger } from '../../core';
import * as express from '../express-types';
import { MiddlewareRouteInfo } from '../types';
import { LoggerMiddleware } from './base';
import { ExpressResponseHooks } from './response-hooks';

// let Response = require('./response');
// let Logger = require('../logger');

let reqId = 0;

export class Middleware extends LoggerMiddleware {
  requestId(req: express.LoggerRequest, res: Response, next: NextFunction) {
    req._reqId = ++reqId;
    req._hrStartTime = process.hrtime();
    next();
  }

  requestLogger(req: Request, res: express.LoggerResponse, next: NextFunction) {
    let ctx = { req: req, res: res };
    req[this._objName] = this.getNewLogger().emitter(this._emitter).context(ctx);
    res[this._objName] = req[this._objName];

    if (this.excludedMethod(req.method)) {
      res[this._objName].silent = true;
    } else {
      // We need the super's send method because we're going to muck with it
      res._origSend = res.send;
      res.send = ExpressResponseHooks.send;

      // We need the super's send method
      res._origEnd = res.end;
      res.end = ExpressResponseHooks.end;

      res.delayTime = ExpressResponseHooks.delayTime;
    }

    next();
  }

  getLogger(req: express.LoggerRequest): Logger {
    return req[this._objName];
  }

  routeLogger(req: express.LoggerRequest, res: Response, next: NextFunction) {
    let log = this.getLogger(req);
    if (log) {
      let d: Date = req._startTime || new Date();
      let data: MiddlewareRouteInfo = {
        method: req.method,
        path: req.path,
        protocol: req.protocol,
        //sidNew: ( rawCookie ? false : true ),
        ip: req.ip,
        query: req.query,
        utctime: d.toISOString()
      };
      if (req.session && req.session.id) {
        data.sid = req.session.id;
      }
      if (req.method && req.method.toLowerCase() === 'post') {
        data['content-length'] = req.get('Content-Length');
      }
      super.logRouteInfo(log, data);
    }

    next();
  }

  routeSeparator(req: express.LoggerRequest, res: Response, next: NextFunction) {
    const log: Logger = this.getLogger(req);
    if (log) {
      let d = req._startTime || new Date();
      let data: MiddlewareRouteInfo = {
        method: req.method,
        path: decodeURI(req.path),
        ip: req.ip
      };
      if (req.session) {
        data.sid = req.session.id;
      }
      data.query = req.query;
      data.localtime = dateUtil(d).toISOLocaleString();
      // data.utctime = (d).toISOString();

      super.logRouteSeparator(log, data);
    }
    next();
  }
}
