define(["avalon.getModel", "text!./avalon.dialog.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        styleEl = document.getElementById("avalonStyle"),
        template = arr[0],
        widgetArr = template.split("MS_OPTION_WIDGET"),
        _maskLayer = widgetArr[0], // 遮罩层html(string)
        supportTransform = false, // 支持transform的浏览器使用transform实现水平垂直居中，不支持的浏览器使用position:absolute来实现
        maskLayerExist = false, // 页面不存在遮罩层就添加maskLayer节点，存在则忽略
        maskLayer = avalon.parseHTML(_maskLayer).firstChild, // 遮罩层节点(dom node)
        _widget = widgetArr[1].split("MS_OPTION_INNERWRAPPER")[0], // 动态添加dialog时,添加组件的html(string)
        dialogShows = [], // 存在层上层时由此数组判断层的个数，据此做相应的处理
        dialogNum = 0, // 保存页面dialog的数量，当dialogNum为0时，清除maskLayer
        maxZIndex = getMaxZIndex(); // 保存body直接子元素中最大的z-index值， 保证dialog在最上层显示
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var body = (document.compatMode && document.compatMode.toLowerCase() == "css1compat") ? document.documentElement : document.body;
    var widget = avalon.ui.dialog = function(element, data, vmodels) {
        dialogNum++;
        var options = data.dialogOptions;
        var len = vmodels.length;
        // 当存在嵌套dialog时，vmodels的length>1(外层dialog controller 和用户定义的controller，显然用户的配置存在于用户定义的controller，也就是vmodels的最后一个数组元素)，而用户为内嵌dialog设置options无法自动应用，因此需要进行一下转换处理，务必确保用户外部定义配置项不可监控
        if (len > 1) {
            var dialogOpts = vmodels[len-1][data.value.split(',')[2]];
            avalon.mix(options, dialogOpts);
        }
        options.type = options.type.toLowerCase();
        options.template = options.getTemplate(template, options);
        var _footerArr = options.template.split("MS_OPTION_FOOTER"),
            _contentArr = _footerArr[0].split("MS_OPTION_CONTENT"),
            _headerArr = _contentArr[0].split("MS_OPTION_HEADER"),
            _innerWraperArr = _headerArr[0].split("MS_OPTION_INNERWRAPPER"),
            _content = _contentArr[1], // content wrapper html
            _lastHeader = _headerArr[1], // header html
            _lastFooter = _footerArr[1], // footer html
            _innerWrapper = _innerWraperArr[1], // inner wrapper html
            _lastContent = "", // dialog content html
            lastContent = "", // dialog content node
            $element = avalon(element)

        var vmodel = avalon.define(data.dialogId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "template"];
            vm.width = options.width;
            vm.widgetElement = element;
            // 如果显示模式为alert或者配置了showClose为false，不显示关闭按钮
            vm.showClose = vm.type == "alert" ? false : options.showClose;
            // console.log("关于showClose 的配置问题");
            // console.log(vm.showClose);
            // console.log(vm);
            vm.$submit = function(e) {
                if (typeof options.onSubmit != "function") {
                    throw new Error("onSubmit必须是一个回调方法");
                }
                if(options.onSubmit.call(e.target, e, vmodel) !== false){
                   vmodel.$close()
                }
            }

            /**
             * desc: 显示dialogmask
             * @param event: 当参数个数为2时，event为要显示的dialog的id，参数个数为1时event为事件对象
             * @param scope: 当存在层中层时，才可能有2个参数，此时scope是用户定义的controller的id 
             **/
            vm.$show = function() {//open
                document.body.style.overflow = "hidden";
                var len = 0;
                avalon.Array.ensure(dialogShows, vm);
                len = dialogShows.length;
                // 通过zIndex的提升来调整遮罩层，保证层上层存在时遮罩层始终在顶层dialog下面(顶层dialog zIndex-1)但是在其他dialog上面
                maskLayer.style.zIndex = 2 * len - 1 + maxZIndex;
                element.style.zIndex = 2 * len + maxZIndex;
                resetCenter(vmodel, element);
                options.onOpen.call(e.target, e, vmodel)
            }
            // 隐藏dialog
            vm.$close = function() {//close
                var len = 0;
                avalon.Array.remove(dialogShows, vm);
                len = dialogShows.length;
                vmodel.toggle = false;
                /* 处理层上层的情况，因为maskLayer公用，所以需要其以将要显示的dialog的toggle状态为准 */
                if (len >= 1 && dialogShows[len-1].modal) {
                    maskLayer.setAttribute("ms-visible", "toggle");
                    avalon.scan(maskLayer, dialogShows[len - 1]);
                } else {
                    document.body.style.overflow = "auto";
                }
                // 重置maskLayer的z-index,当最上层的dialog关闭，通过降低遮罩层的z-index来显示紧邻其下的dialog
                maskLayer.style.zIndex = 2 * len - 1 +maxZIndex;
                options.onClose.call(e.target, e, vmodel)
            };
            vm.$watch("toggle", function(val) {
                if (val) {
                    vmodel.$show();
                }
            })
            /**
             * desc: 可以动态改变dialog的内容
             * @param content: 要替换的content，可以是已经渲染ok的view也可以是未解析渲染的模板
             * @param noScan: 当content是模板时noScan设为false或者不设置，组件会自动解析渲染模板，如果是已经渲染ok的，将noScan设为true，组件将不再进行解析操作
             */
            vm.setContent = function(content, noScan) {
                _lastContent = content;
                avalon.clearHTML(_content);
                lastContent.innerHTML = _lastContent;
                if (!noScan) {
                    avalon.scan(lastContent, [vm].concat(vmodels));
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
                    vmodel.setContent(m.$content, m.$noScan);
                }
                if (!!m.$title) {
                    vmodel.setTitle(m.$title);
                }
                element.innerHTML = _lastContent;
                vm._RenderView();
                avalon.scan(element, [vm].concat(findModel(m)).concat(vmodels));
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
        title: "&nbsp;", // dialog的title
        type: "confirm", // dialog的显示类型，prompt(有返回值) confirm(有两个按钮) alert(有一个按钮)
        onSubmit: avalon.noop, // 点击"确定"按钮时的回调
        onOpen: avalon.noop,
        onClose: avalon.noop,
        width: 480, // 默认dialog的width
        setContent: avalon.noop,
        setTitle: avalon.noop,
        setModel: avalon.noop,
        showClose: true,
        toggle: false, // 通过此属性的决定dialog的显示或者隐藏状态
        widgetElement: "",
        getTemplate: function(str, options) {
            return str;
        },
        modal: true
    }
    // 动态创建dialog
    avalon.dialog = function(config) {
        if (avalon.type(config.id) === 'undefined') {
            config.id = generateID();
        }
        _widget = _widget.replace("MS_OPTION_ID", config.id).replace("MS_OPTION_OPTS", config.options).replace("MS_OPTION_DIALOG_CONTENT", config.content);
        var widget = avalon.parseHTML(_widget).firstChild;
        document.body.appendChild(widget);
        var model = findModel(config.model);
        avalon.scan(widget, model);
        return avalon.vmodels[config.id];
    }
    function generateID() {
        //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        return "avalonDialog" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    function findModel(m) {
        // console.log(m);
        var model = m;
        if (model) {
            if (avalon.type(model) === 'string') {
                model = [avalon.vmodels[model]];
            } else {
                model = [].concat(model);
            }
        } else {
            model = avalon.define('dialogVM' + generateID(), function(vm) {
            });
        }
        return model;
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
            var t = ((avalon(window).height() - target.offsetHeight) / 2) + scrollTop;
            target.style.left = l + "px"
            target.style.top = t + "px"
        }
    }
    function getMaxZIndex() {
        var bodyChildren = document.body.children;
        var maxIndex = 0, zIndex;
        for(var i=0, len=bodyChildren.length; i<len; i++) {
            zIndex = avalon(bodyChildren[i]).css("z-index");
            zIndex = !!zIndex && parseInt(zIndex);
            if (zIndex) {
                maxIndex = Math.max(maxIndex, zIndex);
            }
        }
        return maxIndex;
    }
    return avalon;
});
