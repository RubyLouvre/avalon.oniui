var phantom = require('phantom'),
    staticServer = require("./support/staticServer"),
    expect = require('chai').expect,
    fs = require("fs"),
    path = require("path");

staticServer.install();

phantom.create(function (ph) {
    ph.createPage(function (page) {
        page.open("http://localhost:3000/accordion/avalon.accordion.ex1.html", function (status) {
             page.injectJs(path.join(process.cwd(), "test/vendor/jquery-1.11.2.min.js"));
             page.injectJs(path.join(process.cwd(), "test/vendor/mocha.js"));
             page.injectJs(path.join(process.cwd(), "test/vendor/chai.js"));
             page.injectJs(path.join(process.cwd(), "test/vendor/chai-jquery.js"));
             page.injectJs(path.join(process.cwd(), "test/shims/es5-shim.js"));
             page.injectJs(path.join(process.cwd(), "test/shims/console.js"));
             page.injectJs(path.join(process.cwd(), "test/shims/process.stdout.write.js"));
             page.evaluate(function () {

                 mocha.setup({
                     ui: "bdd",
                     reporter: mocha.reporters["Spec"]
                 });

                 var assert = chai.assert;

                 describe('Array', function(){
                     describe('#push()', function(){
                         it('should append a value', function(){
                             var arr = [];
                             arr.push('foo');
                             arr.push('bar');
                             arr.push('sss');
                             assert('foo' === arr[0]); // to test indentation
                             //assert('bar' === arr[1]);
                             //assert('sss' === arr[2]);
                         });

                         it('should return the length', function(){
                             var arr = [];
                             assert(1 == arr.push('foo'));
                             assert(2 == arr.push('bar'));
                             assert(3 == arr.push('baz'));
                         })
                     })
                 });

                 mocha.run();

             });
        });
        page.set('onConsoleMessage', function (msg) {
            console.log(msg)
        })
    });
});