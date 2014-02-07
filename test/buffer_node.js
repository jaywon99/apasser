var assert = require('assert')
  , util = require('util')
  , BufferNode = require('../core/index/buffer_node')
  , BU = require('../core/util/buffer-util')
  ;

describe("BufferNode", function() {

	var kh = {
		  size: 4
    , comparor: function(a, b) { 
				var c = this[a+0] - b[0];
				if ( c !== 0 ) return c;
				if ( (c = this[a+1]-b[1]) !== 0) return c;
				if ( (c = this[a+2]-b[2]) !== 0) return c;
				return this[a+3]-b[3];
			}
	};
	var vh = {
			size: 4
	};
	var storage = { save: function(node) {}, recycle: function(node) {} };

	it("should create BufferNode with BlockSize, KeyHandler, ValueHandler, extra space", function() {
    var a = new BufferNode(storage, 64, kh, vh, 12);
    assert(a);
  });
  it("should insert new element into node", function() {
    var a = new BufferNode(storage, 64, kh, vh, 12);
		var k = BU.fromInt32LE(10);
		var v = BU.fromInt32LE(20);
		a._insert(0, k, v);
		for (var i=0; i<4; i++) {
			assert.equal(a.buffer[i], k[i]);
			assert.equal(a.buffer[i+4], v[i]);
		}
	});
  it("should insert new element into node", function() {
    var a = new BufferNode(storage, 64, kh, vh, 12);
		var k = BU.fromInt32LE(10);
		var v = BU.fromInt32LE(20);
		a._insert(0, k, v);
		for (var i=0; i<4; i++) {
			assert.equal(a.buffer[i], k[i]);
			assert.equal(a.buffer[i+4], v[i]);
		}
		var k = BU.fromInt32LE(1);
		var v = BU.fromInt32LE(2);
		a._insert(0, k, v);
		for (var i=0; i<4; i++) {
			assert.equal(a.buffer[i], k[i]);
			assert.equal(a.buffer[i+4], v[i]);
		}
  });

  describe("Specific Functions", function() {
		var a;
		beforeEach(function() {
      a = new BufferNode(storage, 64, kh, vh, 12);
			a._insert(0, BU.fromInt32LE(10), BU.fromInt32LE(20));
			a._insert(0, BU.fromInt32LE(1), BU.fromInt32LE(2));
			a._insert(1, BU.fromInt32LE(2), BU.fromInt32LE(4));
			a._insert(3, BU.fromInt32LE(20), BU.fromInt32LE(40));
		});
		it("should remove element in position", function() {
			var removed = a._remove(1);
			BU.assertEqual(removed[0], BU.fromInt32LE(2));
			BU.assertEqual(removed[1], BU.fromInt32LE(4));
		});
		it("should get proper value in position", function() {
			var kv = a.get(1);
			BU.assertEqual(kv[0], BU.fromInt32LE(2));
			BU.assertEqual(kv[1], BU.fromInt32LE(4));
		});
		it("should get proper key value in position", function() {
			var kv = a.getKey(1);
			BU.assertEqual(kv, BU.fromInt32LE(2));
		});
		it("should set proper key value in position", function() {
			a.setKey(3, BU.fromInt32LE(5));
			var kv = a.getKey(3);
			BU.assertEqual(kv, BU.fromInt32LE(5));
		});
		it("should split proper amount key value after position", function() {
      var b = new BufferNode(storage, 64, kh, vh, 12);
			a.split(2, b);
			assert.equal(a.length, 2);
			assert.equal(b.length, 2);
      var kv = a.get(0);
			BU.assertEqual(kv[0], BU.fromInt32LE(1));
			BU.assertEqual(kv[1], BU.fromInt32LE(2));
      kv = a.get(1);
			BU.assertEqual(kv[0], BU.fromInt32LE(2));
			BU.assertEqual(kv[1], BU.fromInt32LE(4));
      kv = b.get(0);
			BU.assertEqual(kv[0], BU.fromInt32LE(10));
			BU.assertEqual(kv[1], BU.fromInt32LE(20));
      kv = b.get(1);
			BU.assertEqual(kv[0], BU.fromInt32LE(20));
			BU.assertEqual(kv[1], BU.fromInt32LE(40));
		});
		it("should merge proper amount key value after position", function() {
      var b = new BufferNode(storage, 64, kh, vh, 12);
			a.split(2, b);
			a.merge(b);
			assert.equal(a.length, 4);
      var kv = a.get(0);
			BU.assertEqual(kv[0], BU.fromInt32LE(1));
			BU.assertEqual(kv[1], BU.fromInt32LE(2));
      kv = a.get(1);
			BU.assertEqual(kv[0], BU.fromInt32LE(2));
			BU.assertEqual(kv[1], BU.fromInt32LE(4));
      kv = a.get(2);
			BU.assertEqual(kv[0], BU.fromInt32LE(10));
			BU.assertEqual(kv[1], BU.fromInt32LE(20));
      kv = a.get(3);
			BU.assertEqual(kv[0], BU.fromInt32LE(20));
			BU.assertEqual(kv[1], BU.fromInt32LE(40));
		});
		it.skip("should slice proper amount key values ", function() {
/*
      var b = a.slice(1,3);
			assert.equal(b.length, 2);
			assert.equal(b[0][0], BU.fromInt32LE(2));
			assert.equal(b[0][1], BU.fromInt32LE(4));
			assert.equal(b[1][0], BU.fromInt32LE(10));
			assert.equal(b[1][1], BU.fromInt32LE(20));
*/
			throw new Error("Need to define this.");
		});
	});

  describe("Common Node Functions", function() {
		var a;
		beforeEach(function() {
      a = new BufferNode(storage, 64, kh, vh, 12);
			a._insert(0, BU.fromInt32LE(10), BU.fromInt32LE(20));
			a._insert(0, BU.fromInt32LE(1), BU.fromInt32LE(2));
			a._insert(1, BU.fromInt32LE(2), BU.fromInt32LE(4));
			a._insert(3, BU.fromInt32LE(20), BU.fromInt32LE(40));
		});
		it("should get last element and remove it when call pop", function() {
			var kv = a.pop();
			assert.equal(a.length, 3);
			BU.assertEqual(kv[0], BU.fromInt32LE(20));
			BU.assertEqual(kv[1], BU.fromInt32LE(40));
		});
		it("should get first element and remove it when call shift", function() {
			var kv = a.shift();
			assert.equal(a.length, 3);
			BU.assertEqual(kv[0], BU.fromInt32LE(1));
			BU.assertEqual(kv[1], BU.fromInt32LE(2));
			kv = a.get(0);
			BU.assertEqual(kv[0], BU.fromInt32LE(2));
			BU.assertEqual(kv[1], BU.fromInt32LE(4));
		});
		it("should put new kv into first position when call unshift", function() {
			a.pop();
			a.unshift(BU.fromInt32LE(0), BU.fromInt32LE(5));
			assert.equal(a.length, 4);
			kv = a.get(0);
			BU.assertEqual(kv[0], BU.fromInt32LE(0));
			BU.assertEqual(kv[1], BU.fromInt32LE(5));
			kv = a.get(1);
			BU.assertEqual(kv[0], BU.fromInt32LE(1));
			BU.assertEqual(kv[1], BU.fromInt32LE(2));
		});
		it("should put new kv into last position when call push", function() {
			a.pop();
			a.push(BU.fromInt32LE(30), BU.fromInt32LE(5));
			assert.equal(a.length, 4);
			kv = a.get(0);
			BU.assertEqual(kv[0], BU.fromInt32LE(1));
			BU.assertEqual(kv[1], BU.fromInt32LE(2));
			kv = a.get(3);
			BU.assertEqual(kv[0], BU.fromInt32LE(30));
			BU.assertEqual(kv[1], BU.fromInt32LE(5));
		});
		it("should replace property", function() {
			a.replace(0, BU.fromInt32LE(100));
			kv = a.get(0);
			BU.assertEqual(kv[1], BU.fromInt32LE(100));
		});
		it("should get proper position for input when bisect_left", function() {
			var rc = a.bisect_left(BU.fromInt32LE(2));
			assert.equal(rc, 1);
		});

		it("should get proper position for input when bisect_right", function() {
			var rc = a.bisect_right(BU.fromInt32LE(2));
			assert.equal(rc, 2);
		});

  });
});
