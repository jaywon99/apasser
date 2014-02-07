var assert = require('assert')
  , ArrayNode = require('../core/index/array_node')
  ;

describe("ArrayNode", function() {
	var kh = { comparor: function(a,b) { return a-b; } };
	var storage = { save: function(node) {}, recycle: function(node) {} };
	it("should create arraynode with order and keyhandler", function() {
    var a = new ArrayNode(4, storage, kh);
    assert(a);
  });
  it("should insert new element into node", function() {
		var a = new ArrayNode(4, storage, kh);
		a._insert(0, 10, 20);
    assert.equal(a.kv[0][0], 10);
		assert.equal(a.kv[0][1], 20);
	});
  it("should insert new element into node", function() {
		var a = new ArrayNode(4, storage, kh);
		a._insert(0, 10, 20);
    assert.equal(a.kv[0][0], 10);
		assert.equal(a.kv[0][1], 20);
		a._insert(0, 1, 2);
    assert.equal(a.kv[0][0], 1);
		assert.equal(a.kv[0][1], 2);
  });

  describe("Specific Functions", function() {
		var a;
		beforeEach(function() {
			a = new ArrayNode(4, storage, kh);
			a._insert(0, 10, 20);
			a._insert(0, 1, 2);
			a._insert(1, 2, 4);
			a._insert(3, 20, 40);
		});
		it("should remove element in position", function() {
			var removed = a._remove(1);
			assert.equal(removed[0], 2);
			assert.equal(removed[1], 4);
		});
		it("should get proper value in position", function() {
			var kv = a.get(1);
			assert.equal(kv[0], 2);
			assert.equal(kv[1], 4);
		});
		it("should get proper key value in position", function() {
			var kv = a.getKey(1);
			assert.equal(kv, 2);
		});
		it("should set proper key value in position", function() {
			a.setKey(3, 5);
			var kv = a.getKey(3);
			assert.equal(kv, 5);
		});
		it("should split proper amount key value after position", function() {
      var b = new ArrayNode(4, storage, kh);
      a.split(2, b);
			assert.equal(a.length, 2);
			assert.equal(b.length, 2);
      var kv = a.get(0);
			assert.equal(kv[0], 1);
			assert.equal(kv[1], 2);
      kv = a.get(1);
			assert.equal(kv[0], 2);
			assert.equal(kv[1], 4);
      kv = b.get(0);
			assert.equal(kv[0], 10);
			assert.equal(kv[1], 20);
      kv = b.get(1);
			assert.equal(kv[0], 20);
			assert.equal(kv[1], 40);
		});
		it("should merge proper amount key value after position", function() {
      var b = new ArrayNode(4, storage, kh);
      a.split(2, b);
			a.merge(b);
			assert.equal(a.length, 4);
      var kv = a.get(0);
			assert.equal(kv[0], 1);
			assert.equal(kv[1], 2);
      kv = a.get(1);
			assert.equal(kv[0], 2);
			assert.equal(kv[1], 4);
      kv = a.get(2);
			assert.equal(kv[0], 10);
			assert.equal(kv[1], 20);
      kv = a.get(3);
			assert.equal(kv[0], 20);
			assert.equal(kv[1], 40);
		});
		it("should slice proper amount key values ", function() {
      var b = a.slice(1,3);
			assert.equal(b.length, 2);
			assert.equal(b[0][0], 2);
			assert.equal(b[0][1], 4);
			assert.equal(b[1][0], 10);
			assert.equal(b[1][1], 20);
		});
	});

  describe("Common Node Functions", function() {
		var a;
		beforeEach(function() {
			a = new ArrayNode(4, storage, kh);
			a._insert(0, 10, 20);
			a._insert(0, 1, 2);
			a._insert(1, 2, 4);
			a._insert(3, 20, 40);
		});
		it("should get last element and remove it when call pop", function() {
			var kv = a.pop();
			assert.equal(a.length, 3);
			assert.equal(kv[0], 20);
			assert.equal(kv[1], 40);
		});
		it("should get first element and remove it when call shift", function() {
			var kv = a.shift();
			assert.equal(a.length, 3);
			assert.equal(kv[0], 1);
			assert.equal(kv[1], 2);
		});
		it("should put new kv into first position when call unshift", function() {
			a.pop();
			a.unshift(0, 5);
			assert.equal(a.length, 4);
			kv = a.get(0);
			assert.equal(kv[0], 0);
			assert.equal(kv[1], 5);
			kv = a.get(1);
			assert.equal(kv[0], 1);
			assert.equal(kv[1], 2);
		});
		it("should put new kv into last position when call push", function() {
			a.pop();
			a.push(30, 5);
			assert.equal(a.length, 4);
			kv = a.get(0);
			assert.equal(kv[0], 1);
			assert.equal(kv[1], 2);
			kv = a.get(3);
			assert.equal(kv[0], 30);
			assert.equal(kv[1], 5);
		});
		it("should replace property", function() {
			a.replace(0, 100);
			kv = a.get(0);
			assert.equal(kv[1], 100);
		});
		it("should get proper position for input when bisect_left", function() {
			var rc = a.bisect_left(2);
			assert.equal(rc, 1);
		});

		it("should get proper position for input when bisect_right", function() {
			var rc = a.bisect_right(2);
			assert.equal(rc, 2);
		});

  });
});
