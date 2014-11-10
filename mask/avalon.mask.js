/**
 * @cnName 输入引导模块
 * @enName validation
 * @introduce
 *  <p>这是ms-duplex2.0的一个扩展模块，用于引导用户输入。</p>
 *  <p>通过如下方式使用:</p>
 *  ```html
 *   <input ms-duplex-mask="a"  data-duplex-mask="((00/00其他字符0000)"/>
 *  ```
 */

define(["avalon"], function() {

    avalon.duplexHooks.mask = {
        init: function(data) {
            var elem = data.element
            var maskText = elem.getAttribute("data-duplex-mask")
            if (data.msType === "mask") {
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

                        // console.log(k)
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
        this.mask = mask
        this.element = element //@config {Element} 组件作用的对象
        this.oldValue = ""
        this.value = ""//@config 默认值
    }
    Mask.defaults = {
        placehoder: "_",
        hideIfInvalid: false, //@config {Boolean} false, 如果它不匹配就会在失去焦点时清空value
        hideIfPristine: true, //@config {Boolean} "true"如果它没有改动过就会在失去焦点时清空value
        showIfHover: false,
        showIfFocus: true,
        showAlways: false,
        translations: {//@config {Object} 对每个字符进行翻译
            0: {pattern: /\d/},
            9: {pattern: /\d/, optional: true},
            A: {pattern: /[a-zA-Z0-9]/},
            S: {pattern: /[a-zA-Z]/}
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
    var widget = function() {
    }
    widget.defaults = {
        /*
         * @config {String} "_"，将需要替换的元字符全部变成"_"
         */
        placehoder: "_",
        hideIfInvalid: false, //@config {Boolean} false, 如果它不匹配就会在失去焦点时清空value
        hideIfPristine: true //@config {Boolean} "true"如果它没有改动过就会在失去焦点时清空value
    }
})