"use strict";

var util = require('util')
  , Node = require('./node')
  , bisect = require('../util/bisect')
  , BU = require('../util/buffer-util')
  ;

exports = module.exports = FixedBufferNode;

util.inherits(FixedBufferNode, Node);

function FixedBufferNode(storage, block_size, keyhandler, valuehandler, extra) {
  if (!(this instanceof FixedBufferNode)) {
    return new FixedBufferNode(storage, block_size, keyhandler, valuehandler, extra);
  }

  this.block_size = block_size || 1024;
  this.buffer = new Buffer(this.block_size);

  this.keyhandler = keyhandler;
  this.valuehandler = valuehandler;

  this.keysize = this.keyhandler.size;
  this.valuesize = this.valuehandler.size;
  this.kvsize = this.keysize + this.valuesize;
  this.extra = extra;
  this.extra_pos = this.block_size - this.extra;
  this.end_of_kv = this.block_size - this.extra - 4; // for length

  var kvsize = this.kvsize;
  var keysize = this.keysize;
  var bisector = bisect.bisector(
		function(item, pos) { 
			// return this.slice(pos*kvsize, pos*kvsize+keysize); 
			return pos*kvsize;
		}, keyhandler.comparor);
  this.left_bisector = bisector.left;
  this.right_bisector = bisector.right;

	this.ZERO = new Buffer(this.keysize);
	this.ZERO.fill(0);

  // Node.call(this, undefined, Math.floor((this.block_size - this.extra - 4) / this.kvsize)-1);
  Node.call(this, Math.floor(this.end_of_kv / this.kvsize) - 1, storage);
};

util.inherits(FixedBufferNode, Node);

FixedBufferNode.prototype.__insert = function(pos, key, value) {
  this.buffer.copy(this.buffer, (pos+1)*this.kvsize, pos*this.kvsize, this.length*this.kvsize);
  if (key !== undefined) {
    key.copy(this.buffer, pos*this.kvsize, 0, this.keysize);
  }
  if (value !== undefined) {
    value.copy(this.buffer, pos*this.kvsize+this.keysize, 0, this.valuesize);
  }
};

FixedBufferNode.prototype.__remove = function(pos) {
  var key = new Buffer(this.buffer.slice(pos*this.kvsize, pos*this.kvsize+this.keysize));
  var value = new Buffer(this.buffer.slice(pos*this.kvsize+this.keysize, (pos+1)*this.kvsize));

  this.buffer.copy(this.buffer, (pos)*this.kvsize, (pos+1)*this.kvsize, this.end_of_kvsize);
  return [key, value];
};

FixedBufferNode.prototype._slice = function(startP, endP) {
  // throw new Error("Need to define this");
  // pass handling info to user or ...
  return new Buffer(this.buffer.slice(startP*this.kvsize, endP*this.kvsize));
}

FixedBufferNode.prototype._get = function(pos) {
  return [this.buffer.slice(pos*this.kvsize, pos*this.kvsize+this.keysize),
          this.buffer.slice(pos*this.kvsize+this.keysize, (pos+1)*this.kvsize)];
};

FixedBufferNode.prototype._getKey = function(pos) {
  return this.buffer.slice(pos*this.kvsize, pos*this.kvsize+this.keysize);
};

FixedBufferNode.prototype._setKey = function(pos, key) {
  key.copy(this.buffer, pos*this.kvsize, 0, this.keysize);
}

FixedBufferNode.prototype._replace = function(pos, newvalue) {
  newvalue.copy(this.buffer, pos*this.kvsize+this.keysize, 0, this.valuesize);
};

FixedBufferNode.prototype._split = function(half, node2) {
  // XXX - or get another node as param and split it.
  // var node2 = new FixedBufferNode(this.block_size, this.keyhandler, this.valuehandler, this.extra);
  this.buffer.copy(node2.buffer, 0, half*this.kvsize, this.length*this.kvsize);
  return node2;
};

FixedBufferNode.prototype._merge = function(node2) {
  node2.buffer.copy(this.buffer, this.length*this.kvsize, 0, node2.length*node2.kvsize);
  this.length += node2.length;
  return this;
};

FixedBufferNode.prototype._bisect_left = function(key, lo, hi) {
  return this.left_bisector(this.buffer, key, lo, hi);
};

FixedBufferNode.prototype._bisect_right = function(key, lo, hi) {
  return this.right_bisector(this.buffer, key, lo, hi);
};

FixedBufferNode.prototype.to_buffer = function(max_limit) {
  BU.fromInt32LE(this.length, this.buffer, this.end_of_kv);
  return this.buffer;
};

FixedBufferNode.prototype.from_buffer = function(buffer) {
  this.buffer = buffer; // XXX - for safety new Buffer(buffer); or buffer.copy(this.buffer, 0);
  this.length = BU.toInt32LE(this.buffer, this.end_of_kv);
};

