define(["../avalon.textbox"], function(avalon) {

    function getElementNode(elem) {
        while(elem) {
            if (elem.nodeType === 1) {
                break;
            } else {
                elem = elem.nextSibling;
            }
        }
        return elem;
    }

    var testWrapper = document.getElementById("testWrapper");
  
    describe("textbox only", function() {
        var fragment = "",
            div = "",
            span = "",
            p = "",
            input = "";

        beforeEach(function() {
            fragment = document.createDocumentFragment();
            div = document.createElement("div");
            span = document.createElement("span");
            p = document.createElement("p");
            input = document.createElement("input");

            input.setAttribute("ms-widget", "textbox");
            fragment.appendChild(div);
            div.appendChild(span);
            div.appendChild(input);
            div.appendChild(p);
            testWrapper.appendChild(fragment);
        })

        it("input被textbox ui包装，并且原DOM tree中的位置不变", function(done) {
            var model = avalon.define("test", function(vm) {

            });
            avalon.scan(input, model);

            setTimeout(function() {
                var inputParent = input.parentNode,
                    inputWrapper = inputParent.parentNode,
                    placeholder = inputParent.firstChild;

                placeholder = getElementNode(placeholder);
                expect(avalon(inputParent).hasClass("ui-textbox-input-wrap")).to.be(true);
                expect(avalon(inputWrapper).hasClass("ui-textbox")).to.be(true);
                expect(avalon(placeholder).hasClass("ui-textbox-placeholder")).to.be(true);

                expect(getElementNode(placeholder.nextSibling)).to.equal(input);
                expect(getElementNode(div.firstChild)).to.equal(span);
                expect(getElementNode(div.lastChild)).to.equal(p);
                testWrapper.removeChild(div);
                done();
            },400)
        })

        it("当输入框为空时显示占位符", function(done) {
            input.setAttribute("data-textbox-placeholder","input your name");
            input.setAttribute("ms-duplex","txt");

            var model = avalon.define("test", function(vm) {
                vm.txt = "";
            });
            avalon.scan(input, model);

            setTimeout(function() {
                var inputParent = input.parentNode,
                    placeholder = inputParent.firstChild;

                placeholder = getElementNode(placeholder);
                expect(placeholder.innerHTML).to.be("input your name");
                expect(avalon(placeholder).css("display")).to.be("block");
                testWrapper.removeChild(div);
                done();
            }, 400)
        })

        it("输入框有值时隐藏占位符", function(done) {
            input.setAttribute("data-textbox-placeholder","input your name");
            input.setAttribute("ms-duplex","txt");

            var model = avalon.define("test", function(vm) {
                vm.txt = "shirly";
            });
            avalon.scan(input, model);

            setTimeout(function() {
                var inputParent = input.parentNode,
                    placeholder = inputParent.firstChild;

                placeholder = getElementNode(placeholder);
                expect(placeholder.innerHTML).to.be("input your name");
                expect(avalon(placeholder).css("display")).to.be("none");
                testWrapper.removeChild(div);
                done();
            }, 400)
        })
    })

    describe("textbox suggest", function() {
        var body = "",
            input = "";

        beforeEach(function() {
            input = document.createElement("input");
            input.setAttribute("ms-widget","textbox");
            input.setAttribute("data-textbox-suggest", "test");
            testWrapper.appendChild(input);
        })

        it("textbox有自动补全功能", function(done) {
            
            var model = avalon.define("demo-suggest", function(vm) {

            })
            
            avalon.scan(input,model);
            setTimeout(function() {
                var suggest = getElementNode(input.parentNode.nextSibling),
                    suggestUl = suggest.getElementsByTagName("ul")[0],
                    wraper = input.parentNode.parentNode;

                expect(avalon(suggest).hasClass("ui-textbox-suggest")).to.be(true);
                expect(avalon(suggestUl).hasClass("ui-suggest")).to.be(true);
                expect(avalon(suggestUl).css("display")).to.be("none");
                testWrapper.removeChild(wraper);
                done();
            }, 400);
        })

        it("自动补全功能可以通过设置data-textbox-suggest-changed来自定义切换后的操作", function(done) {
            var model = avalon.define("demo-suggest", function(vm) {
                vm.txt = "";
                /* 当触发了changedCallback回调时将其设置为true，watch到txt的变化之后继续将其设为false */
                vm.flag = false; 
                // 切换信息之后触发用户定义的回调操作
                vm.changedCallback = function() {
                    vm.flag = true;
                    vm.txt = "shirly___";
                }
                vm.$watch("txt", function(v) {
                    if (model.flag) {
                        model.flag = false;
                        var inputWrapper = input.parentNode.parentNode;
                        expect(input.value).to.be("shirly___");
                        testWrapper.removeChild(inputWrapper);
                        done();
                    }
                })
            })
            input.setAttribute("data-textbox-suggest-changed", "changedCallback");
            input.setAttribute("ms-duplex", "txt");
            avalon.bind(input, "keyup", function(d) {
                setTimeout(function() {
                    var suggest = getElementNode(input.parentNode.nextSibling),
                        suggestUl = suggest.getElementsByTagName("ul")[0],
                        liItems = suggestUl.getElementsByTagName("li");
                    // 判断弹层已经显示
                    expect(avalon(suggestUl).css("display")).to.be("block");
                    expect(liItems.length).to.be(3);
                    // 点击切换补全信息
                    liItems[1].click();
                },400);
            })
            avalon.scan(input,model);
            avalon.ui["suggest"].strategies.test = function(value, doneo) {
                doneo(null, !value ? [] : [value+"1", value+"2", value+"3"]);
            }

            setTimeout(function() {
                var inputParentNode = input.parentNode;
                // 通过keyup模拟键盘输入来显示提示补全弹层
                fireKeyUp(input, 102);
            }, 400)
            
        })
        
        it("suggest的focus配置项，设置为true时会在focus且输入框为空时显示补全信息", function(done) {
            input.setAttribute("data-textbox-suggest-focus", "true");
            var model = avalon.define("demo", function(vm) {

            });
            avalon.scan(input, model);
            avalon.ui["suggest"].strategies.test = function(value, done1) {
                done1( null , value ? [] : [
                    { value : '13800138000' , text : '<b>日审</b> 13800138000' } ,
                    { value : '13800138001' , text : '<b>夜审</b> 13800138001' }
                ])
            }
            avalon.bind(input,"focus", function() {
                var suggest = getElementNode(input.parentNode.nextSibling),
                    suggestUl = suggest.getElementsByTagName("ul")[0],
                    liItems = suggestUl.getElementsByTagName("li"),
                    textboxWrapper = suggest.parentNode;

                expect(avalon(suggestUl).css("display")).to.be("block");
                expect(liItems.length).to.be(2);
                expect(liItems[0].innerHTML.replace(/\s*/g,"")).to.be("<b>日审</b>13800138000");
                expect(liItems[1].innerHTML.replace(/\s*/g,"")).to.be("<b>夜审</b>13800138001");
                testWrapper.removeChild(textboxWrapper);
                done();
            })
            setTimeout(function() {
                input.focus();
            }, 400);
        })
    })
}); 