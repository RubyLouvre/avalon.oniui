/**
 * @cnName avalon类似新浪微博的@提示组件
 * @enName at
 * @introduce
 *    <p>经常使用微博的人会发现，当我们在输入框输入@然后敲一个人的名字，会弹出一个<code>tip提示层</code>，里面是一个名字列表。这是社交网站或应用最近非常流行的功能。
 当你发布<code>@昵称</code>的信息时，在这里的意思是“向某某人说”，对方能看到你说的话，并能够回复，实现一对一的沟通。</p>
 *  @updatetime 2011-11-17
 */
define(["avalon", "text!./avalon.at.html", "css!../chameleon/oniui-common.css", "css!./avalon.at.css"], function(avalon, template) {

    var widget = avalon.ui.at = function(element, data, vmodels) {
        var options = data.atOptions, $element = avalon(element), keyupCallback, blurCallback, keydownCallback, popup
        options.template = options.getTemplate(template, options)

        var lastModified = new Date - 0//上次更新时间
        var queryStartIndex, fakeTextArea
        var vmodel = avalon.define(data.atId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement", "datalist", "template"]
            vm.widgetElement = element
            vm.$init = function(continueScan) {
                var _vmodels = [vmodel].concat(vmodels)
                blurCallback = $element.bind("blur", function(e) {
                    if (!vmodel.$model.__mouseenter__ && vmodel.toggle) {
                        vmodel.toggle = false
                    }
                })
    
                keydownCallback = $element.bind("keydown", function(e) {
                    if (e.keyCode === 13 && popup) {
                        //我们可以在菜单中上下移动，然后接回车选中并且最后隐藏菜单
                        //在这个过程中，不会触发浏览器默认的回车换行行为
                        e.preventDefault()
                    }
                    if (e.which === 38) {
                        e.preventDefault()
                    }
                })
                keyupCallback = $element.bind("keyup", function(e) {
                    var el = this
                    if (e.shiftKey) {//防止键入@时触发两次
                        return
                    }
                    setTimeout(function() {
                        var caret = getCaretPosition(el)
                        var value = el.value
                        var at = options.at//查询标记
                        var query = null //查询字符串,用于highlightData方法
                        //如果光标直接位于光标之后，那么就查询所有
                        var queryAll = value.charAt(caret - 1) === at
                        //取得离光标左边最近的@的位置(也就是插入菜单的位置)
                        var _queryStartIndex = value.slice(0, caret).lastIndexOf(at)
                        if (_queryStartIndex !== -1) {
                            queryStartIndex = _queryStartIndex + 1
                        } else {//如果光标之前的element.value不存在@那么关闭菜单
                            return vmodel.toggle = false
                            return
                        }
                        if (queryAll) {
                            query = ""
                        }
                        if (!queryAll && typeof queryStartIndex === "number") {
                            var query = value.slice(queryStartIndex, caret)
                            if (query.indexOf(" ") >= 0 || query.length > options.maxLength) {
                                return vmodel.toggle = false //如果存在空白或超出长度, 就关闭子菜单
                            } else {
                                query = query.length >= options.minLength ? query : ""
                            }
                        }
                        if (typeof query === "string") {
                            vmodel.query = query
                            if (!popup) {//如果菜单不存在创建菜单
                                var rectValue = value.slice(0, caret)
                                var rectHTML = rectValue
                                //每隔一个字符插入一个<wbr>，实现强制换行，插入<bdo>包围@，方便以后查找
                                // var rectHTML = rectValue.split("").join("<wbr>") + "<wbr>"
                                //为性能起见，只有用户定位于@后才重刷fakeTextArea里面的HTML结构
                                rectHTML = rectHTML.replace(new RegExp(escapeRegExp(at), "img"), "<bdo>" + at + "</bdo>")
                                //创建弹出层
                                popup = vmodel._popup.call(el, rectHTML)
                                vmodel.activeIndex = 0 //重置高亮行
                                avalon.scan(popup, _vmodels)
                                avalon(popup).bind("mouseleave", function() {
                                    vmodel.$model.__mouseenter__ = false
                                })
                            }

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
                    })

                })
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("请尽快升到avalon1.3.7+")
                    avalon.scan(element, _vmodels)
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
            /**
             * @interface 当组件移出DOM树时,系统自动调用的销毁函数
             */
            vm.$remove = function() {
                avalon(element)
                        .unbind("keyup", keyupCallback)
                        .unbind("blur", blurCallback)
                        .unbind("keydown", keydownCallback)
                vm.toggle = false
                avalon.log("at $remove")
            }

            vm._popup = function(str) {
                //创建测量用的DIV,它与当前textara, input的大小样式完全相同
                fakeTextArea = fakeTextArea || document.createElement("div")
                fakeTextArea.innerHTML = str
                document.body.appendChild(fakeTextArea)
                //拷贝其样式
                var styles = window.getComputedStyle ?
                        getComputedStyle(this, null) :
                        this.currentStyle
                var obj = {}
                avalon(this).css("font-size") //强制reflow
                for (var i in styles) {
                    if (/^[a-z]+$/i.test(i) && styles[i] !== "" && typeof styles[i] !== "function") {
                        obj[i] = styles[i]
                    }
                }
                avalon.mix(obj, {
                    width: avalon(this).width() + "px",
                    height: avalon(this).height() + "px",
                    border: "1px solid red",
                    display: "block",
                    "word-wrap": "break-word", //强制换行 fix IE6-8
                    visibility: "hidden"
                })
                var array = []
                for (var i in obj) {
                    array.push(hyphen(i) + ":" + obj[i])
                }
                fakeTextArea.style.cssText = array.join("; ")
                fakeTextArea.scrollTop = this.scrollTop
                fakeTextArea.scrollLeft = this.scrollLeft
                //取得textarea,input在页面上的坐标
                var offset = avalon(this).offset()
                var fakeRect = fakeTextArea.getBoundingClientRect()
                var bdos = fakeTextArea.getElementsByTagName("bdo")
                var bdo = bdos[bdos.length - 1]
                //高亮@所在bdo元素，然后通过Range.getBoundingClientRect取得它在视口的坐标
                if (document.createRange) {//如果是IE10+或W3C  && document.documentMode != 9
                    var range = document.createRange();
                    range.selectNode(bdo)
                    var rangeRect = range.getBoundingClientRect()
                } else {//IE6-9
                    rangeRect = bdo.getBoundingClientRect()
                }
                //高亮@所在bdo元素在测量用的DIV的坐标
                var top = rangeRect.bottom - fakeRect.top
                var left = rangeRect.left - fakeRect.left
                //创建弹出菜单
                popup = popup || document.createElement("div")
                popup.innerHTML = vmodel.template
                document.body.appendChild(popup)
                popup.className = "oni-at"
                popup.setAttribute("ms-visible", "toggle")
                avalon(popup).css({
                    top: offset.top + top, //得到@在textarea, input的坐标
                    left: offset.left + left,
                    position: "absolute"
                })
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
                    document.body.removeChild(fakeTextArea)
                    fakeTextArea = null
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

                element.value = value.slice(0, queryStartIndex) + query + " " + value.slice(queryStartIndex)
                //销毁菜单

                setCaretPosition(element, queryStartIndex + query.length + 1)
                vmodel.toggle = false
            }

        })
        return vmodel

    }
    widget.vertion = 1.0
    widget.defaults = {
        at: "@", // @config 默认的标识符
        datalist: [], //@config 字符串数组，不可监控，(名字取自HTML的datalist同名元素)
        _datalist: [], //@interface 实际是应用于模板上的字符串数组，它里面的字符可能做了高亮处理
        template: "", // @config  弹出层的模板，如果为空，使用默认模板，注意要在上面添加点击或hover处理
        toggle: false, //@config 用于控制弹出层的显示隐藏
        activeIndex: 0, //@config 弹出层里面要高亮的列表项的索引值
        query: "", ///@config @后的查询字符串
        limit: 5, //@config  弹出层里面总共有多少个列表项
        maxLength: 20, //@config @后的查询字符串的最大长度，注意中间不能有空格
        minLength: 1, //@config @后的查询字符串只有出现了多少个字符后才显示弹出层
        /**
         * @config 我们是通过$update方法与后台进行AJAX连接，为了防止输入过快导致频繁，需要指定延时毫秒数
         * 远程更新函数,与后台进行AJAX连接，更新datalist，此方法有一个回调函数，里面将执行$filter、$highlight操作
         */
        delay: 500,
        /**
         * @config {Function} 远程更改数据
         * @param vm {Object} vmodel
         * @param callback {Function} 在vmodel.datalist被更新后执行的回调
         */
        updateData: function(vm, callback) {

        },
        /**
         * @config 模板函数,方便用户自定义模板
         * @param str {String} 默认模板
         * @param opts {Object} vmodel
         * @returns {String} 新模板
         */
        getTemplate: function(str, opts) {
            return str
        },
        /**
         * @config 用于对datalist进行过滤排序，将得到的新数组赋给_datalist，实现弹出层的更新
         * @param opts {Object} vmodel
         * @returns {Array} datalist
         */
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
        /*
         * @config 用于对_datalist中的字符串进行高亮处理，将得到的新数组赋给_datalist，实现弹出层的更新
         * @param items {String} datalist中的每一项
         * @returns {String} 查询字符串
         */
        highlightData: function(item, str) {
            var query = escapeRegExp(str)
            return item.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
                return '<strong style="color:#FF6600;">' + match + '</strong>'
            })
        }
    }
    function hyphen(target) {
        //转换为连字符线风格
        return target.replace(/([A-Z]+)/g, function(a, b) {
            return "-" + b.toLowerCase()
        })
    }
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
    }
    function getCaretPosition(ctrl) {
        var caret  //取得光标的位置
        if (typeof ctrl.selectionStart === "number") {
            caret = ctrl.selectionStart
        } else {
            var selection = ctrl.selection.createRange() //这个TextRange对象不能重用
            selection.moveStart("character", -ctrl.value.length)
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
    /**
     * //获取光标位置 
function getCursor(elem) {
     //IE 9 ，10，其他浏览器
     if (elem.selectionStart !== undefined) {
         return elem.selectionStart;
     } else { //IE 6,7,8
         var range = document.selection.createRange();
         range.moveStart("character", -elem.value.length);
         var len = range.text.length;
         return len;
     }
 }
//设置光标位置
 function setCursor(elem, index) {
     //IE 9 ，10，其他浏览器
     if (elem.selectionStart !== undefined) {
         elem.selectionStart = index;
         elem.selectionEnd = index;
     } else { //IE 6,7,8
         var range = elem.createTextRange();
         range.moveStart("character", -elem.value.length); //左边界移动到起点
         range.move("character", index); //光标放到index位置
         range.select();
     }
 }
//获取选中文字
 function getSelection(elem) {
     //IE 9 ，10，其他浏览器
     if (elem.selectionStart !== undefined) {
         return elem.value.substring(elem.selectionStart, elem.selectionEnd);
     } else { //IE 6,7,8
         var range = document.selection.createRange();
         return range.text;
     }
 }
//设置选中范围
 function setSelection(elem, leftIndex, rightIndex) {
     if (elem.selectionStart !== undefined) { //IE 9 ，10，其他浏览器
         elem.selectionStart = leftIndex;
         elem.selectionEnd = rightIndex;
     } else { //IE 6,7,8
         var range = elem.createTextRange();
         range.move("character", -elem.value.length); //光标移到0位置。
         //这里一定是先moveEnd再moveStart
         //因为如果设置了左边界大于了右边界，那么浏览器会自动让右边界等于左边界。
         range.moveEnd("character", rightIndex);
         range.moveStart("character", leftIndex);
         range.select();
     }
 }
    */
     
    //通过监听textarea,input的keyup进行，移动列表项的高亮位置
    function moveIndex(e, vmodel) {
        var max = vmodel._datalist.size()
        var code = e.which || e.keyCode
        //firefox down 为37

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
            case 63233:
                //safari
                // up arrow
                // avalon.log("+++++++++++++")

                var index = vmodel.activeIndex - 1
                if (index < 0) {
                    index = max - 1
                }
                vmodel.activeIndex = index
                break;
            case 40:
            case 63235:
                //safari
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
/**
 * @other
 * updateData是一个非常重要的配置项，用于与后端同步数据，下面是
 * ```js
 function updateData(vmodel, callback) {
 var model = vmodel.$model
 jQuery.post("url", {limit: model.limit, query: model.query}, function(data) {
 vmodel.datalist = data.datalist
 callback()
 })
 }
 ```
 */
/*
 <p><a href="http://dddemo.duapp.com/bootstrap"> http://dddemo.duapp.com/bootstrap</a></p>
 <p><a href=" http://www.cnblogs.com/haogj/p/3376874.html"> http://www.cnblogs.com/haogj/p/3376874.html</a></p>
 */

/**
 @links
 [例子1](avalon.at.ex1.html)
 */
/*
//针对可编辑div的定位
        function positionCursor(obj) {
            //光标定位到最后
            if (obj.createTextRange) { //ie
                var rtextRange = obj.createTextRange();
                rtextRange.moveStart('character', obj.value.length);
                rtextRange.collapse(true);
                rtextRange.select();
            } else if (obj.selectionStart) { //chrome "<input>"、"<textarea>"
                obj.selectionStart = obj.value.length;
            } else if (window.getSelection) {

                var sel = window.getSelection();

                var tempRange = document.createRange();
                var t = obj.lastChild;
                if (obj.childNodes.length == 1) {
                    tempRange.setStart(obj.firstChild, obj.firstChild.length); //单行时可以定位到最后
                } else if (obj.childNodes.length > 1) { //多行定位到最后
                    tempRange.setStart(that, that.childNodes.length);
                }

                sel.removeAllRanges();
                sel.addRange(tempRange);
            }
        }
 */
