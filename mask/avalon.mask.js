/**
 * @cnName 输入引导模块
 * @enName mask
 * @introduce
 *  <p>这是ms-duplex2.0的一个扩展模块，用于引导用户输入。</p>
 *  <p>通过如下方式使用:</p>
 *  ```html
 *   <input ms-duplex-mask="a"  data-duplex-mask="((00/00其他字符0000)"/>
 *  ```
 */

define(["avalon"], function() {

    avalon.duplexHooks.mask = {
        init: function(_, data) {
            var elem = data.element
            var maskText = elem.getAttribute("data-duplex-mask")
            if (maskText) {
                var mask = data.msMask = new Mask(elem, maskText)
                data.bound("keydown", function(e) {
                    elem.userTrigger = false
                    var k = e.which || e.keyCode
                    if (e.ctrlKey || e.altKey || e.metaKey || k < 32) { //Ignore
                        return
                    }
                    var caret = getCaret(elem)
                    if (k === 39) {//向右
                        var i = mask.caretData.indexOf(null, caret.end)
                        if (i === -1) {
                            i = mask.caretData.indexOf(null)
                        }
                        setTimeout(function() {
                            setCaret(elem, i, i + 1)
                        })
                    } else if (k == 37) {//向左
                        var _ = mask.caretData.slice(0, caret.start)
                        var i = _.lastIndexOf(null)
                        if (i === -1) {
                            i = mask.caretData.indexOf(null)
                        }
                        setTimeout(function() {
                            setCaret(elem, i, i + 1)
                        })
                    } else {
                        elem.userTrigger = true
                    }
                })
                data.bound("click", function(e) {
                    setTimeout(function() {//搞掉keyup中的  elem.userTrigger = true
                        elem.userTrigger = false
                    })
                    if (elem.userTrigger === true) {//防止触发了keyup的操作又触发这里的
                        return
                    }
                    var caret = getCaret(elem)
                    var i = mask.caretData.indexOf(null, caret.end)
                    if (i === -1) {
                        i = mask.caretData.indexOf(null)
                    }
                    setTimeout(function() {
                        setCaret(elem, i, i + 1)
                    })
                })
                function showMask(e) {
                    elem.value = mask.valueMask
                    elem.userTrigger = true
                    var index = mask.vmodelData.indexOf(null)//定位于第一个要填空的位置上
                    if (index !== -1) {
                        setCaret(elem, index, index + 1)
                    }
                }
                function hideMask() {
                    var invalid = mask.vmodelData.some(function(el) {
                        return el === null
                    })
                    if ((mask.hideIfInvalid && invalid) ||
                            (mask.hideIfPristine && elem.value === mask.valueMask)) {
                        elem.value = elem.oldValue = "" //注意IE6-8下，this不指向element
                    }
                }
                if (mask.showAlways) {
                    showMask()
                } else {
                    if (mask.showIfFocus) {
                        data.bound("focus", showMask)
                        data.bound("blur", hideMask)
                    }
                    if (mask.showIfHover) {
                        data.bound("mouseover", showMask)
                        data.bound("mouseout", hideMask)
                    }
                }
            } else {
                throw ("请指定data-duplex-mask")
            }
        },
        get: function(val, data) {//用户点击时会先触发这里
            var elem = data.element
            var mask = data.msMask
            if (elem.userTrigger) {
                mask.getter(val)
                elem.oldValue = val
                elem.userTrigger = false
                var index = mask.vmodelData.indexOf(null)
                if (index === -1) {
                    var caret = getCaret(elem)
                    var index = mask.caretData.indexOf(null, caret.end)
                    if (index === -1) {
                        index = mask.caretData.indexOf(null)
                    }
                    setCaret(elem, index, index + 1)
                } else {
                    setTimeout(function() {
                        setCaret(elem, index, index + 1)
                    })
                }
            }
            elem.oldValue = val
            return mask.vmodelData.join("")
        },
        set: function(val, data) {//将vm中数据放到这里进行处理，让用户看到经过格式化的数据
            // 第一次总是得到符合格式的数据
            var elem = data.element
            var mask = data.msMask
            if (val !== "") {
                if (!mask.match(val)) {
                    elem.oldValue = mask.fix(val)
                }
                return data.msMask.viewData.join("")
            } else {
                return ""
            }
        }
    }

    function Mask(element, dataMask) {
        var options = avalon.getWidgetData(element, "duplexMask")
        var t = {}
        try {
            t = new Function("return " + options.translations)()
        } catch (e) {
        }
        avalon.mix(this, Mask.defaults, options)
        this.translations = avalon.mix({}, Mask.defaults.translations, t)
        this.element = element //@config {Element} 组件实例要作用的input元素
        this.dataMask = dataMask //@config {String} 用户在input/textarea元素上通过data-duplex-mask定义的属性值
        //第一次将dataMask放进去，得到element.value为空时，用于提示的valueMask
        getDatas.call(this)
        this.valueMask = this.viewData.join("")// valueMask中的元字符被全部替换为对应的占位符后的形态，用户实际上在element.value看到的形态
    }
    Mask.defaults = {
        placehoder: "_", //@config {Boolean} "_", 将元字符串换为"_"显示到element.value上，如99/99/9999会替换为__/__/____，可以通过data-duplex-mask-placehoder设置
        hideIfInvalid: false, //@config {Boolean} false, 如果它不匹配就会在失去焦点时清空value(匹配是指所有占位符都被正确的字符填上)，可以通过data-duplex-mask-hide-if-invalid设置
        hideIfPristine: true, //@config {Boolean} true如果它没有改动过就会在失去焦点时清空value，可以通过data-duplex-mask-hide-if-pristine设置
        showIfHover: false, //@config {Boolean} false 当鼠标掠过其元素上方就显示它出来，可以通过data-duplex-mask-show-if-hover设置
        showIfFocus: true, //@config {Boolean} true 当用户让其元素得到焦点就显示它出来，可以通过data-duplex-mask-show-if-focus设置
        showAlways: false, //@config {Boolean} false 总是显示它，可以通过data-duplex-mask-show-always设置
        translations: {//@config {Object} 此对象上每个键名都是元字符，都对应一个对象，上面有pattern(正则)，placehoder(占位符，如果你不想用"_")
            "9": {pattern: /\d/},
            "A": {pattern: /[a-zA-Z]/},
            "*": {pattern: /[a-zA-Z0-9]/}
        }
    }
    function getDatas() {
        var array = this.dataMask.split("")//用户定义的data-duplex-mask的值
        var n = array.length
        var translations = this.translations
        this.viewData = array.concat() //占位符
        this.caretData = array.concat()//光标
        this.vmodelData = new Array(n)
        // (9999/99/99) 这个是data-duplex-mask的值，其中“9”为“元字符”，“(”与 “/” 为“提示字符”
        // (____/__/__) 这是用占位符处理后的mask值
        for (var i = 0; i < n; i++) {
            var m = array[i]
            if (translations[m]) {
                var translation = translations[m]
                this.viewData[i] = translation.placehoder || this.placehoder
                this.caretData[i] = null
                this.vmodelData[i] = null
            }
        }
    }

    Mask.prototype = {
        match: function(value) {
            if (value.length === this.valueMask.length) {
                var array = value.split("")
                var translations = this.translations
                for (var i = 0, n = array.length; i < n; i++) {
                    var m = array[i]
                    if (translations[m]) {
                        var translation = translations[m]
                        var pattern = translation.pattern
                        var placehoder = translation.placehoder || this.placehoder
                        if (m === placehoder) {
                            continue
                        }
                        if (!pattern.test(m)) {
                            return false
                        }
                    } else {
                        if (m !== this.valueMask.charAt(i)) {
                            return false
                        }
                    }
                }
                return true
            } else {
                return false
            }
        },
        fix: function(value) {//如果不符合格式，则补上提示符与占位符
            var array = this.dataMask.split("")
            var valueArray = value.split("")
            var translations = this.translations
            for (var i = 0, n = array.length; i < n; i++) {
                var m = array[i]
                if (translations[m]) {
                    var translation = translations[m]
                    var pattern = translation.pattern
                    if (pattern.test(valueArray[0])) {
                        array[i] = valueArray.shift()
                    } else {
                        array[i] = translation.placehoder || this.placehoder
                    }
                }
            }
            this.viewData = array
            return array.join("")
        },
        getter: function(value) {
            var maskArray = this.dataMask.split("")//用户定义的data-duplex-mask的值
            var valueArray = value.split("")
            var translations = this.translations
            var viewData = []
            var vmodelData = []

            // (9999/99/99) 这个是data-duplex-mask的值，其中“9”为“元字符”，“(”与 “/” 为“提示字符”
            // (____/__/__) 这是用占位符处理后的mask值
            while (maskArray.length) {
                var m = maskArray.shift()
                var el = valueArray.shift()//123456

                if (translations[m]) {//如果碰到元字符
                    var translation = translations[m]
                    var pattern = translation.pattern
                    if (el && el.match(pattern)) {//如果匹配

                        vmodelData.push(el)
                        viewData.push(el)

                    } else {
                        vmodelData.push(null)
                        viewData.push(translation.placehoder || this.placehoder)
                    }
                } else {//如果是提示字符 
                    viewData.push(el)
                    vmodelData.push(void 0)
                }
            }
            this.viewData = viewData
            this.vmodelData = vmodelData
        }
    }

    function getCaret(el) {
        var start = 0,
                end = 0
        if (typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") {
            start = el.selectionStart;
            end = el.selectionEnd;
        } else {
            var range = document.selection.createRange()
            if (range && range.parentElement() === el) {
                var len = el.value.length;
                var normalizedValue = el.value.replace(/\r?\n/g, "\n")

                var textInputRange = el.createTextRange()
                textInputRange.moveToBookmark(range.getBookmark())

                var endRange = el.createTextRange();
                endRange.collapse(false);

                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len
                } else {
                    start = -textInputRange.moveStart("character", -len)
                    start += normalizedValue.slice(0, start).split("\n").length - 1

                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len
                    } else {
                        end = -textInputRange.moveEnd("character", -len)
                        end += normalizedValue.slice(0, end).split("\n").length - 1
                    }
                }
            }
        }
        return {
            start: start,
            end: end
        };
    }
    //setCaret(ctrl, a, b) 高亮部分停留在第a个字符上，但不包含b
    function setCaret(ctrl, start, end) {
        if (!ctrl.value || ctrl.readOnly)
            return
        if (!end) {
            end = start
        }
        if (ctrl.setSelectionRange) {
            ctrl.selectionStart = start
            ctrl.selectionEnd = end
            ctrl.focus()
        } else {
            var range = ctrl.createTextRange()
            range.collapse(true);
            range.moveStart("character", start)
            range.moveEnd("character", end - start)
            range.select()
        }
    }
})
/**
 * @other
 * data-duplex-mask-translations应该对应的一个对象，默认情况下已经有如下东西了：
 * <table class="table-doc" border="1">
 *     <colgroup>
 <col width="190" />
 </colgroup>
 *    <tr><th>元字符</th><th>意义</th></tr>
 *    <tr><td>9</td><td>表示任何数字，0-9，正则为/\d/</td></tr>
 *    <tr><td>A</td><td>表示任何字母，，正则为/[a-zA-Z]/</td></tr>
 *    <tr><td>*</td><td>表示任何非空字符，正则为/\S/</td></tr>
 * </table>
 * 
 */

//https://github.com/RubyLouvre/avalon/issues/550
/**
 @links
 [例子1](avalon.mask.ex1.html)
 [例子2](avalon.mask.ex2.html)
 [例子3](avalon.mask.ex3.html)
 */