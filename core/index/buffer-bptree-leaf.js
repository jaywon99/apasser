"use strict";

var util = require('util')
  , BU = require('../util/buffer-util')
  , CommonLeaf = require('./buffer-common-leaf')
  ;

function BPlusTreeLeaf(tree, NodeFactory, next) {
	CommonLeaf.call(this, tree, NodeFactory, next);
}

util.inherits(BPlusTreeLeaf, CommonLeaf)

exports = module.exports = BPlusTreeLeaf;

//----
BPlusTreeLeaf.prototype.makeBranchData = function() {
  return BU.fromInt32LE(this._id);
};

BPlusTreeLeaf.prototype.escalateCount = function(ancestors, inc) {
}

