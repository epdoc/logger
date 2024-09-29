/*****************************************************************************
 * app.format.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

let format = require('../src/format');
let should = require('should');

describe('format', function () {
  it('formatMs', function (done) {
    let ms = (45 * 60 + 36) * 1000 + 2;
    let s = format.formatMS(ms);
    should(s).equal('45:36.002');
    ms = (122 * 60 + 3) * 1000 + 789;
    s = format.formatMS(ms);
    should(s).equal('122:03.789');
    ms = (0 * 60 + 59) * 1000 + 789;
    s = format.formatMS(ms);
    should(s).equal('00:59.789');
    done();
  });

  it('errorToString', function (done) {
    let msg = 'This is a message';
    let err = new Error(msg);
    let s = format.errorToStringArray(err).join(' ');
    should(s).equal(msg);

    err.errors = ['error 1.', 'error 2.'];
    s = format.errorToStringArray(err).join(' ');
    should(s).equal([msg].concat(err.errors).join(' '));

    err.errors = { a: 'error 1.', b: 'error 2.' };
    s = format.errorToStringArray(err).join(' ');
    should(s).equal([msg, err.errors.a, err.errors.b].join(' '));

    err.errors = { a: { message: 'error 1.' }, b: { message: 'error 2.' } };
    s = format.errorToStringArray(err).join(' ');
    should(s).equal([msg, err.errors.a.message, err.errors.b.message].join(' '));

    done();
  });
});
