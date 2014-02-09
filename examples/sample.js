var assert = require('assert')
  , Users = require('../app/user/index')
  , async = require('async')
  , fs = require('fs')
  , BU = require('../core/util/buffer-util')
  ;

config = require('../server/config/repo-sample.json');

u = new Users(config);

var count = 0;
var t = (new Date()).getTime();
// var usn = 2000001;
var usn = 1;
var max_count = 10000;
// var max_count = 1000;
var stop = false;

console.time("UPSERT");
console.log("START");
// setTimeout(function() { stop = true; }, 10000);
async.forever(function(callback) {

  var n1 = usn++;
  var n2 = Math.floor(Math.random()*10000000);
  u.upsert(n1, n2, function(err, uinfo) {
    count++;
    if (err !== undefined || uinfo === undefined || uinfo.usn !== n1) {
      console.log(err, uinfo, n1, n2);
    }
    if (stop) {
      console.timeEnd("UPSERT");
      console.log("FINISHED", count);
      setImmediate(callback, "STOP");
    } else if (count < max_count) {
      if (count % 1000 === 0) { 
        console.log("STEP", count, Math.floor(count/((new Date()).getTime()-t)*1000), process.memoryUsage()); 
        console.log("QUEUESIZE user: ", u.users.NodeFactory.delayed_queue.length(), u.users.NodeFactory.cache.itemCount);
        console.log("QUEUESIZE rank: ", u.ranking.NodeFactory.delayed_queue.length(), u.ranking.NodeFactory.cache.itemCount);
      }
      setImmediate(callback, null);
    } else {
      console.timeEnd("UPSERT");
      console.log("FINISHED", count, usn);
      setImmediate(callback, "NOMORE");
    }
  });

}, function(err) {
  // fs.closeSync(u.users.NodeFactory.fd);
  // fs.closeSync(u.ranking.NodeFactory.fd);

});

