'use strict';

var express = require('express')
  , app = express()
  , User = require('../app/user/index')
  , fs = require('fs')
  , config = require('./config/service.json')
  , winston = require('winston')
  ;

if (config.error_log) {
  var path;
  if (config.error_log[0] === '/') {
    path = config.error_log;
  } else {
    path = __dirname + '/' + config.access_log;
  }

  global.logger = new (winston.Logger)({
    transports: [
      new winston.transports.DailyRotateFile({ filename: path, json: false, datePattern: '.yyyy-MM-dd' })
    ],
    exceptionHandlers: [
      new winston.transports.DailyRotateFile({ filename: path, json: false, datePattern: '.yyyy-MM-dd' })
    ],
    exitOnError: false
  });
} else {
  global.logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
    ],
    exceptionHandlers: [
      new (winston.transports.Console)(),
    ],
    exitOnError: false
  });
}

var port = 17265; // UserRANK

var repo_map = {};
var valid_ip = {"127.0.0.1":1};

var getUserIndex = function(repo) {
  if (repo_map[repo] === undefined) {
    var conf;
    try {
      conf = require('./config/repo-'+repo+'.json');
      repo_map[repo] = new User(conf);
    } catch (err) {
      return undefined;
    }
  }
  return repo_map[repo];
};

app.configure(function() {
  app.use(express.json());
  app.use(express.urlencoded());
  if (config.demo) {
    app.use("/demo", express.static(__dirname + '/public'));
  }

// Logging
  var logFile;
  if (!(config.access_log)) {
  } else if (config.access_log[0] === '/') {
    logFile = fs.createWriteStream(config.access_log, {flags: 'a'});
    app.use(express.logger({ stream: logFile }));
  } else {
    logFile = fs.createWriteStream(__dirname + '/' + config.access_log, {flags: 'a'});
    app.use(express.logger({ stream: logFile }));
  }

// IP restriction - check netmask module - npm install netmask --save
/*
  app.use(function(req, res, next) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (valid_ip[ip] === undefined) {
      res.json(403, {msg: 'not registered ip'});
    } else {
      next();
    }
  });
*/

  // GLOBAL EXCEPTION HANDLING
  app.use(function(err, req, res, next){
    global.logger.error('expressjs ============================================='); 
    global.logger.error(err.stack);
    res.statusCode = 500;
    res.sendfile(__dirname+'/public/500.html');
  });

});

app.get('/health', function(req, res) {
  res.json({
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// GET User Score
app.get('/v1/user/:repo/:usn', function(req, res) {
  var repo = req.params['repo'];
  var usn  = req.params['usn']*1;

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.get(usn, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// POST - update user score
app.post('/v1/user/:repo/:usn', function(req, res) {
  var repo  = req.params['repo'];
  var usn   = req.params['usn']*1;
  var score = req.body['score']*1; // OR POST

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.upsert(usn, score, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// DELETE - delete user info & score
app.delete('/v1/user/:repo/:usn', function(req, res) {
  var repo = req.params['repo'];
  var usn  = req.params['usn']*1;

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.delete(usn, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// GET - around user list - from prior to after
app.get('/v1/around/:repo/:usn', function(req, res) {
  var repo  = req.params['repo'];
  var usn   = req.params['usn']*1;
  var prior = req.query['prior']*1;
  var after = req.query['after']*1;

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.around(usn, prior, after, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// GET - ranked user lsit - from s to e
app.get('/v1/rankers/:repo/', function(req, res) {
  var repo = req.params['repo'];
  var s    = req.query['s']*1;
  var e    = req.query['e']*1;

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.rankers(s, e, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// GET # of users in score range - from s to e
app.get('/v1/nrankers/:repo/', function(req, res) {
  var repo = req.params['repo'];
  var s    = req.query['s']*1;
  var e    = req.query['e']*1;

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.nrankers(s, e, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// GET - rank of score
app.get('/v1/rank_of/:repo/:score', function(req, res) {
  var repo  = req.params['repo'];
  var score = req.params['score']*1;

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.rank_of(score, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// GET users from score - limit #
// XXX - how can we repeat it????
app.get('/v1/usersFrom/:repo/:score', function(req, res) {
  var repo  = req.params['repo'];
  var score = req.params['score']*1;
  var limit = req.query['limit']*1;

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
  userIndex.usersFrom(score, limit, function(err, result) {
    if (err) {
      res.json(404, {msg: err});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

// SUPPORT ELO RANKING - XXX
app.post('/v1/elo/:repo/', function(req, res) {
  var repo = req.params['repo'];
  // check win, lose, tie

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
});

// REFRESH UserLink - Don't know why we need it but maybe - XXX
app.get('/v1/refresh/:repo/', function(req, res) {
  var repo = req.params['repo'];
  // refresh UserIndex

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
});

// BULK UPLOAD!!! - XXX
app.post('/v1/bulk/:repo/', function(req, res) {
  var repo = req.params['repo'];
  // refresh UserIndex

  var userIndex = getUserIndex(repo);
  if (userIndex === undefined) { res.json(404, {msg: "NoSuchRepo"}); res.end(); return; }
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.statusCode = 404;
  res.sendfile(__dirname+'/public/404.html');
});

app.listen(port);
console.log('Server running at http://127.0.0.1:'+port+'/');


