/**
  * scrollspy组件，
  *
  */
define(["avalon", "text!./avalon.scrollspy.html", "css!./avalon.scrollspy.css"], function(avalon, template) {
    // 站位用来生成文档用注释
    // widget.defaults = {
    var defaults = {
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        onChange: avalon.noop,//@optMethod onChange(index, ele, widgetElement) 滚动到应该显示那个tab的index，以及这个tab的li元素，以及绑定scrollspy的元素
        axis: "y",//@param 滚动条滚动的方向，默认是竖直方向y，取值为x的时候，表示水平方向
        spytarget: void 0,
        $author: "skipper@123"
    }
    function getById(id) {
        return document.getElementById(id)
    }
    avalon.bindingHandlers.scrollspy = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "scrollspy"]
        var ID = args[0].trim(), opts = args[1], vmodel, vmOptions
        if (ID && ID != "$") {
            vmodel = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!vmodel) {
                return
            }
        }
        data.element.removeAttribute("ms-scrollspy")
        if (!vmodel) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            vmodel = vmodels.length ? vmodels[0] : null
        }
        var fnObj = vmodel || {}
        if (vmodel && typeof vmodel[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = vmodel[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var element = data.element,
            options = avalon.mix({}, defaults, vmOptions || {}, data[opts] || {}, avalon.getWidgetData(element, "scrollspy")),
            msData = element.msData,
            $element = avalon(element)

        function getAllTargets() {
            var spytarget = getById(options.spytarget),
            u = spytarget ? spytarget.getElementsByTagName("li") : false,
                arr = []
            avalon.each(u, function(i, item) {
                var a = item.getElementsByTagName("a")[0],
                    href = a.getAttribute("href"), id
                if(id = href.match(/^#[\S]+/g)) {
                    arr.push(id[0].substring(1))
                }
            })
            return arr
        }
        // do something while scrolling
        function onScroll(x, y, scroller) {
            var list = getAllTargets(),
                scrollerOffset = scroller.offset()
            for(var i = 0; list[i++];) {
                var id = list[i - 1],
                    ele = getById(id),
                    $ele = avalon(ele),
                    offset = $ele.offset(),
                    height = $ele.innerHeight(),
                    width = $ele.innerWidth()
                if(options.axis == "x") {
                    if(offset.left <= scrollerOffset.left && offset.left + width >= scrollerOffset.left) {
                        break
                    }
                } else {
                    if(offset.top <= scrollerOffset.top && offset.top + height >= scrollerOffset.top) {
                        break
                    }
                }
            }
            options.onChange && options.onChange(i - 1, list[i - 1], element)
        }
        var initTop = element.scrollTop,
            initLeft = element.scrollLeft,
            scroller = $element
        // 原生滚动事件
        avalon.bind(element, "scroll", function(e) {
            onScroll(element.scrollLeft, element.scrollTop, $element)
        })
        // if scrollbar is used
        if(msData && msData["ms-widget"] == "scrollbar") {
            var myScroll = avalon.vmodels[msData["ms-widget-id"]]
            initTop = myScroll.scrollTop
            initLeft = myScroll.scrollLeft
            scroller = myScroll.getScroller()
            myScroll.$watch("scrollLeft", function(n, o) {
                onScroll(n, void 0, scroller)
            })
            myScroll.$watch("scrollTop", function(n, o) {
                onScroll(void 0, n, scroller)
            })
        }
        // callback after inited
        if(typeof options.onInit === "function" ) {
            onScroll(initTop, initLeft, scroller)
            //vmodels是不包括vmodel的 
            options.onInit.call(element, vmodel, options, vmodels)
        }
    }
})