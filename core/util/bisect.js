"use strict";

exports = module.exports = {
  bisector: function(f, c) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (c.call(a, f.call(a, a[mid], mid) , x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (c.call(a, f.call(a, a[mid], mid), x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  },
  default_bisector: function() {
    return this.bisector(function(d) { return d; }, function(a,b) { return a-b; });
  }

};

