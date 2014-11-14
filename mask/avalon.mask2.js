"use strict";
var Mask = function(ctrl, data) {
    var el = avalon(ctrl)
    var jMask = this, old_value = el.val(), regexMask;
    var mask = ctrl.getAttribute("data-duplex-mask")
    var options = avalon.getWidgetData(element, "duplexMask")
    var t = {}
    try {
        t = new Function("return " + options.translations)()
    } catch (e) {
    }
    avalon.mix(this, Mask.defaults, options)
    this.translations = avalon.mix({}, Mask.defaults.translations, t)
    //data-duplex-mask=AAA 000-S0S
    //data-duplex-mask-reverse=true
    //data-duplex-mask-clear-if-not-match=true
    //data-dupex-mask-translation="{ 'r': {  pattern: /[\/]/,  fallback: '/' }}" 
    //data-dupex-mask-placeholder: "__/__/____"
    var p = {
        invalid: [],
        getCaret: function() {
            var caret = 0 //取得光标的位置
            if (typeof ctrl.selectionStart === "number") {
                caret = ctrl.selectionStart
            } else {
                var selection = ctrl.selection.createRange() //这个TextRange对象不能重用
                selection.moveStart("character", -ctrl.value.length)
                caret = selection.text.length;
            }
            return caret
        },
        setCaret: function(pos) {
            if (ctrl.setSelectionRange) {
                ctrl.setSelectionRange(pos, pos);
            } else if (ctrl.createTextRange) {
                var range = ctrl.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        },
        events: function() {
            function keydown() {
                old_value = el.val()
            }
            function delay() {
                setTimeout(function() {
                    keydown()
                    p.behaviour()
                }, 100);
            }
            data.bound("keyup", p.behaviour)
            data.bound("paste", delay)
            data.bound("drop", delay)
            data.bound("change", function() {
                el.data('changed', true)
            })
            data.bound("keydown", keydown)
            data.bound("blur", keydown)

        },
        getRegexMask: function() {
            var maskChunks = [], translation, pattern, optional, recursive, oRecursive, r;

            for (var i = 0; i < mask.length; i++) {
                translation = jMask.translation[mask[i]];

                if (translation) {

                    pattern = translation.pattern.toString().replace(/.{1}$|^.{1}/g, "");
                    optional = translation.optional;
                    recursive = translation.recursive;

                    if (recursive) {
                        maskChunks.push(mask[i]);
                        oRecursive = {digit: mask[i], pattern: pattern};
                    } else {
                        maskChunks.push(!optional && !recursive ? pattern : (pattern + "?"));
                    }

                } else {
                    maskChunks.push(mask[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                }
            }

            r = maskChunks.join("");

            if (oRecursive) {
                r = r.replace(new RegExp("(" + oRecursive.digit + "(.*" + oRecursive.digit + ")?)"), "($1)?")
                        .replace(new RegExp(oRecursive.digit, "g"), oRecursive.pattern);
            }

            return new RegExp(r);
        },
        val: function(v) {
            if (arguments.length > 0) {
                el.val(v)
                return v
            } else {
                return el.val()
            }
        },
        getMCharsBeforeCount: function(index, onCleanVal) {
            for (var count = 0, i = 0, maskL = mask.length; i < maskL && i < index; i++) {
                if (!jMask.translation[mask.charAt(i)]) {
                    index = onCleanVal ? index + 1 : index;
                    count++;
                }
            }
            return count;
        },
        caretPos: function(originalCaretPos, oldLength, newLength, maskDif) {
            var translation = jMask.translation[mask.charAt(Math.min(originalCaretPos - 1, mask.length - 1))];

            return !translation ? p.caretPos(originalCaretPos + 1, oldLength, newLength, maskDif)
                    : Math.min(originalCaretPos + newLength - oldLength - maskDif, newLength);
        },
        behaviour: function(e) {
            e = e || window.event;
            p.invalid = [];
            var keyCode = e.keyCode || e.which;
            if (jMask.byPassKeys.indexOf(keyCode) === -1) {

                var caretPos = p.getCaret(),
                        currVal = p.val(),
                        currValL = currVal.length,
                        changeCaret = caretPos < currValL,
                        newVal = p.getMasked(),
                        newValL = newVal.length,
                        maskDif = p.getMCharsBeforeCount(newValL - 1) - p.getMCharsBeforeCount(currValL - 1);

                p.val(newVal);

                // change caret but avoid CTRL+A
                if (changeCaret && !(keyCode === 65 && e.ctrlKey)) {
                    // Avoid adjusting caret on backspace or delete
                    if (!(keyCode === 8 || keyCode === 46)) {
                        caretPos = p.caretPos(caretPos, currValL, newValL, maskDif);
                    }
                    p.setCaret(caretPos);
                }

                return p.callbacks(e);
            }
        },
        getMasked: function(skipMaskChars) {
            var buf = [],
                    value = p.val(),
                    m = 0, maskLen = mask.length,
                    v = 0, valLen = value.length,
                    offset = 1, addMethod = "push",
                    resetPos = -1,
                    lastMaskChar,
                    check;

            if (options.reverse) {
                addMethod = "unshift";
                offset = -1;
                lastMaskChar = 0;
                m = maskLen - 1;
                v = valLen - 1;
                check = function() {
                    return m > -1 && v > -1;
                };
            } else {
                lastMaskChar = maskLen - 1;
                check = function() {
                    return m < maskLen && v < valLen;
                };
            }

            while (check()) {
                var maskDigit = mask.charAt(m),
                        valDigit = value.charAt(v),
                        translation = jMask.translation[maskDigit];

                if (translation) {
                    if (valDigit.match(translation.pattern)) {
                        buf[addMethod](valDigit);
                        if (translation.recursive) {
                            if (resetPos === -1) {
                                resetPos = m;
                            } else if (m === lastMaskChar) {
                                m = resetPos - offset;
                            }

                            if (lastMaskChar === resetPos) {
                                m -= offset;
                            }
                        }
                        m += offset;
                    } else if (translation.optional) {
                        m += offset;
                        v -= offset;
                    } else if (translation.fallback) {
                        buf[addMethod](translation.fallback);
                        m += offset;
                        v -= offset;
                    } else {
                        p.invalid.push({p: v, v: valDigit, e: translation.pattern});
                    }
                    v += offset;
                } else {
                    if (!skipMaskChars) {
                        buf[addMethod](maskDigit);
                    }

                    if (valDigit === maskDigit) {
                        v += offset;
                    }

                    m += offset;
                }
            }

            var lastMaskCharDigit = mask.charAt(lastMaskChar);
            if (maskLen === valLen + 1 && !jMask.translation[lastMaskCharDigit]) {
                buf.push(lastMaskCharDigit);
            }

            return buf.join("");
        },
        callbacks: function(e) {
            var val = p.val(),
                    changed = val !== old_value,
                    defaultArgs = [val, e, el, options],
                    callback = function(name, criteria, args) {
                        if (typeof options[name] === "function" && criteria) {
                            options[name].apply(this, args);
                        }
                    };

            callback('onChange', changed === true, defaultArgs);
            callback('onKeyPress', changed === true, defaultArgs);
            callback('onComplete', val.length === mask.length, defaultArgs);
            callback('onInvalid', p.invalid.length > 0, [val, e, el, p.invalid, options]);
        }
    }
// public methods
    jMask.mask = mask;
    jMask.options = options;


// get value without mask
    jMask.getCleanVal = function() {
        return p.getMasked(true);
    };

}
Mask.defaults = {
    maskElements: 'input,td,span,div',
    dataMaskAttr: '*[data-mask]',
    dataMask: true,
    watchInterval: 300,
    watchInputs: true,
    watchDataMask: false,
    byPassKeys: [9, 16, 17, 18, 36, 37, 38, 39, 40, 91],
    translation: {
        '0': {pattern: /\d/},
        '9': {pattern: /\d/, optional: true},
        '#': {pattern: /\d/, recursive: true},
        'A': {pattern: /[a-zA-Z0-9]/},
        'S': {pattern: /[a-zA-Z]/}
    }
}


avalon.duplexHooks.mask = {
    init: function(_, data) {
        data.mask = new Mask(data.element)
        data.mask.init()
    }
}