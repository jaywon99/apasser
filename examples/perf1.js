var BU = require('../core/util/buffer-util')
  ;

var b1 = BU.fromInt32LE(250);
var b2 = BU.fromInt32LE(123123123);

console.time("incInt32LE");
for (var i=0; i<1000000; i++) {
  var t1 = new Buffer(b1);
	BU.incInt32LE(t1, 123123123);
}

console.timeEnd("incInt32LE");

console.time("addInt32LE");
for (var i=0; i<1000000; i++) {
  var t1 = new Buffer(b1);
	BU.addInt32LE(t1, b2);
}

console.timeEnd("addInt32LE");

