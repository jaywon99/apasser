'use strict';

var fs = require('fs')
  , repl = require('repl')
  , Users = require('../app/user/index')
  , argv = require('minimist')(process.argv.slice(2))
  ;

if (argv._.length !== 1) {
  console.log("Usage: node %s config.json", process.argv[1]);
  process.exit(-1);
}

if (argv._[0][0] === '/') {
  var config = require(argv._[0]);
} else {
  var config = require(process.cwd()+"/"+argv._[0]);
}

var users = new Users(config);

var context = repl.start("> ").context;

context.u = users;
context.ub = users.users;
context.rb = users.ranking;
context.BU = require('../core/util/buffer-util');


