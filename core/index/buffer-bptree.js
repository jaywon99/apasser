"use strict";

var fs = require('fs')
  , BranchClass = require('./buffer-bptree-branch')
  , LeafClass = require('./buffer-bptree-leaf')
  , BU = require('../util/buffer-util')
  , NodeFactory = require('./node_factory')
  ;

exports = module.exports = BPlusTree;

function BPlusTree(options, pBranchClass, pLeafClass) {
  this.keyhandler = options.keyhandler;
  this.valuehandler = options.valuehandler;
  this.block_size = options.block_size;
  this.compareKey = this.keyhandler.comparor;

  this.NodeFactory = new NodeFactory(this, pBranchClass || BranchClass, pLeafClass || LeafClass, options);
	this._root = this.NodeFactory.getRoot();

	if (this._root === undefined) {
  	this._root = this.NodeFactory.NewLeaf();
		this.NodeFactory.setRoot(this._root);
	}
};

// return callback(err, kv);
BPlusTree.prototype.remove = function(key, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    var kv;
    if (found) {
      kv = node.remove(index, path);
      self.NodeFactory.afterUpdate(callback, undefined, kv);
    } else {
      callback.call(this, "NoKey");
    }
  });
}

// return callback(err, kv);
BPlusTree.prototype.insert = function(key, data, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];

    if (found) {
      callback.call(this, "Duplicate");
    } else {
      node.insert(index, key, data, path);
      self.NodeFactory.afterUpdate(callback, undefined, [key, data]);
    }
  });
}

// return callback(err, kv);
BPlusTree.prototype.upsert = function(key, data, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];

		var origin = found ?  node.get(index)[1] : undefined;
		var olddata = (found) ?  new Buffer(origin) : undefined;
		var newdata = (typeof data === 'function') ?  data(origin) : data;

    if (found) {
      node.replace(index, newdata);
      self.NodeFactory.afterUpdate(callback, undefined, [key, olddata], [key, newdata]);
    } else {
      node.insert(index, key, newdata, path);
      self.NodeFactory.afterUpdate(callback, undefined, undefined, [key, newdata]);
    }
  });
}

// return callback(err, kv);
BPlusTree.prototype.update = function(oldkey, newkey, callback) {
  var self = this;
  this._path_to(oldkey, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    if (found) {
      var kv = node.remove(index, path);
      self.insert(newkey, kv[1], callback);
    } else {
      callback.call(this, "NoKey");
    }
  });
}

BPlusTree.prototype.get = function(key, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    if (found) {
      callback.call(this, undefined, node.get(index));
    } else {
      callback.call(this, "NoKey");
    }
  });
}

BPlusTree.prototype._path_to = function(key, callback) {
  var ancestry = [];
  var self = this;

  var looping = function(current, tree) {
    if (!current.isLeaf) {
      var index = current.bisect_right(key, 1)-1;

      ancestry.push([current, index]);
// console.log("LOOPING AND FOUND", current._id, index);
      current.getChild(index, function(node) {
        // setImmediate( looping, node, tree);
        looping( node, tree);
      });
    } else {
      var index = current.bisect_left(key);
      ancestry.push([current, index]);

      // callback.call(this, ancestry, (index < current.length && self.compareKey(current.getKey(index), key) === 0));
      callback.call(this, ancestry, (index < current.length && self.compareKey.call(current.buffer, index*current.kvsize, key) === 0));
    }
  };

  looping(this._root, this);
};

//-----------------
// USED BY LEAF/BRANCH

BPlusTree.prototype.set_root = function(node) {
  this._root = node;
	this.NodeFactory.setRoot(node);
};

BPlusTree.prototype.dump = function(writeStream, callback) {
  // FOUND FIRST LEAF
  var looping = function(current, tree, _rank) {
    if (!current.isLeaf) {
      current.getChild(0, function(node) {
        // setImmediate( looping, node, tree);
        looping( node, tree);
      });
    } else {
      current.dump(writeStream, callback);
    }
  };

  looping(this._root, this);
};

