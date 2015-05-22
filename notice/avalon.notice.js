/**
 * @cnName 提示组件
 * @enName notice
 * @introduce
 * notice组件用来向用户显示一些提示信息。
 */
define(["../avalon.getModel", "text!./avalon.notice.html", "css!../chameleon/oniui-common.css", "css!./avalon.notice.css"], function(avalon, sourceHTML) {
    var template = sourceHTML,
        containerMap = [],
        affixBoxs = [], // 存储吸顶的notice元素，且只保存弹出的notice
        affixHeights = [], //存储吸顶元素对应的height、width、offsetTop
        isIE6 = (window.navigator.userAgent || '').toLowerCase().indexOf('msie 6') !== -1,
        maxZIndex = 0;
    var widget = avalon.ui.notice = function(element, data, vmodels) {
        var options = data.noticeOptions,
            temp = template
        if (options.animate) {
            temp = template.replace('ms-visible="toggle"' , "")
            options.height = 0
        } else {
            options.height = "auto"
        }
        options.template = options.getTemplate(temp, options);
        // container选项可以是dom对象，或者元素ID("#id")
        var noticeDefineContainer = options.container;
        // 根据配置值将container转换为完全的dom对象，如果用户未配置container，则container容器默认是应用绑定的元素
        options.container = noticeDefineContainer ? noticeDefineContainer.nodeType === 1 ? noticeDefineContainer : document.getElementById(noticeDefineContainer.substr(1)) : element;
        var templateView = null, // 保存模板解析后的dom对象的引用
            elementInnerHTML = element.innerHTML.trim(), //如果notice的container是默认配置也就是绑定元素本身，元素的innerHTML就是notice的content
            onShow = options.onShow,
            onShowVM = null,
            onHide = options.onHide,
            onHideVM = null;
        if (typeof onShow === "string") {
            onShowVM = avalon.getModel(onShow, vmodels);
            options.onShow = onShowVM && onShowVM[1][onShowVM[0]] || avalon.noop;
        }
        if (typeof onHide === "string") {
            onHideVM = avalon.getModel(onHide, vmodels);
            options.onHide = onHideVM && onHideVM[1][onHideVM[0]] || avalon.noop;
        }
        element.innerHTML = ""
        if (options.header !== "notice title" && options.title === "notice title") {
            options.title = options.header
        }
        var vmodel = avalon.define(data.noticeId, function(vm) {
            avalon.mix(vm, options);
            vm.$closeTimer = 0; // 定时器引用
            vm.$skipArray = ["template", "widgetElement", "_isAffix", "container", "elementHeight", "rootElement"];
            vm.elementHeight = 0
            vm.content = vm.content || elementInnerHTML;
            vm._isAffix = vm.isPlace && vm.isAffix;
            vm.rootElement = {};
            vm.widgetElement = element;
            // type的改变影响notice显示类的改变
            vm.typeClass = vm[vm.type + "Class"];
            vm.noticeAffixWidth = 0;
            vm.noticeAffixHeight = 0;
            vm.affixPlaceholderDisplay = "none";
            // 如果配置notice不占位则设置器容器为body
            !vm.isPlace ? vm.container = document.body : vm.container;
            vm._show = function(display) { // toggle为true时调用此方法显示notice
                _timerClose();
                _affix();
                if (vmodel.animate) {
                    step(display, vmodel)
                }
                vmodel.onShow.call(element, data, vmodels); // 用户回调
            }
            vm.$watch("elementHeightOk", function() {
                vmodel.height = "auto"
            })
            vm._close = function() { //close按钮click时的监听处理函数
                vmodel.toggle = false;
            }
            vm._hide = function(display) { //toggle为false时隐藏notice
                var hideAffixIndex = affixBoxs.indexOf(templateView),
                    $templateView = avalon(templateView)

                if (vmodel.animate) {
                    vmodel.elementHeight = $templateView.innerHeight()
                    $templateView.css("height", vmodel.elementHeight)
                    step(display, vmodel)
                }
                //隐藏吸顶元素后将其从吸顶队列中删除，并修改吸顶队列中所有元素的position为static，以便affixPosition能重新调整吸顶元素位置
                if (hideAffixIndex !== -1) {
                    templateView.style.position = "static"; //隐藏时改变position，方便再显示时调整元素位置(吸顶还是原位)
                    affixBoxs.splice(hideAffixIndex, 1);
                    affixHeights.splice(hideAffixIndex, 1);
                    for (var i = 0, len = affixBoxs.length; i < len; i++) {
                        affixBoxs[i].style.position = "static";
                    }
                    if (len) { //如果依然存在吸顶元素，重新调整吸顶元素的位置
                        affixPosition();
                    }
                }
                vmodel.onHide.call(element, data, vmodels); //用户回调
            }
            vm.setContent = function(content) {
                vmodel.content = content;
            }
            vm.$init = function() {
                var container = null;
                var sourceFragment = avalon.parseHTML(options.template);
                var AffixPlaceholder = sourceFragment.lastChild;
                if (!maxZIndex) {
                    maxZIndex = getMaxZIndex()                    
                }
                templateView = sourceFragment.firstChild;
                container = positionNoticeElement(); //获取存储notice的容器
                container.appendChild(templateView);
                if (!vmodel.isPlace) { //不占位notice元素，使之保持和配置container同样的offsetLeft和width
                    var $container = avalon(options.container);
                    // IE7及以下元素为空其width为0，所以需要取到其父节点的width
                    var $containerParent = avalon($container[0].parentNode);
                    templateView.style.width = ($container.width() || $containerParent.width()) + "px";
                    templateView.style.position = "relative";
                    templateView.style.left = $container.offset().left + "px";
                }
                if (vmodel._isAffix) {
                    container.appendChild(AffixPlaceholder);
                    avalon.scan(AffixPlaceholder, [vmodel]);
                }
                vm.rootElement = templateView
                avalon.scan(templateView, [vmodel].concat(vmodels))
                if (typeof options.onInit === 'function') {
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels);
                }
                if (vmodel.animate) {
                    animateElementHeight()
                }
            }
            vm.$remove = function() { //删除组件绑定元素后的自清理方法
                var templateViewPar = templateView.parentNode;
                for (var i = 0, len = containerMap.length; i < len; i++) {
                    var containerInfo = containerMap[i];
                    if (containerInfo[2] === options.container) {
                        break;
                    }
                }
                if (vmodel._isAffix) {
                    var templateViewNextSiblind = templateView.nextSibling;
                    templateViewPar.removeChild(templateViewNextSiblind);
                }
                templateView.innerHTML = templateView.textContent = "";
                templateViewPar.removeChild(templateView);
                if (!templateViewPar.children.length) {
                    templateViewPar.parentNode.removeChild(templateViewPar);
                    containerInfo[0] = void 0;
                }
            }
        });
        vmodel.$watch("toggle", function(v) { //改变toggle影响notice的显示、隐藏
            if (v) {
                vmodel._show(v);
            } else {
                vmodel._hide(v);
            }
        })
        vmodel.$watch("type", function(v) { //改变type影响notice的显示类型
            vmodel.typeClass = vmodel[v + "Class"];
        })
        vmodel.$watch("header", function(v) {
            vmodel.title = v;
        })
        vmodel.$watch("successClass", function(v) {
            vmodel.typeClass = v
        })
        vmodel.$watch("errorClass", function(v) {
            vmodel.typeClass = v
        })
        vmodel.$watch("infoClass", function(v) {
            vmodel.typeClass = v
        })
        vmodel.$watch("zIndex", function(v) {
            maxZIndex = v;
            affixPosition()
        })
        vmodel.$watch("content", function() {
            if (vmodel.animate) {
                animateElementHeight()
            }
        })
        // 如果配置了timer，则在notice显示timer时间后自动隐藏
        function _timerClose() {
            if (!vmodel.timer) {
                return;
            }
            window.clearTimeout(vmodel.$closeTimer);
            vmodel.$closeTimer = window.setTimeout(function() {
                vmodel.toggle = false;
            }, vmodel.timer);
        }
        // notice要求占位且吸顶则保存吸顶元素到affixBoxs中，将元素的width、height、offsetTop保存到affixHeights对应位置,并根据页面目前位置调整吸顶元素的位置
        function _affix() {
            if (!vmodel._isAffix) {
                return;
            }
            var $templateView = avalon(templateView);
            var offset = $templateView.offset();
            var templateViewWidth = templateView.offsetWidth;
            var templateViewHieght = templateView.offsetHeight;
            vmodel.noticeAffixWidth = templateViewWidth;
            vmodel.noticeAffixHeight = templateViewHieght;
            templateView.vmodel = vmodel;
            affixBoxs.push(templateView);
            affixHeights.push([templateViewHieght, templateViewWidth, offset.top, offset.left]);
            affixPosition();
        }
        // 当content改变时，重新计算元素高度，保证动画执行正确
        function animateElementHeight() {
            setTimeout(function () {
                var temp = document.createElement('div'), cloneTemplateView = templateView.cloneNode(true), 
                    $cloneTemplateView, 
                    width = avalon(templateView).innerWidth(),
                    templateViewPar = templateView.parentNode
                if (!width) {
                    while(templateViewPar) {
                        if (templateViewPar.nodeType === 1) {
                            width = avalon(templateViewPar).innerWidth()
                        }
                        if (width) {
                            break;
                        }
                        templateViewPar = templateViewPar.parentNode
                    }
                } 
                temp.style.position = 'absolute';
                temp.style.height = 0;
                document.body.appendChild(temp);
                temp.appendChild(cloneTemplateView);
                $cloneTemplateView = avalon(cloneTemplateView);
                $cloneTemplateView.css({
                    visibility: 'hidden',
                    width: width,
                    height: "auto"
                });
                vmodel.elementHeight = $cloneTemplateView.height();
                document.body.removeChild(temp);
            }, 10);
        }
        // 根据占位与否以及配置的container获得最终插入notice的container
        function positionNoticeElement() {
            var containerArr = [];
            var container = vmodel.container;
            var containerExist = false; // container是否被处理过的标志
            for (var i = 0, len = containerMap.length; i < len; i++) {
                var containerInfo = containerMap[i];
                if (containerInfo[2] === container) {
                    containerExist = true;
                    // container已经被配置过，则直接获取container下的div
                    container = vmodel.isPlace ? containerInfo[0] : containerInfo[1];
                    if (!container) { //因为存在占位和不占位两种情况，所以有可能得到的container还没有经过处理
                        var div = document.createElement("div");
                        var containerFirstChild = vmodel.container.childNodes[0];
                        if (!containerFirstChild) { // 如果container还没有子元素直接append
                            vmodel.container.appendChild(div);
                        } else { //保证notice的容器始终在container的起始位置
                            vmodel.container.insertBefore(div, containerFirstChild);
                        }
                        if (vmodel.isPlace) {
                            containerInfo[0] = container = div;
                            avalon(div).addClass("oni-notice-flow")
                        } else {
                            avalon(div).addClass("oni-notice-detach")
                            containerInfo[1] = container = div;
                        }
                    }
                    break;
                }
            }
            if (!containerExist) {
                var div = document.createElement("div");
                if (vmodel.isPlace) {
                    var containerFirstChild = container.childNodes[0];
                    if (!containerFirstChild) { // 如果container还没有子元素直接append
                        container.appendChild(div);
                    } else { //保证notice的容器始终在container的起始位置
                        container.insertBefore(div, containerFirstChild);
                    }
                } else { // 不占位的notice直接append到body后面
                    container.appendChild(div);
                }
                avalon(div).addClass(vmodel.isPlace ? "oni-notice-flow" : "oni-notice-detach");
                containerArr[2] = container; // 保存用户配置的container对象
                if (vmodel.isPlace) {
                    containerArr[0] = container = div; // 占位元素container下的oni-notice-flow
                } else {
                    containerArr[1] = container = div; // body下的oni-notice-detach元素
                }
                containerMap.push(containerArr);
            }
            return container;
        }
        return vmodel;
    }
    avalon.bind(window, "scroll", function() {
        affixPosition();
    })
    function affixPosition() { // 定位吸顶元素
        var scrollTop = avalon(document).scrollTop();
        for (var i = 0, len = affixBoxs.length; i < len; i++) {
            var notice = affixBoxs[i],
                    style = notice.style,
                    $notice = avalon(notice),
                    vmodel = notice.vmodel;
            // 如果滚动距离大于吸顶元素的offsetTop，将元素吸顶，否则保存元素在页面的位置不变
            if (scrollTop >= affixHeights[i][2]) {
                // IE6下fixed失效，使用absolute进行吸顶操作
                if (style.position !== "fixed" || (isIE6 && style.position !== "absolute")) { //滚动过程中如果元素已经吸顶，就不再重新计算位置并定位
                    var top = 0;
                    var left = 0;
                    for (var j = 1; j <= i; j++) {
                        top += affixHeights[j - 1][0];
                    }
                    top = isIE6 ? scrollTop + top : top;
                    left = affixHeights[i][3];
                    $notice.css({
                        width: affixHeights[i][1] + "px",
                        top: top + "px",
                        left: left + "px",
                        position: (isIE6 ? "absolute" : "fixed"),
                        "z-index": maxZIndex
                    })
                    vmodel.affixPlaceholderDisplay = "block";
                }
            } else {
                $notice.css("position", "static");
                vmodel.affixPlaceholderDisplay = "none";
            }
        }
    }
    function getMaxZIndex() {
        var children = document.body.children,
                maxIndex = 10, //当body子元素都未设置zIndex时，默认取10
                zIndex;
        for (var i = 0, el; el = children[i++]; ) {
            if (el.nodeType === 1) {
                zIndex = ~~avalon(el).css("z-index");
                if (zIndex) {
                    maxIndex = Math.max(maxIndex, zIndex);
                }
            }
        }
        return maxIndex + 1;
    }
    function camelize(target) {
        //转换为驼峰风格
        if (target.indexOf("-") < 0 && target.indexOf("_") < 0) {
            return target //提前判断，提高getStyle等的效率
        }
        return target.replace(/[-_][^-_]/g, function(match) {
            return match.charAt(1).toUpperCase()
        })
    }
    function supportCss3(name) {
        var prefix = ["", "-webkit-", "-o-", "-moz-", "-ms-"],
            i,
            htmlStyle = document.documentElement.style
        for (i in prefix) {
            camelCase = camelize(prefix[i] + name)
            if (camelCase in htmlStyle) {
                return true
            }
        }
        return false
    }
    function step(display, vmodel) {
        var elementHeight = vmodel.elementHeight,
            height,
            interval
        if (supportCss3("transition")) {
            height = display ? elementHeight : 0
            if (!display) {
                setTimeout(function() {
                    vmodel.height = height
                }, 10)
            } else {
                vmodel.height = height 
            }
            if (height) {
                setTimeout(function() {
                    vmodel.$fire("elementHeightOk")
                }, 600)
            }
        } else {
            height = display ? 0 : elementHeight
            function animate() {
                height = display ? height + 1 : height - 1
                if (height < 0) {
                    vmodel.height = 0
                    return 
                } else if (height > elementHeight) {
                    vmodel.height = elementHeight
                    setTimeout(function() {
                        vmodel.$fire("elementHeightOk")
                    }, 600)
                    return 
                }
                vmodel.height = height
                setTimeout(animate, 0)
            }
            animate()
        }
    }
    widget.version = 1.0
    widget.defaults = {
        content: "", //@interface 要显示的内容,可以是DOM对象|String|DOM String
        container: "", //@interface 显示notice的容器，可以配置为自己想要包裹notice的元素对象或者元素id，id的话必须是"#ID"的格式,默认为绑定组件的元素
        type: "info", //@config notice类型,可以选择为"success"、"error"或者默认的"info
        header: "notice title", //@config notice的标题
        title: "notice title", //@config  notice的标题
        timer: 0, //@config notice显示之后自动隐藏的定时器，0表示不自动隐藏
        hasCloseBtn: true, //@config 是否显示关闭按钮，设为false不显示
        toggle: false, //@config 显示或隐藏notice， true显示，false隐藏
        isPlace: true, //@config 是否占位，false不占位，true占位，占位时notice显示在自定义的container中，不占位时append到body元素下
        isAffix: false, //@config 是否吸顶，非占位元素不吸顶，占位元素当滚动距离大于元素距页面顶部距离时吸顶，否则保持原位置
        /**
         * @interface  notice显示之后回调
         * @param data {Object} 与此数组相关的数据对象
         *  @param vmodels {Array} 位于此组件上方的vmodels组成的数组
         */
        onShow: avalon.noop,
        /**
         * @interface  notice关闭之后回调
         * @param data {Object} 与此数组相关的数据对象
         *  @param vmodels {Array} 位于此组件上方的vmodels组成的数组
         */
        onHide: avalon.noop,
        successClass: "oni-notice-info", //@config type为success时的提示类名
        errorClass: "oni-notice-danger", //@config type为error时的提示类名
        infoClass: "", //@config type为info时的提示类名
        widgetElement: "", //@interface accordion容器
        zIndex: 'auto', //@config 提示组件的zindex css值
        animate: true, //@config notice的显示隐藏是否添加动画
        /*
         * @config {Function} 用于重写模板的函数 
         * @param {String} tmpl
         * @param {Object} opts
         * @returns {String}
         */
        getTemplate: function(str, options) {
            return str;
        }
    }
    return avalon;
})
/**
 @links
 [notice组件概览，具体使用demo及说明请看avalon.notice.ex1...6](avalon.notice.ex.html)
 [使用默认配置的notice组件，可以动态改变其content、header、type](avalon.notice.ex1.html)
 [自定义notice的container，设置isPlace可以决定notice是占位还是不占位](avalon.notice.ex2.html)
 [当配置notice占位且可吸顶时，notice会在页面滚动到它所在位置时吸顶显示](avalon.notice.ex3.html)
 [自定义notice的回调](avalon.notice.ex4.html)
 [设置timer使得notice在显示一段时间之后隐藏](avalon.notice.ex5.html)
 [自定义notice type的样式类](avalon.notice.ex6.html)
 */