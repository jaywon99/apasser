"use strict";

exports = module.exports = Node;

function Node(order, storage) {
	this.storage = storage;
  this.order = order;
  this.minimum = this.order >>> 1;

  this.length = 0;
  this.dirty_flag = true;

	this._id = undefined;
};

Node.prototype.dirty = function() {
	this.storage.save(this);
};

Node.prototype.recycle = function() {
	this.storage.recycle(this);
};

Node.prototype._insert = function(pos, key, value) {
  if (pos > this.length) {
    throw new Error("Can't insert after last");
  }

  this.__insert(pos, key, value);
  this.dirty();
  this.length ++;
};

Node.prototype._remove = function(pos) {
  if (this.length <= 0) {
    throw new Error("Can't remove on empty");
  }
  if (pos >= this.length) {
    throw new Error("Can't remove not inserted one");
  }

  var old = this.__remove(pos);
  this.dirty();
  this.length --;
  return old;
};

Node.prototype.get = function(pos) {
  if (pos >= this.length) throw new Error("POS >= LENGTH");

  return this._get(pos);
};

Node.prototype.slice = function(startP, endP) {
  if (startP < 0) throw new Error("startP < 0");
  if (endP > this.length) throw new Error("endP >= LENGTH");

  var rc = this._slice(startP, endP);
  this.dirty();
	return rc;
}

Node.prototype.getKey = function(pos) {
  if (pos < 0) throw new Error("POS < 0");
  if (pos >= this.length) throw new Error("POS >= LENGTH");
  return this._getKey(pos);
};

Node.prototype.setKey = function(pos, key) {
  if (pos < 0) throw new Error("POS < 0");
  if (pos >= this.length) throw new Error("POS >= LENGTH");
  var rc = this._setKey(pos, key);
  this.dirty();
	return rc;
}

Node.prototype.replace = function(pos, data) {
  if (pos < 0) throw new Error("POS < 0");
  if (pos >= this.length) throw new Error("POS >= LENGTH");
  var rc = this._replace(pos, data);
  this.dirty();
	return rc;
}

Node.prototype.pop = function() {
  return this._remove(this.length-1);
};

Node.prototype.push = function(key, value) {
  return this._insert(this.length, key, value);
};

Node.prototype.unshift = function(key, value) {
  return this._insert(0, key, value);
};

Node.prototype.shift = function() {
  return this._remove(0);
};

Node.prototype.split = function(pos, into) {
  this._split(pos, into);
  this.dirty();
  into.dirty();
  into.length = this.length - pos;
  this.length = pos;
  return into;
};

Node.prototype.merge = function(node2) {
  var rc = this._merge(node2);
  this.dirty();
	return rc;
};

Node.prototype.bisect_left = function(key, lo, hi) {
  return this._bisect_left(key, lo || 0, hi || this.length);
};

Node.prototype.bisect_right = function(key, lo, hi) {
  return this._bisect_right(key, lo || 0, hi || this.length);
};

Node.prototype.__insert = function(pos, key, value) {
  throw new Error("Unimplemented Exception");
};

Node.prototype.__remove = function(pos) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._get = function(pos) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._slice = function(startP, endP) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._getKey = function(pos) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._setKey = function(pos, newkey) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._replace = function(pos, newvalue) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._split = function(pos, newnode) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._merge = function(node2) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._bisect_left = function(key, lo, hi) {
  throw new Error("Unimplemented Exception");
};

Node.prototype._bisect_right = function(key, lo, hi) {
  throw new Error("Unimplemented Exception");
};

Node.prototype.toBuffer = function(options) {
  throw new Error("Unimplemented Exception");
};

Node.prototype.fromBuffer = function(buffer) {
  throw new Error("Unimplemented Exception");
};


