"use strict";
var Mask = function(ctrl, data) {
    var el = avalon(ctrl)
    var jMask = this, old_value = el.val(), regexMask;
    var mask = el.data("duplexMask")
    var p = {
        invalid: [],
        getCaret: function() {
            try {
                var sel,
                        pos = 0,
                        dSel = document.selection,
                        cSelStart = ctrl.selectionStart;
                // IE Support
                if (dSel && navigator.appVersion.indexOf("MSIE 10") === -1) {
                    sel = dSel.createRange();
                    sel.moveStart('character', -el.value.length);
                    pos = sel.text.length;
                }
                // Firefox support
                else if (cSelStart || cSelStart === '0') {
                    pos = cSelStart;
                }
                return pos;
            } catch (e) {
            }
        },
        setCaret: function(pos) {
            try {
                var range
                if (ctrl.setSelectionRange) {
                    ctrl.setSelectionRange(pos, pos);
                } else if (ctrl.createTextRange) {
                    range = ctrl.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', pos);
                    range.moveStart('character', pos);
                    range.select();
                }
            } catch (e) {
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
            if ($.inArray(keyCode, jMask.byPassKeys) === -1) {

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
    };


    // public methods
    jMask.mask = mask;
    jMask.options = options;


    // get value without mask
    jMask.getCleanVal = function() {
        return p.getMasked(true);
    };

    jMask.init = function(only_mask) {
        only_mask = only_mask || false;
        options = options || {};

        jMask.byPassKeys = $.jMaskGlobals.byPassKeys;
        jMask.translation = $.jMaskGlobals.translation;

        jMask.translation = $.extend({}, jMask.translation, options.translation);
        jMask = $.extend(true, {}, jMask, options);

        regexMask = p.getRegexMask();

        if (only_mask === false) {

            if (options.placeholder) {
                el.attr('placeholder', options.placeholder);
            }

            // autocomplete needs to be off. we can't intercept events
            // the browser doesn't  fire any kind of event when something is 
            // selected in a autocomplete list so we can't sanitize it.
            el.attr('autocomplete', 'off');
            p.destroyEvents();
            p.events();

            var caret = p.getCaret();
            p.val(p.getMasked());
            p.setCaret(caret + p.getMCharsBeforeCount(caret, true));

        } else {
            p.events();
            p.val(p.getMasked());
        }
    };



};



$.fn.mask = function(mask, options) {
    options = options || {};
    var selector = this.selector,
            globals = $.jMaskGlobals,
            interval = $.jMaskGlobals.watchInterval,
            maskFunction = function() {
                if (notSameMaskObject(this, mask, options)) {
                    return $(this).data('mask', new Mask(this, mask, options));
                }
            };

    $(this).each(maskFunction);

    if (selector && selector !== "" && globals.watchInputs) {
        clearInterval($.maskWatchers[selector]);
        $.maskWatchers[selector] = setInterval(function() {
            $(document).find(selector).each(maskFunction);
        }, interval);
    }
};


var globals = {
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
};




avalon.duplexHooks.mask = {
    init: function(_, data) {
        data.mask = new Mask(data.element)
        data.mask.init()
    }
}