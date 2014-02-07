var assert = require('assert')
  , async = require('async')
  , BU = require('../core/util/buffer-util')
  , Tree = require('../core/index/buffer-rbptree')
  , Branch = require('../core/index/buffer-rbptree-branch')
  , Leaf = require('../core/index/buffer-rbptree-leaf')
  ;

describe('Buffer Rank B+Tree', function() {

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

  describe("Leaf", function() {
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
				t.get(BU.fromInt32LE(20), function(err, kv, rank) {
					assert.equal(err, undefined);
					BU.assertEqual(kv[0], BU.fromInt32LE(20));
					BU.assertEqual(kv[1], BU.fromInt32LE(11));
					assert.equal(rank, 5);
					done();
				});
			});

			it("should return error if not exist", function(done) {
				t.get(BU.fromInt32LE(21), function(err, kv) {
					assert.notEqual(err, undefined);
					done();
				});
			});

			it("should not return error even not exist and get rank even negative number", function(done) {
				t.rank(BU.fromInt32LE(21), function(err, kv, rank) {
					assert.equal(err, undefined);
					assert.equal(rank, -6);
					done();
				});
			});

			it("should update if exist and get new rank", function(done) {
				t.upsert(BU.fromInt32LE(20), BU.fromInt32LE(100), function(err, okv, nkv, rank) {
					assert.equal(err, undefined);
					assert(BU.equal(nkv[0], BU.fromInt32LE(20)));
					assert(BU.equal(nkv[1], BU.fromInt32LE(100)));
					assert(rank, 10);
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
						done();
					});
				});
			});

			it("should update key - remove and insert and get new rank", function(done) {
				t.update(BU.fromInt32LE(20), BU.fromInt32LE(34), function(err, kv, rank) {
					assert.equal(err, undefined);
					assert.equal(rank, 9);
					assert(BU.equal(kv[0], BU.fromInt32LE(34)));
					assert(BU.equal(kv[1], BU.fromInt32LE(11)));
					t.get(BU.fromInt32LE(34), function(err, kv) {
						assert.equal(err, undefined);
						assert(BU.equal(kv[1], BU.fromInt32LE(11)));
						done();
					});
				});
			});

			it("should get several keys", function(done) {
				t.range(3, 7, function(err, kv, rank) {
// console.log(arguments);
done();
/*
					assert.equal(err, undefined);
					assert.equal(rank, 9);
					assert(BU.equal(kv[0], BU.fromInt32LE(34)));
					assert(BU.equal(kv[1], BU.fromInt32LE(11)));
					t.get(BU.fromInt32LE(34), function(err, kv) {
						assert.equal(err, undefined);
						assert(BU.equal(kv[1], BU.fromInt32LE(11)));
						done();
					});
*/
				});
			});

			it("should get several keys - around", function(done) {
				t.around(BU.fromInt32LE(19), 3, 3, function(err, kv, rank) {
// console.log(arguments);
done();
/*
					assert.equal(err, undefined);
					assert.equal(rank, 9);
					assert(BU.equal(kv[0], BU.fromInt32LE(34)));
					assert(BU.equal(kv[1], BU.fromInt32LE(11)));
					t.get(BU.fromInt32LE(34), function(err, kv) {
						assert.equal(err, undefined);
						assert(BU.equal(kv[1], BU.fromInt32LE(11)));
						done();
					});
*/
				});
			});

		});
		describe("MassInsert", function() {
			it("should valid random insert/check", function(done) {
				var t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 64});

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

