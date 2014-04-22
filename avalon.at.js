//avalon 1.2.5 2014.4.2
define(["avalon", "text!avalon.at.popup.html"], function(avalon, tmpl) {
    var widget = avalon.ui.at = function(element, data, vmodels) {

        var options = data.atOptions, $element = avalon(element), keyupCallback, popup
        var arr = tmpl.split("MS_OPTION_STYLE")
        var cssText = arr[1].replace(/<\/?style>/g, "")
        var styleEl = document.getElementById("avalonStyle")
        var popupHTML = arr[0]
        try {
            styleEl.innerHTML += cssText
        } catch (e) {
            styleEl.styleSheet.cssText += cssText
        }
        var vmodel = avalon.define(data.atId, function(vm) {

            avalon.mix(vm, options)

            vm.$skipArray = ["at", "widgetElement", "datalist"]
            vm.widgetElement = element

            vm.$init = function() {
                var _vmodels = [vmodel].concat(vmodels)
                keyupCallback = $element.bind("keyup", function(e) {
                    var value = this.value
                    var at = options.at
                    var index = value.lastIndexOf(at)
                    if (index > -1) {
                        if (!popup) {
                            var str = value.replace(/\s+$/g, "").split("").join("<wbr>") + "<wbr>"
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
                            popup = document.createElement("div")
                            popup.innerHTML = popupHTML
                            document.body.appendChild(popup)
                            popup.className = "ui-at"
                            avalon(popup).css({
                                top: offset.top + top,
                                left: offset.left + left,
                                position: "absolute"
                            })
                            avalon.scan(popup, _vmodels)
                            document.body.removeChild(fakeTextArea)
                            fakeTextArea = null
                        }
                        var rightContext = value.substr(index + 1, options.maxLength)
                        if (rightContext.length >= options.minLength) {
                            // 取得@右边的内容，一直取得其最近的一个空白为止
                            var match = rightContext.match(/^\S+/)
                            if (match) {
                                var query = match[0], lowquery = query.toLowerCase()
                                var unique = {}
                               //精确匹配
                                var datalist = vmodel.datalist.filter(function(el) {
                                    if (el.indexOf(query) > -1) {
                                        unique[el] = 1
                                        return true
                                    }
                                })
                                //模糊匹配
                                vmodel.datalist.forEach(function(el) {
                                    var str = el.toLowerCase()
                                    if (!unique[el]) {
                                        if (str.indexOf(lowquery) > -1) {
                                            unique[el] = 1
                                            datalist.push(el)
                                        }
                                    }
                                })
                                if(vmodel.$model._datalist.join(",") != datalist.join(",")){
                                    vmodel._datalist = datalist
                                }
                            
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


        })
        return vmodel

    }
    widget.vertion = 1.0
    widget.defaults = {
        at: "@", //默认的标识符,
        datalist: [], //字符串数组
        _datalist: [],
        popupHTML: "",
        items: 5, //最多显示多少个
        maxLength: 20, //@之后多长的字符串可以匹配
        minLength: 1, //当前文本输入框中字符串达到该属性值时才进行匹配处理，默认：1；
        highlightCallback: avalon.noop,
        sortCallback: avalon.noop,
        matchCallback: avalon.noop,
    }

    return avalon
})
