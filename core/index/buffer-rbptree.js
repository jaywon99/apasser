"use strict";

var fs = require('fs')
  , util = require('util')
  , async = require('async')
  , BranchClass = require('./buffer-rbptree-branch')
  , LeafClass = require('./buffer-rbptree-leaf')
  , NodeFactory = require('./node_factory')
  , BPlusTree = require('./buffer-bptree')
  , BU = require('../util/buffer-util')
  ;

exports = module.exports = RankBPlusTree;

function RankBPlusTree(options) {
	BPlusTree.call(this, options, BranchClass, LeafClass);
};

util.inherits(RankBPlusTree, BPlusTree);

// return callback(err, kv);
RankBPlusTree.prototype.remove = function(key, callback) {
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
RankBPlusTree.prototype.insert = function(key, data, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    if (found) {
      callback.call(this, "Duplicate");
    } else {
      var _rank = self._rank(path, node, index, found);
      node.insert(index, key, data, path);
      self.NodeFactory.afterUpdate(callback, undefined, [key, data], -_rank);
    }
  });
}

// return callback(err, kv);
// data can be function with parameter ([key, value])
RankBPlusTree.prototype.upsert = function(key, data, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    var _rank = self._rank(path, node, index, found);

		var origin = found ?  node.get(index)[1] : undefined;
		var olddata = (found) ?  new Buffer(origin) : undefined;
		var newdata = (typeof data === 'function') ?  data(origin) : data;

    if (found) {
			node.replace(index, newdata);
      self.NodeFactory.afterUpdate(callback, undefined, [key, olddata], [key, newdata], _rank);
    } else {
      node.insert(index, key, newdata, path);
      self.NodeFactory.afterUpdate(callback, undefined, undefined, [key, newdata], -_rank);
    }
  });
}

// return callback(err, kv);
RankBPlusTree.prototype.update = function(oldkey, newkey, callback) {
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

RankBPlusTree.prototype.get = function(key, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    if (found) {
    	var _rank = self._rank(path, node, index, found);
      callback.call(this, undefined, node.get(index), _rank);
    } else {
      callback.call(this, "NoKey");
    }
  });
}

RankBPlusTree.prototype.rank = function(key, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    var _rank = self._rank(path, node, index, found);
    if (found) {
      callback.call(this, undefined, node.get(index), _rank);
    } else {
      callback.call(this, undefined, [key, undefined], _rank);
    }
  });
}

RankBPlusTree.prototype.range = function(rank1, rank2, callback) {

  var looping = function(current, tree, rbuf, cnts) {
    if (!current.isLeaf) {
      for (var i = 0; i<current.length; i++) {
        if (BU.compareInt32LE(rbuf, current.getCount(i)) < 0) {
					current.getChild(i, function(node) {
            // setImmediate( looping, node, tree, _rank, cnts);
            looping( node, tree, rbuf, cnts);
          });
          break;
        } else {
			    BU.subInt32LE(rbuf, current.getCount(i));
        }
      }
      callback.call(this, []);
    } else {
      current._gather_to_low(cnts, [], BU.toInt32LE(rbuf), callback);
    }
  };

  var rbuf = BU.fromInt32LE(rank1-1);
  looping(this._root, this, rbuf, rank2-rank1);
}

RankBPlusTree.prototype.around = function(key, before, after, callback) {
  var self = this;
  this._path_to(key, function(path, found) {
    var leaf = path.pop();
    var node = leaf[0], index = leaf[1];
    var _rank = self._rank(path, node, index, found);

    var afterindex = index;
		var beforerank, beforeendrank;
    // CAN EXECUTE PARALLEL
    if (found) {
      afterindex++;
		}
		async.parallel([
			  function(cb) {
					self.range(Math.max(1, Math.abs(_rank) - before), Math.abs(_rank), function(befores) {
						cb(null, befores);
					});
				}
			,	function(cb) { 
    			node._gather_to_low(after, [], afterindex, function(afters) {
						cb(null, afters);
					})
				}
			], function(err, results) {
				if (found) {
					// setImmediate(callback, _rank, results[0], node.get(index), results[1]);
					callback.call(self, _rank, results[0], node.get(index), results[1]);
				} else {
					// setImmediate(callback, _rank, results[0], [node.getKey(index), undefined], results[1]);
					callback.call(self, _rank, results[0], [node.getKey(index), undefined], results[1]);
				}
			});

  });
}

RankBPlusTree.prototype._path_to = function(key, callback) {
  var ancestry = [];
  var self = this;

  var looping = function(current, tree) {
    if (!current.isLeaf) {
      var index = current.bisect_right(key, 1)-1;

      ancestry.push([current, index]);
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

RankBPlusTree.prototype._rank = function(path, node, index, found) {
  var rbuf = BU.fromInt32LE(index+1);
  for (var i=path.length; --i>=0; ) {
		path[i][0].countChildren(path[i][1], rbuf);
/*
    // for (var j=0; j<path[i][1]; j++) {
    for (var j=path[i][1], k=path[i][0].keysize+4; --j>=0; k+=path[i][0].kvsize) {
			// BU.addInt32LE(rbuf, path[i][0].getCount(j));
			BU.addInt32LE(rbuf, path[i][0].buffer, k);
    }
*/
  }
	var _rank = BU.toInt32LE(rbuf);
  if (found) {
    return _rank;
  } else {
    return -_rank;
  }
}


