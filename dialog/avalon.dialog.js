define(["avalon", "text!./avalon.dialog.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],
            cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
            styleEl = document.getElementById("avalonStyle"),
            template = arr[0],
            widgetArr = template.split("MS_OPTION_WIDGET"),
            _layout = widgetArr[0], // 遮罩层html(string)
            supportTransform = false, // 支持transform的浏览器使用transform实现水平垂直居中，不支持的浏览器使用position:absolute来实现
            layoutExist = false, // 页面不存在遮罩层就添加layout节点，存在则忽略
            layout = avalon.parseHTML(_layout).firstChild, // 遮罩层节点(dom node)
            _widget = widgetArr[1].split("MS_OPTION_INNERWRAPPER")[0], // 动态添加dialog时,添加组件的html(string)
            dialogShows = [], // 存在层上层时由此数组判断层的个数，据此做相应的处理
            dialogNum = 0; // 保存页面dialog的数量，当dialogNum为0时，清除layout
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var body = (document.compatMode && document.compatMode.toLowerCase() == "css1compat") ? document.documentElement : document.body;
    var widget = avalon.ui.dialog = function(element, data, vmodels) {
        dialogNum++;
        var options = data.dialogOptions;
        options.type = options.type.toLowerCase()
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
            vm.width = vm.width || options.width;
            vm.widgetElement = element;
            // 如果显示模式为alert或者配置了showClose为false，不显示关闭按钮
            vm.showClose = vm.type == "alert" ? false : options.showClose;
            // 点击“取消”或者dialog的关闭按钮后的回调方法
            vm.cancel = options.cancel;
            // 点击“确定”按钮后的回调方法
            vm.submit = options.submit;
            /**
             * desc: 显示dialogmask
             * @param event: 当参数个数为2时，event为要显示的dialog的id，参数个数为1时event为事件对象
             * @param scope: 当存在层中层时，才可能有2个参数，此时scope是用户定义的controller的id 
             **/
            vm.show = function(event, scope) {
                document.body.style.overflow = "hidden";
                var len = 0,
                        id = "";
                avalon.Array.ensure(dialogShows, vm);
                len = dialogShows.length;
                // 通过zIndex的提升来调整遮罩层，保证层上层存在时遮罩层始终在顶层dialog下面(顶层dialog zIndex-1)但是在其他dialog上面
                layout.style.zIndex = 2 * len - 1;
                element.style.zIndex = 2 * len;
                /* 如果arguments.length为2说明是层中层触发的，因为avalon会根据就近原则获取属性，所以需要特别处理一下 */
                if (arguments.length == 2) {
                    id = event;
                    scope = findModel(scope)[0];
                    scope.show(id);
                    return false;
                }
                // 不管是单个层还是层上层最终都会执行下面的语句，下面语句也才是show回调真正要做的事情
                event && event.preventDefault && event.preventDefault();
                vmodel.toggle = true;
                resetCenter(vmodel, element);
            }
            // 隐藏dialog
            vm.close = function(event) {
                var len = 0;
                avalon.Array.remove(dialogShows, vm);
                len = dialogShows.length;
                event && event.preventDefault();
                vmodel.toggle = false;
                /* 处理层上层的情况，因为layout公用，所以需要其以将要显示的dialog的toggle状态为准 */
                if (dialogShows.length >= 1) {
                    layout.setAttribute("ms-visible", "toggle");
                    avalon.scan(layout, dialogShows[len - 1]);
                } else {
                    document.body.style.overflow = "auto";
                }
                // 重置layout的z-index,当最上层的dialog关闭，通过降低遮罩层的z-index来显示紧邻其下的dialog
                layout.style.zIndex = 2 * len - 1;
            };
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
                // console.log("setModel");

                element.innerHTML = _lastContent;
                vm._RenderView();
              
                avalon.scan(element, [vm].concat(findModel(m)).concat(vmodels));
            };
            // 将零散的模板(dialog header、dialog content、 dialog footer、 dialog wrapper)组合成完整的dialog
            vm._RenderView = function() {
                var innerWrapper = ""; // 保存innerWraper元素节点
                _lastHeader = _lastHeader.replace("MS_OPTION_CANCEL", vm.cancel);
                _lastFooter = _lastFooter.replace("MS_OPTION_CANCEL", vm.cancel).replace("MS_OPTION_SUBMIT", vm.submit);
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
                if (!layoutExist) {
                    document.body.appendChild(layout);
                    layoutExist = true;
                }
            }
            vm.$init = function() {
                $element.addClass("ui-dialog");
                element.setAttribute("ms-visible", "toggle");
                vm._RenderView();
                document.body.appendChild(element);
                //resetCenter(vmodel, element);
                // 当窗口尺寸发生变化时重新调整dialog的位置，始终使其水平垂直居中
                avalon(window).bind("resize", function() {
                    resetCenter(vmodel, element);
                })
                // 必须重新设置ms-visible属性，因为layout为所有dialog所公用，第一次实例化dialog组件后layout就失去了ms-visible属性
                layout.setAttribute("ms-visible", "toggle");
                avalon.scan(layout, [vmodel].concat(vmodels));
                avalon.scan(element, [vmodel].concat(vmodels));
            };
            vm.$remove = function() {
                dialogNum--;
                element.innerHTML = "";
                if (!dialogNum) {
                    layout.parentNode.removeChild(layout);
                    layoutExist = false;
                }
            }
        });
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        title: "&nbsp;", // dialog的title
        type: "confirm", // dialog的显示类型，prompt(有返回值) confirm(有两个按钮) alert(有一个按钮)
        submit: "close", // 点击"确定"按钮时的回调
        cancel: "close", // 点击“取消”或关闭按钮时的回调
        width: 480, // 默认dialog的width
        show: avalon.noop, // 显示dialog的方法
        close: avalon.noop, // 关闭dialog的方法
        setContent: avalon.noop,
        setTitle: avalon.noop,
        setModel: avalon.noop,
        showClose: true,

        toggle: false, // 通过此属性的决定dialog的显示或者隐藏状态
        widgetElement: "",
        getTemplate: function(str, options) {
            return str;
        }
    }
    // 获取对应id的vmodel
    avalon.$ui = function(id) {
        return avalon.vmodels[id];
    }
    // 动态创建dialog
    avalon.dialog = function(opts) {
        if (avalon.type(opts.id) === 'undefined') {
            opts.id = generateID();
        }
        _widget = _widget.replace("MS_OPTION_ID", opts.id).replace("MS_OPTION_TITLE", opts.title).replace("MS_OPTION_SUBMIT", opts.confirm).replace("MS_OPTION_CANCEL", opts.cancel).replace("MS_OPTION_TYPE", opts.type).replace("MS_OPTION_WIDTH", opts.width ? opts.width : 480).replace("MS_OPTION_DIALOG_CONTENT", opts.content);
        var widget = avalon.parseHTML(_widget).firstChild;
        document.body.appendChild(widget);
        var model = findModel(opts.model);
        avalon.scan(widget, model);
        return avalon.$ui(opts.id);
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
                model = [avalon.$ui(model)];
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
            layout.style.width = avalon(window).width() + "px";
            layout.style.height = bodyHeight + "px";
            var l = ((avalon(window).width() - target.offsetWidth) / 2) + scrollLeft;
            var t = ((avalon(window).height() - target.offsetHeight) / 2) + scrollTop;
            target.style.left = l + "px"
            target.style.top = t + "px"
        }
    }
    return avalon;





});