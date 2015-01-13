'use strict';

var staticServer = require("./support/staticServer"),
    fs = require("fs"),
    path = require("path"),
    casesRender = require("./support/casesRender");

staticServer.install();

var cases = [{
    pageUrl: "/accordion/avalon.accordion.ex1.html",
    caseUrl: "/test/suites/accordion.ex1.js"
}];

casesRender(cases, function() {
    staticServer.close();
    process.exit(0);
});



