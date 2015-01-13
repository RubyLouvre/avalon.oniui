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
                            page.includeJs("http://localhost:3000/test/vendor/util.js", function() {
                                page.evaluate(function () {
                                    setTimeout(function() {
                                        var vmodel = avalon.vmodels.aa,
                                            root = $("[avalonctrl=aa]"),
                                            triggers = $(".oni-accordion-header", root),
                                            panels = $(".oni-accordion-content", root);

                                        var result = {
                                            testResult: true,
                                            data_first_init_toggle: vmodel.data[0].toggle,
                                            panel_first_init_visible: panels.eq(0).is(":visible"),
                                            jquery: typeof $
                                        };
                                        result.length = vmodel.data.length;

                                        //模拟点击第一个选项卡
                                        testUtils.dispatchClickEvent(triggers.get(0));
                                        result.data_first_click_toggle = vmodel.data[0].toggle;
                                        result.panel_first_click_visible = panels.eq(0).is(":visible");

                                        //模拟点击第二个选项卡
                                        testUtils.dispatchClickEvent(triggers.get(1));
                                        result.data_second_click_toggle = vmodel.data[1].toggle;
                                        result.panel_second_click_visible = panels.eq(1).is(":visible");

                                        console.log(JSON.stringify(result));
                                    }, 1000)
                                });
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
            '#jquery被成功引入': function() {
                expect(result.jquery).to.equal("function");
            },
            '#data长度为2': function() {
                expect(result.length).to.equal(2);
            },
            '#data初始化时的第一项toggle为false': function() {
                expect(result.data_first_init_toggle).to.equal(false);
            },
            '#第一个面板初始化时的第一项为不可见': function() {
                expect(result.panel_first_init_visible).to.equal(false);
            },
            '#点击第一个选项卡后，data的第一项toggle为true': function() {
                expect(result.data_first_click_toggle).to.equal(true);
            },
            '#点击第一个选项卡后，第一个面板可见': function() {
                expect(result.panel_first_click_visible).to.equal(true);
            },
            '#点击第二个选项卡后，data的第二项toggle为false': function() {
                expect(result.data_second_click_toggle).to.equal(false);
            },
            '#点击第二个选项卡后，第二个面板不可见': function() {
                expect(result.panel_second_click_visible).to.equal(false);
            }
        }
    }
};