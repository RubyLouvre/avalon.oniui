define(["avalon", "text!./avalon.dialog.html"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""];
    var cssText = arr[1].replace(/<\/?style>/g, "");
    var styleEl = document.getElementById("avalonStyle");
    var template = arr[0];
    var widgetArr = template.split("MS_OPTION_WIDGET");
    var _layout = widgetArr[0];
    var supportTransform = false;
    var layoutExist = false;
    var layout = avalon.parseHTML(_layout).firstChild;
    var _widget =  widgetArr[1].split("MS_OPTION_INNERWRAPPER")[0];
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    //判定是否支持css3 transform
    var transforms = {//IE9+ firefox3.5+ chrome4+ safari3.1+ opera10.5+
        "transform": "transform",
        "-moz-transform": "mozTransform",
        "-webkit-transform": "webkitTransform",
        "-ms-transform": "msTransform"
    }

    for (var i in transforms) {
        if (transforms[i] in layout.style) {
            supportTransform = true;
        }
    }

    var widget = avalon.ui.dialog = function(element, data, vmodels) {
        var options = data.dialogOptions;
        options.template = options.getTemplate(template, options);

        var _footerArr = options.template.split("MS_OPTION_FOOTER"),
            _contentArr = _footerArr[0].split("MS_OPTION_CONTENT"),
            _headerArr = _contentArr[0].split("MS_OPTION_HEADER"),
            _innerWraperArr = _headerArr[0].split("MS_OPTION_INNERWRAPPER"),
            _content = _contentArr[1], // content html
            _lastHeader = _headerArr[1], // header html
            _lastFooter = _footerArr[1], // footer html
            _innerWrapper = _innerWraperArr[1], // inner html
            _lastContent = "",
            lastContent = "",
            $element = avalon(element);
        
        var vmodel = avalon.define(data.dialogId, function(vm) {
            avalon.mix(vm, options);
            vm.width = vm.width || options.width;
            vm.widgetElement = element;
            vm.$skipArray = ["widgetElement", "template"];
            vm.showClose = ( options.type && options.type.toUpperCase() === "ALERT") ? false : options.showClose;
            vm.typeAlert = options.type && options.type.toUpperCase() === "ALERT";

            vm.cancel = options.cancel || "close";
            vm.submit = options.submit || "close";
            vm.show = function(event) {
                console.log(event);
                event && event.preventDefault();
                vmodel.toggle = true;
                resetCenter(vmodel, element);
            }
            vm.close = function(event) {
                event && event.preventDefault();
                vmodel.toggle = false;
            };
            vm.setContent = function(content, noScan) {
                _lastContent = content;
                avalon.clearHTML( _content );
                lastContent.innerHTML = _lastContent;
                if(!noScan) {
                    avalon.scan( lastContent, [vm].concat(vmodels) );
                }
            };
            vm.setTitle = function(title) {
                vm.title = title;
            };
            vm.setModel = function(m) {
                vm._modelReset = true;
                element.innerHTML = _lastContent;
                vm._RenderView();
                avalon.scan( element, [vm].concat(findModel(m)).concat(vmodels) );
            };
            vm._RenderView = function() {
                var innerWrapper = "";
                _lastHeader = _lastHeader.replace("MS_OPTION_CANCEL", vm.cancel);
                _lastFooter = _lastFooter.replace("MS_OPTION_CANCEL", vm.cancel).replace("MS_OPTION_SUBMIT",vm.submit);

                element.setAttribute("ms-css-width", "width");
                lastContent = avalon.parseHTML(_content).firstChild;
                _lastContent = element.innerHTML;
                element.innerHTML = "";
                lastContent.innerHTML = _lastContent;
                innerWrapper= avalon.parseHTML(_innerWrapper).firstChild;
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
                resetCenter(vmodel, element);
                avalon(window).bind("resize", function() {
                    resetCenter(vmodel, element);
                })
                // 必须重新设置ms-visible属性，因为layout为所有dialog所公用，第一次实例化dialog组件后layout就失去了ms-visible属性
                layout.setAttribute("ms-visible", "toggle");
                avalon.scan(layout, [vmodel].concat(vmodels));
                avalon.scan(element, [vmodel].concat(vmodels));
            };
            vm.$remove = function() {
                element.innerHTML = "";
            }
        });
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        title: "",
        type: "",
        submit: "",
        cancel: "",
        width: 480,
        show: function() {},
        close: function() {},
        setContent: function() {},
        setTitle: function() {},
        setModel: function() {},
        showClose: true,
        typeAlert: false ,
        toggle: false,
        widgetElement: "",
        getTemplate: function(str, options){
            return str
        },
        _modelReset: false
    }
    avalon.$ui = function(id) {
        return avalon.vmodels[id];
    }
    avalon.dialog = function(opts) {
        if(avalon.type(opts.id) === 'undefined') {
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
    function findModel( m ) {
        var model = m;
        if(model) {
            if(avalon.type(model) === 'string') {
                model = [avalon.$ui(model)];
            } else {
                model = [].concat(model);
            }
        } else {
            model = avalon.define('dialogVM' + generateID(), function(vm) {});
        }
        return model;
    }
    function resetCenter(vmodel, target) {
        if (vmodel.toggle) {
            var parentNode = document.body;

            if (supportTransform) {
                avalon(target).addClass("ui-dialog-vertical-center-transform");
            } else {
                var l = (avalon(window).width() - target.offsetWidth) / 2
                var t = (avalon(window).height() - target.offsetHeight) / 2
                target.style.left = l + "px"
                target.style.top = t + "px"
            } 
            // if (vmodel.modal) {
            //     parentNode.insertBefore(overlay, target)
            //     overlay.style.display = "block"
            //     avalon.Array.ensure(overlayInstances, vmodel)
            // }
        }
    }
    return avalon;
});