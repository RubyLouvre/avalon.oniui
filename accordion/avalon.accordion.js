define(["avalon", "text!./avalon.accordion.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        styleEl = document.getElementById("avalonStyle"),
        template = arr[0],
        templateArr = template.split("MS_OPTION_MODE_CARET"),
        caretTemplate = templateArr[1],
        navTemplate = templateArr[0],
        accordionNum = 0;
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }

    var widget = avalon.ui.accordion = function(element, data, vmodels) {
        accordionNum++ ;
        var options = data.accordionOptions;
        // 根据mode的不同使用不同的template
        var template = options.mode=="caret" ? caretTemplate : options.mode=="nav" ? navTemplate : options.template;
        options.template = options.getTemplate(template, options);
        
        var vmodel = avalon.define(data.accordionId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "rendered","autoRun","template","container","controlCls","currentTrigge","initIndex","multiple","trigger","triggerType"];
            vm.widgetElement = vm.container = element;
            vm.$headers = []; // 保存所有面板的header
            vm.$panels = []; // 保存所有的面板content
            vm.rendered = false; // 判断是否渲染了组件
            vm._renderView = function() {
                var template = options.template;
                var accordionItems = "";
                var elementClass = 'ui-accordion ui-accordion-mode-' + options.mode + ' js-accordion' + accordionNum+" "+options.controlCls;
                var header, content, trigger;
                avalon(element).addClass(elementClass);
                element.setAttribute("ms-css-width","width");
                template = template.replace(/MS_OPTION_ACTIVECLASS/g, options.currentTriggerCls);
                element.innerHTML = template;
                var accordionInnerWrapper = element.children[0]; // accordion wrapper
                accordionItems = accordionInnerWrapper.children;
                header = accordionItems[0]; // header
                content = accordionItems[1]; // panel
                trigger; // 触发面板展开收起事件的DOM节点
                if(!!options.trigger) {
                    var headerChildren = header.children;
                    for(var i=0, el; el = headerChildren[i++];) {
                        if(avalon(el).hasClass(options.trigger)) {
                            trigger = el;
                            break;
                        }
                    }
                }
                if (options.trigger && trigger) { // 如果设置了触发 面板切换事件的节点class，那么将事件绑定在对应节点
                    trigger.setAttribute("ms-on-"+options.triggerType, options.triggerType+"Callback($event,$index)")
                } else { // 未设置触发节点则在整个header上触发
                    header.setAttribute("ms-on-"+options.triggerType, options.triggerType+"Callback($event,$index)");
                    avalon(header).css("cursor","pointer");
                }
                // 当设置multiple为true时模板中的规则将导致异常，所以需要撤销这些异常设置
                if (options.multiple) {
                    header.removeAttribute("ms-class");
                    content.removeAttribute("ms-visible");
                    content.style.display = "none";
                }
                if(options.initIndex !== null) {
                    vm.currentIndex = options.initIndex;
                }
                avalon.scan(element, [vmodel].concat(vmodels));
                vmodel.rendered = true;
                setTimeout(function() { // 渲染完组件之后，将对应面板的header和panel分别保存
                    var len = accordionItems.length;
                    for (var i=0, el; el = accordionItems[i++];) {
                        var $el = avalon(el);
                        if ($el.hasClass("ui-accordion-header")) {
                            vmodel.$headers.push(el);
                            // 当multiple为true时，如果设置了初始打开的面板，打开对应面板，否则全部收起
                            if(options.multiple && Math.floor(i/2)==options.initIndex) {
                                avalon(el).addClass(options.currentTriggerCls);
                            }
                        } else if($el.hasClass("ui-accordion-content")) {
                            vmodel.$panels.push(el);
                            if(options.multiple && (i/2-1)==options.initIndex) {
                                el.style.display = "block";
                            }
                        }
                    }
                }, 400);
            }
            vm.$init = function() {
                if (options.autoRun) {
                    vm._renderView();
                }
            }
            // 点击面板header时的回调,设置triggerType为click时执行
            vm.clickCallback = function(event,index) {
                eventCallback(event, index);
            }
            // mouse over面板header时的回调，设置triggerType为mouseover时执行
            vm.mouseoverCallback = function(event, index) {
                eventCallback(event, index);
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = "";
            }
            // 重新渲染accordion
            vm.setData = function(data) {
                vm.data = data;
            }
            // 手动渲染accordion
            vm.refresh = function(data) {
                if (vmodel.rendered) {
                    vmodel.data = data;
                } else {
                    vm._renderView();
                }
                
            }
            vm.getCurrentHeader = function() {
                if (options.multiple) {
                    return null;
                }
                return vmodel.$headers[this.currentIndex];
            }
            vm.getCurrentPanel = function() {
                if (options.multiple) {
                    return null;
                }
                return vmodel.$panels[this.currentIndex];
            }
            vm.getHeader = function(index) {
                return vmodel.$headers[index];
            }
            vm.getPanel = function(index) {
                return vmodel.$panels[index];
            }
            vm.getLength = function() {
                return options.data.length;
            }
            vm.getStatus = function(index) {
                return (avalon(vmodel.$panels[index]).css('display') === 'none') ? 0 : 1;
            }
            vm.switchTo = function(index) {
                vmodel.$headers[index][options.triggerType]();
            }
            function eventCallback(event, index) {
                var header = vmodel.getHeader(index),
                    panel = vmodel.getPanel(index),
                    headerActive = avalon(header).hasClass(options.currentTriggerCls);

                header.headerActive = headerActive;
                if (options.beforeSwitch.call(this, index, header, panel) === false) {
                    return false;
                }
                if (options.multiple && !header.headerActive) {
                    // 基数点击为展开
                    avalon(header).addClass(options.currentTriggerCls);
                    panel.style.display = "block";
                } else if (options.multiple && header.headerActive) {
                    // 偶数点击为收起
                    avalon(header).removeClass(options.currentTriggerCls);
                    panel.style.display = "none";
                } 
                vm.currentIndex = index;
                options.onSwitch.call(this, index, header, panel);
            }
        });
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        autoRun: true, // 设为true自动渲染accordion组件，设为false不渲染，只在合适的时候手动调用refresh进行渲染
        template: "", // 用户自定义template
        container: "", // accordion容器，最好使用widgetElement
        controlCls: "", // 为accordion容器自定义的class
        currentTriggerCls: "ui-accordion-active", // 展开accordion面板时，header添加的class
        data: [], // 渲染accordion的header和panel信息
        initIndex: null, // 初始打开的面板
        mode: "caret", // 有三种类型的template，分别是caret|nav|custom，当是custom需要用户传入合适template
        multiple: false, // 是否可以同时打开多个面板
        widgetElement: "", // accordion容器
        getTemplate: function(str, options) {
            return str;
        },
        trigger: "ui-accordion-trigger", // 触发展开面板的dom节点对应class
        triggerType: 'click', // 触发展开面板的事件类型，可以是：click|mouseover
        width: '100%',
        currentIndex: -1, // 当前点击的面板的索引值
        beforeSwitch: function() {},
        onSwitch: function() {}
    }
    return avalon;
});
