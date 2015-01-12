'use strict';

var phantom = require('phantom'),
    staticServer = require("./staticServer"),
    Promise = require("promise"),
    expect = require('chai').expect;

staticServer.install();

describe('oniui tests', function(){

    describe("#accordion", function() {

        this.timeout(5000);

        var result;

        before(function(done) {
            phantom.create(function (ph) {
                ph.createPage(function (page) {
                    page.open("http://localhost:3000/accordion/avalon.accordion.ex1.html", function (status) {
                        page.evaluate(function () {
                            setTimeout(function() {
                                var result = {
                                    testResult: true
                                };
                                var root = document.querySelector("[avalonctrl=aa]"),
                                    triggers = root.getElementsByClassName("oni-accordion-header"),
                                    panels = root.getElementsByClassName("oni-accordion-content");

                                result.length = avalon.vmodels.aa.data.length;
                                console.log(JSON.stringify(result));
                                return result;
                            }, 1000)
                        });
                    });
                    page.set('onConsoleMessage', function (msg) {
                        try {
                            msg = JSON.parse(msg);
                            if(msg.testResult) {
                                result = msg;
                                ph.exit();
                                staticServer.close();
                                done();
                            }
                        } catch (e) {}

                    })

                });
            });
        });

        it("data length should be 2", function() {
            expect(result.length).to.equal(2);
        })

    });

});

