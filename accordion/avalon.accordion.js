define(["../avalon.getModel", "text!./avalon.accordion.html", "css!../chameleon/oniui-common.css", "css!./avalon.accordion.css"], function(avalon, sourceHTML) {
    var template = sourceHTML,
        templateArr = template.split("MS_OPTION_MODE_CARET"),
        caretTemplate = templateArr[1],
        navTemplate = templateArr[0],
        accordionNum = 0;
    var widget = avalon.ui.accordion = function(element, data, vmodels) {
        var options = data.accordionOptions,
            vmodelsLength = vmodels.length,
            accordionOpts = data.value.split(",")[2],
            msData = Object.keys(element.msData),
            _data = [],
            dataVM = [],
            accordionTemp = "",
            horizontalHeaderStyle = "ms-css-width='headerWidth' ms-css-height='headerAndContentHeight'",
            horizontalH2Style = "ms-css-bottom='-headerWidth' ms-css-width='headerAndContentHeight' ms-css-height='headerWidth'",
            horizontalContentStyle = "ms-css-width='contentWidth' ms-css-height='headerAndContentHeight'",
            animateTime = 0;

        accordionNum += 1
        if (vmodelsLength > 1) { // 存在嵌套的accordion时，需要手动将配置对象mix到options上，这就要求所有accordion的组件定义必须存在id和options选项，比如：ms-widget="accordion,accordionId,accordionOpts"
            avalon.mix(options, vmodels[vmodelsLength-1][accordionOpts]);
        }
        navTemplate = options.direction === "vertical" ? navTemplate.replace("MS_OPTION_HORIZONTAL_HEADER_WIDTH_HEIGHT", "").replace("MS_OPTION_HORIZONTAL_CONTENT_WIDTH_HEIGHT", "") : navTemplate.replace("MS_OPTION_HORIZONTAL_HEADER_WIDTH_HEIGHT", horizontalHeaderStyle).replace("MS_OPTION_HORIZONTAL_CONTENT_WIDTH_HEIGHT",horizontalContentStyle)
        if (options.direction === "vertical") {
            accordionTemp = options.mode == "caret" ? caretTemplate : navTemplate 
        } else {
            options.mode = "nav"
            options.multiple = false
            accordionTemp = navTemplate.replace("MS_OPTION_HORIZONTAL_TITLE", horizontalH2Style)
        }
        // 根据mode的不同使用不同的template
        options.template = options.getTemplate(accordionTemp, options);
        msData.forEach(function(item){
            if(item.indexOf("ms-each") === 0) {
                _data = element.msData[item]
                dataVM = avalon.getModel(_data, vmodels)
                _data = dataVM[1][dataVM[0]]
                element.removeAttribute(item)
                return false
            }
        })
        options.data = !options.data.length ? _data.$model || _data: options.data
        var vmodel = avalon.define(data.accordionId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement", "rendered","autoRun","template","accordionClass","currentTrigge","initIndex","multiple","trigger","triggerType","data", "accordionVmodel"]
            vm.widgetElement = element
            vm.$headers = [] // 保存所有面板的header
            vm.$panels = [] // 保存所有的面板content
            vm.$triggers = []
            vm.rendered = false // 判断是否渲染了组件
            vm._renderView = function() {
                var template = options.template,
                    accordionItems = "",
                    elementClass = 'ui-accordion ui-accordion-mode-' + options.mode + ' js-accordion' + accordionNum+" "+options.accordionClass,
                    header, 
                    content, 
                    trigger,
                    accordionInnerWrapper;

                avalon(element).addClass(elementClass)
                element.setAttribute("ms-css-width","width")
                template = template.replace(/MS_OPTION_ACTIVECLASS/g, options.currentTriggerClass)
                element.innerHTML = template
                accordionInnerWrapper = element.children[0]// accordion wrapper
                accordionItems = accordionInnerWrapper.children
                header = accordionItems[0] // header
                content = accordionItems[1] // panel
                if (!!options.trigger) {
                    var headerChildren = header.children;
                    for (var i=0, el; el = headerChildren[i++];) {
                        if (avalon(el).hasClass(options.trigger)) {
                            trigger = el
                            break;
                        }
                    }
                }
                if (options.trigger && trigger) { // 如果设置了触发 面板切换事件的节点class，那么将事件绑定在对应节点
                    trigger.setAttribute("ms-on-"+options.triggerType, options.triggerType+"Callback($event,$index,widgetElement.$vmodel)")
                } else { // 未设置触发节点则在整个header上触发
                    header.setAttribute("ms-on-"+options.triggerType, options.triggerType+"Callback($event,$index, widgetElement.$vmodel)")
                    avalon(header).css("cursor","pointer")
                }
                // 当设置multiple为true时模板中的规则将导致异常，所以需要撤销这些异常设置
                if (options.multiple) {
                    header.removeAttribute("ms-class")
                    content.removeAttribute("ms-visible")
                    content.style.display = "none"
                }
                if (options.initIndex !== null) {
                    vm.currentIndex = options.initIndex
                }
                avalon.scan(element, [vmodel].concat(vmodels))
                if (typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
                vmodel.rendered = true
                setTimeout(function() { // 渲染完组件之后，将对应面板的header和panel分别保存
                    for (var i=0, el; el = accordionItems[i++];) {
                        var $el = avalon(el)
                        if ($el.hasClass("ui-accordion-header")) {
                            vmodel.$headers.push(el)
                            // 当multiple为true时，如果设置了初始打开的面板，打开对应面板，否则全部收起
                            if(options.multiple && Math.floor(i/2)==options.initIndex) {
                                avalon(el).addClass(options.currentTriggerClass)
                            }
                            if(!!options.trigger) {
                                var headerChildren = el.children
                                for(var j=0, subEl; subEl = headerChildren[j++];) {
                                    if(avalon(subEl).hasClass(options.trigger)) {
                                        vmodel.$triggers.push(subEl);
                                        break;
                                    }
                                }
                            } else {
                                vmodel.$triggers.push(el)
                            }

                        } else if($el.hasClass("ui-accordion-content")) {
                            vmodel.$panels.push(el)
                            if(options.multiple && (i/2-1)==options.initIndex) {
                                el.style.display = "block"
                            }
                        }
                    }
                }, 400)
            }
            vm.$init = function() {
                if(!vmodel.data.length) {
                    // 从dom中抓取数据
                    var list = [],
                        subEle,
                        next = null;
                    while(subEle = element.firstChild) {
                        if(subEle.nodeType !==1) {
                            element.removeChild(subEle)
                            continue
                        }
                        next = subEle.nextSibling
                        while(next.nodeType !==1) {
                            element.removeChild(next)
                            next = subEle.nextSibling
                        }
                        if(avalon(subEle).hasClass("title")) {
                            list.push({
                                title: subEle.innerHTML.trim(),
                                content: next.innerHTML.trim()
                            })
                        }
                        element.removeChild(subEle)
                        element.removeChild(next)
                    }
                    vmodel.data = list
                }
                element.$vmodel = vmodel
                if (options.autoRun) {
                    vm._renderView()
                }
            }
            // 点击面板header时的回调,设置triggerType为click时执行
            vm.clickCallback = function(event,index, vmodel) {
                vmodel._eventCallback(event, index)
            }
            // mouse over面板header时的回调，设置triggerType为mouseover时执行
            vm.mouseoverCallback = function(event, index, vmodel) {
                vmodel._eventCallback(event, index)
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
            // 重新渲染accordion
            vm.setData = function(data) {
                vmodel.data = data
                vmodel.currentIndex = -1
                vmodel._renderView()
            }
            // 手动渲染accordion
            vm.refresh = function(data) {
                if (data) {
                    vmodel.setData(data)
                } else if(!vmodel.rendered){
                    vm._renderView()
                }
            }
            vm.getCurrentHeader = function() {
                if (options.multiple) {
                    return null
                }
                return vmodel.$headers[this.currentIndex]
            }
            vm.getCurrentPanel = function() {
                if (options.multiple) {
                    return null
                }
                return vmodel.$panels[this.currentIndex]
            }
            vm.getHeader = function(index) {
                return vmodel.$headers[index]
            }
            vm.getPanel = function(index) {
                return vmodel.$panels[index]
            }
            vm.getLength = function() {
                return options.data.length
            }
            vm.getStatus = function(index) {
                return (avalon(vmodel.$panels[index]).css('display') === 'none') ? 0 : 1
            }
            vm.switchTo = function(index) {
                var event= {
                        target: vmodel.$triggers[index]
                    }
                if(!options.multiple) { // multiple为false时直接通过currentIndex打开面板
                    if (options.beforeSwitch.call(event.target, index, vm.getHeader(index), vm.getPanel(index)) === false) {
                        return false
                    }
                    vmodel.currentIndex = index
                    options.onSwitch.call(event.target, index, vm.getHeader(index), vm.getPanel(index))
                } else if(options.triggerType=="click") {
                    event.target[options.triggerType]()
                } else { // dom元素不可以像调用click一样调用mouseover方法
                    eventCallback(event, index)                    
                }
            }
            vm._eventCallback = eventCallback
        })
        vmodel.$watch("currentIndex", function(val) {
            var panel = vmodel.getPanel(val)
            if (vmodel.direction == "horizontal" && panel) {
                clearTimeout(animateTime) 
                animate(panel, Number(vmodel.contentWidth) || 400)
            }
        })
        function eventCallback(event, index) {
            var header = vmodel.getHeader(index),
                $header = avalon(header),
                panel = vmodel.getPanel(index),
                headerActive = (function() {return options.currentTriggerClass.trim().split(/\s/).every(function(c){return $header.hasClass(c)})}());

            header.headerActive = headerActive
            if (options.beforeSwitch.call(event.target, index, header, panel) === false) {
                return false
            }
            if (options.multiple && !header.headerActive) {
                // 基数点击为展开
                avalon(header).addClass(options.currentTriggerClass)
                panel.style.display = "block"


            } else if (options.multiple && header.headerActive) {
                // 偶数点击为收起
                avalon(header).removeClass(options.currentTriggerClass)
                panel.style.display = "none"
            } 
            vmodel.currentIndex = index
            
            options.onSwitch.call(event.target, index, header, panel)
        }

        function animate(panel, width) {
            var currentWidth = 0
            function widthAnimate() {
                console.log("widthAnimate : "+currentWidth)
                currentWidth += 10
                if (currentWidth > width) {
                    currentWidth = width
                    panel.style.width = currentWidth + "px"
                    clearTimeout(animateTime)
                    return false
                }
                panel.style.width = currentWidth + "px"
                animateTime = setTimeout(widthAnimate, 10)
            }
            widthAnimate()
        }
        return vmodel
    }
    widget.version = 1.0
    widget.defaults = {
        width: '100%',
        headerWidth: 30,
        contentWidth: 400,
        headerAndContentHeight: 200,
        autoRun: true, // 设为true自动渲染accordion组件，设为false不渲染，只在合适的时候手动调用refresh进行渲染
        template: "", // 用户自定义template
        accordionClass: "", // 为accordion容器自定义的class
        currentTriggerClass: "ui-state-active", // 展开accordion面板时，header添加的class
        data: [], // 渲染accordion的header和panel信息
        initIndex: null, // 初始打开的面板
        mode: "caret", // 有三种类型的template，分别是caret|nav，当是custom需要用户传入合适template
        multiple: false, // 是否可以同时打开多个面板
        widgetElement: "", // accordion容器
        trigger: "ui-accordion-trigger", // 触发展开面板的dom节点对应class
        triggerType: 'click', // 触发展开面板的事件类型，可以是：click|mouseover
        currentIndex: -1, // 当前点击的面板的索引值
        direction: "vertical",
        beforeSwitch: avalon.noop,
        onSwitch: avalon.noop,
        onInit: avalon.noop,
        getTemplate: function(str, options) {
            return str
        }
    }
    return avalon
});
