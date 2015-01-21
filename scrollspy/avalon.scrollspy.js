/**
 * @cnName scrollspy组件
 * @enName scrollspy
 * @introduce
 *  <p>当滚动页面或者元素的时候触发某种事件和动画效果<br>该组件通过侦听页面或者元素的scrolling事件，触发基于滚动位置衍生的事件。例如：当你滚动页面到一个特定的位置，你可以给应该展现视图内的特定元素指定一个渐入效果
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
        onChange: avalon.noop,//@config onChange(index, ele, widgetElement, options) 滚动到应该显示的index[是onChangeNew返回的indexs的第一个值]，以及targetListGetter返回的list[index]值，以及绑定scrollspy的元素，options
        onChangeNew: avalon.lop,//@config onChangeNew(indexLists, lists, element, options)参数indexs为所有显示在viewpoint内的index组成数组,lists为对应的list[index]集合的数组，其他同onChange
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
        }, //@config targetListGetter() 获取tab list函数，元素是数字或者元素id索引，默认是元素id索引，如果targetListGetter返回为空或者空数组的时候，list则取值panelListGetter的值，因此panelListGetter是必须有返回内容的
        panelListGetter: avalon.noop, //@config panelListGetter() 获取panel list函数，返回一个数组，元素是dom，或者返回空，默认返回空，panel跟targetListGetter返回的数组项，是一一对应的，来实现menu的切换，而内容滚动或切换到对应的panel，必须返回一个数组
        panelGetter: function(id, index, list, options) {
            return list != void 0 && list[index]  || id != void 0 && getById(id)
        }, //@config panelGetter(pannelId, pannelIndex, panelsList, options) 获取panel函数，默认返回 panelsList[pannelIndex] || Id = pannelId
        spytarget: void 0, //@config 指定滚动关联的元素id，默认的targetListGetter会到这个指定元素内寻找li元素作为所有的菜单选项，spytarget会作为第一个参数传递给targetListGetter,panelListGetter
        _lock: false,
        scrollTo: avalon.noop,
        $author: "skipper@123"
    }
    function getScroll(ele) {
        if(ele == document.body) return {
            top: ele.scrollTop || document.documentElement.scrollTop,
            left: ele.scrollLeft || document.documentElement.scrollLeft,
            height: avalon(window).height(),
            width: avalon(window).width()
        }
        var offset = avalon(ele).offset()
        return {
            top: ele.scrollTop,
            left: ele.scrollLeft,
            offsetTop: offset.top,
            offsetLeft: offset.left,
            height: avalon(ele).height(),
            width: avalon(ele).width()
        }
    }
    avalon.bindingHandlers.scrollspy = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || ["$", "scrollspy"]
        var ID = args[0].trim(), opts = args[1], vmodel, vmOptions,
            element = data.element,
            msData = element.msData,
            $element = avalon(element),
            scrollbarBinded = msData && msData["ms-widget"].match(/scrollbar[,]?/g),
            isElementBody = element === document.body
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
                panelList = options.panelListGetter(options.spytarget, options),
                // scrollerOffset = scroller.offset()
                scrollerOffset = getScroll(scroller[0]),
                sHeight = scrollerOffset.height,
                sWidth = scrollerOffset.width,
                rlist = [],
                tlists = []
            if(!list || !list.length) list = panelList
            for(var i = 0, len = list.length; i < len; i++) {
                var id = list[i],
                    ele = options.panelGetter(id, i, panelList, options)
                if(!ele) return
                var $ele = avalon(ele),
                    offset = $ele.offset(),
                    height = $ele.innerHeight(),
                    width = $ele.innerWidth(),
                    index = false
                if(isElementBody) {
                    if(options.axis == "x") {
                        if(scrollerOffset.left <= offset.left + width && scrollerOffset.left + sWidth >= offset.left) {
                            index = i
                        }
                    } else {
                        if(scrollerOffset.top <= offset.top + height && scrollerOffset.top + sHeight >= offset.top) {
                            index = i
                        }
                    }
                } else {
                    if(options.axis == "x") {
                        if(scrollerOffset.left <= offset.left + width && scrollerOffset.left + sWidth >= offset.left) {
                            index = i
                        }
                    } else {
                        if(offset.top <= scrollerOffset.offsetTop && offset.top + height >= scrollerOffset.offsetTop) {
                            index = i
                        }
                    }
                }
                if(index !== false) {
                    rlist.push(index)
                    tlists.push(list[i])
                }
            }
            if(rlist.length) {
                i = rlist[0]
                options.onChange && options.onChange(i, list[i], element, options)
            }
            options.onChangeNew && options.onChangeNew(rlist, tlists, element, options)
        }
        var initTop = element.scrollTop,
            initLeft = element.scrollLeft,
            scroller = $element,
            myScroll
        // 原生滚动事件
        avalon.bind(isElementBody ? window : element, "scroll", function(e) {
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