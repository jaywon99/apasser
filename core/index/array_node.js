"use strict";

var util = require('util')
  , Node = require('./node')
  , bisect = require('../util/bisect')
  // , BufferReader = require('../../util/buffer-reader')
  ;

exports = module.exports = ArrayNode;

// function ArrayNode(_id, order, kv, keyhandler, valuehandler) {
function ArrayNode(order, storage, keyhandler, valuehandler, kv) {
  if (!(this instanceof ArrayNode)) {
    return new ArrayNode(order, storage, kv, keyhandler, valuehandler);
  }

  Node.call(this, order, storage);

  if (kv === undefined) {
    this.kv = [];
  } else {
    this.kv = kv;
  }
  this.keyhandler = keyhandler;
  this.valuehandler = valuehandler;

  var bisector = bisect.bisector(function(item, pos) { return item[0]; }, keyhandler.comparor);
  this.left_bisector = bisector.left;
  this.right_bisector = bisector.right;

};

util.inherits(ArrayNode, Node);

ArrayNode.prototype.__insert = function(pos, key, value) {
  this.kv.splice(pos, 0, [key, value]);
};

ArrayNode.prototype.__remove = function(pos) {
  var deleted = this.kv[pos];
  this.kv.splice(pos, 1); // DO WE NEED CLONE???
  return deleted;
};

ArrayNode.prototype._get = function(pos) {
  return this.kv[pos];
};

ArrayNode.prototype._slice = function(startP, endP) {
  return this.kv.slice(startP, endP);
};

ArrayNode.prototype._getKey = function(pos) {
  return this.kv[pos][0];
};

ArrayNode.prototype._setKey = function(pos, newkey) {
  this.kv[pos][0] = newkey;
};

ArrayNode.prototype._replace = function(pos, newvalue) {
  this.kv[pos][1] = newvalue;
};

ArrayNode.prototype._split = function(pos, newnode) {
  newnode.kv = this.kv.slice(pos);
  this.kv = this.kv.slice(0, pos);
};

ArrayNode.prototype._merge = function(node2) {
  this.kv = this.kv.concat(node2.kv);
  this.length += node2.length;
};

ArrayNode.prototype._bisect_left = function(key, lo, hi) {
  return this.left_bisector(this.kv, key, lo, hi);
};

ArrayNode.prototype._bisect_right = function(key, lo, hi) {
  return this.right_bisector(this.kv, key, lo, hi);
};

ArrayNode.prototype.to_buffer = function(max_limit) {
  var buffer = new BufferBuilder(max_limit);
  buffer.appendUInt32LE(this.length);
  for (var i=0; i<this.kv.length; i++) {
    this.keyhandler.to_buffer(this.kv[i].key, buffer);
    this.valuehandler.to_buffer(this.kv[i].data, buffer);
  }
  if (max_limit >= buffer.length) {
    buffer.fill(0, max_limit - buffer.length);
  }
  return buffer.get();
};

ArrayNode.prototype.from_buffer = function(buffer) {
  var bufferReader = new BufferReader(buffer);
  this.length = bufferReader.readUInt32LE();
  this.kv = [];
  for (var i=0; i<this.length; i++) {
    var kvpair = [];
    kvpair[0] = this.keyhandler.from_buffer(bufferReader);
    kvpair[1] = this.valuehandler.from_buffer(bufferReader);
    this.kv.push(kvpair);
  }

};


