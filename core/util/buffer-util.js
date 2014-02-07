"use strict";

var assert = require('assert')
  , util = require('util')
  ;

exports = module.exports = {};

exports.equal = function (a, b) {
  if (a.length !== b.length) return false;
  for (var i=0; i<a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
};

exports.assertEqual = function(a, b, msg) {
  assert(exports.equal(a,b), (msg === undefined) ? "DIFFERENT "+util.inspect(a)+" & "+util.inspect(b) : msg);
};

exports.copy = function(a, b) {
  return a.copy(b, 0);
};

exports.fromInt32LE = function(i, buf, offset) {
  if (buf === undefined) buf = new Buffer(4);
  if (offset === undefined) offset = 0;

  buf[offset] = i & 0xFF; i >>>= 8; offset++;
  buf[offset] = i & 0xFF; i >>>= 8; offset++;
  buf[offset] = i & 0xFF; i >>>= 8; offset++;
  buf[offset] = i & 0xFF; i >>>= 8;

	return buf;
};

exports.fromInt64LE = function(i, buf, offset) {
  if (buf === undefined) buf = new Buffer(8);
  if (offset === undefined) offset = 0;

  exports.fromInt32LE(Math.floor(i / 2097152), buf, offset+4);
  exports.fromInt32LE((i % 2097152) , buf, offset);
	return buf;
};

exports.toInt32LE = function(buf, offset) {
  if (offset === undefined) offset = 0;

  return (((((buf[offset+3]<<8)+buf[offset+2])<<8)+buf[offset+1])<<8)+buf[offset+0];
};

exports.toInt64LE = function(buf, offset) {
  if (offset === undefined) offset = 0;

	return exports.toInt32LE(buf, offset+4)*2097152+exports.toInt32LE(buf, offset);
};

exports.compareInt32LE = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

	offset1 += 3; offset2 += 3;
	var c;
  if ( (c = ((buf2[offset2]&0x80) - (buf1[offset1]&0x80))) !==0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	return buf1[offset1--]-buf2[offset2--];
};

exports.compareInt32LEDesc = function(buf1, offset1, buf2, offset2) {
	return -exports.compareInt32LE(buf1, offset1, buf2, offset2);
};

exports.compareInt64LE = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

	offset1 += 7; offset2 += 7;
	var c;
  if ( (c = ((buf2[offset2]&0x80) - (buf1[offset1]&0x80))) !==0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	if ( (c = buf1[offset1--]-buf2[offset2--]) !== 0) return c;
	return buf1[offset1--]-buf2[offset2--];
};

// reverse mapping
exports.compareInt64LER = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

	var c;
	if ( (c = buf1[offset1++]-buf2[offset2++]) !== 0) return c;
	if ( (c = buf1[offset1++]-buf2[offset2++]) !== 0) return c;
	if ( (c = buf1[offset1++]-buf2[offset2++]) !== 0) return c;
	if ( (c = buf1[offset1++]-buf2[offset2++]) !== 0) return c;
	if ( (c = buf1[offset1++]-buf2[offset2++]) !== 0) return c;
	if ( (c = buf1[offset1++]-buf2[offset2++]) !== 0) return c;
	if ( (c = buf1[offset1++]-buf2[offset2++]) !== 0) return c;
	return buf1[offset1++]-buf2[offset2++];
};
exports.BcompareInt64LER = function(buf1, offset1, buf2, offset2) {
	return exports.compareInt64LER(this, buf1, offset1);
};

exports.compareInt64LEDesc = function(buf1, offset1, buf2, offset2) {
	return -exports.compareInt64LE(buf1, offset1, buf2, offset2);
};

exports.compareI32AI64A = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

  var c = exports.compareInt32LE(buf1, offset1, buf2, offset2);
	if (c !== 0) return c;
	return exports.compareInt64LE(buf1, offset1+4, buf2, offset2+4);
};

exports.compareI32AI64D = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

  var c = exports.compareInt32LE(buf1, offset1, buf2, offset2);
	if (c !== 0) return c;
	return exports.compareInt64LEDesc(buf1, offset1+4, buf2, offset2+4);
};

exports.compareI32DI64A = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

  var c = exports.compareInt32LEDesc(buf1, offset1, buf2, offset2);
	if (c !== 0) return c;
	c = exports.compareInt64LE(buf1, offset1+4, buf2, offset2+4);
	return c;
};

exports.compareI32DI64D = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

  var c = exports.compareInt32LE(buf1, offset1, buf2, offset2);
	if (c !== 0) return c;
	return exports.compareInt64LEDesc(buf1, offset1+4, buf2, offset2+4);
};

exports.BcompareI32AI64A = function(buf1, offset1, buf2, offset2) {
	return exports.compareI32AI64A(this, buf1, offset1);
};
exports.BcompareI32AI64D = function(buf1, offset1, buf2, offset2) {
	return exports.compareI32AI64D(this, buf1, offset1);
};
exports.BcompareI32DI64A = function(buf1, offset1, buf2, offset2) {
	return exports.compareI32DI64A(this, buf1, offset1);
};
exports.BcompareI32DI64D = function(buf1, offset1, buf2, offset2) {
	return exports.compareI32DI64D(this, buf1, offset1);
};

exports.fromNow = function(buf, offset) {
  if (buf === undefined) buf = new Buffer(8);
  if (offset === undefined) offset = 0;

  var timestamp = (new Date()).getTime();
  exports.fromInt32LE(Math.floor(timestamp / 2097152), buf, offset+4);
  exports.fromInt32LE((timestamp % 2097152) * 1024 + Math.floor(Math.random()*1024), buf, offset);
	return buf;
}

// for count & children
exports.fromInt32LEInt32LE = function(i1, i2, buf, offset) {
  if (buf === undefined) buf = new Buffer(4);
  if (offset === undefined) offset = 0;

  buf[offset] = i1 & 0xFF; i1 >>>= 8; offset++;
  buf[offset] = i1 & 0xFF; i1 >>>= 8; offset++;
  buf[offset] = i1 & 0xFF; i1 >>>= 8; offset++;
  buf[offset] = i1 & 0xFF; i1 >>>= 8; offset++;

  buf[offset] = i2 & 0xFF; i2 >>>= 8; offset++;
  buf[offset] = i2 & 0xFF; i2 >>>= 8; offset++;
  buf[offset] = i2 & 0xFF; i2 >>>= 8; offset++;
  buf[offset] = i2 & 0xFF; i2 >>>= 8; offset++;

	return buf;
};

exports.PLUS1 = exports.fromInt32LE(1);
exports.MINUS1 = exports.fromInt32LE(-1);
exports.ZERO = exports.fromInt32LE(0);

exports.addInt32LE = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

  var t = buf1[offset1] + buf2[offset2];
	buf1[offset1] = t & 0xFF; t >>>= 8; offset1++; offset2++;
  t += buf1[offset1] + buf2[offset2];
	buf1[offset1] = t & 0xFF; t >>>= 8; offset1++; offset2++;
  t += buf1[offset1] + buf2[offset2];
	buf1[offset1] = t & 0xFF; t >>>= 8; offset1++; offset2++;
  t += buf1[offset1] + buf2[offset2];
	buf1[offset1] = t & 0xFF; 
  return buf1;
};

exports.subInt32LE = function(buf1, offset1, buf2, offset2) {
	if (offset1 instanceof Buffer) { offset2 = buf2; buf2 = offset1; offset1 = 0; }
	if (offset2 === undefined) offset2 = 0;

  var t = buf1[offset1] - buf2[offset2];
	buf1[offset1] = t & 0xFF; t >>>= 8; offset1++; offset2++;
  t += buf1[offset1] - buf2[offset2];
	buf1[offset1] = t & 0xFF; t >>>= 8; offset1++; offset2++;
  t += buf1[offset1] - buf2[offset2];
	buf1[offset1] = t & 0xFF; t >>>= 8; offset1++; offset2++;
  t += buf1[offset1] - buf2[offset2];
	buf1[offset1] = t & 0xFF; 
  return buf1;
};


