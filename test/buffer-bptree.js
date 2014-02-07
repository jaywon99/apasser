var assert = require('assert')
  , async = require('async')
  , BU = require('../core/util/buffer-util')
  , Tree = require('../core/index/buffer-bptree')
  , Branch = require('../core/index/buffer-bptree-branch')
  , Leaf = require('../core/index/buffer-bptree-leaf')
  ;

describe('Buffer B+Tree', function() {

	// put below into somewhere
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

  describe("Leaf", function() {

  	describe("Construction", function() {
  		it("should create successfully", function() {
				var leaf = new Leaf({block_size: 1024, keyhandler: kh, valuehandler: vh}, 0, 0);
			});
  	});

  	describe("insert", function() {
			var leaf;
			beforeEach(function() {
				leaf = new Leaf({block_size: 1024, keyhandler: kh, valuehandler: vh}, storage, 0, 0);
			});
			it("should insert correctly", function() {
				leaf.insert(0, BU.fromInt32LE(2), BU.fromInt32LE(5));
				assert.equal(leaf.length, 1);
			});
		});

	});

	describe("Branch", function() {
	});

	describe("Tree", function() {
		it("should create tree successfully", function() {
			var t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 64});
		});
		it("should insert data successfully", function() {
			var t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 64});
			t.insert(BU.fromInt32LE(10), BU.fromInt32LE(20), function(err, kv) { 
				assert(BU.equal(kv[0], BU.fromInt32LE(10))); 
				assert(BU.equal(kv[1], BU.fromInt32LE(20))); 
				t.insert(BU.fromInt32LE(20), BU.fromInt32LE(11), function(err, kv) { 
					assert(BU.equal(kv[0], BU.fromInt32LE(20))); 
					assert(BU.equal(kv[1], BU.fromInt32LE(11))); 
				});
			});
		});

		it("should insert data successfully", function() {
			var t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 64});
			async.series([
				function(callback) { t.insert(BU.fromInt32LE(10), BU.fromInt32LE(10), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(20), BU.fromInt32LE(11), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(30), BU.fromInt32LE(12), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(13), BU.fromInt32LE(13), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(23), BU.fromInt32LE(14), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(33), BU.fromInt32LE(15), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(15), BU.fromInt32LE(16), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(25), BU.fromInt32LE(17), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(35), BU.fromInt32LE(18), function() { setTimeout(callback, 0, null); }); },
				function(callback) { t.insert(BU.fromInt32LE(18), BU.fromInt32LE(19), function() { setTimeout(callback, 0, null); }); },
			], function() {
				t.get(BU.fromInt32LE(20), function(err, kv) {
					assert.equal(err, undefined);
					assert(BU.equal(kv[0], BU.fromInt32LE(20)));
					assert(BU.equal(kv[1], BU.fromInt32LE(11)));
				});
			});
		});

		describe("AfterInsert", function() {
			var t;
			beforeEach(function(done) {
				t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 64});
				async.series([
					function(callback) { t.insert(BU.fromInt32LE(10), BU.fromInt32LE(10), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(20), BU.fromInt32LE(11), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(30), BU.fromInt32LE(12), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(13), BU.fromInt32LE(13), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(23), BU.fromInt32LE(14), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(33), BU.fromInt32LE(15), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(15), BU.fromInt32LE(16), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(25), BU.fromInt32LE(17), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(35), BU.fromInt32LE(18), function() { setTimeout(callback, 0, null); }); },
					function(callback) { t.insert(BU.fromInt32LE(18), BU.fromInt32LE(19), function() { setTimeout(callback, 0, null); }); },
				], done
				);
			});

			it("should return if exist", function(done) {
				t.get(BU.fromInt32LE(20), function(err, kv) {
					assert.equal(err, undefined);
					assert(BU.equal(kv[0], BU.fromInt32LE(20)));
					assert(BU.equal(kv[1], BU.fromInt32LE(11)));
					done();
				});
			});

			it("should return error if not exist", function(done) {
				t.get(BU.fromInt32LE(21), function(err, kv) {
					assert.notEqual(err, undefined);
					done();
				});
			});

			it("should update if exist", function(done) {
				t.upsert(BU.fromInt32LE(20), BU.fromInt32LE(100), function(err, okv, nkv) {
					assert.equal(err, undefined);
					assert(BU.equal(nkv[0], BU.fromInt32LE(20)));
					assert(BU.equal(nkv[1], BU.fromInt32LE(100)));
					done();
				});
			});

			it("should insert if not exist", function(done) {
				t.upsert(BU.fromInt32LE(55), BU.fromInt32LE(100), function(err, okv, nkv) {
					assert.equal(err, undefined);
					assert.equal(okv, undefined);
					assert(BU.equal(nkv[0], BU.fromInt32LE(55)));
					assert(BU.equal(nkv[1], BU.fromInt32LE(100)));
					t.get(BU.fromInt32LE(55), function(err, kv) {
						assert.equal(err, undefined);
						assert(BU.equal(kv[1], BU.fromInt32LE(100)));
					});
					done();
				});
			});

			it("should update key - remove and insert", function(done) {
				t.update(BU.fromInt32LE(20), BU.fromInt32LE(55), function(err, kv) {
					assert.equal(err, undefined);
					assert(BU.equal(kv[0], BU.fromInt32LE(55)));
					assert(BU.equal(kv[1], BU.fromInt32LE(11)));
					t.get(BU.fromInt32LE(55), function(err, kv) {
						assert.equal(err, undefined);
						assert(BU.equal(kv[1], BU.fromInt32LE(11)));
					});
					done();
				});
			});

		});
		describe("MassInsert", function() {
			it("should valid random insert/check", function(done) {

				var t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 1024});

				var stop = false;
				var count = 0;
				var valid = {};
				setTimeout(function() { stop = true; }, 1000);
				async.forever(function(callback) {

					var n1 = Math.floor(Math.random()*10000000);
					var n2 = Math.floor(Math.random()*10000);
					valid[n1] = BU.fromInt32LE(n1);
					t.upsert(BU.fromInt32LE(n1), BU.fromInt32LE(n2), function(err, kv) { 
						count++;
						if (err !== undefined) {
							console.log(err, kv);
						}
						if (stop) {
							setImmediate(callback, "STOP");
						} else if (count < 10000000) {
							setImmediate(callback, null);
						} else {
							setImmediate(callback, "NOMORE");
						}
					});

				}, function(err) {
					async.map(Object.keys(valid), function(it, cb) {
						t.remove(valid[it], function(err, kv) {
							cb(null, err);
						});
					}, function(err) {
						done();
					});
				});

			});
		});

	});

});

