"use strict";

var util = require('util')
  , BU = require('../util/buffer-util')
  , BufferNode = require('./buffer_node')
  ;

function CommonBPlusTreeBranch(tree, NodeFactory, valuehandler) {
  if (tree === undefined) {
    throw new Error("ArgumentException: tree was not defined");
  }

  this.tree = tree;
  this.NodeFactory = NodeFactory;

  BufferNode.call(this, this.NodeFactory, tree.block_size, tree.keyhandler, valuehandler, 4);

  this.isLeaf = false;
  this._id = undefined;
};

exports = module.exports = CommonBPlusTreeBranch;

util.inherits(CommonBPlusTreeBranch, BufferNode);

CommonBPlusTreeBranch.prototype.lateral = function(p, p_index, d, d_index) {
  if (p_index > d_index) {
    var cntbuf = this.getCount(0);
    // var firstkv = this.shift();
    // d.push(p.getKey(p_index), firstkv[1]);
    this.shift_and_push_to(d);
    // d.setKey(d.length-1, p.getKey(p_index));
    p.copyKey(p_index, d, d.length-1);

    // p.setKey(p_index, this.getKey(0));
    this.copyKey(0, p, p_index);

    p.addCount(p_index, cntbuf);
    p.subCount(d_index, cntbuf);
  } else {
    var cntbuf = this.getCount(this.length-1);

    // var lastkv = this.pop();
    // d.setKey(0, p.getKey(d_index));
    // d.unshift(lastkv[0], lastkv[1]);
    // p.setKey(d_index, lastkv[0]);

    // d.setKey(0, p.getKey(d_index));
    p.copyKey(d_index, d, 0);
    this.pop_and_unshift_to(d);
    // p.setKey(d_index, d.getKey(0));
    d.copyKey(0, p, d_index);

    p.subCount(p_index, cntbuf);
    p.addCount(d_index, cntbuf);
  }
};

CommonBPlusTreeBranch.prototype.shrink = function(ancestors) {
  var p = null, p_index = null;
  if (ancestors.length > 0) {
    var apair = ancestors.pop();
    p = apair[0], p_index = apair[1];

    if (p_index > 0) {
      var left_sib = p.getChildSync(p_index-1);
      if (left_sib.length < left_sib.order) {
        this.lateral(p, p_index, left_sib, p_index-1);
        return;
      }
    }
    if (p_index + 1 < p.length) {
      var right_sib = p.getChildSync(p_index+1);
      if (right_sib.length < right_sib.order) {
        this.lateral(p, p_index, right_sib, p_index+1);
        return;
      }
    }
  }

  if (!p) {
    p = this.NodeFactory.NewBranch();
    p._insert(0, this.ZERO, this.makeBranchData());
    p_index = 0;
    this.tree.set_root(p);
  }

  var sibling = this.splitBranch();

  p._insert(p_index+1, sibling.getKey(0), sibling.makeBranchData());
  p.setCount(p_index, this.countChildren());
  if (p.length > p.order) {
    p.shrink(ancestors);
  }
};

CommonBPlusTreeBranch.prototype.splitBranch = function() {
  var sibling = this.NodeFactory.NewBranch();
  this.split(this.length >>> 1, sibling);

  return sibling;
}

CommonBPlusTreeBranch.prototype.grow = function(ancestors) {
  // if (ancestors.length == 0) return;
  var apair = ancestors.pop();
  var p = apair[0], p_index = apair[1];

  var left_sib = null, right_sib = null;

  if (p_index + 1 < p.length) { // right_sib was exist?
    right_sib = p.getChildSync(p_index+1);
    if (right_sib.length-1 > right_sib.minimum) {
      right_sib.lateral(p, p_index + 1, this, p_index);
      return;
    }
  }

  if (p_index > 0) { // left_sib was exist?
    left_sib = p.getChildSync(p_index-1);
    if (left_sib.length-1 > left_sib.minimum) {
      left_sib.lateral(p, p_index-1, this, p_index);
      return;
    }
  }

  if (left_sib) {
    // this.setKey(0, p.getKey(p_index));
    p.copyKey(p_index, this, 0);
    left_sib.merge(this);
    p.setCount(p_index-1, left_sib.countChildren());
    this.recycle(); // NO MORE USING this
    p._remove(p_index);

  } else {
    // right_sib.setKey(0, p.getKey(p_index+1));
    p.copyKey(p_index+1, right_sib, 0);
    this.merge(right_sib);
    p.setCount(p_index, this.countChildren());
    right_sib.recycle();
    p._remove(p_index+1);
  }

  if (p.length-1 < p.minimum) {
    if (ancestors.length > 0) {
      p.grow(ancestors);
    } else if (p.length == 1) {
      this.tree.set_root( (left_sib != null) ? left_sib : this );
    }
  }

};

CommonBPlusTreeBranch.prototype.insert = function(index, item, ancestors) {
  // MOST OF CASE - NOT CALL THIS
  this._insert(index+1, item, this.ZERO);
  if (this.length > this.order)
    this.shrink(ancestors);
};

CommonBPlusTreeBranch.prototype.remove = function(index, ancestors) {
  this._remove(index+1);
  if (this.length-1 < this.minimum) {
    if (ancestors.length > 0) {
      this.grow(ancestors);
    } else if (this.length === 1) {
      this.tree.set_root(this.getChildSync(0));
    }
  }
};

CommonBPlusTreeBranch.prototype.to_buffer = function(max_limit) {
  var buffer = CommonBPlusTreeBranch.super_.prototype.to_buffer.call(this, max_limit);
  BU.fromInt32LE(0x4252414E, buffer, this.extra_pos);

  return buffer;
}

CommonBPlusTreeBranch.prototype.from_buffer = function(buffer) {
  CommonBPlusTreeBranch.super_.prototype.from_buffer.call(this, buffer);
};

CommonBPlusTreeBranch.prototype.getChild = function(pos, callback) {
  // var buf = this.get(pos);
  // var childId = BU.toInt32LE(buf[1]);
  // this.NodeFactory.get(childId, callback);
  // return [this.buffer.slice(pos*this.kvsize, pos*this.kvsize+this.keysize),
  //        this.buffer.slice(pos*this.kvsize+this.keysize, (pos+1)*this.kvsize)];
  this.NodeFactory.get(
  	BU.toInt32LE(this.buffer, pos*this.kvsize+this.keysize),
		callback);
};

CommonBPlusTreeBranch.prototype.getChildSync = function(pos) {
  // var buf = this.get(pos);
  // var childId = BU.toInt32LE(buf[1]);
  return this.NodeFactory.getSync( BU.toInt32LE(this.buffer, pos*this.kvsize+this.keysize) );
};

// --------------------
CommonBPlusTreeBranch.prototype.makeBranchData = function() {
  return undefined;
};

CommonBPlusTreeBranch.prototype.getCount = function(pos) {
};

CommonBPlusTreeBranch.prototype.setCount = function(pos, cnt) {
};

CommonBPlusTreeBranch.prototype.addCount = function(pos, cnt) {
};

CommonBPlusTreeBranch.prototype.subCount = function(pos, cnt) {
};

CommonBPlusTreeBranch.prototype.countChildren = function() {
};


