"use strict";

var util = require('util')
  , BU = require('../util/buffer-util')
  , BufferNode = require('./buffer_node')
  , CommonBranch = require('./buffer-common-branch')
  ;

function BPlusTreeBranch(tree, NodeFactory) {
	CommonBranch.call(this, tree, NodeFactory, {size: 4});
};

exports = module.exports = BPlusTreeBranch;

util.inherits(BPlusTreeBranch, CommonBranch);

//----

BPlusTreeBranch.prototype.makeBranchData = function() {
  return BU.fromInt32LE(this._id);
};

