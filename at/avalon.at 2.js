//avalon 1.2.5 2014.4.2
define(["avalon", "text!./avalon.at.html", "css!../chameleon/oniui-common.css", "css!./avalon.at.css"], function(avalon, template) {

    var widget = avalon.ui.at = function(element, data, vmodels) {
        var options = data.atOptions, $element = avalon(element), keyupCallback, blurCallback, keypressCallback, popup
        options.template = options.getTemplate(template, options)

        var lastModified = new Date - 0//上次更新时间
        var vmodel = avalon.define(data.atId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement", "datalist", "template"]
            vm.widgetElement = element
            vm.$init = function() {
                var _vmodels = [vmodel].concat(vmodels)
                blurCallback = $element.bind("blur", function(e) {
                    if (!vmodel.$model.__mouseenter__ && vmodel.toggle) {
                        vmodel.toggle = false
                    }
                })
                keypressCallback = $element.bind("keypress", function(e) {
                    if (e.keyCode === 13 && popup) {
                        //我们可以在菜单中上下移动，然后接回车选中并且最后隐藏菜单
                        //在这个过程中，不会触发浏览器默认的回车换行行为
                        e.preventDefault()
                        avalon.log("keypress")
                    }
                })
                keyupCallback = $element.bind("keyup", function(e) {
                    var caret = getCaretPosition(this)
                    var value = this.value
                    var at = options.at
                    //如果光标直接位于光标之后，那么就查询所有
                    var queryAll = value.charAt(caret - 1) === at
                    //如果光标位于@之后，那么取@与光标之间的字符串作为查询字段
                    var querySome
                    if (!queryAll) {
                        var stop = caret
                        var start = caret - options.maxLength
                        if (start < 0) {
                            start = 0
                        }
                        var left = value.substring(start, stop)
                        left = left.split(" ").pop()
                        if (left.indexOf(at) >= 0) {
                            var lastIndex = left.lastIndexOf(at)
                            querySome = left.slice(lastIndex + 1)
                        }
                    }


                    if (queryAll || querySome) {
                        if (!popup) {
                            console.log("菜单不存在，创建菜单")
                            //  avalon.log("已经定位到@之后")
                            var rectValue = value.slice(0, caret)
                            var rectHTML = rectValue.replace(/\s+$/g, "")
                            //每隔一个字符插入一个<wbr>，实现强制换行，插入<bdo>包围@，方便以后查找
                            rectHTML = rectHTML.split("").join("<wbr>") + "<wbr>"
                            //为性能起见，只有用户定位于@后才重刷fakeTextArea里面的HTML结构
                            rectHTML = rectHTML.replace(new RegExp(escapeRegExp(at), "img"), "<bdo>" + at + "</bdo>")
                            //创建弹出层
                            popup = vmodel._popup.call(this, rectHTML)
                            if (!popup){
                                   console.log("创建菜单失败")
                                return
                            }
                            vmodel.activeIndex = 0 //重置高亮行
                            avalon.scan(popup, _vmodels)
                            avalon(popup).bind("mouseleave", function() {
                                vmodel.$model.__mouseenter__ = false
                            })
                        }

      
                        if (queryAll || (querySome && querySome.length >= options.minLength)) {
                            var query = vmodel.query = queryAll ? "" : querySome
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

                    } else if (popup) {
                      //  vmodel.toggle = false
                    }


                })
                avalon.scan(element, _vmodels)
                if (typeof options.onInit === "function") {
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }

            vm.$remove = function() {
                avalon(element).unbind("keyup", keyupCallback).unbind("blur", blurCallback).unbind("keypress", blurCallback)
                vm.toggle = false
                avalon.log("at $remove")
            }

            vm._popup = function(str) {
                //创建测量用的DIV,它与当前textara, input的大小样式完全相同
                //firefox 用PRE元素无法通过CSS让文字自动换行
                var fakeTextArea = window.netscape ? document.createElement("div") : document.createElement("pre")
                fakeTextArea.innerHTML = str
                document.body.appendChild(fakeTextArea)
                //拷贝其样式
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
                var bdos = fakeTextArea.getElementsByTagName("bdo")
                var bdo = bdos[bdos.length - 1]
                if (!bdo)
                    return
                //高亮@所在bdo元素，然后通过Range.getBoundingClientRect取得它在视口的坐标
                if (document.createRange) {//如果是IE10+或W3C  && document.documentMode != 9
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
                popup = popup || document.createElement("div")
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
                var caret = getCaretPosition(element)
                element.value = value.slice(0, caret) + query + " " + value.slice(caret)
                //销毁菜单
                
                setCaretPosition(element, caret + query.length + 1)
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
    function getCaretPosition(element) {
        var caret  //取得光标的位置
        if (typeof element.selectionStart === "number") {
            caret = element.selectionStart
        } else {
            var selection = document.selection.createRange() //这个TextRange对象不能重用
            selection.moveStart("character", -element.value.length)
            caret = selection.text.length;
        }
        return caret
    }
    function setCaretPosition(ctrl, pos) {
        if (ctrl.setSelectionRange) {
            ctrl.focus()
            ctrl.setSelectionRange(pos, pos)
        } else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange()
            range.collapse(true);
            range.moveEnd("character", pos)
            range.moveStart("character", pos)
            range.select()
        }
    }
    //通过监听textarea,input的keyup进行，移动列表项的高亮位置
    function moveIndex(e, vmodel) {
        var max = vmodel._datalist.size()
        var code = e.which || e.keyCode
        console.log("移动菜单   "+code)
        //firefox down 为37
       // console.log(e.keyCode)
        switch (code) {
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
                console.log("down")
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

