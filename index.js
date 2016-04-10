'use strict';

var ansi = require('ansi');
var util = require('util');
var chalk = require('chalk');
var ReadlineInterface = require('readline').Interface;

exports.createInterface = function (options) { return new Interface(options); };

exports.Interface = Interface;

util.inherits(Interface, ReadlineInterface);
function Interface(options) {
  if (!(this instanceof Interface)) {
    return new Interface(options);
  }

  this.suggest = (options && options.suggest) || function () {
    return null;
  };

  this.colorize = (options && options.colorize) || function (str) {
    return str;
  };

  this._ansiCursor = ansi(options && options.output);
  ReadlineInterface.call(this, options);
}

Interface.prototype._originalWriteToOutput = ReadlineInterface.prototype._writeToOutput;
Interface.prototype._writeToOutput = function (stringToWrite) {
  if (stringToWrite === '\r\n' || stringToWrite === ' ') {
    this.output.write(stringToWrite);
    return;
  }
  if (!stringToWrite) return;

  var startsWithPrompt = stringToWrite.indexOf(this._prompt) === 0;
  if (startsWithPrompt) {
    this.output.write(this._prompt);
    stringToWrite = stringToWrite.substring(this._prompt.length);
    renderCurrentLine(this, stringToWrite, true);
  } else {
    this._originalWriteToOutput(stringToWrite);
  }
};


Interface.prototype._insertString = function(c) {
  if (this.cursor < this.line.length) {
    var beg = this.line.slice(0, this.cursor);
    var end = this.line.slice(this.cursor, this.line.length);
    this.line = beg + c + end;
    this.cursor += c.length;
    this._refreshLine();
  } else {
    this.line += c;
    this.cursor += c.length;
    this._refreshLine();
    this._moveCursor(0);
  }
};

function renderCurrentLine(self, stringToWrite, showSuggestions) {
  var suggestionPromise = showSuggestions ? self.suggest(stringToWrite) : null;
  if (suggestionPromise && typeof suggestionPromise.then === 'function') {
    suggestionPromise.then(afterSuggestion, function (err) {
      process.nextTick(function () { throw err; });
    });
  } else {
    afterSuggestion(suggestionPromise);
  }
  function afterSuggestion(suggestion) {
    var promptLength = self._prompt.length;
    var cursorPos = self._getCursorPos();
    var nX = cursorPos.cols;
    if (suggestion && suggestion.indexOf(stringToWrite) === 0) {
      self._ansiCursor.horizontalAbsolute(promptLength + 1).eraseLine().write(self.colorize(stringToWrite) + chalk.grey(suggestion.substring(stringToWrite.length)));
      self._ansiCursor.horizontalAbsolute(nX + 1);
    } else {
      self._ansiCursor.horizontalAbsolute(promptLength + 1).eraseLine().write(self.colorize(stringToWrite));
      self._ansiCursor.horizontalAbsolute(nX);
    }
  }
}
