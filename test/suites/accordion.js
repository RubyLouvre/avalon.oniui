var phantom = require('phantom'),
    expect = require('chai').expect,
    result;

module.exports = {
    'accordion': {
        'ex1': {
            'before': function(done) {
                this.timeout(5000);
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
                                    done();
                                }
                            } catch (e) {}

                        })

                    });
                });
            },
            '#data length should be 2': function() {
                expect(result.length).to.equal(2);
            }
        }
    }
};