"use strict";

var util = require('util')
  , BU = require('../util/buffer-util')
  , BufferNode = require('./buffer_node')
  , CommonBranch = require('./buffer-common-branch')
  ;

function RankBPlusTreeBranch(tree, NodeFactory) {
  CommonBranch.call(this, tree, NodeFactory, {size: 8});
};

exports = module.exports = RankBPlusTreeBranch;

util.inherits(RankBPlusTreeBranch, CommonBranch);

// --------------------
RankBPlusTreeBranch.prototype.makeBranchData = function() {
  var buf = new Buffer(8);
  BU.fromInt32LE(this._id, buf);
  var counts = this.countChildren();
  counts.copy(buf, 4);
  return buf;
};

RankBPlusTreeBranch.prototype.getCount = function(pos) {
  // var kv = this.get(pos);
  // return kv[1].slice(4,8);
  return this.buffer.slice(pos*this.kvsize+this.keysize+4, pos*this.kvsize+this.keysize+8);
};

RankBPlusTreeBranch.prototype.setCount = function(pos, cnt) {

/*
  var kv = this.get(pos);
  if (cnt instanceof Buffer) {
    cnt.copy(kv[1], 4);
  } else {
    BU.fromInt32LE(cnt, kv[1], 4);
  }
  this.replace(pos, kv[1]);
*/

  // var buf = this.buffer.slice(pos*this.kvsize+this.keysize+4, pos*this.kvsize+this.keysize+8);
  if (cnt instanceof Buffer) {
    cnt.copy(this.buffer, pos*this.kvsize+this.keysize+4);
  } else {
    BU.fromInt32LE(cnt, this.buffer, pos*this.kvsize+this.keysize+4);
  }
  this.dirty();

};

RankBPlusTreeBranch.prototype.addCount = function(pos, cnt) {
/*
  var kv = this.get(pos);
  if (cnt instanceof Buffer) {
    BU.addInt32LE(kv[1], 4, cnt);
  } else {
    BU.addInt32LE(kv[1], 4, BU.fromInt32LE(cnt));
  }
  this.replace(pos, kv[1]);
*/

  // var buf = this.buffer.slice(pos*this.kvsize+this.keysize+4, pos*this.kvsize+this.keysize+8);
  if (cnt instanceof Buffer) {
    BU.addInt32LE(this.buffer, pos*this.kvsize+this.keysize+4, cnt);
  } else {
    BU.addInt32LE(this.buffer, pos*this.kvsize+this.keysize+4, BU.fromInt32LE(cnt));
  }
  this.dirty();

};

RankBPlusTreeBranch.prototype.subCount = function(pos, cnt) {
/*
  var kv = this.get(pos);
  if (cnt instanceof Buffer) {
    BU.subInt32LE(kv[1], 4, cnt);
  } else {
    BU.subInt32LE(kv[1], 4, BU.fromInt32LE(cnt));
  }
  this.replace(pos, kv[1]);
*/

  if (cnt instanceof Buffer) {
    BU.subInt32LE(this.buffer, pos*this.kvsize+this.keysize+4, cnt);
  } else {
    BU.subInt32LE(this.buffer, pos*this.kvsize+this.keysize+4, BU.fromInt32LE(cnt));
  }
  this.dirty();

};

RankBPlusTreeBranch.prototype.countChildren = function(pos, buf) {
	if (pos === undefined) pos = this.length;
	if (buf === undefined) {
  	buf = new Buffer(4); buf.fill(0, 0, 4);
	}
  for (var i=pos*this.kvsize-this.valuesize+4; i>0; i-=this.kvsize) {
    BU.addInt32LE(buf, this.buffer, i);
  }
  return buf;
};


