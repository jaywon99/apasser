'use strict';

var fs = require('fs')
  , readline = require('readline')
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

var cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

process.stdin.on('keypress', function(s, key) {
  if (key && key.ctrl && key.name == 'l') {
    process.stdout.write ('\u001B[2J\u001B[0;0f');
    cli.prompt();
  }
});

console.log("Welcome to CLI");
cli.setPrompt("> ", 2);
cli.on('line', function(line) {
  var cmds = line.split(/ /).filter(function(x) { return x; });

  switch (cmds[0]) {
  case 'quit': cli.close(); break;
  case 'get':
    if (cmds.length !== 2) {
      console.log("Usage: get usn");
      cli.prompt();
    } else {
      users.get(cmds[1], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'upsert':
    if (cmds.length !== 3) {
      console.log("Usage: upsert usn new-score");
      cli.prompt();
    } else {
      users.upsert(cmds[1], cmds[2], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'delete':
    if (cmds.length !== 2) {
      console.log("Usage: delete usn");
      cli.prompt();
    } else {
      users.delete(cmds[1], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'around':
    if (cmds.length !== 4) {
      console.log("Usage: around usn #-of-high-rankers #-of-low-rankers");
      cli.prompt();
    } else {
      users.around(cmds[1], cmds[2], cmds[3], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'rankers':
    if (cmds.length !== 3) {
      console.log("Usage: rankers rank1 rank2");
      cli.prompt();
    } else {
      users.rankers(cmds[1], cmds[2], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'nrankers':
    if (cmds.length !== 3) {
      console.log("Usage: nrankers score1 score2");
      cli.prompt();
    } else {
      users.nrankers(cmds[1], cmds[2], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'rank_of':
    if (cmds.length !== 2) {
      console.log("Usage: rank_of score");
      cli.prompt();
    } else {
      users.rank_of(cmds[1]*1, function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'usersFrom':
    if (cmds.length !== 3) {
      console.log("Usage: usersFrom score limit");
      cli.prompt();
    } else {
      users.usersFrom(cmds[1], cmds[2], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'dump':
    if (cmds.length !== 2) {
      console.log("Usage: dump path");
      cli.prompt();
    } else {
      users.dump(cmds[1], function(err, uinfo) {
        if (err) { console.log("Error: "+err); }
        else { console.log(JSON.stringify(uinfo, null, 4)); }
        cli.prompt();
      });
    }
    break;
  case 'load':
  default:
    console.log("You can use only 'quit', 'get', 'upsert', 'delete', 'around', 'rankers', 'nrankers', 'rank_of', 'usersFrom', 'dump'.");
    console.log("\tquit: quit this cli");
    console.log("\tget usn: get single user score & rank");
    console.log("\tupsert usn score: update user score and get new rank");
    console.log("\tdelete usn: delete single user");
    console.log("\taround usn #-of-high-rankers #-of-low-rankers: get users around specific user. like get 50 high ranker and 50 low ranker around me.");
    console.log("\trankers rank1 rank2: get users whose rank is between rank1 to rank2 - absolute ranks. ex) get rank 1 to rank 100");
    console.log("\tnrankers rank1 rank2: count users whose score are between rank1 and rank2");
    console.log("\trank_of score: get rank of specific score. ex) rank_of 2000");
    console.log("\tusersFrom score limit: get users whose score was less then specic and get limited users");
    console.log("\tdump path: dump data to backup files");
    cli.prompt();
  }
});
cli.on('close', function() {
  console.log("Anyoung");
  process.exit();
});

cli.prompt();

