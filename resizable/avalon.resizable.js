define(["../draggable/avalon.draggable"], function(avalon) {


    var draggable = avalon.bindingHandlers.draggable;
    var resizable = avalon.bindingHandlers.resizable = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "resizable"]
        var ID = args[0].trim(), opts = args[1], model, vmOptions
        if (ID && ID != "$") {
            model = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!model) {
                return
            }
        }

        if (!model) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            model = vmodels.length ? vmodels[0] : null
        }
        var fnObj = model || {}
        if (model && typeof model[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var element = data.element
        element.removeAttribute("ms-resizable")
        var options = avalon.mix({}, resizable.defaults, vmOptions || {}, avalon.getWidgetData(element, "resizable"));
        //修正drag,stop为函数
        "stop,start,resize,drag".replace(avalon.rword, function(name) {
            var method = options[name]
            if (typeof method === "string") {
                if (typeof fnObj[method] === "function") {
                    options[name] = fnObj[method]
                } else {
                    options[name] = avalon.noop
                }
            }
        })
        options.handles = options.handles.match(avalon.rword) || ["all"];
        options._aspectRatio = typeof options.aspectRatio === "number"

        var target = avalon(element)
        target.bind("mousemove", function(e) {
            if (options.started)
                return;

            var dir = getDirection(e, target, options)
            options._cursor = target.css("cursor"); //保存原来的光标样式
            if (dir === "") {
                target.css("cursor", "default");
            } else {
                target.css("cursor", dir + "-resize");
            }
        })

        target.bind("mouseleave", function(e) {
            target.css("cursor", options._cursor); //还原光标样式
            delete options._cursor
        })
        var _drag = options.drag || avalon.noop
        var body = document.body
        //在dragstart回调中,我们通过draggable已经设置了
        //data.startPageX = event.pageX;    data.startPageY = event.pageY;
        //data.originalX = offset.left; data.originalY = offset.top;
        options.beforeStart = function(event, data) {
            var target = data.$element;
            data.dragX = data.dragY = false
            var dir = getDirection(event, target, data);
            if (dir === "")
                return;
            avalon.mix(data, {
                dir: dir,
                startResizeLeft: getCssValue(target, "left"),
                startResizeTop: getCssValue(target, "top"),
                startResizeWidth: target.width(),
                startResizeHeight: target.height()
            })
            //开始缩放时的位置大小
            "startResizeLeft,startResizeTop,startResizeWidth,startResizeHeight".replace(avalon.rword, function(word) {
                data[word.replace("startR", "r")] = data[word];
            })
            //等比例缩放
            data.aspectRatio = data._aspectRatio ? data.aspectRatio : ((data.startResizeWidth / data.startResizeHeight) || 1);
            event.type = "resizestart";
            //data.start.call(target[0], event, data); //触发用户回调
            avalon(body).css('cursor', dir + '-resize');
        }
        options.drag = function(event, data) {
            if (data.dir) {
                refresh(event, data.$element, data);
                event.type = "resize";
                data.resize.call(data.element, event, data); //触发用户回调
            }else if ("_cursor" in options) {
                _drag.call(data.element, event, data); //触发用户回调
            }
        }
        options.beforeStop = function(event, data) {
            if (data.dir) {
                var target = data.$element;
                refresh(event, target, data);
                delete data.dir;
                event.type = "resizeend";
                //   data.stop.call(target[0], event, data); //触发用户回调
                avalon(body).css("cursor", "default");
            }
        }
        data.value = ""
        data.draggable = options
        draggable(data, vmodels)

    }
    resizable.defaults = {
        handles: "n,e,s,w,ne,se,sw,nw",
        maxHeight: 10000,
        maxWidth: 10000,
        minHeight: 10,
        minWidth: 10,
        cursor: false,
        edge: 5,
        start: avalon.noop,
        resize: avalon.noop,
        stop: avalon.noop
    }
    /**
     * 用于修正拖动元素靠边边缘的区域的鼠标样式
     * @param {Event} e
     * @param {Mass} target
     * @param {Object} data 经过处理的配置对象
     */

    function getDirection(e, target, data) {
        var dir = "";
        var offset = target.offset();
        var width = target[0].offsetWidth;
        var height = target[0].offsetHeight;
        var edge = data.edge;
        if (e.pageY > offset.top && e.pageY < offset.top + edge) {
            dir += "n";
        } else if (e.pageY < offset.top + height && e.pageY > offset.top + height - edge) {
            dir += "s";
        }
        if (e.pageX > offset.left && e.pageX < offset.left + edge) {
            dir += "w";
        } else if (e.pageX < offset.left + width && e.pageX > offset.left + width - edge) {
            dir += "e";
        }
        for (var i = 0, handle; handle = data.handles[i++]; ) {
            if (handle === "all" || handle === dir) {
                return dir;
            }
        }
        return "";
    }

    function getCssValue(el, css) { //对样式值进行处理,强制转数值
        var val = parseInt(el.css(css), 10);
        if (isNaN(val)) {
            return 0;
        } else {
            return val;
        }
    }

    function refresh(event, target, data) { //刷新缩放元素
        var b = data
        if (data._aspectRatio || event.shiftKey) {
            var aspest = true,
                    pMinWidth = b.minHeight * data.aspectRatio,
                    pMinHeight = b.minWidth / data.aspectRatio,
                    pMaxWidth = b.maxHeight * data.aspectRatio,
                    pMaxHeight = b.maxWidth / data.aspectRatio;

            if (pMinWidth > b.minWidth) {
                b.minWidth = pMinWidth;
            }
            if (pMinHeight > b.minHeight) {
                b.minHeight = pMinHeight;
            }
            if (pMaxWidth < b.maxWidth) {
                b.maxWidth = pMaxWidth;
            }
            if (pMaxHeight < b.maxHeight) {
                b.maxHeight = pMaxHeight;
            }
        }


        if (data.dir.indexOf("e") !== -1) {
            var width = data.startResizeWidth + event.pageX - data.startPageX;
            width = Math.min(Math.max(width, b.minWidth), b.maxWidth);
            data.resizeWidth = width;
            if (aspest) {
                data.resizeHeight = data.startResizeHeight + (event.pageX - data.startPageX) / data.aspectRatio;
            }
        }
        if (data.dir.indexOf("s") !== -1) {
            var height = data.startResizeHeight + event.pageY - data.startPageY;
            height = Math.min(Math.max(height, b.minHeight), b.maxHeight);
            data.resizeHeight = height;
            if (aspest) {
                data.resizeWidth = data.startResizeWidth + (event.pageY - data.startPageY) * data.aspectRatio;
            }
        }
        if (data.dir.indexOf("w") !== -1) {
            data.resizeWidth = data.startResizeWidth - event.pageX + data.startPageX;
            if (data.resizeWidth >= b.minWidth && data.resizeWidth <= b.maxWidth) {
                data.resizeLeft = data.startResizeLeft + event.pageX - data.startPageX;
                if (aspest) {
                    data.resizeHeight = data.startResizeHeight - (event.pageX - data.startPageX) / data.aspectRatio;

                    if(data.dir.indexOf("s") === -1) {
                        data.resizeTop = data.startResizeTop + (event.pageX - data.startPageX) / data.aspectRatio;
                    }
                }
            }
        }
        if (data.dir.indexOf("n") !== -1) {
            data.resizeHeight = data.startResizeHeight - event.pageY + data.startPageY;
            if (data.resizeHeight >= b.minHeight && data.resizeHeight <= b.maxHeight) {
                data.resizeTop = data.startResizeTop + event.pageY - data.startPageY;
                if (aspest) {
                    data.resizeWidth = data.startResizeWidth - (event.pageY - data.startPageY) * data.aspectRatio;

                    if(data.dir.indexOf("e") === -1){
                        data.resizeLeft = data.startResizeLeft + (event.pageY - data.startPageY) * data.aspectRatio;
                    }
                }
            }
        }

        var obj = {
            left: data.resizeLeft,
            top: data.resizeTop,
            width: data.resizeWidth,
            height: data.resizeHeight
        }
        for (var i in obj) {
            target.css(i, obj[i])
        }
    }
    return avalon
})