'use strict';

var phantom = require('phantom'),
    staticServer = require("./support/staticServer"),
    expect = require('chai').expect,
    fs = require("fs"),
    path = require("path"),
    predecessor = {
        before: function() {
            staticServer.install();
        },
        after: function() {
            staticServer.close();
        }
    };

var cases = [];

fs.readdirSync(path.join(__dirname, "suites/")).forEach(function(filename) {
    cases.push(require(path.join(__dirname, "suites/", filename)))
});

cases.forEach(function(tc) {
    for(var name in tc) {
        if(tc.hasOwnProperty(name)) {
            predecessor[name] = tc[name];
        }
    }
});

module.exports = predecessor;