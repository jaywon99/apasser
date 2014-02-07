var fs = require('fs')
  , BU = require('../core/util/buffer-util')
  ;

var fd = fs.openSync("/tmp/user.dat", "r");

id = process.argv[2];
console.log("BLOCK ", id);

var buffer = new Buffer(16384);
var r = fs.readSync(fd, buffer, 0, 16384, id*16384);

function toHexString(buffer, start, end) {
        var line = "";
        for (var j=start; j<end; j++) {
          if (buffer[j] < 16) line += "0"+buffer[j].toString(16) + " ";
          else line += buffer[j].toString(16) + " ";
        }
	return line;
}

switch (BU.toInt32LE(buffer, 16384-4)) {
    case 0x4C454146: // LEAF

    case 0x4252414E: // BRANCH
			var len = BU.toInt32LE(buffer, 16384-8);
			console.log("BRANCH - len: ", len);
			for (var i=0, j=0; i<len; i++, j+=12) {
				console.log(i+": "+toHexString(buffer, j, j+8) + " -> " + BU.toInt32LE(buffer, j+8, j+12));
			}

			break;
}

fs.closeSync(fd);

