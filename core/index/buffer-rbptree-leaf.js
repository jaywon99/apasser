"use strict";

var util = require('util')
  , BU = require('../util/buffer-util')
  , CommonLeaf = require('./buffer-common-leaf')
  ;

function RankBPlusTreeLeaf(tree, NodeFactory, next) {
	CommonLeaf.call(this, tree, NodeFactory, next);
}

util.inherits(RankBPlusTreeLeaf, CommonLeaf)

exports = module.exports = RankBPlusTreeLeaf;

//----
RankBPlusTreeLeaf.prototype.makeBranchData = function() {
  var buf = new Buffer(8);
  BU.fromInt32LE(this._id, buf);
  BU.fromInt32LE(this.length, buf, 4);
  return buf;
};

RankBPlusTreeLeaf.prototype.escalateCount = function(ancestors, inc) {
  for (var i=ancestors.length-1; i>=0; i--) {
    ancestors[i][0].addCount(ancestors[i][1], inc);
  }
}

