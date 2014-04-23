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
                $element.bind("blur", function(e) {
                    console.log(vmodel.$model.__mouseenter__ + " blur")
                    if (!vmodel.$model.__mouseenter__) {

                        vmodel.toggle = false
                        if (popup) {
                            popup.parentNode.removeChild(popup)
                            popup = null
                        }
                    }
                })

                keyupCallback = $element.bind("keyup", function(e) {
                    var value = this.value
                    var at = options.at
                    var index = value.lastIndexOf(at)
                    if (index > -1) {
                        if (!popup) {
                            var str = value.replace(/\s+$/g, "")
                            if (str !== value) {
                                element.value = str//让光标定位在文字的最后
                                element.focus()
                                if (element.createTextRange) {
                                    var range = element.createTextRange(); //建立文本选区   
                                    range.moveStart('character', str.length);
                                    range.collapse(true);
                                    range.select()
                                }
                            }
                            //每隔一个字符插入一个<wbr>，实现强制换行，插入<bdo>包围@，方便以后查找
                            str = str.split("").join("<wbr>") + "<wbr>"
                            str = str.replace("<wbr>" + at + "<wbr>", "<bdo>" + at + "</bdo>")
                            //创建弹出层
                            popup = vmodel.$popup.call(this, str)

                            avalon.scan(popup, _vmodels)
                            avalon(popup).bind("mouseleave", function() {
                                vmodel.$model.__mouseenter__ = false
                            })


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
                                    if (vmodel.$model.__toString__ !== toString) {
                                        //添加高亮
                                        datalist = datalist.map(function(el) {
                                            return vmodel.$highlight(el, query)
                                        })
                                        vmodel._datalist = datalist
                                        vmodel.$model.__toString__ = toString
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
                                //用户在用键盘移动时，mouseenter将失效
                                vmodel.$model.__keyup__ = true
                                moveIndex(e, vmodel)
                                setTimeout(function() {
                                    vmodel.$model.__keyup__ = false
                                }, 150)
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
                    popup = null
                }
            }

            vm.$popup = function(str) {
                //创建测量用的DIV,它与当前textara, input的大小样式完全相同
                var fakeTextArea = document.createElement("div")
                fakeTextArea.innerHTML = str
                document.body.appendChild(fakeTextArea)
                var styles = window.getComputedStyle ?
                        window.getComputedStyle(this, null) :
                        this.currentStyle
                var $fakeTextArea = avalon(fakeTextArea)
                for (var i in styles) {
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
                    "word-wrap": "break-word", //强制换行 fix IE6-8
                    "word-break": "break-all" //强制换行 fix IE6-8
                })
                //取得textarea,input在页面上的坐标
                var offset = avalon(this).offset()
                var fakeRect = fakeTextArea.getBoundingClientRect()
                var bdo = fakeTextArea.getElementsByTagName("bdo")[0]
                //高亮@所在bdo元素，然后通过Range.getBoundingClientRect取得它在视口的坐标
                if (document.createRange && document.documentMode != 9) {//如果是IE10+或W3C
                    var range = document.createRange();
                    range.selectNode(bdo)
                } else {
                    var range = document.selection.createRange().duplicate()
                    range.moveToElementText(bdo)
                    range.select();
                }
                //高亮@所在bdo元素在测量用的DIV的坐标
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
                    top: offset.top + top, //得到@在textarea, input的坐标
                    left: offset.left + left,
                    position: "absolute"
                })
                document.body.removeChild(fakeTextArea)
                fakeTextArea = null
                return popup
            }


            vm.$hover = function(e, index) {
                e.preventDefault()
                var model = vmodel.$model
                model.__mouseenter__ = true
                if (!model.__keyup__) {
                    vm.activeIndex = index
                }
            }

            vm.$select = function(e) {

                e.stopPropagation()
                e.preventDefault()
                var query = vmodel._datalist[ vmodel.activeIndex ]
                var span = document.createElement("span")
                span.innerHTML = query
                query = span.textContent || span.innerText//去掉高亮标签
                var value = element.value
                var index = value.replace(/\s+$/g, "").lastIndexOf(vmodel.at)
                //添加一个特殊的空格,让aaa不再触发 <ZWNJ>，零宽不连字空格
                element.value = value.slice(0, index) + "@\u200c" + query
                //隐藏菜单
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