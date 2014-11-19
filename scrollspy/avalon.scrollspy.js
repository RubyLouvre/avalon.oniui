/**
 * @cnName scrollspy组件
 * @enName scrollspy
 * @introduce
 *  <p> 可通过监听元素原生的scroll事件或者结合scrollbar组件使用时，监听其scroll，根据scrollTop，scrollLeft计算判定配置指定的panel list应该切换到什么位置，绑定方式是ms-scrollspy=""，这样可以跟其他组件绑定在一个元素上
</p>
 */
define(["avalon", "text!./avalon.scrollspy.html", "css!./avalon.scrollspy.css"], function(avalon, template) {
    function getById(id) {
        return document.getElementById(id)
    }
    // 站位用来生成文档用注释
    // widget.defaults = {
    var defaults = {
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's interface
        onInit: avalon.noop,
        onChange: avalon.noop,//@config onChange(index, ele, widgetElement, options) 滚动到应该显示那个tab的index，以及targetListGetter返回的list[index]值，以及绑定scrollspy的元素，options
        axis: "y",//@config 滚动条滚动的方向，默认是竖直方向y，取值为x的时候，表示水平方向
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
        }, //@config targetListGetter() 获取tab list函数，元素是数字或者元素id索引，默认是元素id索引
        panelListGetter: avalon.noop, //@config panelListGetter() 获取panel list函数，返回一个数组，元素是dom，或者返回空，默认返回空
        panelGetter: function(id, index, list, options) {
            return list != void 0 && list[index]  || id != void 0 && getById(id)
        }, //@config panelGetter(pannelId, pannelIndex, panelsList, options) 获取panel函数，默认返回 panelsList[pannelIndex] || Id = pannelId
        spytarget: void 0,
        _lock: false,
        scrollTo: avalon.noop,
        $author: "skipper@123"
    }
    avalon.bindingHandlers.scrollspy = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "scrollspy"]
        var ID = args[0].trim(), opts = args[1], vmodel, vmOptions,
            element = data.element,
            msData = element.msData,
            $element = avalon(element),
            scrollbarBinded = msData && msData["ms-widget"].match(/scrollbar[,]?/g)
        if (ID && ID != "$") {
            vmodel = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!vmodel) {
                return
            }
        }
        data.element.removeAttribute("ms-scrollspy")
        if (!vmodel) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            var vmodelIndex = scrollbarBinded ? 1 : 0
            vmodel = vmodels.length ? vmodels[vmodelIndex] : null
        }
        var fnObj = vmodel || {}
        if (vmodel && typeof vmodel[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = vmodel[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }
        var options = avalon.mix({}, defaults, vmOptions || {}, data[opts] || {}, avalon.getWidgetData(element, "scrollspy"))

        // do something while scrolling
        function onScroll(x, y, scroller) {
            if(!scroller) return
            // 通过接口算出tab list
            var list = options.targetListGetter(options.spytarget, options),
            // 通过接口算出pannel list
                panelList = options.panelListGetter(options.spytarget, options)
                scrollerOffset = scroller.offset()
            for(var i = 0; list[i++];) {
                var id = list[i - 1],
                    ele = options.panelGetter(id, i - 1, panelList, options)
                if(!ele) return
                var $ele = avalon(ele),
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
            options.onChange && options.onChange(i - 1, list[i - 1], element, options)
        }
        var initTop = element.scrollTop,
            initLeft = element.scrollLeft,
            scroller = $element,
            myScroll
        // 原生滚动事件
        avalon.bind(element, "scroll", function(e) {
            // 修复原生滚动事件执行顺序造成的问题
            if(options._lock) return options._lock = false
            onScroll(element.scrollLeft, element.scrollTop, $element)
        })
        // if scrollbar is used
        if(scrollbarBinded) {
            myScroll = avalon.vmodels[msData["ms-widget-id"] || element.getAttribute("avalonctrl")]
            initTop = myScroll.scrollTop
            initLeft = myScroll.scrollLeft
            scroller = myScroll.getScroller()
            myScroll.$watch("scrollLeft", function(n, o) {
                if(options._lock) return
                onScroll(n, void 0, scroller)
            })
            myScroll.$watch("scrollTop", function(n, o) {
                if(options._lock) return
                onScroll(void 0, n, myScroll.getScroller() || scroller)
            })
        }
        //@interface scrollTo(id, index) 滚动到panel位置，滚动到 panelList[index] || dom.id = id的元素的地方，该方法绑定在onInit的返回的options参数上返回，供调用
        options.scrollTo = function(id, index) {
            var panelList =  options.panelListGetter(options.spytarget, options),
                ele = options.panelGetter(id, index, panelList, options),
                $ele = avalon(ele)
            if(!scroller && scrollbarBinded) {
                scroller = myScroll.getScroller()
            }
            if(!ele || !scroller) return
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
                options._lock = false
                // myScroll.update()
            } else {
                element["scroll" + dir] += offset[dir.toLowerCase()] - scrollerOffset[dir.toLowerCase()]
            }
        }
        // callback after inited
        if(typeof options.onInit === "function" ) {
            onScroll(initTop, initLeft, scroller)
            //vmodels是不包括vmodel的 
            options.onInit.call(element, vmodel, options, vmodels)
        }
    }
})