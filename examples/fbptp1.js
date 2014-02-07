var assert = require('assert')
  , Tree = require('../core/index/buffer-bptree')
  , async = require('async')
  , BU = require('../core/util/buffer-util')
  ;

	// put below into somewhere
	var kh = {
		  size: 4
    , comparor: BU.compareInt32LE
	};
	var vh = {
			size: 4
	};

t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 16384, path: '/tmp/test1.dat'});
// t = new Tree({keyhandler: kh, valuehandler: vh, block_size: 128});

var count = 0;
var valid = {};

/*
console.time("UPSERT");
var looping = function(done) {
	var n1 = Math.floor(Math.random()*1000);
	var n2 = Math.floor(Math.random()*1000);
	var b1 = BU.fromInt32LE(n1);
	var b2 = BU.fromInt32LE(n2);
	valid[n1] = n2;
	t.upsert(b1, b2, function(err, kv) {
		count++;
		assert(BU.equal(b1, kv[0]));
		assert(BU.equal(b2, kv[1]));
		if (count < 1000000) {
			setImmediate(looping, done);
		} else {
console.timeEnd("UPSERT");
			setImmediate(done);
		}
	});
};

looping(function() {

console.time("VALID");
  async.eachSeries(Object.keys(valid), function(item, callback) {
			var val = valid[item];
			var b = BU.fromInt32LE(item);
			t.get(b, function(err, kv) {
				assert.equal(err, undefined);
				assert(BU.equal(b, kv[0]));
				assert(BU.equal(BU.fromInt32LE(val), kv[1]));
				setImmediate(callback);
			});
		}, function(err) { console.log("ERR", err); console.timeEnd("VALID");});

});
*/

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

console.time("UPSERT");
async.forever(function(callback) {

	var n1 = Math.floor(Math.random()*10000);
	var n2 = Math.floor(Math.random()*10000);
	var b1 = BU.fromInt32LE(n1);
	var b2 = BU.fromInt32LE(n2);
	valid[n1] = n2;
	t.upsert(b1, b2, function(err, kv) {
		count++;
		assert(BU.equal(b1, kv[0]));
		assert(BU.equal(b2, kv[1]));
		if (count < 100000) {
			setImmediate(callback, null);
		} else {
console.timeEnd("UPSERT");
			setImmediate(callback, "NOMORE");
		}
	});

}, function(err) {

console.time("VALID");
console.log("LEFT", Object.keys(valid).length);
  async.eachSeries(Object.keys(valid), function(item, callback) {
			var val = valid[item];
			var b = BU.fromInt32LE(item);
			t.get(b, function(err, kv) {
				assert.equal(err, undefined);
				assert(BU.equal(b, kv[0]));
				assert(BU.equal(BU.fromInt32LE(val), kv[1]));
				setImmediate(callback);
			});
		}, function(err) { 
			console.log("ERR", err); 
			console.timeEnd("VALID");
  		async.eachSeries(shuffle(Object.keys(valid)), function(item, callback) {
				var b = BU.fromInt32LE(item);
				t.remove(b, function(err, kv) {
					setImmediate(callback);
				});
			}, function(err) { 
				console.log("REMOVE-ERR", err); 
			});
		});

});

