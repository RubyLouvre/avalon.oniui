// avalon 1.3.6
/**
 * 
 * @cnName 手风琴组件
 * @enName accordion
 * @introduce
 *    <p>手风琴组件可以将多个内容组织到多个小面板中，通过点击面板的<code>小三角</code>(默认)或<code>标题</code>(需要配置)可以展开或者收缩其内容，使用效果很像<code>Tab</code>。作为备选，还可以通过将鼠标放置到标题上来展开或者收缩。
                此组件能方便我们在有限的区域中放置众多信息。</p>
 */
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
        navTemplate = options.direction === "vertical" ? navTemplate.replace("MS_OPTION_HORIZONTAL_HEADER_WIDTH_HEIGHT", "").replace(/MS_OPTION_HORIZONTAL_CONTENT_WIDTH_HEIGHT/g, "") : navTemplate.replace("MS_OPTION_HORIZONTAL_HEADER_WIDTH_HEIGHT", horizontalHeaderStyle).replace(/MS_OPTION_HORIZONTAL_CONTENT_WIDTH_HEIGHT/g,horizontalContentStyle)
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
        avalon.each(options.data, function(index, item) {
            var toggle = item.toggle 
            item.toggle = toggle !== void 0 ? toggle : false
        })
        var vmodel = avalon.define(data.accordionId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement", "rendered","autoRun","template","accordionClass","currentTrigge","initIndex","multiple","trigger","triggerType", "accordionVmodel", "rootElement"]
            vm.widgetElement = element
            vm.rootElement = {}
            vm.$headers = [] // 保存所有面板的header
            vm.$panels = [] // 保存所有的面板content
            vm.$triggers = []
            /**
             * @interface 组件是否完成渲染,false未完成，true完成
             */
            vm.rendered = false 
            vm._renderView = function(continueScan) {
                var template = options.template,
                    accordionItems = "",
                    elementClass = 'oni-accordion oni-accordion-mode-' + options.mode + ' js-accordion' + accordionNum+" "+options.accordionClass,
                    header, 
                    content, 
                    trigger,
                    accordionInnerWrapper,
                    initIndex = options.initIndex

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
                    trigger.setAttribute("ms-on-"+options.triggerType, options.triggerType+"Callback($event,$index)")
                } else { // 未设置触发节点则在整个header上触发
                    header.setAttribute("ms-on-"+options.triggerType, options.triggerType+"Callback($event,$index)")
                    avalon(header).css("cursor","pointer")
                }
                if (initIndex !== null) {
                    vmodel.currentIndex = initIndex
                    vmodel.data[initIndex].toggle = true 
                }
                vm.rootElement = element.getElementsByTagName("*")[0]
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
                vmodel.rendered = true
                setTimeout(function() { // 渲染完组件之后，将对应面板的header和panel分别保存
                    for (var i=0, el; el = accordionItems[i++];) {
                        var $el = avalon(el)
                        if ($el.hasClass("oni-accordion-header")) {
                            vmodel.$headers.push(el)
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

                        } else if($el.hasClass("oni-accordion-content")) {
                            vmodel.$panels.push(el)
                        }
                    }
                }, 400)
            }
            vm.$init = function(continueScan) {
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
                                content: next.innerHTML.trim(),
                                toggle: false
                            })
                        }
                        element.removeChild(subEle)
                        element.removeChild(next)
                    }
                    vmodel.data = list
                }
                element.$vmodel = vmodel
                if (options.autoRun) {
                    vm._renderView(continueScan)
                }
            }
            // 点击面板header时的回调,设置triggerType为click时执行
            vm.clickCallback = function(event,index) {
                vmodel._eventCallback(event, index)
            }
            // mouseenter面板header时的回调，设置triggerType为mouseenter时执行
            vm.mouseenterCallback = function(event, index) {
                vmodel._eventCallback(event, index)
            }
            /**
             * @interface 当组件移出DOM树时,系统自动调用的销毁函数
             */
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
            
            /**
             * @interface 重定义组件配置数据对象
             * @param data {Array} 结构如下：
             * <pre class="brush:javascript;gutter:false;toolbar:false">
                [{
                title: "标题1",
                content: "正文1"
                },
                {
                title: "标题2",
                content: "正文2"
                }] 
                </pre>
             *
             */
            vm.setData = function(data) {
                avalon.each(data, function(index, item) {
                    item.toggle = item.toggle !== void 0 ? item.toggle : false
                })
                vmodel.data = data
                vmodel.currentIndex = -1
                vmodel._renderView()
            }
            /**
             * @interface 手工刷新组件视图,也可以传递参数data，重渲染组件视图
             * @param data {Array} 结构如下：
             * <pre class="brush:javascript;gutter:false;toolbar:false">
                [{
                title: "标题1",
                content: "正文1"
                },
                {
                title: "标题2",
                content: "正文2"
                }] 
                </pre>
             *
             */
            vm.refresh = function(data) {
                if (data) {
                    vmodel.setData(data)
                } else if(!vmodel.rendered){
                    vm._renderView()
                }
            }
            /**
             * @interface 获得当前展开的accordion标题对象，仅在config.multiple == false时有效
             * @returns {ElementObj} 标题dom对象的引用
             */
            vm.getCurrentHeader = function() {
                if (options.multiple) {
                    return null
                }
                return vmodel.$headers[this.currentIndex]
            }
            /**
             * @interface 获得当前展开的accordion面板对象，仅在config.multiple == false时有效
             * @returns {ElementObj} 面板dom对象的引用
             */
            vm.getCurrentPanel = function() {
                if (options.multiple) {
                    return null
                }
                return vmodel.$panels[this.currentIndex]
            }
            /**
             * @interface 获得指定序号的accordion面板对应的标题节点对象
             * @param index {Number} 面板序号
             * @returns {ElementObj} 指定序号的标题dom对象的引用
             */
            vm.getHeader = function(index) {
                return vmodel.$headers[index]
            }
            /**
             * @interface 获得指定序号的accordion面板对应的面板节点对象
             * @param index {Number} 面板序号
             * @returns {ElementObj} 指定序号的面板dom对象的引用
             */
            vm.getPanel = function(index) {
                return vmodel.$panels[index]
            }
            /**
             * @interface 获得组件的面板数量
             * @returns {Number} 手风琴面板个数
             */
            vm.getLength = function() {
                return options.data.length
            }
            /**
             * @interface 获得指定序号的accordion面板展开(1)/收起(0)状态
             * @param index {Number} 指定面板序号(从0开始)
             * @returns {Number} 1表示index对应面板展开，0表示收起
             */
            vm.getStatus = function(index) {
                return (avalon(vmodel.$panels[index]).css('display') === 'none') ? 0 : 1
            }
            /**
             * @interface 切换accordion面板的展开
             * @param index {Number} 指定面板序号(从0开始)
             */
            vm.switchTo = function(index) {
                var event= {
                        target: vmodel.$triggers[index]
                    }
                if (options.onBeforeSwitch.call(event.target, index, vm.getHeader(index), vm.getPanel(index)) === false) {
                    return false
                }
                vmodel.currentIndex = index
                vmodel.data[index].toggle = true
            }
            vm._eventCallback = eventCallback
        })
        vmodel.$watch("currentIndex", function(newVal, oldVal) {
            var panel = vmodel.getPanel(newVal)
            if (vmodel.direction == "horizontal" && panel) {
                clearTimeout(animateTime) 
                animate(panel, Number(vmodel.contentWidth) || 400)
            } 
            if (!vmodel.multiple && oldVal !== -1) {
                vmodel.data[oldVal].toggle = false
            }
        })
        function eventCallback(event, index) {
            var header = vmodel.getHeader(index),
                $header = avalon(header),
                panel = vmodel.getPanel(index),
                dataItem = vmodel.data[index],
                itemToggle = !dataItem.toggle

            if (index === vmodel.currentIndex && event.type === "mouseenter") {
                return
            }
            if (options.onBeforeSwitch.call(event.target, index, header, panel) === false) {
                return false
            }

            vmodel.data[index].toggle = itemToggle
            if (itemToggle) {
                vmodel.currentIndex = index
            }
            options.onSwitch.call(event.target, index, header, panel)
        }

        function animate(panel, width) {
            var currentWidth = 0
            function widthAnimate() {
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
        width: '100%', //@config 配置组件宽度(type: Number || Percent)
        headerWidth: 30, //@config 组件水平展开时，头部的宽
        contentWidth: 400, //@config 组件水平展开时内容的宽
        headerAndContentHeight: 200, //@config 组件水平展开时的高度
        autoRun: true, //@config 告知组件是否自动渲染，设为false时需要手动调用refresh方法进行组件的解析渲染
        template: "", //@config 用户自定义template
        accordionClass: "", //@config 为accordion容器自定义的class
        currentTriggerClass: "oni-state-active", //@config 展开accordion面板时，header添加的class
        /**
         * @interface 配置accordion组件要展示的数据对象，格式为
            <pre class="brush:javascript;gutter:false;toolbar:false">
            [
            {title: String, content: String},
            {title: String, content: String},
            {title: String, content: String}
             ]
            </pre> 
         */
        data: [], 
        initIndex: null, //@config 初始展开第几个面板
        mode: "caret", //@config 组件展开模式，取值说明："nav"=面板header无小三角图标，"caret"=展开面板有小三角图标，可以定义是点击图标展开面板还是点击header即展开，默认是点击header即展开，当然也可以通过getTemplate自定义模板
        multiple: false, //@config 是否可以同时打开多个面板
        widgetElement: "", //@interface 保存绑定组件元素的引用
        trigger: "oni-accordion-header", //@config 触发展开面板的dom节点对应class，比如mode为caret时想要只通过小图标展开隐藏panel时可以设置为"oni-accordion-trigger"
        triggerType: 'click', //@config 触发展开面板的事件类型，可以是：click|mouseenter
        currentIndex: -1, //@interface 组件最新展开的面板序号，不可配置
        direction: "vertical", //@config 组件的展开方向，默认为垂直展开，也可以水平展开("horizontal")
        /**
         * @config {Function} 组件面板展开前回调函数
         * @param index {Number} 面板序号
         * @param header {Object} 标题区域节点对象
         * @param panel {Object} 面板区域节点对象
         * @returns {Boolean| Undefined} 若返回false则不展开面板 
         */
        onBeforeSwitch: avalon.noop, //@config
        /**
         * @config {Function} 组件面板展开后的回调函数
         * @param index {Number} 面板序号
         * @param header {Object} 标题区域节点对象
         * @param panel {Object} 面板区域节点对象
         */
        onSwitch: avalon.noop, //@config
        /**
         * @config {Function} 远程更改数据
         * @param vmodel {Object} 组件自身vmodel
         * @param options {Object} 组件的配置对象
         * @param vmodels {Array} 组件的祖先vmodel组成的数组链
         */
        onInit: avalon.noop, //@config
        /**
         * @config {Function} 方便用户自定义模板
         * @param str {String} 默认模板
         * @param opts {Object} vmodel
         * @returns {String} 新模板
         */
        getTemplate: function(str, options) {
            return str
        }
    }
    return avalon
});
/**
 @links
 [简单例子](avalon.accordion.ex1.html)
 [使用setData或者refresh(data)重新渲染accordion](avalon.accordion.ex2.html)
 [accordion提供的各种API](avalon.accordion.ex3.html)
 [嵌套的accordion](avalon.accordion.ex4.html)
 [文字内容水平展开的accordion](avalon.accordion.ex5.html)
 */