
console.time("ADDIT");

var x, y, z;
y=10;z=20;
for (var i=0; i<1000000; i++) {
  x = y+z;
}
console.timeEnd("ADDIT");

console.time("CALLIT");

var x, y, z;
y=10;z=20;
c = function() { return y+z; }
for (var i=0; i<1000000; i++) {
  x = c();
}
console.timeEnd("CALLIT");

