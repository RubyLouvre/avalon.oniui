define(["avalon.getModel", 
    "text!./avalon.dialog.html",
    "css!../chameleon/oniui-common.css", 
    "css!./avalon.dialog.css"
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
        dialogNum++;
        var options = data.dialogOptions,
            dialogOptions = data.value.split(',')[2]; //确保存在嵌套dialog时能正确应用用户定义的配置对象
        dialogOptions = dialogOptions && avalon.getModel(dialogOptions, vmodels);
        if (dialogOptions) {
            avalon.mix(options, dialogOptions[1][dialogOptions[0]]);
        }

        if (avalon(element).data("custom")) { //兼容onion-adapter的自创建dialog
            avalon.mix(options, avalon(element).data("config"));
        }
        var submit = options.submit ? (typeof options.submit ==="function") ? options.submit : options.submit.substring(0,options.submit.indexOf("(")) : null, //兼容onion-adapter可删掉
            submitVM = null,
            cancel = options.cancel ? typeof options.cancel === "function" ? options.cancel : options.cancel.substring(0,options.cancel.indexOf("(")) : null, //兼容onion-adapter可删掉
            cancelVM = null,
            confirm = options.confirm ? (typeof options.confirm ==="function") ? options.confirm : options.confirm.substring(0,options.confirm.indexOf("(")) : null, //兼容onion-adapter可删掉
            confirmVM = null;
        if (typeof submit === "string") {
            submitVM = avalon.getModel(submit, vmodels);
            options.submit = submitVM && submitVM[1][submitVM[0]].bind(vmodels) || avalon.noop;
        } else {
            options.submit = submit;
        }
        if (typeof cancel ==="string") {
            cancelVM = avalon.getModel(cancel, vmodels);
            options.cancel = cancelVM && cancelVM[1][cancelVM[0]].bind(vmodels) || avalon.noop;
        } else {
            options.cancel = cancel;
        }
        if(typeof confirm ==="string") {
            confirmVM = avalon.getModel(confirm, vmodels);
            options.confirm = confirmVM && confirmVM[1][confirmVM[0]].bind(vmodels) || avalon.noop;
        } else {
            options.confirm = confirm;
        }
        options.type = options.type.toLowerCase(); //兼容onion-adapter的ALERT大写方式
        options.template = options.getTemplate(template, options);
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
            eleChildren = element.childNodes, //兼容onion-adapter的辅助变量
            hasSubDialog = false; //兼容onion-adapter的辅助变量
        // 判断绑定dialog组件元素内部是否有dialog绑定
        for (var i=0, len=eleChildren.length; i<len; i++) { //兼容onion-adapter 
            var subEle = eleChildren[i],
                widget;
            if (subEle.nodeType === 1) {
                widget = avalon(subEle).attr("ms-widget");
                if (widget && widget.split(",")[0]==="dialog") {
                    hasSubDialog = true;
                    break;
                }
            } 
        }

        var vmodel = avalon.define(data.dialogId, function(vm) {
            avalon.mix(vm, options);
            if (!hasSubDialog) { //显示dialog，可废弃，用来兼容onion-adapter，规范的方式是通过toggle切换dialog的显示与隐藏
                vm.show = function() { 
                    vmodel.toggle = true;
                }
            }
            vm.$skipArray = ["widgetElement", "template","submitBtnClick","cancelBtnClick"];
            vm.submitBtnClick = false;
            vm.cancelBtnClick = false;
            vm.widgetElement = element;
            // 如果显示模式为alert或者配置了showClose为false，不显示关闭按钮
            vm.showClose = vm.type === "alert" ? false : options.showClose;
            
            // 点击确定按钮，根据回调返回值是否为false决定是否关闭弹窗
            vm._submit = function(e) {
                if (typeof options.onSubmit !== "function") {
                    throw new Error("onSubmit必须是一个回调方法");
                }
                if (vmodel.submit) { //兼容onion-adapter
                    vmodel.submit(avalon.noop);
                }
                if (vmodel.confirm) { //兼容onion-adapter
                    vmodel.confirm(avalon.noop);
                }
                // 在用户回调返回false时，不关闭弹窗
                if(options.onSubmit.call(e.target, e, vmodel) !== false){
                    vmodel.submitBtnClick = true;
                    vmodel._close(e)
                }
            }
            
            // 显示dialogmask
            vm._open = function() {
                var len = 0, //当前显示的dialog的个数
                    selectLength = document.getElementsByTagName("select").length;
                !isIE6 ? document.body.style.overflow = "hidden" : 0;
                avalon.Array.ensure(dialogShows, vm);
                len = dialogShows.length;
                // 通过zIndex的提升来调整遮罩层，保证层上层存在时遮罩层始终在顶层dialog下面(顶层dialog zIndex-1)但是在其他dialog上面
                
                maskLayer.style.zIndex = 2 * len + maxZIndex -1;
                element.style.zIndex =  2 * len + maxZIndex;
                resetCenter(vmodel, element);
                // IE6下遮罩层无法覆盖select解决办法
                if (isIE6 && selectLength && iFrame === null) {
                    iFrame = createIframe();
                } else if(isIE6 && selectLength) { 
                    iFrame.style.display = "block";
                    iFrame.style.width = maskLayer.style.width;
                    iFrame.style.height = maskLayer.style.height;
                    iFrame.style.zIndex = maskLayer.style.zIndex -1;
                }
                options.onOpen.call(vmodel);
            }
            
            // 隐藏dialog
            vm._close = function(e) {
                avalon.Array.remove(dialogShows, vm);
                var len = dialogShows.length;
                vmodel.toggle = false;
                /* 处理层上层的情况，因为maskLayer公用，所以需要其以将要显示的dialog的toggle状态为准 */
                if (len && dialogShows[len-1].modal) {
                    maskLayer.setAttribute("ms-visible", "toggle");
                    avalon.scan(maskLayer, dialogShows[len - 1]);
                } else {
                    if (iFrame !== null) {
                        iFrame.style.display = "none";
                    }
                    !isIE6? document.body.style.overflow = "auto" : 0;
                    return ;
                }
                // 重置maskLayer的z-index,当最上层的dialog关闭，通过降低遮罩层的z-index来显示紧邻其下的dialog
                var layoutZIndex = 2 * len + maxZIndex - 1;
                maskLayer.style.zIndex = layoutZIndex;
                if (iFrame) {
                    iFrame.style.zIndex = layoutZIndex -1;
                }
                // 因为在submit操作之后也调用了_close方法来关闭弹窗，但是如果用户定义了onClose方法的话是不应该触发的，因此通过submitBtnClick这个开关来判断是点击了确定按钮还是点击了"取消"或者“关闭”按钮.
                if (vmodel.submitBtnClick) {
                    vmodel.submitBtnClick = false;
                } else if (vmodel.cancelBtnClick) {
                    vmodel.cancelBtnClick = false;
                } else {
                    options.onClose.call(e.target, e, vmodel)
                }
            };
            // 点击"取消"按钮，根据回调返回值是否为false决定是否关闭dialog
            vm._cancel = function(e) {
                if (typeof options.onCancel != "function") {
                    throw new Error("onCancel必须是一个回调方法");
                }
                if(vmodel.cancel) {
                    vmodel.cancel(avalon.noop);
                }
                // 在用户回调返回false时，不关闭弹窗
                if(options.onCancel.call(e.target, e, vmodel) !== false){
                    vmodel.cancelBtnClick = true;
                    vmodel._close(e)
                }
            }
            vm.$watch("toggle", function(val) {
                if (val) {
                    vmodel._open();
                }
            })
            vm.$watch("zIndex", function(val) {
                maxZIndex = val;
            })
            /**
             * desc: 可以动态改变dialog的内容
             * @param content: 要替换的content，可以是已经渲染ok的view也可以是未解析渲染的模板
             * @param noScan: 当content是模板时noScan设为false或者不设置，组件会自动解析渲染模板，如果是已经渲染ok的，将noScan设为true，组件将不再进行解析操作
             */
            vm.setContent = function(content, noScan) {
                _lastContent = content;
                lastContent.innerHTML = _lastContent;
                if (!noScan) {
                    avalon.scan(lastContent, [vmodel].concat(vmodels));
                }
            };
            // 动态修改dialog的title
            vm.setTitle = function(title) {
                vm.title = title;
            };
            // 重新渲染dialog
            vm.setModel = function(m) {
                // 这里是为了充分利用vm._ReanderView方法，才提前设置一下element.innerHTML
                if (!!m.$content) {
                    _lastContent = m.$content;
                    lastContent.innerHTML = _lastContent;
                }
                if (!!m.$title) {
                    vmodel.title = m.$title;
                }
                avalon.scan(element, [vmodel].concat(findModel(m)).concat(vmodels));
            };
            // 将零散的模板(dialog header、dialog content、 dialog footer、 dialog wrapper)组合成完整的dialog
            vm._RenderView = function() {
                var innerWrapper = ""; // 保存innerWraper元素节点
                // 用户只能通过data-dialog-width配置width，不可以通过ms-css-width来配置，配置了也无效
                element.setAttribute("ms-css-width", "width");
                lastContent = avalon.parseHTML(_content).firstChild;
                _lastContent = element.innerHTML;
                element.innerHTML = "";
                lastContent.innerHTML = _lastContent;
                innerWrapper = avalon.parseHTML(_innerWrapper).firstChild;
                innerWrapper.innerHTML = _lastHeader;
                innerWrapper.appendChild(lastContent);
                innerWrapper.appendChild(avalon.parseHTML(_lastFooter));
                element.appendChild(innerWrapper);
                if (!maskLayerExist) {
                    document.body.appendChild(maskLayer);
                    maskLayerExist = true;
                }
            }
            vm.$init = function() {
                $element.addClass("ui-dialog");
                element.setAttribute("ms-visible", "toggle");
                vm._RenderView();
                document.body.appendChild(element);
                // 当窗口尺寸发生变化时重新调整dialog的位置，始终使其水平垂直居中
                avalon(window).bind("resize", function() {
                    resetCenter(vmodel, element);
                })
                // 必须重新设置ms-visible属性，因为maskLayer为所有dialog所公用，第一次实例化dialog组件后maskLayer就失去了ms-visible属性
                maskLayer.setAttribute("ms-visible", "toggle");
                if (vmodel.modal) {
                    avalon.scan(maskLayer, [vmodel].concat(vmodels));
                }
                avalon.scan(element, [vmodel].concat(vmodels));
                if(typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            };
            vm.$remove = function() {
                dialogNum--;
                element.innerHTML = "";
                if (!dialogNum) {
                    maskLayer.parentNode.removeChild(maskLayer);
                    maskLayerExist = false;
                }
            }
        });
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        width: 480, // 默认dialog的width
        title: "&nbsp;", // dialog的title
        type: "confirm", // dialog的显示类型，prompt(有返回值) confirm(有两个按钮) alert(有一个按钮)
        onSubmit: avalon.noop, // 点击"确定"按钮时的回调
        onOpen: avalon.noop,
        onCancel: avalon.noop,
        onClose: avalon.noop,
        setTitle: avalon.noop,
        setContent: avalon.noop,
        setModel: avalon.noop,
        showClose: true,
        toggle: false, // 通过此属性的决定dialog的显示或者隐藏状态
        widgetElement: "",
        getTemplate: function(str, options) {
            return str;
        },
        modal: true,
        zIndex: maxZIndex
    }
    // 动态创建dialog
    avalon.dialog = function(config) {
        if (avalon.type(config.id) === 'undefined') {
            config.id = generateID();
        }
        _widget = _widget.replace("MS_OPTION_ID", config.id).replace("MS_OPTION_OPTS", config.options).replace("MS_OPTION_DIALOG_CONTENT", config.content);
        var widget = avalon.parseHTML(_widget).firstChild;
        document.body.appendChild(widget);
        if(!config.options) {
            widget.setAttribute("data-custom", true);
            widget.setAttribute("data-config", JSON.stringify(config));
        }
        var model = findModel(config.model);
        avalon.scan(widget, model);
        return avalon.vmodels[config.id];
    }
    function findModel( m ) {
        var model = m;
        if(model) { // 如果m为字符串参数，说明是要在已存在的vmodels中查找对应id的vmodel
            if(avalon.type(model) === 'string') {
                model = avalon.vmodels[model];
            } 
        } else { // 如果没有传递参数m，则返回空vmodel
            model = avalon.define('dialogVM' + setTimeout("1"), function(vm) {
            });
        }
        if (!model) {
            throw new Error("您查找的"+model+"不存在");
        }
        // 如果传入的是avalon的vmodel格式的参数对象，直接返回，如果是普通的对象，将其转换为avalon的监控对象
        if (avalon.isPlainObject(model) && !model.$id && !model.$accessors) {
            model = avalon.define('dialogVM' + setTimeout("1"), function(vm) {
                avalon.mix(vm, m);
            });
        }
        return [].concat(model);
    }
    // 调整弹窗水平、垂直居中
    function resetCenter(vmodel, target) {
        var bodyHeight = Math.max(body.clientHeight, body.scrollHeight),
            scrollTop = Math.max(document.body.scrollTop, document.documentElement.scrollTop),
            scrollLeft = Math.max(document.body.scrollLeft, document.documentElement.scrollLeft);
        if (vmodel.toggle) {
            maskLayer.style.width = avalon(window).width() + "px";
            maskLayer.style.height = bodyHeight + "px";
            var l = ((avalon(window).width() - target.offsetWidth) / 2) + scrollLeft;
            var t = (avalon(window).height() - target.offsetHeight) / 2 + scrollTop - 10;
            target.style.left = l + "px"
            target.style.top = t + "px"
        }
    }
    // 获取body子元素最大的z-index
    function getMaxZIndex() {
        var children = document.body.children,
            maxIndex = 10, //当body子元素都未设置zIndex时，默认取10
            zIndex;
        for (var i = 0, el; el = children[i++];) {
            if (el.nodeType === 1) {
                if (el === maskLayer) continue;
                zIndex = ~~avalon(el).css("z-index");
                if (zIndex) {
                    maxIndex = Math.max(maxIndex, zIndex);
                }
            }
        }
        return maxIndex + 1;
    }
    // IE6下创建iframe遮住不能被遮罩层遮住的select
    function createIframe() {
        var iframe = document.createElement('<iframe src="javascript:\'\'" style="position:absolute;top:0;left:0;bottom:0;margin:0;padding:0;right:0;zoom:1;width:'+maskLayer.style.width+';height:'+maskLayer.style.height+';z-index:'+(maskLayer.style.zIndex-1)+';"></iframe>');
        document.body.appendChild(iframe);
        return iframe;
    }
    // 生成唯一id
    function generateID() {
        return "avalon" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    return avalon;
});
//弹出层的各种特效 http://tympanus.net/Development/ModalWindowEffects/