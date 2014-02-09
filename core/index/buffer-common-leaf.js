"use strict";

var util = require('util')
  , format = util.format
  , inherits = util.inherits
  , BufferNode = require('./buffer_node')
  , BU = require('../util/buffer-util')
  // , BufferBuilder = require('../../util/buffer-builder')
  // , BufferReader = require('../../util/buffer-reader')
  ;

function CommonBPlusTreeLeaf(tree, NodeFactory, next) {
  if (tree === undefined) {
    throw new Error("ArgumentException: tree was not defined");
  }

  this.tree = tree;
  this.NodeFactory = NodeFactory;

  BufferNode.call(this, this.NodeFactory, tree.block_size, tree.keyhandler, tree.valuehandler, 8);

  this.next = next || 0;

  this.isLeaf = true;

  this._id = undefined;
}

inherits(CommonBPlusTreeLeaf, BufferNode)

exports = module.exports = CommonBPlusTreeLeaf;

CommonBPlusTreeLeaf.prototype.insert = function(index, key, data, ancestors) {
  this._insert.call(this, index, key, data);
  this.escalateCount(ancestors, BU.PLUS1);
  if (this.length > this.order) {
    this.shrink(ancestors);
  }
}

CommonBPlusTreeLeaf.prototype.lateral = function(p, p_index, d, d_index) {
  if (p_index > d_index) {
    // d.push.apply(d, this.shift());
    this.shift_and_push_to(d);
    // p.setKey(p_index, this.getKey(0));
    this.copyKey(0, p, p_index);
    p.subCount(p_index, BU.PLUS1);
    p.addCount(d_index, BU.PLUS1);
  } else {
    // d.unshift.apply(d, this.pop());
    this.pop_and_unshift_to(d);
    // p.setKey(d_index, d.getKey(0));
    d.copyKey(0, p, d_index);
    p.addCount(p_index, BU.PLUS1);
    p.subCount(d_index, BU.PLUS1);
  }
}

CommonBPlusTreeLeaf.prototype.shrink = function(ancestors) {
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

  var sibling = this.splitLeaf();

  p._insert(p_index+1, sibling.getKey(0), sibling.makeBranchData());
  p.setCount(p_index, this.countChildren());
  if (p.length > p.order) {
    p.shrink(ancestors);
  }

};

CommonBPlusTreeLeaf.prototype.splitLeaf = function() {
  var sibling = this.NodeFactory.NewLeaf(this.next);
  this.split(this.length >>> 1, sibling);

  this.next = sibling._id;

  return sibling;
}

CommonBPlusTreeLeaf.prototype.remove = function(index, ancestors) {
  // WHAT HAPPENED IF index === 0? XXX
  var result = this._remove.call(this, index);
  this.escalateCount(ancestors, BU.MINUS1);
  if (this.length < this.minimum && ancestors.length > 0) {
    this.grow(ancestors);
  }
  return result;
};

CommonBPlusTreeLeaf.prototype.grow = function(ancestors) {

  var apair = ancestors.pop();
  var p = apair[0], p_index = apair[1];

  var left_sib = null, right_sib = null;

  if (p_index + 1 < p.length) {
    right_sib = p.getChildSync(p_index+1);
    if (right_sib.length > right_sib.minimum) {
      right_sib.lateral(p, p_index + 1, this, p_index);
      return;
    }
  }

  if (p_index > 0) {
    left_sib = p.getChildSync(p_index-1);
    if (left_sib.length > left_sib.minimum) {
      left_sib.lateral(p, p_index-1, this, p_index);
      return;
    }
  }

// NEED REVIEW~~~~~~
  if (left_sib) {
    left_sib.merge(this);
    left_sib.next = this.next;
    p.setCount(p_index-1, left_sib.countChildren());

    this.recycle(); // BUT REMOVE FROM TREE (ADD TO FREE LIST)
    p.remove(p_index-1, ancestors);
    return;
  } 

  if (right_sib) {
    this.merge(right_sib);
    this.next = right_sib.next;
    p.setCount(p_index, this.countChildren());

    right_sib.recycle();
    p.remove(p_index, ancestors);
    return;
  }

  throw new Error("WHAT THE HELL?");
};

CommonBPlusTreeLeaf.prototype.countChildren = function() {
  return this.length;
}

CommonBPlusTreeLeaf.prototype._gather_to_low = function(cnts, buf, index, callback) {
  if (this.length - index < cnts) {
    if (this.length > index) {
      cnts -= (this.length - index);
      buf.push(this.slice(index, this.length));
    }
    if (this.next != 0) {
      this.NodeFactory.get(this.next, function(node) { 
        setImmediate(function() { node._gather_to_low(cnts, buf, 0, callback) });
      });
    } else {
      callback.call(this, buf);
    }
  } else {
    buf.push(this.slice(index, index+cnts));
    callback.call(this, buf);
  }
};

CommonBPlusTreeLeaf.prototype.to_buffer = function(max_limit) {
  var buffer = CommonBPlusTreeLeaf.super_.prototype.to_buffer.call(this, max_limit);
  BU.fromInt32LE(this.next, buffer, this.extra_pos);
  BU.fromInt32LE(0x4C454146, buffer, this.extra_pos+4);

  return buffer;
}

CommonBPlusTreeLeaf.prototype.from_buffer = function(buffer) {
  CommonBPlusTreeLeaf.super_.prototype.from_buffer.call(this, buffer);
  
  this.next = BU.toInt32LE(buffer, this.extra_pos);
}

CommonBPlusTreeLeaf.prototype.dump = function(writeStream, callback) {
  var buffer = CommonBPlusTreeLeaf.super_.prototype.to_buffer.call(this);
  writeStream.write(buffer.slice(0, this.kvsize * this.length));

  if (this.next != 0) {
    this.NodeFactory.get(this.next, function(node) { 
      setImmediate(function() { node.dump(writeStream, callback) });
    });
  } else {
    callback.call(this);
  }
};

//-------- Rank Only

CommonBPlusTreeLeaf.prototype.makeBranchData = function() {
  var buf = new Buffer(8);
  BU.fromInt32LE(this._id, buf);
  BU.fromInt32LE(this.length, buf, 4);
  return buf;
};

CommonBPlusTreeLeaf.prototype.escalateCount = function(ancestors, inc) {
  for (var i=ancestors.length-1; i>=0; i--) {
    ancestors[i][0].addCount(ancestors[i][1], inc);
  }
}

