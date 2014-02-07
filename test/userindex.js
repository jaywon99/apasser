var assert = require('assert')
  , async = require('async')
  , util = require('util')
  , UserIndex = require('../app/user/index')
  ;

describe("UserIndex", function() {
	describe("Create", function() {
		it("should create index", function() {
			var u = new UserIndex({sort:['desc','asc'], second_key: 'updated_at'});
			// need some assert check
		});
	});

	describe("Upsert", function() {
		var u;
		beforeEach(function() {
			u = new UserIndex({sort:['desc','asc'], second_key: 'updated_at'});
		});

		it("should upsert correctly", function(done) {
			u.upsert(1, 100, function(err, uinfo) {
				assert.equal(uinfo.usn, 1);
				assert.equal(uinfo.score, 100);
				assert.equal(uinfo.rank, 1);
				assert.equal(uinfo.score_rank, 1);
				done();
			});
		});

		it("should upsert correctly when insert bigger", function(done) {
			u.upsert(1, 100, function(err, uinfo) {
			  u.upsert(2, 110, function(err, uinfo) {
					assert.equal(uinfo.usn, 2);
					assert.equal(uinfo.score, 110);
					assert.equal(uinfo.rank, 1);
					assert.equal(uinfo.score_rank, 1);
					done();
				});
			});
		});

		it("should upsert correctly when insert smaller", function(done) {
			u.upsert(1, 100, function(err, uinfo) {
			  u.upsert(2, 90, function(err, uinfo) {
					assert.equal(uinfo.usn, 2);
					assert.equal(uinfo.score, 90);
					assert.equal(uinfo.rank, 2);
					assert.equal(uinfo.score_rank, 2);
					done();
				});
			});
		});

		it("should upsert correctly when insert same score", function(done) {
			u.upsert(1, 100, function(err, uinfo) {
				setTimeout(function() {
					u.upsert(2, 100, function(err, uinfo) {
						assert.equal(uinfo.usn, 2);
						assert.equal(uinfo.score, 100);
						assert.equal(uinfo.rank, 2);
						assert.equal(uinfo.score_rank, 1);
						done();
					});
				}, 1);
			});
		});

		it("should upsert correctly when insert same score if exist", function(done) {
			u.upsert(1, 100, function(err, uinfo) {
				setTimeout(function() {
					u.upsert(2, 100, function(err, uinfo) {
						u.upsert(2, 99, function(err, uinfo) {
							assert.equal(uinfo.usn, 2);
							assert.equal(uinfo.score, 99);
							assert.equal(uinfo.rank, 2);
							assert.equal(uinfo.score_rank, 2);
							done();
						});
					});
				}, 1);
			});
		});

	});

	describe("Retrive", function() {
		var u;
		beforeEach(function(done) {
			u = new UserIndex({sort:['desc','asc'], second_key: 'updated_at'});

			var uk = [[1, 52], [2,67], [3,83], [4,28], [5,9], [6,24], [7,45], [8,45], [9,74], [10,19], [11,47]];

			async.eachSeries(uk, function(item, cb) {
				setTimeout(function() {
					u.upsert(item[0], item[1], cb);
				}, 1);
			}, function(err) {
				done();
			});
		});

		it("should return valid score", function(done) {
			u.get(1, function(err, uinfo) {
				assert.equal(uinfo.usn, 1);
				assert.equal(uinfo.score, 52);
				assert.equal(uinfo.rank, 4);
				assert.equal(uinfo.score_rank, 4);
				done();
			});
		});

		it("should return valid score", function(done) {
			u.get(8, function(err, uinfo) {
				assert.equal(uinfo.usn, 8);
				assert.equal(uinfo.score, 45);
				assert.equal(uinfo.rank, 7);
				assert.equal(uinfo.score_rank, 6);
				done();
			});
		});

		it("should delete valid user and get new rank", function(done) {
			u.remove(7, function(err, uinfo) {
				u.get(8, function(err, uinfo) {
					assert.equal(uinfo.usn, 8);
					assert.equal(uinfo.score, 45);
					assert.equal(uinfo.rank, 6);
					assert.equal(uinfo.score_rank, 6);
					done();
				});
			});
		});

		it("should get correct rank of score", function(done) {
			u.rank_of(50, function(err, rinfo) {
				assert.equal(rinfo.score_rank, 5);
				done();
			});
		});

		it("should get correct users after score", function(done) {
			u.usersFrom(50, 10, function(err, uinfo) {
				assert.equal(uinfo.length, 7);
				assert.equal(uinfo[0].usn, 11);
				assert.equal(uinfo[1].usn, 7);
				assert.equal(uinfo[2].usn, 8);
				assert.equal(uinfo[3].usn, 4);
				assert.equal(uinfo[4].usn, 6);
				assert.equal(uinfo[5].usn, 10);
				assert.equal(uinfo[6].usn, 5);
				done();
			});
		});

		it("should get correct users in rank 5 to 10", function(done) {
			u.rankers(5, 10, function(err, uinfo) {
				assert.equal(uinfo.length, 5);
				assert.equal(uinfo[0].usn, 11);
				assert.equal(uinfo[1].usn, 7);
				assert.equal(uinfo[2].usn, 8);
				assert.equal(uinfo[3].usn, 4);
				assert.equal(uinfo[4].usn, 6);
				done();
			});
		});

		it("should get correct users around user 1 (around 5)", function(done) {
			u.around(1, 5, 5, function(err, infos) {
				assert.equal(infos[0].length, 3);
				assert.equal(infos[0][0].usn, 3);
				assert.equal(infos[0][1].usn, 9);
				assert.equal(infos[0][2].usn, 2);
				assert.equal(infos[2].length, 5);
				assert.equal(infos[2][0].usn, 11);
				assert.equal(infos[2][1].usn, 7);
				assert.equal(infos[2][2].usn, 8);
				assert.equal(infos[2][3].usn, 4);
				assert.equal(infos[2][4].usn, 6);
				done();
			});
		});

		it("should get correct # of users between 50 and 70", function(done) {
			u.nrankers(50, 70, function(err, info) {
				assert.equal(info.cnts, 2);
				done();
			});
		});

	});

	it("should execute correctly even add massive data", function(done) {
		var u = new UserIndex({sort:['desc','asc'], second_key: 'updated_at'});

		var stop = false;
		var count = 0;
		setTimeout(function() { stop = true; }, 1500);
		async.forever(function(callback) {

			var n1 = Math.floor(Math.random()*10000000);
			var n2 = Math.floor(Math.random()*10000);
			u.upsert(n1, n2, function(err, uinfo) {
				count++;
				if (err !== undefined || uinfo === undefined || uinfo.usn !== n1) {
					console.log(err, uinfo);
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
			done();
		});
	});

	describe.skip("Retrive", function() {
		var u;
		it("test", function(done) {
			u = new UserIndex({sort:['desc','asc'], second_key: 'updated_at'});

			var uk = [[1, 52], [2,67], [3,83], [4,28], [5,9], [6,24], [7,45], [8,45], [9,74], [10,19], [11,47]];

			console.log("==================");
			async.eachSeries(uk, function(item, cb) {
				setTimeout(function() {
					u.upsert(item[0], item[1], function(err, kv) {
						var keys = Object.keys(u.ranking.NodeFactory.cache); 
						for (var i=0; i<keys.length; i++) {
							var n = u.ranking.NodeFactory.cache[keys[i]];
							console.log(keys[i], n.length, n.isLeaf);
							for (var j=0; j<n.length*n.kvsize; j+=n.kvsize) {
								console.log(n.buffer.slice(j, j+n.kvsize));
							}
						}
						console.log("------------------");
						cb(err, kv);
					});
				}, 1);
			}, function(err) {
				done();
			});
		});
	});

});

