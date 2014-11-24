// avalon 1.3.6
/**
 * 
 * @cnName 对话框
 * @enName dialog
 * @introduce
 *    <p>dialog组件提供弹窗显示或者隐藏,通过简单配置可以水平居中显示dialog弹窗，此组件支持弹窗中再弹窗，也可以用来模拟alert的行为，非常方便</p>
 */
define(["../avalon.getModel", 
    "text!./avalon.dialog.html",
    "../button/avalon.button",
    "css!../chameleon/oniui-common.css", 
    "css!./avalon.dialog.css",
    "../draggable/avalon.draggable"
], function(avalon, sourceHTML) {

    var template = sourceHTML,
        widgetArr = template.split("MS_OPTION_WIDGET"),
        _maskLayer = widgetArr[0], // 遮罩层html(string)
        maskLayer = avalon.parseHTML(_maskLayer).firstChild, // 遮罩层节点(dom node)
        maskLayerExist = false, // 页面不存在遮罩层就添加maskLayer节点，存在则忽略
        _widget = widgetArr[1].split("MS_OPTION_INNERWRAPPER")[0], // 动态添加dialog时,绑定组件的元素(string)
        dialogShows = [], //存在层上层时由此数组判断层的个数
        dialogNum = 0, //保存页面dialog的数量，当dialogNum为0时，清除maskLayer
        maxZIndex = getMaxZIndex(), //保存body直接子元素中最大的z-index值， 保证dialog在最上层显示
        //IE6 userAgent Mozilla/4.0(compatible;MISE 6.0;Windows NT 6.1;...)
        isIE6 = (window.navigator.userAgent || '').toLowerCase().indexOf('msie 6') !== -1,
        iFrame = null,
        body = (document.compatMode && document.compatMode.toLowerCase() == "css1compat") ? document.documentElement : document.body;

    var widget = avalon.ui.dialog = function(element, data, vmodels) {
        dialogNum++
        var options = data.dialogOptions
        options.type = options.type.toLowerCase() 
        options.template = options.getTemplate(template, options)
        var _footerArr = options.template.split("MS_OPTION_FOOTER"),
            _contentArr = _footerArr[0].split("MS_OPTION_CONTENT"),
            _headerArr = _contentArr[0].split("MS_OPTION_HEADER"),
            _innerWraperArr = _headerArr[0].split("MS_OPTION_INNERWRAPPER"),
            _content = _contentArr[1], //content wrapper html
            _lastHeader = _headerArr[1], //header html
            _lastFooter = _footerArr[1], //footer html
            _innerWrapper = _innerWraperArr[1], //inner wrapper html
            _lastContent = "", //dialog content html
            lastContent = "", //dialog content node
            $element = avalon(element),
            onConfirm = options.onConfirm,
            onConfirmVM = null,
            onCancel = options.onCancel,
            onCancelVM = null,
            onOpen = options.onOpen,
            onOpenVM = null,
            onClose = options.onClose,
            onCloseVM = null,
            toggleClose = true;

        if (typeof onConfirm === "string") {
            onConfirmVM = avalon.getModel(onConfirm, vmodels)
            options.onConfirm = onConfirmVM && onConfirmVM[1][onConfirmVM[0]] || avalon.noop
        }
        if (typeof onCancel ==="string") {
            onCancelVM = avalon.getModel(onCancel, vmodels)
            options.onCancel = onCancelVM && onCancelVM[1][onCancelVM[0]] || avalon.noop
        }
        if (typeof onClose ==="string") {
            avalon.log("ms-widget='dialog' data-dialog-on-close 此用法已经被废弃")
            onCloseVM = avalon.getModel(onClose, vmodels)
            options.onClose = onCloseVM && onCloseVM[1][onCloseVM[0]] || avalon.noop
        }
        if (typeof onOpen ==="string") {
            onOpenVM = avalon.getModel(onOpen, vmodels)
            options.onOpen = onOpenVM && onOpenVM[1][onOpenVM[0]] || avalon.noop
        }
        _lastFooter = options.getFooter(_lastFooter, options)
        var vmodel = avalon.define(data.dialogId, function(vm) {
            avalon.mix(vm, options)
            vm.$skipArray = ["widgetElement", "template", "container", "modal", "zIndexIncrementGlobal", "initChange"]
            vm.widgetElement = element
            vm.position = "fixed"
            // 如果显示模式为alert或者配置了showClose为false，不显示关闭按钮
            vm.showClose = vm.type === "alert" ? false : vm.showClose
            
            // 点击确定按钮，根据回调返回值是否为false决定是否关闭弹窗
            vm._confirm = function(e) {
                if (typeof vmodel.onConfirm !== "function") {
                    throw new Error("onConfirm必须是一个回调方法")
                }
                // 在用户回调返回false时，不关闭弹窗
                if(vmodel.onConfirm.call(e.target, e, vmodel) !== false){
                    vmodel._close(e)
                }
            }
            // 显示dialogmask
            vm._open = function(updateZIndex) {
                var len = 0, //当前显示的dialog的个数
                    selectLength = document.getElementsByTagName("select").length,
                    maxZIndex = vmodel.zIndex
                avalon.Array.ensure(dialogShows, vmodel)
                len = dialogShows.length
                // 通过zIndex的提升来调整遮罩层，保证层上层存在时遮罩层始终在顶层dialog下面(顶层dialog zIndex-1)但是在其他dialog上面
                maskLayer.style.zIndex = 2 * len + maxZIndex -1
                element.style.zIndex =  2 * len + maxZIndex
                if(updateZIndex) {
                    return 
                }
                resetCenter(vmodel, element)
                // IE6下遮罩层无法覆盖select解决办法
                if (isIE6 && selectLength && iFrame === null && vmodel.modal) {
                    iFrame = createIframe()
                } else if(isIE6 && selectLength && vmodel.modal) { 
                    iFrame.style.display = "block"
                    iFrame.style.width = maskLayer.style.width
                    iFrame.style.height = maskLayer.style.height
                    iFrame.style.zIndex = maskLayer.style.zIndex -1
                }
                vmodel.onOpen.call(element, vmodel)
            }
            
            // 隐藏dialog
            vm._close = function(e) {
                avalon.Array.remove(dialogShows, vm)
                var len = dialogShows.length,
                    maxZIndex = vmodel.zIndex;
                if (e) {
                    toggleClose = false
                }
                vmodel.toggle = false

                /* 处理层上层的情况，因为maskLayer公用，所以需要其以将要显示的dialog的toggle状态为准 */
                if (len && dialogShows[len-1].modal) {
                    maskLayer.setAttribute("ms-visible", "toggle")
                    avalon.scan(maskLayer, dialogShows[len - 1])
                } else {
                    if (iFrame !== null) {
                        iFrame.style.display = "none"
                    }
                    document.documentElement.style.overflow = ""
                    vmodel.onClose.call(element, vmodel)
                    return 
                }
                // 重置maskLayer的z-index,当最上层的dialog关闭，通过降低遮罩层的z-index来显示紧邻其下的dialog
                var layoutZIndex = 2 * len + maxZIndex - 1
                maskLayer.style.zIndex = layoutZIndex
                if (iFrame) {
                    iFrame.style.zIndex = layoutZIndex -1
                }
                vmodel.onClose.call(element, vmodel)
            }

            // 点击"取消"按钮，根据回调返回值是否为false决定是否关闭dialog
            vm._cancel = function(e) {
                if (typeof vmodel.onCancel != "function") {
                    throw new Error("onCancel必须是一个回调方法")
                }
                // 在用户回调返回false时，不关闭弹窗
                if(vmodel.onCancel.call(e.target, e, vmodel) !== false){
                    vmodel._close(e)
                }
            }

            /**
             * desc: 可以动态改变dialog的显示内容
             * @param content: 要替换的content，可以是已经渲染ok的view也可以是未解析渲染的模板
             * @param noScan: 当content是模板时noScan设为false或者不设置，组件会自动解析渲染模板，如果是已经渲染ok的，将noScan设为true，组件将不再进行解析操作
             */
            vm.setContent = function(content, noScan, contentVmodels) {
                var scanVmodels = contentVmodels ? contentVmodels : [vmodel].concat(vmodels)
                _lastContent = content
                lastContent.innerHTML = _lastContent
                if (!noScan) {
                    avalon.scan(lastContent, scanVmodels)
                }
                return vmodel
            }

            // 动态修改dialog的title
            vm.setTitle = function(title) {
                vmodel.title = title
                return vmodel
            }

            // 重新渲染dialog
            vm.setModel = function(m) {
                // 这里是为了充分利用vm._ReanderView方法，才提前设置一下element.innerHTML
                if (!!m.$content) {
                    vmodel.setContent(m.$content, m.noScan, [vmodel].concat(findModel(m)).concat(vmodels))
                }
                if (!!m.$title) {
                    vmodel.title = m.$title
                }
                return vmodel
            }
            // 将零散的模板(dialog header、dialog content、 dialog footer、 dialog wrapper)组合成完整的dialog
            vm._renderView = function() {
                var innerWrapper = null // 保存innerWraper元素节点
                // 用户只能通过data-dialog-width配置width，不可以通过ms-css-width来配置，配置了也无效
                element.setAttribute("ms-css-width", "width")
                lastContent = avalon.parseHTML(_content).firstChild
                _lastContent = element.innerHTML || vmodel.content
                element.innerHTML = ""
                lastContent.innerHTML = _lastContent
                innerWrapper = avalon.parseHTML(_innerWrapper).firstChild
                innerWrapper.innerHTML = _lastHeader
                innerWrapper.appendChild(lastContent)
                innerWrapper.appendChild(avalon.parseHTML(_lastFooter))
                element.appendChild(innerWrapper)
                if (!maskLayerExist) {
                    document.body.appendChild(maskLayer)
                    maskLayerExist = true
                }
            }

            vm.$init = function(continueScan) {
                var container = vmodel.container,
                    clientHeight = body.clientHeight,
                    docBody = document.body,
                    // container必须是dom tree中某个元素节点对象或者元素的id，默认将dialog添加到body元素
                    elementParent = ((avalon.type(container) === "object" && container.nodeType === 1 && docBody.contains(container)) ? container : document.getElementById(container)) || docBody
                if (avalon(docBody).height() < clientHeight) {
                    avalon(docBody).css("min-height", clientHeight)
                }
                if (vmodel.draggable) {
                    $element.attr("ms-draggable", "")
                    vmodel.draggable = {
                        handle: function(e){
                            var el = e.target
                            do {
                                if (el.className === "oni-dialog-header") {
                                    return el
                                }
                                if (el.className === "oni-dialog") {
                                    return
                                }
                            } while (el = el.parentNode)
                        }
                    }
                }
                vmodel.initChange = true
                vmodel.zIndex = vmodel.zIndex + vmodel.zIndexIncrementGlobal
                vmodel.title = vmodel.title || "&nbsp;"
                $element.addClass("oni-dialog")
                element.setAttribute("ms-visible", "toggle")
                element.setAttribute("ms-css-position", "position")
                vm._renderView()
                elementParent.appendChild(element)
                // 当窗口尺寸发生变化时重新调整dialog的位置，始终使其水平垂直居中
                element.resizeCallback = avalon(window).bind("resize", throttle(resetCenter, 50, 100, [vmodel, element]))
                if(!maskLayer.attributes["ms-visible"]) {
                    // 设置遮罩层的显示隐藏
                    maskLayer.setAttribute("ms-visible", "toggle")
                }
                if (vmodel.modal) {
                    avalon.scan(maskLayer, [vmodel].concat(vmodels))
                }
                avalon.scan(element, [vmodel].concat(vmodels))
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }

            // 自动清理方法
            vm.$remove = function() {
                dialogNum--
                element.innerHTML = ""
                avalon.unbind(window, "resize", element.resizeCallback)
                avalon.unbind(window, "scroll", element.scrollCallback)
                if (!dialogNum) {
                    maskLayer.parentNode.removeChild(maskLayer)
                    maskLayerExist = false
                }
            }

            // 打开dialog之后处理zIndex使dialog正常显示
            vm.$watch("toggle", function(val) {
                if (val) {
                    vmodel._open()
                } else {
                    if (toggleClose === false) {
                        toggleClose = true
                    } else {
                        vmodel._close()
                    }
                }
            })

            // 可以手动设置最大zIndex
            vm.$watch("zIndex", function(val) {
                if (vmodel.initChange) {
                    vmodel.initChange = false
                } else {
                    vmodel._open(true)
                }
            })
        })
        return vmodel
    }
    widget.version = 1.0
    widget.defaults = {
        width: 480, //@config 设置dialog的width
        title: "&nbsp;", //@config 设置弹窗的标题
        draggable: false, //@config 设置dialog是否可拖动
        type: "confirm", //@config 配置弹窗的类型，可以配置为alert来模拟浏览器
        content: "", //@config 配置dialog的content，默认取dialog的innerHTML作为dialog的content，如果innerHTML为空，再去取content配置项
        /**
         * @config {Function} 定义点击"确定"按钮后的回调操作
         * @param event {Number} 事件对象
         * @param vmodel {Object} 组件对应的Vmodel
         */
        onConfirm: avalon.noop, 
        /**
         * @config {Function} 定义显示dialog时的回调
         * @param vmodel {Object} 组件对应的Vmodel
         */
        onOpen: avalon.noop, 
        /**
         * @config {Function} 定义点击"取消"按钮后的回调操作
         * @param event {Object} 事件对象
         * @param vmodel {Object} 组件对应的Vmodel
         */
        onCancel: avalon.noop, //点击“取消”按钮的回调
        /**
         * @config {Function} 定义点击"关闭"按钮后的回调操作
         * @param event {Object} 事件对象
         * @param vmodel {Object} 组件对应的Vmodel
         */
        onClose: avalon.noop, //点击右上角的“关闭”按钮的回调
        setTitle: avalon.noop, //动态修改dialog的title
        setContent: avalon.noop, //动态修改dialog的content
        /**
         * @config {Function} 重新渲染模板
         * @param m {Object} 重新渲染dialog的配置对象，包括title、content、content中涉及的插值表达式，需要注意的是，title和content不是真正渲染的内容，所以不需要avalon进行扫描监控，定义的时候必须在其前面加上"$",否则组件不会渲染成想要的效果
         */
        setModel: avalon.noop, //重新渲染dialog
        showClose: true, //@config 配置dialog是否显示"取消"按钮，但是如果type为alert，不论showClose为true or false都不会显示"取消"按钮
        toggle: false, //通过此属性的决定dialog的显示或者隐藏状态
        widgetElement: "", //保存对绑定元素的引用
        container: "body", //@config dialog元素的上下文父元素，container必须是dialog要appendTo的父元素的id或者元素dom对象
        confirmName: "确定", //@config 配置dialog的"确定"按钮的显示文字
        cancelName: "取消", //@config 配置dialog的"取消"按钮的显示文字
        getTemplate: function(str, options) {
            return str
        },
        /**
         * @config {Function} 通过此方法配置dialog的footer
         * @param tmp {String} dialog默认模板的footer
         * @returns {String} 用户自定义的dialog的footer 
         */
        getFooter: function(tmp) {
            return tmp
        },
        modal: true, //@config 是否显示遮罩
        zIndex: maxZIndex, //@config 通过设置vmodel的zIndex来改变dialog的z-index,默认是body直接子元素中的最大z-index值，如果都没有设置就默认的为10
        zIndexIncrementGlobal: 0 //@config 相对于zIndex的增量, 用于全局配置，如果只是作用于单个dialog那么zIndex的配置已足够，设置全局需要通过avalon.ui.dialog.defaults.zIndexIncrementGlobal = Number来设置
    }
    avalon(window).bind("keydown", function(e) {
        var keyCode = e.which,
            dialogShowLen = dialogShows.length;
        if (keyCode === 27 && dialogShowLen) {
            dialogShows[dialogShowLen - 1].toggle = false
        }
    })
    // 获取重新渲染dialog的vmodel对象
    function findModel(m) {
        var model = m
        if (model) { // 如果m为字符串参数，说明是要在已存在的vmodels中查找对应id的vmodel
            if (avalon.type(model) === 'string') {
                model = avalon.vmodels[model]
            } 
        } else { // 如果没有传递参数m，则返回空vmodel
            model = avalon.define('dialogVM' + setTimeout("1"), function(vm) {
            })
        }
        if (!model) {
            throw new Error("您查找的"+model+"不存在")
        }
        // 如果传入的是avalon的vmodel格式的参数对象，直接返回，如果是普通的对象，将其转换为avalon的监控对象
        if (avalon.isPlainObject(model) && !model.$id && !model.$accessors) {
            model = avalon.define('dialogVM' + setTimeout("1"), function(vm) {
                avalon.mix(vm, m)
            })
        }
        return [].concat(model)
    }

    // resize、scroll等频繁触发页面回流的操作要进行函数节流
    function throttle(fn, delay, mustRunDelay, args){
        var timer = null
        var t_start
        return function(){
            var context = this, t_curr = +new Date()
            clearTimeout(timer)
            if(!t_start){
                t_start = t_curr
            }
            if(t_curr - t_start >= mustRunDelay){
                fn.apply(context, args)
                t_start = t_curr
            }
            else {
                timer = setTimeout(function(){
                    fn.apply(context, args)
                }, delay)
            }
        }
     }

    // 使dialog始终出现在视窗中间
    function resetCenter(vmodel, target, scroll) {
        if (!vmodel.toggle) return
        var bodyHeight = body.scrollHeight,
            bodyWidth = body.scrollWidth,
            clientWidth,
            clientHeight,
            targetOffsetHeight = target.offsetHeight,
            targetOffsetWidth = target.offsetWidth,
            scrollTop = document.body.scrollTop + document.documentElement.scrollTop,
            scrollLeft = body.scrollLeft,
            documentElementStyle = document.documentElement.style,
            t = 0,
            l = 0, 
            top,
            left,
            $target = avalon(target),
            $maskLayer = avalon(maskLayer);

        vmodel.position = isIE6 ? "absolute" : "fixed"
        isIE6 ? documentElementStyle.overflow = "auto" : documentElementStyle.overflow = "hidden"
        clientWidth = document.documentElement.clientWidth
        clientHeight = document.documentElement.clientHeight
        top = (clientHeight - targetOffsetHeight) / 2
        left = (clientWidth - targetOffsetWidth) / 2

        if (clientHeight < targetOffsetHeight || clientWidth < targetOffsetWidth) {
            vmodel.position = "absolute"
            documentElementStyle.overflow = "auto"
        } 
        if (clientHeight < targetOffsetHeight) {
            t = scrollTop + 10
            l = scrollLeft + 10
            if (clientWidth > targetOffsetWidth) {
                l = left + (isIE6 ? scrollLeft : 0)
            }
        } else {
            t = top + (isIE6 ? scrollTop : 0)
            l = left + (isIE6 ? scrollLeft : 0)
            if (clientWidth < targetOffsetWidth) {
                l = scrollLeft + 10
            }
        }
        var maskHeight = bodyHeight > targetOffsetHeight ? bodyHeight : targetOffsetHeight + 10
        var maskWidth = bodyWidth > targetOffsetWidth ? bodyWidth : targetOffsetWidth + 10
        $maskLayer.css({height: maskHeight , width: maskWidth})
        $target.css({left:l, top: t})
    }

    // 获取body子元素最大的z-index
    function getMaxZIndex() {
        var children = document.body.children,
            maxIndex = 10, //当body子元素都未设置zIndex时，默认取10
            zIndex;
        for (var i = 0, el; el = children[i++];) {
            if (el.nodeType === 1) {
                if (el === maskLayer) continue
                zIndex = ~~avalon(el).css("z-index")
                if (zIndex) {
                    maxIndex = Math.max(maxIndex, zIndex)
                }
            }
        }
        return maxIndex + 1
    }
    // IE6下创建iframe遮住不能被遮罩层遮住的select
    function createIframe() {
        var iframe = document.createElement('<iframe src="javascript:\'\'" style="position:absolute;top:0;left:0;bottom:0;margin:0;padding:0;right:0;zoom:1;width:'+maskLayer.style.width+';height:'+maskLayer.style.height+';z-index:'+(maskLayer.style.zIndex-1)+';"></iframe>')
        document.body.appendChild(iframe)
        return iframe
    }

    return avalon
})
/**
 @links
 [dialog功能全览](avalon.dialog.ex.html)
 [默认配置的dialog组件](avalon.dialog.ex1.html)
 [拥有回调操作的dialog](avalon.dialog.ex2.html)
 [不显示关闭按钮的dialog](avalon.dialog.ex3.html)
 [嵌套dialog](avalon.dialog.ex4.html)
 [模拟alert](avalon.dialog.ex5.html)
 [模拟alert，showClose配置无效](avalon.dialog.ex6.html)
 [自定义dialog的width](avalon.dialog.ex7.html)
 [通过container配置项设置dialog元素的上下文父元素](avalon.dialog.ex8.html)
 [修改dialog的title、content、或者重新渲染dialog](avalon.dialog.ex9.html)
 [通过加载avalon.draggable实现拖拽](avalon.dialog.ex10.html)
 [改变dialog的z-index](avalon.dialog.ex11.html)
 */