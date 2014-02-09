"use strict";

var fs = require('fs')
  , async = require('async')
  , util = require('util')
  , BU = require('../util/buffer-util')
  , LRU = require('lru-cache')
  ;

exports = module.exports = NodeFactory;

function NodeFactory(tree, BranchClass, LeafClass, options) {
	this.tree = tree;
	this.BranchClass = BranchClass;
	this.LeafClass = LeafClass;

	this.block_size = options.block_size || 16384;
	this.path = options.path;
  // basic cache size is 64M
  this.cache = new LRU((options.cache_size || 67108864) / this.block_size);

	this.root = undefined;

	this.dirty_nodes = {};

  this.MAX_ID = 1;
	this.dirty_flag = true;

	this.initialize();
};

NodeFactory.prototype.initialize = function() {

	this.openSync();
	if (this.in_memory) return;

	var buffer = new Buffer(this.block_size);
  var bytesRead = this.readSync(buffer, 0, this.block_size, 0);
  if (bytesRead === 0) {
    return;
  }
	// validate file type
	var _id = BU.toInt32LE(buffer, 4);
	if (_id !== 0) {
		this.root_id = _id;
		this.root = this.getSync(this.root_id);
	}
	this.MAX_ID = BU.toInt32LE(buffer, 8);

};

NodeFactory.prototype.dirty = function() {
	this.dirty_flag = true;
	this.dirty_nodes[0] = this;
};

NodeFactory.prototype.getRoot = function() {
	return this.root;
};

NodeFactory.prototype.get = function(id, callback) {
	var self = this;
	var node = this.cache.get(id);
	if (node === undefined) {
		var buf = new Buffer(this.block_size);
		self.read(buf, 0, this.block_size, id * this.block_size, function(err, bytesRead, buffer) {
			if (err) throw new Error(err);
			node = self.NewNode(buffer, id);
			// node._id = id; 
			// node.from_buffer(buffer);
			self.cache.set(id, node);
			callback.call(node, node);
		});
	} else {
		callback.call(node, node);
	}
};

NodeFactory.prototype.getSync = function(id) {
	var node = this.cache.get(id);
	if (node === undefined) {
		var buffer = new Buffer(this.block_size);
		var bytesRead = this.readSync(buffer, 0, this.block_size, id * this.block_size);
		if (bytesRead === 0) throw new Error("bytesRead === 0 at "+id);

		node = this.NewNode(buffer, id);
		this.cache.set(id, node);
	}
	return node;
};

NodeFactory.prototype.NewBranch = function() {
	var node = new this.BranchClass(this.tree, this);
	node._id = this.MAX_ID++;
	this.dirty();
	this.cache.set(node._id, node);
	return node;
};

NodeFactory.prototype.NewLeaf = function(next) {
	var node = new this.LeafClass(this.tree, this, next);
	node._id = this.MAX_ID++;
	this.dirty();
	this.cache.set(node._id, node);
	return node;
};

NodeFactory.prototype.NewNode = function(buffer, id) {
	var node;
	switch (BU.toInt32LE(buffer, this.block_size-4)) {
		case 0x4C454146:
			node = new this.LeafClass(this.tree, this);
			break;
		case 0x4252414E:
			node = new this.BranchClass(this.tree, this);
			break;
		default:
			console.log(id);
			for (var i=0; i<buffer.length; i+=32) {
				var line = "";
				for (var j=i; j<Math.min(buffer.length, i+32); j++) {
					if (buffer[j] < 16) line += "0"+buffer[j].toString(16) + " ";
					else line += buffer[j].toString(16) + " ";
				}
				console.log(line);
			}
			throw new Error("Unknown Block Type "+id);
	}
	node._id = id; // 
	node.from_buffer(buffer);
// console.log("READ! ", node._id);
  return node;
};

NodeFactory.prototype.save = function(node) {
	if (node._id === 0) {
		throw new Error("_id is 0!!!!!!!!!!!!!");
	}
	this.dirty_nodes[node._id] = node;
};

NodeFactory.prototype.recycle = function(node) {
};

NodeFactory.prototype.setRoot = function(node) {
	// DO SOMETHING ON NodeFactory
	this.root_id = node._id;
// console.log("NEW ROOT ID", this.root_id);
	// this.saveConfig(function(){});
	this.dirty_nodes[0] = this;
};

NodeFactory.prototype.saveConfig = function(callback) {
	var buffer = new Buffer(this.block_size);
	BU.fromInt32LE(this.root_id, buffer, 4);
	BU.fromInt32LE(this.MAX_ID, buffer, 8);
	this.write(buffer, 0, this.block_size, 0, callback);
};

NodeFactory.prototype.afterUpdate = function(callback) {
	var self = this;
  var callback_arguments = Array.prototype.slice.call(arguments, 1);
	// async.each( Object.keys(self.dirty_nodes), function (iter, cb) {
	async.each( Object.keys(self.dirty_nodes), function (iter, cb) {
		var node = self.dirty_nodes[iter];
		if (node instanceof NodeFactory) {
			self.saveConfig(function(err, written,buf) { cb(null, err); });
		} else {
			self.write( node.to_buffer(), 0, self.block_size, self.block_size * node._id, function(err, written, buf) { cb(null, err); });
		}
	}, function(err) {
		for (var it in self.dirty_nodes) {
			self.dirty_nodes[it].dirty_flag = false;
		}
		self.dirty_nodes = {};
    callback.apply(this, callback_arguments);
	});

/*
      self.unflushed_count++;
      if (self.auto_flush > 0 && self.unflushed_count >= self.auto_flush) {
        self.flush(function() {
          // setImmediate(callback, result, key, data);
          callback.call(this, undefined, {key: key, data: data});
        });
      } else {
        // setImmediate(callback, result, key, data);
        callback.call(this, undefined, {key: key, data: data});
      }
*/

}

// -------------------------
// Real Storage Relative Functions
NodeFactory.prototype.write = function(buffer, offset, length, pos, callback) {
	if (this.in_memory) {
		callback(undefined, length, buffer);
	} else {
		fs.write(this.fd, buffer, offset, length, pos, callback);
	}
};

NodeFactory.prototype.read = function(buffer, offset, length, pos, callback) {
	if (this.in_memory) {
		buffer.fill(0, offset, offset+length);
		callback(undefined, length, buffer);
	} else {
		fs.read(this.fd, buffer, offset, length, pos, callback);
	}
};

NodeFactory.prototype.readSync = function(buffer, offset, length, pos) {
	if (this.in_memory) {
		buffer.fill(0, offset, offset+length);
		return length;
	} else {
		return fs.readSync(this.fd, buffer, offset, length, pos);
	}
};

NodeFactory.prototype.openSync = function() {
	if (this.path === undefined || this.path === "memory") {
		this.in_memory = true;
		return;
	}
	this.in_memory = false;
  try {
    this.fd = fs.openSync(this.path, "r+");
  } catch (err) {
    this.fd = fs.openSync(this.path, "w+");
  }
};

