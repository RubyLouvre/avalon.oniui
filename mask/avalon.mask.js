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
                data.msMask = new Mask(elem, maskText)
                function keyCallback(e) {
                    var k = e.which || e.keyCode
                    if (e.type === "click") {
                        k = 100
                    }
                    var valueLength = elem.value.length
                    if (valueLength && (data.msMask.validMask.length !== valueLength)) {
                        data.msMask.masked = false
                    }

                    if (e.ctrlKey || e.altKey || e.metaKey || k < 32) //Ignore
                        return

                    var caret = getCaret(elem)
                    var impurity = data.msMask.impurity
                    function getPos(i, left, n) {
                        var step = left ? -1 : +1
                        var old = i
                        while (i >= -1 && i < n) {
                            i = i + step
                            if (!impurity[i] && i !== -1 && i !== n) {
                                return i
                            }
                            if (i === -1) {
                                return  old + 1
                            }
                            if (i === n) {
                                return  old - 1
                            }
                        }
                    }
                    var n = elem.value.length - 1
                    var pos
                    if (k === 37 || k == 38) {//向左向上移动光标
                        pos = caret.start - 1
                        if (pos < 1) {
                            pos = 0
                        }
                        if (impurity[pos]) {
                            pos = getPos(pos, true, n)
                        }
                    } else if (k === 39 || k == 40) {//向右向下移动光标
                        pos = caret.end//只操作end
                        if (pos >= n) {
                            pos -= 1
                        }
                        if (impurity[pos]) {
                            pos = getPos(pos, false, n)
                        }
                    } else if (k && k !== 13) {//如果是在光标高亮处直接键入字母
                        pos = caret.start
                        if (pos >= n) {
                            pos -= 1
                        }
                        if (impurity[pos]) {
                            pos = getPos(pos, false, n)
                        }
                    }
                    if (typeof pos === "number") {
                        setTimeout(function() {
                            setCaret(elem, pos, pos + 1)
                        })
                    }

                    if (e.preventDefault) {
                        e.preventDefault()
                    } else {
                        e.returnValue = false
                    }
                }
                data.bound("keyup", keyCallback)
                data.bound("click", keyCallback)
                var mask = data.msMask
                function showMask(e) {
                    if (!e || !mask.masked) {
                        mask.masked = true
                        elem.value = avalon.duplexHooks.mask.set(mask.value || mask.mask, data)
                    }
                }
                function hideMask() {
                    if ((mask.clearIfInvalid && !mask.valid) ||
                            (mask.clearIfPristine && mask.value === mask.validMask)) {
                        elem.value = mask.oldValue = mask.masked = ""//注意IE6-8下，this不指向element
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
                        data.bound("mouserover", showMask)
                        data.bound("mouseout", hideMask)
                    }
                }
            } else {
                throw ("请指定data-duplex-mask")
            }
        },
        get: function(val, data) {
            var mask = data.msMask
            if (mask.masked) {
                mask.oldValue = mask.value = val
                return mask.getMaskedVal(true)
            } else {
                return val
            }
        },
        set: function(val, data) {
            var mask = data.msMask
            if (mask.masked) {
                mask.value = val
                mask.value = mask.getMaskedVal()
                mask.value = mask.getMaskedVal(true) //得到上一次的maskValue,并对数据进行清洗
                var newValue = mask.getMaskedVal()    //得到第二次的maskValue
                if (mask.oldValue !== newValue) {
                    var pos = mask.caretStart
                    setTimeout(function() {
                        setCaret(data.element, pos, pos + 1)
                    }, 50)
                }
                return newValue
            } else {
                return val
            }
        }
    }

    function Mask(element, mask) {
        var options = avalon.getWidgetData(element, "duplexMask")
        var t = {}
        try {
            t = new Function("return " + options.translations)()
        } catch (e) {
        }
        avalon.mix(this, Mask.defaults, options)
        this.translations = avalon.mix({}, Mask.defaults.translations, t)
        this.mask = mask //@config {String} 用于提示用户输入的mask字符串，用户只能在占位符上输入（会有光标引导你）,用户必须设置data-duplex-mask属性
        this.element = element //@config {Element} 组件实例要作用的input元素
        this.oldValue = "" //@config {String} 元素之前的value值
        this.value = ""//@config {String} 元素现在的value值
        this.impurity = {} //@config {Object} mask分别两部分，一些部分用户需要输入，一部分是提示或美化用的杂质，impurity是用于装载这些杂质在这个mask中的索引值，它用于光标引导功能
    }
    Mask.defaults = {
        placehoder: "_", //@config {Boolean} "_", 将元字符串换为"_"显示到element.value上，如99/99/9999会替换为__/__/____，可以通过data-duplex-mask-placehoder设置
        hideIfInvalid: false, //@config {Boolean} false, 如果它不匹配就会在失去焦点时清空value，可以通过data-duplex-mask-hide-if-invalid设置
        hideIfPristine: true, //@config {Boolean} true如果它没有改动过就会在失去焦点时清空value，可以通过data-duplex-mask-hide-if-pristine设置
        showIfHover: false, //@config {Boolean} false 当鼠标掠过其元素上方就显示它出来，可以通过data-duplex-mask-show-if-hover设置
        showIfFocus: true, //@config {Boolean} true 当用户让其元素得到焦点就显示它出来，可以通过data-duplex-mask-show-if-focus设置
        showAlways: false, //@config {Boolean} false 总是显示它，可以通过data-duplex-mask-show-always设置
        translations: {//@config {Object} 此对象上每个键名都是元字符，都对应一个对象，上面有pattern(正则)，placehoder(占位符，如果你不想用"_"),optional（表示可选）
            "0": {pattern: /\d/, optional: true},
            "9": {pattern: /\d/},
            "A": {pattern: /[a-zA-Z]/},
            "*": {pattern: /[a-zA-Z0-9]/}
        }
    }
    Mask.prototype = {
        getMaskedVal: function(skipMask) {
            var mask = this.mask
            var value = this.value
            var valueArray = value.split("")
            var maskArray = mask.split("")
            var translations = this.translations
            var buf = []
            var caretIndex = -1 //光标的插入位置
            var valid = true
            var impurityIndex = 0
            this.impurity = {}
            if (value === mask) {
                //如果不存在或一致，那么先将元字符转换为占位符,比如
                //将00/00/0000转换为__/__/____
                for (var i = 0, n = maskArray.length; i < n; i++) {
                    var m = maskArray[i]
                    if (translations[m]) {
                        valueArray[i] = translations[m].placehoder || this.placehoder
                    } else {
                        valueArray[i] = m
                    }
                }
                this.validMask = valueArray.join("")
            }

            while (maskArray.length) {
                var m = maskArray.shift()
                if (valid) {//得控位获得焦点时,光标应该定位的位置
                    caretIndex++
                }
                if (translations[m]) {
                    var el = valueArray.shift()//123456
                    var translation = translations[m]
                    var pattern = translation.pattern

                    if (el && el.match(pattern)) {
                        buf.push(el)
                    } else {
                        valid = false
                        if (!translation.optional && !skipMask) {
                            buf.push(translation.placehoder || this.placehoder)
                        }
                    }
                } else {
                    this.impurity[impurityIndex] = true//收集杂质的位置
                    if (valueArray[0] === m) {// 当__/__/____遇到12/34/____时，/要去掉
                        valueArray.shift()
                    }
                    if (!skipMask) {
                        buf.push(m)
                    }
                }
                impurityIndex++
            }
            this.valid = valid
            this.caretStart = caretIndex
            return  buf.join("")
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
 *    <tr><td>0</td><td>表示任何数字，0-9，正则为/\d/， <code>可选</code>，即不匹配对最终结果也没关系</td></tr>
 *    <tr><td>9</td><td>表示任何数字，0-9，正则为/\d/</td></tr>
 *    <tr><td>A</td><td>表示任何字母，，正则为/[a-zA-Z]/</td></tr>
 *    <tr><td>*</td><td>表示任何非空字符，正则为/\S/</td></tr>
 * </table>
 * 
 */
/**
 @links
 [例子](avalon.mask.ex1.html)
 */