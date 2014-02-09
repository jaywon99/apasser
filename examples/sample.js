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

config = require('../server/config/repo-sample.json');

u = new Users(config);

var count = 0;
var t = (new Date()).getTime();
var usn = 1;
var max_count = 1000000;
var stop = false;

console.time("UPSERT");
console.log("START");
// setTimeout(function() { stop = true; }, 10000);
async.forever(function(callback) {

	var n1 = usn++;
	var n2 = Math.floor(Math.random()*10000000);
	// var b1 = BU.fromInt32LE(n1);
	// var b2 = BU.fromInt32LE(n2);
	u.upsert(n1, n2, function(err, uinfo) {
		count++;
		if (err !== undefined || uinfo === undefined || uinfo.usn !== n1) {
			console.log(err, uinfo);
		}
		if (stop) {
console.timeEnd("UPSERT");
console.log("FINISHED", count);
			setImmediate(callback, "STOP");
		} else if (count < max_count) {
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

});

