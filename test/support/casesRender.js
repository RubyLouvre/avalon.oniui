var phantom = require('phantom'),
    expect = require('chai').expect,
    fs = require("fs"),
    path = require("path");
require("longjohn")
function casesRender(cases, callback) {
    phantom.create(function (ph) {
        ph.createPage(function (page) {
            page.onConsoleMessage(function (msg) {
                try {
                    var phantomMsg = JSON.parse(msg);

                    if(phantomMsg.phantomMsg && phantomMsg.mochaEnd) {
                        render()
                    } else {
                        console.log(msg)
                    }
                } catch(e) {
                    console.log(msg)
                }
            });
            page.set('onError', function() {
                console.log("onError");
                console.log(arguments)
            });
            page.set('onResourceError', function() {
                console.log("onResourceError")
            });
            page.set('onResourceTimeout', function() {
                console.log("onResourceTimeout")
            });

            render();

            function render() {
                var currentCase = cases.shift();
                if(!currentCase) {
                    ph.exit(0);
                    callback();
                } else {
                    page.open(path.join("http://localhost:3000", currentCase.pageUrl), function (status) {
                        page.injectJs(path.join(process.cwd(), "test/vendor/jquery-1.11.2.min.js"));
                        page.injectJs(path.join(process.cwd(), "test/vendor/mocha.js"));
                        page.injectJs(path.join(process.cwd(), "test/vendor/chai.js"));
                        page.injectJs(path.join(process.cwd(), "test/vendor/chai-jquery.js"));
                        page.injectJs(path.join(process.cwd(), "test/vendor/util.js"));
                        page.injectJs(path.join(process.cwd(), "test/shims/es5-shim.js"));
                        page.injectJs(path.join(process.cwd(), "test/shims/console.js"));
                        page.injectJs(path.join(process.cwd(), "test/shims/process.stdout.write.js"));

                        page.evaluate(function() {
                            mocha.setup({
                                ui: "bdd",
                                reporter: mocha.reporters["Spec"],
                                ignoreLeaks: true
                            });
                        });

                        setTimeout(function() {
                            page.injectJs(path.join(process.cwd(), currentCase.caseUrl));

                            page.evaluate(function () {

                                mocha.failures = [];

                                mocha.run().on('end', function(){
                                    console.log(JSON.stringify({
                                        phantomMsg: true,
                                        mochaEnd: true
                                    }))
                                }).on('fail', function(test, err) {
                                    mocha.failures.push(test);
                                });

                            });
                        }, 1000);

                    });
                }
            }
        });
    });
}



module.exports = casesRender;