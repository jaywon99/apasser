var assert = require('assert')
  , Node = require("../core/index/node")
  ;


describe("Node", function() {
	var storage = { save: function(node) {}, recycle: function(node) {} };
  it("should create node and length should be zero, dirty should be true", function() {
    var n = new Node(10, storage);
    assert(n);
    assert.equal(n.length, 0);
    assert.equal(n.dirty_flag, true);
  });

  it("should raise error when we insert it.", function() {
    var n = new Node(10, storage);
    assert.throws(function() { n.insert(1,1); });
  });

  it("should raise error when we remove it.", function() {
    var n = new Node(10, storage);
    assert.throws(function() { n.remove(1); });
  });

  it("should raise error when we get it.", function() {
    var n = new Node(10, storage);
    assert.throws(function() { n.get(1); });
  });

});

