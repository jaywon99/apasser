var assert = require('assert')
  , BU = require('../core/util/buffer-util')
  ;

describe("BufferUtil", function() {

	describe("fromInt32LE", function() {
		it("should return valid byte array", function() {
			var b = BU.fromInt32LE(25);
			assert.equal(b.length, 4);
			assert.equal(b[0], 25);
			assert.equal(b[1], 0);
			assert.equal(b[2], 0);
			assert.equal(b[3], 0);
		});
	});

	describe("compareInt32LE", function() {
		it("should return negative number if second is bigger", function() {
			var a = BU.fromInt32LE(15);
			var b = BU.fromInt32LE(25);
			assert(BU.compareInt32LE(a,b)<0);
		});
		it("should return positive number if first is bigger", function() {
			var a = BU.fromInt32LE(25);
			var b = BU.fromInt32LE(15);
			assert(BU.compareInt32LE(a,b)>0);
		});
		it("should return 0 if same", function() {
			var a = BU.fromInt32LE(15);
			var b = BU.fromInt32LE(15);
			assert(BU.compareInt32LE(a,b)===0);
		});
	});

	describe("fromNow", function() {
		it("should return unique number (timestamp * 1024 + random)", function() {
			var b1 = BU.fromNow();
			setTimeout(function() {
				var b2 = BU.fromNow();
				assert(BU.compareInt64LE(b1, b2) < 0);
			}, 1);
		});
	});

	describe("toInt32LE", function() {
		it("should return valid int value", function() {
			var b = BU.fromInt32LE(25);
			assert.equal(BU.toInt32LE(b), 25);
		});
	});

	describe("equals", function() {
		it("should return true if two buffer contents are same", function() {
			assert(BU.equal(BU.fromInt32LE(100), BU.fromInt32LE(100)));
		});
	});

	describe("addInt32LE", function() {
		it("should add correctly", function() {
			var b1 = BU.fromInt32LE(25);
			var b2 = BU.fromInt32LE(25);
			BU.addInt32LE(b1, 0, b2, 0);
			assert.equal(BU.toInt32LE(b1), 50);
		});
		it("should add correctly (no offset === 0)", function() {
			var b1 = BU.fromInt32LE(25);
			var b2 = BU.fromInt32LE(25);
			BU.addInt32LE(b1, b2);
			assert.equal(BU.toInt32LE(b1), 50);
		});
		it("should add correctly when carry", function() {
			var b1 = BU.fromInt32LE(250);
			var b2 = BU.fromInt32LE(350);
			BU.addInt32LE(b1, b2);
			assert.equal(BU.toInt32LE(b1), 600);
		});
	});

	describe("subInt32LE", function() {
		it("should subtract correctly", function() {
			var b1 = BU.fromInt32LE(50);
			var b2 = BU.fromInt32LE(25);
			BU.subInt32LE(b1, 0, b2, 0);
			assert.equal(BU.toInt32LE(b1), 25);
		});
		it("should subtract correctly (no offset === 0)", function() {
			var b1 = BU.fromInt32LE(50);
			var b2 = BU.fromInt32LE(25);
			BU.subInt32LE(b1, b2);
			assert.equal(BU.toInt32LE(b1), 25);
		});
		it("should subtract correctly when carry", function() {
			var b1 = BU.fromInt32LE(123123432);
			var b2 = BU.fromInt32LE(123432);
			BU.subInt32LE(b1, b2);
			assert.equal(BU.toInt32LE(b1), 123000000);
		});
		it("should subtract correctly even number < 0", function() {
			var b1 = BU.fromInt32LE(123123);
			var b2 = BU.fromInt32LE(123432);
			BU.subInt32LE(b1, b2);
			assert.equal(BU.toInt32LE(b1), -309);
		});
	});


});

