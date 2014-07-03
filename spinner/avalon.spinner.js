define(["avalon", "text!./avalon.spinner.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        styleEl = document.getElementById("avalonStyle"),
        template = arr[0];
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var widget = avalon.ui.spinner = function(element, data, vmodels) {
        var options = data.spinnerOptions;
        options.template = options.getTemplate(template, options);
        var vmodel = avalon.define(data.spinnerId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["min", "max", "widgetElement", "step"];
            vm.widgetElement = element;
            var wrapper = null, focusValue = 0;
            vm.$init = function() {
                wrapper = avalon.parseHTML(options.template).firstChild;
                var tmpBElement = wrapper.getElementsByTagName("b")[0],
                    tmpBParent = tmpBElement.parentNode,
                    tmpDiv = document.createElement("div"),
                    elementParent = element.parentNode;
                // 插入临时标签，保证包裹了element的文档碎片最终插入到element原来所在位置
                decorateElement(); // 为element添加相应的类，并绑定事件
                elementParent.insertBefore(tmpDiv, element);
                tmpBParent.appendChild(element);
                // 模板中插入临时DOM节点b，为了方便查找放置input的父节点，将element放到合适的位置之后要移除临时节点
                tmpBParent.removeChild(tmpBElement);
                elementParent.replaceChild(wrapper, tmpDiv);
                avalon.scan(wrapper, [vmodel].concat(vmodels));
                if(typeof vmodel.onInit === "function" ){
                    //vmodels是不包括vmodel的
                     vmodel.onInit.calll(element, vmodel, options, vmodels)
                }
                setTimeout(function() { // 如果输入域的初始值不在spinner的范围，调整它
                    var value = Number(element.value),
                        min = options.min,
                        max = options.max;
                    if( typeof min == 'number' && !isNaN(Number(min)) && value < min) {
                        value = min;
                    } 
                    if( typeof max == 'number' && !isNaN(Number(max)) && value > max) {
                        value = max;
                    } 
                    element.value  = value;
                }, 400)
            }
            vm.$remove = function() {
                wrapper.innerHTML = wrapper.textContent = "";
                wrapper.parentNode.removeChild(wrapper);
            }
            vm.$add = function(event) { // add number by step
                var value = Number(element.value),
                    subValue = 0;
                subValue = value + (options.step || 1);
                // 如果subValue不是number类型说明value包含非数值字符，或者options.step包含非数值字符
                if(isNaN(subValue)) {
                    throw new Error("输入域的值非数值，或者step的设置为非数值，请检查");
                }
                subValue = checkNum(subValue);
                element.value = subValue;
                options.onadd.call(event.target, subValue);
            }
            vm.$sub = function(event) { // minus number by step
                var value = Number(element.value),
                    subValue = 0;
                subValue = value - (options.step || 1);
                if(isNaN(subValue)) {
                    throw new Error("输入域的值非数值，或者step的设置为非数值，请检查");
                }
                subValue = checkNum(subValue);
                element.value = subValue;
                options.onsub.call(event.target, subValue);
            }
            function decorateElement() {
                var $element = avalon(element);
                $element.addClass("ui-textbox-input");
                $element.bind("focus", function() {
                    focusValue = element.value;
                })
                $element.bind("blur", function() {
                    value = element.value;
                    if(!isNaN(Number(value))) {
                        value = checkNum(element.value);
                    } else {
                        value = focusValue;
                    }
                    element.value = value;
                })
                $element.bind("keydown", function(event) {
                    switch( event.which ) {
                        case 38: // up
                            vmodel.$add(event);
                            return false;
                        case 40: // down
                            vmodel.$sub(event);
                            return false;
                    }
                })
            }
            function checkNum(val) {
                // 如果val包含非数值字符，设置为0
                v = Number(val) || 0;
                // 当设置了数值options.min，且不是NaN，重置v，否则忽略
                if( typeof options.min == 'number' && !isNaN(Number(options.min)) ) {
                    var min = options.min;
                    if( v < min ) v = min;
                } 
                // 当设置了数值options.max，且不是NaN，重置v，否则忽略
                if( typeof options.max == 'number' && !isNaN(Number(options.max)) ) {
                    var max = options.max;
                    if( v > max ) v = max;
                } 
                return parseFloat(v);
            }
        });
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        min: NaN,
        max: NaN,
        step: 1,
        widgetElement: "", // accordion容器
        getTemplate: function(str, options) {
            return str;
        },
        onsub: avalon.noop,
        onadd: avalon.noop
    }
    return avalon;
})
