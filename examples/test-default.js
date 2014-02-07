var assert = require('assert')
  , Users = require('../app/user/index')
  , async = require('async')
  , fs = require('fs')
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

config = require('../server/config/test-default.json');

u = new Users(config);

var count = 0;
var valid = {};

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

console.time("UPSERT");
console.log("START");
var t = (new Date()).getTime();
var stop = false;
// setTimeout(function() { stop = true; }, 10000);
async.forever(function(callback) {

	var n1 = Math.floor(Math.random()*100000000);
	var n2 = Math.floor(Math.random()*10000000);
	// var b1 = BU.fromInt32LE(n1);
	// var b2 = BU.fromInt32LE(n2);
	valid[n1] = n2;
	u.upsert(n1, n2, function(err, uinfo) {
		count++;
		if (err !== undefined || uinfo === undefined || uinfo.usn !== n1) {
			console.log(err, uinfo);
		}
		if (stop) {
console.timeEnd("UPSERT");
console.log("FINISHED", count);
			setImmediate(callback, "STOP");
		} else if (count < 1000000) {
			if (count % 1000 === 0) { console.log("STEP", count, Math.floor(count/((new Date()).getTime()-t)*1000)); }
			setImmediate(callback, null);
		} else {
console.timeEnd("UPSERT");
console.log("FINISHED", count);
			setImmediate(callback, "NOMORE");
		}
	});

}, function(err) {
	fs.closeSync(u.users.NodeFactory.fd);
	fs.closeSync(u.ranking.NodeFactory.fd);

/*
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
*/

});

