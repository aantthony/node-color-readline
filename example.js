'use strict';

var colorReadline = require('./');
var chalk = require('chalk');
var repl = colorReadline.createInterface({
  input: process.stdin,
  output: process.stdout,
  colorize: function (str) {
    return str.replace(/e/g, function (match) {
      return chalk.red(match);
    });
  }
});

repl.on('line', function (cmd) {
  console.log('LINE:', cmd);
});

repl.prompt();
