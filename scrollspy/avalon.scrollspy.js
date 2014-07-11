/**
  * @description scrollspy组件，可通过监听元素原生的scroll事件或者结合scrollbar组件使用时，监听其scroll，根据scrollTop，scrollLeft计算判定配置指定的panel list应该切换到什么位置
  *
  */
define(["avalon", "text!./avalon.scrollspy.html", "css!./avalon.scrollspy.css"], function(avalon, template) {
    function getById(id) {
        return document.getElementById(id)
    }
    // 站位用来生成文档用注释
    // widget.defaults = {
    var defaults = {
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        onChange: avalon.noop,//@optMethod onChange(index, ele, widgetElement) 滚动到应该显示那个tab的index，以及这个tab的li元素，以及绑定scrollspy的元素
        axis: "y",//@param 滚动条滚动的方向，默认是竖直方向y，取值为x的时候，表示水平方向
        targetListGetter: function(spytarget) {
            var spytarget = getById(spytarget),
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
        }, //@optMethod targetListGetter() 获取tab list函数，元素是数字或者元素id索引，默认是元素id索引
        panelListGetter: avalon.noop, //@optMethod panelListGetter() 获取panel list函数，返回一个数组，元素是dom，或者返回空，默认返回空
        panelGetter: function(id, index, list, options) {
            return list != void 0 && list[index]  || id != void 0 && getById(id)
        }, //@optMethod panelGetter(pannelId, pannelIndex, panelsList, options) 获取panel函数，默认返回 panelsList[pannelIndex] || Id = pannelId
        spytarget: void 0,
        _lock: false,
        scrollTo: avalon.noop,
        $author: "skipper@123"
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

        // do something while scrolling
        function onScroll(x, y, scroller) {
            // 通过接口算出tab list
            var list = options.targetListGetter(options.spytarget, options),
            // 通过接口算出pannel list
                panelList = options.panelListGetter(options.spytarget, options)
                scrollerOffset = scroller.offset()
            for(var i = 0; list[i++];) {
                var id = list[i - 1],
                    ele = options.panelGetter(id, i - 1, panelList, options),
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
            if(i > list.length) i = 0
            options.onChange && options.onChange(i - 1, list[i - 1], element)
        }
        var initTop = element.scrollTop,
            initLeft = element.scrollLeft,
            scroller = $element,
            myScroll
        // 原生滚动事件
        avalon.bind(element, "scroll", function(e) {
            if(options._lock) return
            onScroll(element.scrollLeft, element.scrollTop, $element)
        })
        // if scrollbar is used
        if(msData && msData["ms-widget"] == "scrollbar") {
            myScroll = avalon.vmodels[msData["ms-widget-id"]]
            initTop = myScroll.scrollTop
            initLeft = myScroll.scrollLeft
            scroller = myScroll.getScroller()
            myScroll.$watch("scrollLeft", function(n, o) {
                if(options._lock) return
                onScroll(n, void 0, scroller)
            })
            myScroll.$watch("scrollTop", function(n, o) {
                if(options._lock) return
                onScroll(void 0, n, scroller)
            })
        }
        //@method scrollTo(id, index) 滚动到panel位置，滚动到 panelList[index] || dom.id = id的元素的地方
        options.scrollTo = function(id, index) {
            var panelList =  options.panelListGetter(options.spytarget, options),
                ele = options.panelGetter(id, index, panelList, options),
                $ele = avalon(ele)
            if(!ele) return
            options._lock = true
            var scrollerOffset = scroller.offset(),
                offset = $ele.offset(),
                dir = options.axis == "x" ? "Left" : "Top"
            if(myScroll) {
                if(dir == "Left") {
                    myScroll.scrollTo(offset[dir.toLowerCase()] - scrollerOffset[dir.toLowerCase()], void 0)
                } else {
                    myScroll.scrollTo(void 0, myScroll["scroll" + dir] + offset[dir.toLowerCase()] - scrollerOffset[dir.toLowerCase()])
                }
                // myScroll.update()
            } else {
                element["scroll" + dir] += offset[dir.toLowerCase()] - scrollerOffset[dir.toLowerCase()]
            }
            options._lock = false
        }
        // callback after inited
        if(typeof options.onInit === "function" ) {
            onScroll(initTop, initLeft, scroller)
            //vmodels是不包括vmodel的 
            options.onInit.call(element, vmodel, options, vmodels)
        }
    }
})