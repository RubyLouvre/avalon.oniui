//avalon 1.2.5 2014.4.2
define(["avalon", "text!./avalon.at.html", "css!../chameleon/oniui-common.css", "css!./avalon.at.css"], function(avalon, template) {

    var widget = avalon.ui.at = function(element, data, vmodels) {
        var options = data.atOptions, $element = avalon(element), keyupCallback, blurCallback, popup
        options.template = options.getTemplate(template, options)

        var lastModified = new Date - 0//上次更新时间
        var vmodel = avalon.define(data.atId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement", "datalist", "template"]
            vm.widgetElement = element
            var bdoName = document.documentMode ? "bdo" : "bdi"
            vm.$init = function(continueScan) {
                var _vmodels = [vmodel].concat(vmodels)
                blurCallback = $element.bind("blur", function(e) {
                    if (!vmodel.$model.__mouseenter__ && vmodel.toggle) {
                        vmodel.toggle = false
                    }
                })
                keyupCallback = $element.bind("keyup", function(e) {
                    var value = this.value
                    var at = options.at
                    var index = value.lastIndexOf(at)
                    if (index > -1) {
                        if (!vmodel.toggle) {
                            var str = value.replace(/\s+$/g, "")
                            //每隔一个字符插入一个<wbr>，实现强制换行，插入<bdo>包围@，方便以后查找
                            var sington = str.length === 1
                            str = str.split("").join("<wbr>") + "<wbr>"
                            if (sington) {
                                str = "<wbr>" + str //防止@出现在最前面
                            }
                            str = str.replace(new RegExp(escapeRegExp("<wbr>" + at + "<wbr>"), "img"), "<" + bdoName + ">" + at + "</" + bdoName + ">")

                            //创建弹出层
                            popup = vmodel._popup.call(this, str)
                            if (popup) {
                                vmodel.activeIndex = 0 //重置高亮行
                                avalon.scan(popup, _vmodels)

                                avalon(popup).bind("mouseleave", function() {
                                    vmodel.$model.__mouseenter__ = false
                                })
                            }


                        }
                        var rightContext = value.substr(index + 1, options.maxLength)

                        if (rightContext.length >= options.minLength) {
                            // 取得@右边的内容，一直取得其最近的一个空白为止
                            var match = rightContext.match(/^\S+/) || [""]
                            var query = vmodel.query = match[0]//取得查询字符串
                            function callback() {
                                //对请求回来的数据进笨过滤排序
                                var datalist = vmodel.filterData(vmodel)
                                var toString = datalist.join(",")
                                //只有发生改动才同步视图
                                if (vmodel.$model.__toString__ !== toString) {
                                    //添加高亮
                                    datalist = datalist.map(function(el) {
                                        return vmodel.highlightData(el, query)
                                    })
                                    vmodel._datalist = datalist
                                    vmodel.$model.__toString__ = toString
                                }
                                vmodel.toggle = !!datalist.length
                                if (!vmodel.toggle && popup) {
                                    popup.parentNode.removeChild(popup)
                                }
                            }

                            var now = new Date//时间闸
                            if (lastModified - now > vmodel.delay && typeof vmodel.updateData === "function") {
                                //远程请求数据，自己实现updateData方法，主要是改变datalist数组，然后在调用callback
                                vmodel.updateData(callback)
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

                })
                if(continueScan){
                    continueScan()
                }else{
                    avalon.log("请尽快升到avalon1.3.7+")
                    avalon.scan(element, _vmodels)
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }

            vm.$remove = function() {
                avalon(element).unbind("keyup", keyupCallback).unbind("blur", blurCallback)
                vm.toggle = false
                avalon.log("at $remove")
            }

            vm._popup = function(str) {
                //创建测量用的DIV,它与当前textara, input的大小样式完全相同
                var fakeTextArea = document.createElement("pre")
                fakeTextArea.innerHTML = str
                document.body.appendChild(fakeTextArea)
                var styles = window.getComputedStyle ?
                        getComputedStyle(this, null) :
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
                var bdos = fakeTextArea.getElementsByTagName(bdoName)
                var bdo = bdos[bdos.length - 1]
                if(!bdo)
                    return

                //高亮@所在bdo元素，然后通过Range.getBoundingClientRect取得它在视口的坐标
                if (document.createRange && document.documentMode != 9) {//如果是IE10+或W3C
                    var range = document.createRange();
                    range.selectNode(bdo)
                    var rangeRect = range.getBoundingClientRect()
                } else {//IE6-9
                    rangeRect = bdo.getBoundingClientRect()
                }
                //高亮@所在bdo元素在测量用的PER的坐标
                var top = rangeRect.bottom - fakeRect.top
                var left = rangeRect.left - fakeRect.left
                //创建弹出菜单
                popup = document.createElement("div")
                popup.innerHTML = vmodel.template
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

            vm._hover = function(e, index) {
                e.preventDefault()
                var model = vmodel.$model
                model.__mouseenter__ = true
                if (!model.__keyup__) {
                    vm.activeIndex = index
                }
            }
            vm.$watch("toggle", function(v) {
                if (v === false && popup && popup.parentNode) {
                    popup.parentNode.removeChild(popup)
                    popup = null
                }
            })
            vm._select = function(e) {
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
                element.focus()//聚集到最后
                //销毁菜单
                vmodel.toggle = false

            }

        })
        return vmodel

    }
    widget.vertion = 1.0
    widget.defaults = {
        at: "@", //默认的标识符,
        datalist: [], //字符串数组，不可监控，(名字取自HTML的datalist同名元素)
        _datalist: [], //实际是应用于模板上的字符串数组，它里面的字符可能做了高亮处理
        template: "", //弹出层的模板，如果为空，使用默认模板，注意要在上面添加点击或hover处理
        toggle: false, //用于控制弹出层的显示隐藏
        activeIndex: 0, //弹出层里面要高亮的列表项的索引值
        query: "", //@后的查询字符串
        limit: 5, //弹出层里面总共有多少个列表项
        maxLength: 20, //@后的查询字符串的最大长度，注意中间不能有空格
        minLength: 1, //@后的查询字符串只有出现了多少个字符后才显示弹出层
        delay: 500, //我们是通过$update方法与后台进行AJAX连接，为了防止输入过快导致频繁，需要指定延时毫秒数
        //远程更新函数,与后台进行AJAX连接，更新datalist，此方法有一个回调函数，里面将执行$filter、$highlight操作
        updateData: avalon.noop,
        getTemplate: function(str, options) {
            return str
        },
        //用于对datalist进行过滤排序，将得到的新数组赋给_datalist，实现弹出层的更新
        filterData: function(opts) {
            //opts实质上就是vmodel，但由于在IE6-8下，this不指向调用者，因此需要手动传vmodel
            var unique = {}, query = opts.query, lowquery = query.toLowerCase()
            //精确匹配的项放在前面
            var datalist = opts.datalist.filter(function(el) {
                if (el.indexOf(query) === 0) {
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
        //用于对_datalist中的字符串进行高亮处理，item为_datalist中的每一项，str为查询字符串
        highlightData: function(item, str) {
            var query = escapeRegExp(str)
            return item.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
                return '<strong style="color:#FF6600;">' + match + '</strong>'
            })
        }
    }
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
    }
    //通过监听textarea,input的keyup进行，移动列表项的高亮位置
    function moveIndex(e, vmodel) {
        var max = vmodel._datalist.size()
        switch (e.keyCode) {
            case 13:
                // enter
                vmodel._select(e)
                break;
            case 9:
                // tab
            case 27:
                // escape
                e.preventDefault();
                break;
            case 38:
            case 63233: //safari
                // up arrow
                e.preventDefault();
                var index = vmodel.activeIndex - 1
                if (index < 0) {
                    index = max - 1
                }
                vmodel.activeIndex = index
                break;
            case 40:
            case 63235: //safari
                // down arrow
                e.preventDefault();
                var index = vmodel.activeIndex + 1
                if (index === max) {
                    index = 0
                }
                vmodel.activeIndex = index
                break;
        }
    }

    return avalon
})
/*
 //updateData的例子，里面是一个AJAX回调，成功后更新VM的datalist，并执行回调
 
 function updateData(vmodel, callback){ 
 var model = vmodel.$model
 jQuery.post("url", { limit: model.limit, query: model.query}, function(data){
 vmodel.datalist = data.datalist
 callback()
 })
 }
 
 
 
 **/
/**
 * 参考链接
 http://dddemo.duapp.com/bootstrap
 http://www.cnblogs.com/haogj/p/3376874.html
 */

