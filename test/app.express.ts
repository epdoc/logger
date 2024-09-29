// let express = require('express');
// let request = require('supertest');
// let should = require('should');
// let elogger = require('../index');
// let middleware = elogger.middleware();

import e from 'express';
import { LogManager, DefaultLogger as Logger } from '../src';

describe('Express response middleware', function () {
  this.timeout(300000);

  let app = e.application;

  beforeEach((done) => {
    let logMgr = new LogManager();
    logMgr.start().then(() => {
      let log: Logger = logMgr.getLogger('app') as Logger;
      log.info('Adding middleware');
      app.use(middleware.reqId());
      //app.use(app.router);
      app.all('*', middleware.responseLogger({ logMgr: logMgr }));
      app.all('*', middleware.routeSeparator({ separator: '-' }));
      app.all('*', middleware.routeLogger());

      app.get('/a', function (req, res) {
        req.log.pushName('a').resetElapsed();
        setTimeout(function () {
          req.log.elapsed().info('Timer should be about 500');
          res.send({ message: 'hello world' });
        }, 500);
      });
      app.get('/b', function (req, res) {
        res.json({ message: 'hello world' });
      });
      app.get('/c', function (req, res) {
        req.log.pushName('c').resetElapsed('c');
        setTimeout(function () {
          req.log.elapsed('c').info('Timer should be about 250');
          res.end('hello world');
        }, 250);
      });

      app.listen(3000);
      done();
    }, done);
  });

  it('send', function (done) {
    request(app)
      .get('/a')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          should(res).have.property('body');
          should(res.body).have.property('message', 'hello world');
          done();
        }
      });
  });

  it('json', function (done) {
    request(app)
      .get('/b')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          should(res).have.property('body');
          should(res.body).have.property('message', 'hello world');
          done();
        }
      });
  });

  it('end', function (done) {
    request(app)
      .get('/c')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          should(res).have.property('text', 'hello world');
          done();
        }
      });
  });
});
