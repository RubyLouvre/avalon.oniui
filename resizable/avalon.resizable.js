define(["../draggable/avalon.draggable"], function(avalon) {

    var defaults = {
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
        var dir = '';
        var offset = target.offset();
        var width = target.outerWidth();
        var height = target.outerHeight();
        var edge = data.edge;
        if (e.pageY > offset.top && e.pageY < offset.top + edge) {
            dir += 'n';
        } else if (e.pageY < offset.top + height && e.pageY > offset.top + height - edge) {
            dir += 's';
        }
        if (e.pageX > offset.left && e.pageX < offset.left + edge) {
            dir += 'w';
        } else if (e.pageX < offset.left + width && e.pageX > offset.left + width - edge) {
            dir += 'e';
        }
        for (var i = 0, handle; handle = data.handles[i++]; ) {
            if (handle == 'all' || handle == dir) {
                return dir;
            }
        }
        return '';
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
        var b = data.b || {
            minWidth: data.minWidth,
            maxWidth: data.maxWidth,
            minHeight: data.minHeight,
            maxHeight: data.maxHeight
        }
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

        if (data.dir.indexOf("e") != -1) {
            var width = data.startWidth + event.pageX - data.startX;
            width = Math.min(Math.max(width, b.minWidth), b.maxWidth);
            data.width = width;
            if (aspest) {
                data.height = width / data.aspectRatio;
            }
        }
        if (data.dir.indexOf("s") != -1) {
            var height = data.startHeight + event.pageY - data.startY;
            height = Math.min(Math.max(height, b.minHeight), b.maxHeight);
            data.height = height;
            if (aspest) {
                data.width = height * data.aspectRatio;
            }
        }
        if (data.dir.indexOf("w") != -1) {
            data.width = data.startWidth - event.pageX + data.startX;
            if (data.width >= b.minWidth && data.width <= b.maxWidth) {
                data.left = data.startLeft + event.pageX - data.startX;
                if (aspest) {
                    data.top = data.startTop + (event.pageX - data.startX) / data.aspectRatio;
                }
            }
        }
        if (data.dir.indexOf("n") != -1) {
            data.height = data.startHeight - event.pageY + data.startY;
            if (data.height >= b.minHeight && data.height <= b.maxHeight) {
                data.top = data.startTop + event.pageY - data.startY;
                if (aspest) {
                    data.left = data.startLeft + (event.pageY - data.startY) * data.aspectRatio;
                }
            }
        }
        target.css({
            left: data.left,
            top: data.top,
            width: data.width,
            height: data.height
        });
    }
    var draggable = avalon.bindingHandlers.draggable;
    avalon.bindingHandlers.resizable = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "resizable"]
        var ID = args[0].trim(), opts = args[1], model, vmOptions
        if (ID && ID != "$") {
            model = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!model) {
                data.remove = false
                return
            }
        }
        if (!model) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            model = vmodels.length ? vmodels[0] : null
        }
        var fnObj = model || {}
        if (opts && model && typeof model[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var element = data.element
        var options = avalon.mix({}, defaults, vmOptions || {}, avalon.getWidgetData(element, "resizable"));
        //修正drag,stop为函数
        "stop,start,resize".replace(avalon.rword, function(name) {
            var method = options[name]
            if (typeof method === "string") {
                if (typeof fnObj[method] === "function") {
                    options[name] = fnObj[method]
                } else {
                    options[name] = avalon.noop
                }
            }
        })
        console.log(options)
        
        



    }

    return avalon
})