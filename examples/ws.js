var express = require('express')
  , app = express()
  , fs = require('fs')
  ;

app.configure(function() {
  app.use(express.static(__dirname + '/../coverage/lcov-report'));
});

app.listen(8080);
console.log("START at :8080");
