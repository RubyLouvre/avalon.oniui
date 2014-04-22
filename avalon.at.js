//avalon 1.2.5 2014.4.2
define(["avalon", "text!avalon.at.popup.html"], function(avalon, tmpl) {
    var arr = tmpl.split("MS_OPTION_STYLE")
    var cssText = arr[1].replace(/<\/?style>/g, "")
    var styleEl = document.getElementById("avalonStyle")
    var popupHTML = arr[0]
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    var widget = avalon.ui.at = function(element, data, vmodels) {

        var options = data.atOptions, $element = avalon(element), keyupCallback, popup
        if (!options.popupHTML) {
            options.popupHTML = popupHTML
        }
        var lastModified = new Date - 0//上次更新时间
        var vmodel = avalon.define(data.atId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement", "datalist", "popupHTML"]
            vm.widgetElement = element

            vm.$init = function() {
                var _vmodels = [vmodel].concat(vmodels)
                keyupCallback = $element.bind("keyup", function(e) {
                    var value = this.value
                    var at = options.at
                    var index = value.lastIndexOf(at)
                    if (index > -1) {
                        if (!popup) {
                            var str = value.replace(/\s+$/g, "")
                            if (str !== value && element.createTextRange) {
                                var range = element.createTextRange(); //建立文本选区   
                                range.moveStart('character', str.length); //选区的起点移到最后去  
                                range.collapse(true);
                                range.select()
                            }

                            str = str.split("").join("<wbr>") + "<wbr>"
                            str = str.replace("<wbr>" + at + "<wbr>", "<bdi>" + at + "</bdi>")

                            var fakeTextArea = document.createElement("div")
                            fakeTextArea.innerHTML = str
                            document.body.appendChild(fakeTextArea)
                            var styles = window.getComputedStyle ?
                                    window.getComputedStyle(element, null) :
                                    element.currentStyle
                            var $fakeTextArea = avalon(fakeTextArea)
                            for (var i in styles) {//确保DIV与TEXTAREA中的样式一致
                                if (typeof styles[i] !== "function") {
                                    try {
                                        $fakeTextArea.css(i, styles[i])
                                    } catch (e) {
                                    }
                                }
                            }

                            $fakeTextArea.css({
                                width: this.offsetWidth,
                                height: this.offsetHeight,
                                border: "1px solid red",
                                display: "block",
                                "word-wrap": "break-word", //fix IE6-8
                                "word-break": "break-all" //fix IE6-8
                            })

                            var offset = $element.offset()
                            var fakeRect = fakeTextArea.getBoundingClientRect()
                            var bdi = fakeTextArea.getElementsByTagName("bdi")[0]
                            if (document.createRange && document.documentMode != 9) {//如果是IE10+或W3C
                                var range = document.createRange();
                                range.selectNode(bdi)
                            } else {
                                var range = document.selection.createRange().duplicate()
                                range.moveToElementText(bdi)
                                range.select();
                            }
                            //取得@相对于文本框或文本区的距离的关键，Range对象与元素节点一样都有getBoundingClientRect
                            var rangeRect = range.getBoundingClientRect()
                            var top = rangeRect.bottom - fakeRect.top
                            var left = rangeRect.left - fakeRect.left
                            //创建弹出菜单
                            popup = document.createElement("div")
                            popup.innerHTML = vmodel.popupHTML
                            document.body.appendChild(popup)
                            popup.className = "ui-at"
                            popup.setAttribute("ms-visible", "toggle")
                            avalon(popup).css({
                                top: offset.top + top,
                                left: offset.left + left,
                                position: "absolute"
                            })
                            avalon.scan(popup, _vmodels)
                            setTimeout(function() {
                                listen(popup, vmodel)
                            })
                            document.body.removeChild(fakeTextArea)
                            fakeTextArea = null
                        }
                        var rightContext = value.substr(index + 1, options.maxLength)
                        if (rightContext.length >= options.minLength) {
                            // 取得@右边的内容，一直取得其最近的一个空白为止
                            var match = rightContext.match(/^\S+/)
                            if (match) {
                                var query = vmodel.query = match[0]
                                function callback() {
                                    //对请求回来的数据进笨过滤排序
                                    var datalist = vmodel.$filter(vmodel)
                                    var toString = datalist.join(",")
                                    //只有发生改动才同步视图
                                    if (vmodel.$model._toString !== toString) {
                                        //添加高亮
                                        datalist = datalist.map(function(el) {
                                            return vmodel.$highlight(el, query)
                                        })
                                        vmodel._datalist = datalist
                                        vmodel.$model._toString = toString
                                    }
                                    vmodel.toggle = !!datalist.length
                                }

                                var now = new Date//时间闸
                                if (lastModified - now > vmodel.delay && typeof vmodel.$update === "function") {
                                    //远程请求数据，自己实现remoteFetch方法，主要是改变datalist数组，然后在调用callback
                                    vmodel.$update(callback)
                                    lastModified = now
                                }
                                callback()
                                moveIndex(e, vmodel)
                            }

                        }

                    }
                })
                avalon.scan(element, _vmodels)
            }
            vm.$remove = function() {
                avalon(element).unbind(keyupCallback)
                if (popup) {
                    popup.innerHTML = ""
                    document.body.removeChild(popup)
                }
            }
            vm.$hover = function(index) {
                //   vm.activeIndex = index
            }
//            vm.$removePopup = function(e) {
//                e.stopPropagation()
//                e.preventDefault()
//                setTiemout(function() {
//                    vmodel.toggle = false
//                    popup.parentNode.removeChild(popup)
//                    popup = null
//                }, 150)
//
//            }
            vm.$select = function(e) {
                e.stopPropagation()
                e.preventDefault()
                var query = vmodel._datalist[vmodel.activeIndex]
                var span = document.createElement("span")
                span.innerHTML = query
                query = span.textContent || span.innerText//去掉高亮标签
                var value = element.value
                var index = value.replace(/\s+$/g, "").lastIndexOf(vmodel.at)
                //添加一个特殊的空格,让aaa不再触发 <ZWNJ>，零宽不连字空格
                element.value = value.slice(0, index) + "@\u200c" + query
                vmodel.toggle = false
                popup.parentNode.removeChild(popup)
                popup = null

            }

        })
        return vmodel

    }
    widget.vertion = 1.0
    widget.defaults = {
        at: "@", //默认的标识符,
        datalist: [], //字符串数组
        _datalist: [],
        popupHTML: "",
        toggle: false,
        activeIndex: 0,
        query: "", //@后的查询词组
        limit: 5, //popup里最多显示多少项
        maxLength: 20, //@之后的字符串最大能匹配的长度
        minLength: 1, //@之后的字符串的长度达到多少才显现popup
        delay: 500, //指定延时毫秒数后，才正真向后台请求数据，以防止输入过快导致频繁向后台请求，默认
        $update: avalon.noop, //用于远程更新数据
        //你可以在这里进行过滤与排序等操作
        $filter: function(opts) {
            var unique = {}, query = opts.query, lowquery = query.toLowerCase()
            //精确匹配的项放在前面
            var datalist = opts.datalist.filter(function(el) {
                if (el.indexOf(query) > -1) {
                    unique[el] = 1
                    return true
                }
            })
            //模糊匹配的项放在后面
            opts.datalist.forEach(function(el) {
                var str = el.toLowerCase()
                if (!unique[el]) {
                    if (str.indexOf(lowquery) > -1) {
                        unique[el] = 1
                        datalist.push(el)
                    }
                }
            })
            return datalist.slice(0, opts.limit) //对显示个数进行限制
        },
        //你可以在这里对已匹配的项 进行高亮 
        $highlight: function(item, str) {
            var query = str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
            return item.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
                return '<strong style="color:#FF6600;">' + match + '</strong>'
            })
        }
    }
    function listen(popup, vmodel) {

        var elem = vmodel.widgetElement
        var $elem = avalon(elem)
        avalon(popup).bind('click', vmodel.$select)
//        var hide = true
//        avalon(popup).bind("mouseenter", function() {
//            hide = false
//        })
//        avalon(popup).bind("mouseleave", function() {
//            hide = true
//        })
//        $elem.bind("blur", function(e) {
//            e.stopPropagation()
//            e.preventDefault()
//            if (hide) {
//                vmodel.toggle = false
//                popup.parentNode.removeChild(popup)
//                popup = null
//            }
//        })
//eventSupported(elem, "keydown") ? "keydown" :

    }

    function moveIndex(e, vmodel) {
        switch (e.keyCode) {
            case 13:
                // enter
                vmodel.$select(e)
                break;
            case 9:
                // tab
            case 27:
                // escape
                e.preventDefault();
                break;
            case 38:
                // up arrow
                e.preventDefault();
                var index = vmodel.activeIndex - 1
                if (index < 0) {
                    index = vmodel.limit - 1
                }
                vmodel.activeIndex = index
                break;
            case 40:
                // down arrow
                e.preventDefault();
                var index = vmodel.activeIndex + 1
                if (index === vmodel.limit) {
                    index = 0
                }
                vmodel.activeIndex = index
                break;
        }
    }

    function eventSupported(elem, eventName) {
        var isSupported = (eventName in elem)
        if (!isSupported) {
            elem.setAttribute(eventName, 'return;')
            isSupported = typeof elem[eventName] === 'function'
        }
        return isSupported;
    }
    return avalon
})
/*
 updater的实现例子：
 
 function updater(callback){ 
 var vmodel = this, model = vmodel.$model
 jQuery.post("url", { limit: model.limit, query: model.query}, function(data){
 vmodel.datalist = data.datalist
 callback()
 })
 }
 http://dddemo.duapp.com/bootstrap
 
 http://www.cnblogs.com/haogj/p/3376874.html
 **/