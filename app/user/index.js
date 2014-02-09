"use strict";

var BPlusTree = require('../../core/index/buffer-bptree')
  , RankBPlusTree = require('../../core/index/buffer-rbptree')
  , BU = require('../../core/util/buffer-util')
  , fs = require('fs')
  , ReadWriteLock = require('rwlock')
  , async = require('async')
  ;

exports = module.exports = UserIndex;

// Value Structure for User
// score: 4byte (32bit) - 0
// updated_at: 8byte (Timestamp*1024+Randome) - 4
// created_at: 8byte (Timestamp*1024+Randome) - 12
// played: 4byte (32bit) - 20

// KV Structure for Ranking
// score: 4byte (32bit) - 0
// key2:  8byte (64bit) - 4
// usn:   8byte (64bit) - 12

exports.UserKeyHandler = {
  size: 8,
  comparor: BU.BcompareInt64LER
};

exports.UserValueHandler = {
  size: 24,
}

exports.getRankingInfo = function(options) {
  var info = { keyhandler: { size: 12} };
  var sort = (options.sort) ? options.sort.join(",") : "desc,asc";
  switch(sort) {
    case "asc,asc":
      info.keyhandler.comparor = BU.BcompareI32AI64A; break;
    case "asc,desc":
      info.keyhandler.comparor = BU.BcompareI32AI64D; break;
    case "desc,asc":
      info.keyhandler.comparor = BU.BcompareI32DI64A; break;
    case "desc,desc":
      info.keyhandler.comparor = BU.BcompareI32DI64D; break;
    default:
      throw new Error("sort should be array of asc/desc");
  }
  switch(options.sort[1]) {
    case 'desc':
      info.max_2nd = new Buffer(8);
      info.max_2nd.fill(0xFF, 0, 7);
      info.max_2nd[7] = 0x7F;
      break;
    case 'asc':
    default:
      info.max_2nd = new Buffer(8);
      info.max_2nd.fill(0, 0, 7);
      info.max_2nd[7] = 0x80;
      break;
  }
  switch(options.second_key) {
    case "usn":
      info.key2i = 0; 
      info.key2ps = 0;
      info.key2pe = 8;
      break;
    case "created_at":
      info.key2i = 1;
      info.key2ps = 4;
      info.key2pe = 12;
      break;
    case "updated_at":
    default:
      info.key2i = 1;
      info.key2ps = 12;
      info.key2pe = 20;
      break;
  }
  return info;
};

function UserIndex(options) {
  this.keyinfo = exports.getRankingInfo(options);

  this.users = new BPlusTree({keyhandler:exports.UserKeyHandler, valuehandler:exports.UserValueHandler, block_size:16384, path: (options.base === undefined || options.base === 'memory') ? options.base : options.base+'-user.bpt'});
  this.ranking = new RankBPlusTree({keyhandler:this.keyinfo.keyhandler, valuehandler: {size: 8}, block_size: 16384, path: (options.base === undefined || options.base === 'memory') ? options.base : options.base+'-rank.rbpt'});
  // this.users = new BPlusTree({keyhandler:exports.UserKeyHandler, valuehandler:exports.UserValueHandler, block_size: 16384});
  // this.ranking = new RankBPlusTree({keyhandler:this.keyinfo.keyhandler, valuehandler: {size: 8}, block_size: 16384});

  this.lock = new ReadWriteLock();

};

UserIndex.prototype.rankingKey = function(ukv) {
  var buf = new Buffer(12);
  ukv[1].copy(buf, 0, 0, 4);
  ukv[this.keyinfo.key2i].copy(buf, 4, this.keyinfo.key2ps, this.keyinfo.key2pe);
  return buf;
};

UserIndex.prototype.scoreKey = function(ukv) {
  var buf = new Buffer(12);
  if (typeof ukv === 'number') {
    BU.fromInt32LE(ukv, buf);
  } else if (ukv instanceof Buffer) {
    ukv.copy(buf, 0, 0, 4);
  } else {
    ukv[1].copy(buf, 0, 0, 4);
  }
  this.keyinfo.max_2nd.copy(buf, 4, 0, 8);
  return buf;
};

UserIndex.prototype.get = function(usn, callback) {
  var self = this;
  var busn = BU.fromInt64LE(usn);

this.lock.readLock(function(release) {
  self.users.get(busn, function(err, ukv) {
    if (err) {
release();
      callback.call(self, err);
    } else {
      async.parallel([
          function(cb) {
            var buf = self.rankingKey(ukv);
            self.ranking.rank(buf, function(err, kv, rank) {
              if (err) cb(err);
              else cb(null, rank);
            });
          }
        , function(cb) {
            var buf = self.scoreKey(ukv);
            self.ranking.rank(buf, function(err, kv, rank) {
              if (err) cb(err);
              else cb(null, Math.abs(rank));
            });
          }
      ], function(err, results) {
release();
        if (err) callback.call(self, err);
        else callback.call(self, undefined, {usn: usn, score: BU.toInt32LE(ukv[1],0), rank: results[0], score_rank: Math.abs(results[1])});
      });
    }
  });
});

};

UserIndex.prototype.upsert = function(usn, newscore, callback) {
  var self = this;
  this.transactionLog("UPSERT", usn, newscore);
  var busn = BU.fromInt64LE(usn);
this.lock.writeLock(function(release) {
  async.waterfall([
      function(cb) {
        self.users.upsert(busn, function(v) {
          if (v === undefined) {
            v = new Buffer(24);
            v.fill(0, 20, 24);
            BU.fromNow(v, 12);
          }
          BU.fromInt32LE(newscore, v, 0);
          BU.fromNow(v, 4);
          return v;
        }, cb);
      }
    , function(oldukv, newukv, cb) {
        if (oldukv === undefined) {
          var newb = self.rankingKey(newukv);
          var scoreb = self.scoreKey(newukv);
//console.log("insert", newb);
          self.ranking.insert(newb, busn, function(err, kv, rank) {
            cb(err, kv, rank, scoreb);
          });
        } else {
          var oldb = self.rankingKey(oldukv);
          var newb = self.rankingKey(newukv);
          var scoreb = self.scoreKey(newukv);
          self.ranking.update(oldb, newb, function(err, kv, rank) {
            cb(err, kv, rank, scoreb);
          });
        }
      }
    , function(kv, rank, scoreb, cb) {
        self.ranking.rank(scoreb, function(err, kv, score_rank) {
          cb(undefined, {usn: usn, score: newscore, rank: rank, score_rank: Math.abs(score_rank)});
        });
      }
  ], function(err, result) {
release();
    callback.apply(self, arguments);
  });
});
};

UserIndex.prototype.remove = function(usn, callback) {
  var self = this;
  this.transactionLog("REMOVE", usn, 0);
  var busn = BU.fromInt64LE(usn);
this.lock.writeLock(function(release) {
  async.waterfall([
      function(cb) { self.users.remove(busn, cb); }
    , function(ukv, cb) { self.ranking.remove(self.rankingKey(ukv), cb); }
  ], function(err, result) {
release();
    callback.call(self, err);
  });
});
};

UserIndex.prototype.around = function(usn, prior, after, callback) {
  var self = this;
  var busn = BU.fromInt64LE(usn);
this.lock.readLock(function(release) {
  self.users.get(busn, function(err, kv) {
    if (err) {
release();
      callback.call(self, err);
    } else {
      self.ranking.around(self.rankingKey(kv), prior*1, after*1, function(myrank, prior, mine, after) {
        var scores = {}, item;

        var s = BU.toInt32LE(mine[0]);
        var mineur = { usn: BU.toInt64LE(mine[1]), score: s, rank: myrank };
        scores[s] = mine[0].slice(0,4);

        var priorurs = [];
        var priorrank = 0;
        while ((item = prior.shift())) {
          for (var i=0; i<item.length; i+=20) {
            var s = BU.toInt32LE(item, i);
            var u = { usn: BU.toInt64LE(item, i+12), score: s, rank: priorrank++ }
            priorurs.push(u);
            scores[s] = item.slice(i, i+4);
          }
        }
        for (var i in priorurs) {
          priorurs[i].rank = myrank - priorrank + priorurs[i].rank;
        }

        var afterurs = [];
        while ((item = after.shift())) {
          for (var i=0; i<item.length; i+=20) {
            var s = BU.toInt32LE(item, i);
            var u = { usn: BU.toInt64LE(item, i+12), score: s, rank: ++myrank }
            afterurs.push(u);
            scores[s] = item.slice(i, i+4);
          }
        }

        self._score_ranks(scores, function(err, scoreMap) {
release();
          if (err) callback.call(self, err);
          else {
            for (var u in priorurs) {
              priorurs[u].score_rank = scoreMap[priorurs[u].score];
            }
            for (var u in afterurs) {
              afterurs[u].score_rank = scoreMap[afterurs[u].score];
            }
            mineur.score_rank = scoreMap[mineur.score];
            callback.call(self, undefined, [priorurs, mineur, afterurs]);
          }
        });
      });
    }
  });
});
};

UserIndex.prototype.rankers = function(rank1, rank2, callback) {
  var self = this;
this.lock.readLock(function(release) {
  self.ranking.range(rank1, rank2, function(kvs) {
    var item;
    var urs = [];
    var scores = {};
    while ((item = kvs.shift())) {
      for (var i=0; i<item.length; i+=20) {
        var s = BU.toInt32LE(item, i);
        var u = { usn: BU.toInt64LE(item, i+12), score: s, rank: rank1++ }
        urs.push(u);
        scores[s] = item.slice(i, i+4);
      }
    }

    self._score_ranks(scores, function(err, scoreMap) {
release();
      if (err) callback.call(self, err);
      else {
        for (var u in urs) {
          urs[u].score_rank = scoreMap[urs[u].score];
        }
        callback.call(self, undefined, urs);
      }
    });
  });
});
};

UserIndex.prototype.nrankers = function(score1, score2, callback) {
  var self = this;
this.lock.readLock(function(release) {
  async.parallel([
      function(cb) { self.ranking.rank(self.scoreKey(score1), cb); }
    , function(cb) { self.ranking.rank(self.scoreKey(score2), cb); }
  ], function(err, result) {
release();
    if (err) { callback.call(self, err); }
    else { callback.call(self, undefined, {s: score1, e: score2, cnts: Math.abs(Math.abs(result[0][1]) - Math.abs(result[1][1])) }); }
  });
});
};

UserIndex.prototype.rank_of = function(score, callback) {
  var self = this;
this.lock.readLock(function(release) {
  self.ranking.rank(self.scoreKey(score), function(err, rkv, rank) {
release();
    if (err) { callback.call(this, err); }
    else { callback.call(this, undefined, {score: score, score_rank: Math.abs(rank)}); };
  });
});

};

UserIndex.prototype.usersFrom = function(score, limit, callback) {
  var self = this;
this.lock.readLock(function(release) {
  self.ranking.around(self.scoreKey(score), 0, limit*1, function(rank, prior, mine, after) {
    var scores = {}, item;

    rank = Math.abs(rank);
    var afterurs = [];
    while ((item = after.shift())) {
      for (var i=0; i<item.length; i+=20) {
        var s = BU.toInt32LE(item, i);
        var u = { usn: BU.toInt64LE(item, i+12), score: s, rank: rank++ }
        afterurs.push(u);
        scores[s] = item.slice(i, i+4);
      }
    }

    self._score_ranks(scores, function(err, scoreMap) {
release();
      if (err) callback.call(self, err);
      else {
        for (var u in afterurs) {
          afterurs[u].score_rank = scoreMap[afterurs[u].score];
        }
        callback.call(self, undefined, afterurs);
      }
    });
  });
});
}

UserIndex.prototype.dump = function(filename, callback) {
  var self = this;
this.lock.readLock(function(release) {
  async.parallel([
      function(cb) { 
        var uws = fs.createWriteStream(filename+".user.dmp");
        self.users.dump(uws, function(err) {
          uws.close();
          cb(err);
        });
      }
    , function(cb) { 
        var rws = fs.createWriteStream(filename+".rank.dmp");
        self.ranking.dump(rws, function(err) {
          rws.close();
          cb(err);
        });
      }
  ], function() {
release();
    callback.apply(self, arguments);
  });
});
};

UserIndex.prototype.load = function(filename, callback) {
  var self = this;
this.lock.writeLock(function(release) {
  async.parallel([
      function(cb) { 
        var urs = fs.createReadStream(filename+".user.dmp");
        this.users.load(urs, function(err) {
          urs.close();
          cb(err);
        });
      }
    , function(cb) { 
        var rrs = fs.createReadStream(filename+".rank.dmp");
        this.ranking.load(rrs, function(err) {
          rrs.close();
          cb(err);
        });
      }
  ], function() {
release();
    callback.apply(self, arguments);
  });
});
};

UserIndex.prototype.transactionLog = function(cmd, usn, score) {
};

UserIndex.prototype._score_ranks = function(scores, callback) {
  var self = this;
  var scorekeys = [];
  for (var x in scores) {
    scorekeys.push(self.scoreKey(scores[x]));
  }
  async.map(scorekeys, function(item, cb) {
    self.ranking.rank(item, function(err, kv, rank) {
      if (err) cb(err);
      else cb(null, [BU.toInt32LE(kv[0]), Math.abs(rank)]);
    });
  }, function(err, results) {
    if (err) callback.call(self, err);
    else {
      var scoreMap = {};
      for (var i in results) {
        scoreMap[results[i][0]] = results[i][1];
      }
      callback.call(self, undefined, scoreMap);
    }
  });
};

