/*==================================================
 Copyright (c) 2013-2015 司徒正美 and other contributors
 http://www.cnblogs.com/rubylouvre/
 https://github.com/RubyLouvre
 http://weibo.com/jslouvre/
 
 Released under the MIT license
 avalon.shim.js(无加载器版本) 1.45 built in 2015.7.13
 support IE6+ and other browsers
 ==================================================*/
(function(global, factory) {

    if (typeof module === "object" && typeof module.exports === "object") {
        // For CommonJS and CommonJS-like environments where a proper `window`
        // is present, execute the factory and get avalon.
        // For environments that do not have a `window` with a `document`
        // (such as Node.js), expose a factory as module.exports.
        // This accentuates the need for the creation of a real `window`.
        // e.g. var avalon = require("avalon")(window);
        module.exports = global.document ? factory(global, true) : function(w) {
            if (!w.document) {
                throw new Error("Avalon requires a window with a document")
            }
            return factory(w)
        }
    } else {
        factory(global)
    }

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function(window, noGlobal){

/*********************************************************************
 *                    全局变量及方法                                  *
 **********************************************************************/
var expose = new Date() - 0
//http://stackoverflow.com/questions/7290086/javascript-use-strict-and-nicks-find-global-function
var DOC = window.document
var head = DOC.getElementsByTagName("head")[0] //HEAD元素
var ifGroup = head.insertBefore(document.createElement("avalon"), head.firstChild) //避免IE6 base标签BUG
ifGroup.innerHTML = "X<style id='avalonStyle'>.avalonHide{ display: none!important }</style>"
ifGroup.setAttribute("ms-skip", "1")
ifGroup.className = "avalonHide"
var rnative = /\[native code\]/ //判定是否原生函数
function log() {
    if (window.console && avalon.config.debug) {
        // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
        Function.apply.call(console.log, console, arguments)
    }
}


var subscribers = "$" + expose
var otherRequire = window.require
var otherDefine = window.define
var innerRequire
var stopRepeatAssign = false
var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var rcomplexType = /^(?:object|array)$/
var rsvg = /^\[object SVG\w*Element\]$/
var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
var oproto = Object.prototype
var ohasOwn = oproto.hasOwnProperty
var serialize = oproto.toString
var ap = Array.prototype
var aslice = ap.slice
var Registry = {} //将函数曝光到此对象上，方便访问器收集依赖
var W3C = window.dispatchEvent
var root = DOC.documentElement
var avalonFragment = DOC.createDocumentFragment()
var cinerator = DOC.createElement("div")
var class2type = {}
"Boolean Number String Function Array Date RegExp Object Error".replace(rword, function (name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
})


function noop() {
}


function oneObject(array, val) {
    if (typeof array === "string") {
        array = array.match(rword) || []
    }
    var result = {},
            value = val !== void 0 ? val : 1
    for (var i = 0, n = array.length; i < n; i++) {
        result[array[i]] = value
    }
    return result
}

//生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var generateID = function (prefix) {
    prefix = prefix || "avalon"
    return String(Math.random() + Math.random()).replace(/\d\.\d{4}/, prefix)
}
function IE() {
    if (window.VBArray) {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    } else {
        return NaN
    }
}
var IEVersion = IE()

avalon = function (el) { //创建jQuery式的无new 实例化结构
    return new avalon.init(el)
}

avalon.profile = function () {
    if (window.console && avalon.config.profile) {
        Function.apply.call(console.log, console, arguments)
    }
}

/*视浏览器情况采用最快的异步回调*/
avalon.nextTick = new function () {// jshint ignore:line
    var tickImmediate = window.setImmediate
    var tickObserver = window.MutationObserver
    var tickPost = W3C && window.postMessage
    if (tickImmediate) {
        return tickImmediate.bind(window)
    }

    var queue = []
    function callback() {
        var n = queue.length
        for (var i = 0; i < n; i++) {
            queue[i]()
        }
        queue = queue.slice(n)
    }

    if (tickObserver) {
        var node = document.createTextNode("avalon")
        new tickObserver(callback).observe(node, {characterData: true})// jshint ignore:line
        return function (fn) {
            queue.push(fn)
            node.data = Math.random()
        }
    }

    if (tickPost) {
        window.addEventListener("message", function (e) {
            var source = e.source
            if ((source === window || source === null) && e.data === "process-tick") {
                e.stopPropagation()
                callback()
            }
        })

        return function (fn) {
            queue.push(fn)
            window.postMessage('process-tick', '*')
        }
    }

    return function (fn) {
        setTimeout(fn, 0)
    }
}// jshint ignore:line
/*********************************************************************
 *                 avalon的静态方法定义区                              *
 **********************************************************************/
avalon.init = function (el) {
    this[0] = this.element = el
}
avalon.fn = avalon.prototype = avalon.init.prototype

avalon.type = function (obj) { //取得目标的类型
    if (obj == null) {
        return String(obj)
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === "object" || typeof obj === "function" ?
            class2type[serialize.call(obj)] || "object" :
            typeof obj
}

var isFunction = typeof alert === "object" ? function (fn) {
    try {
        return /^\s*\bfunction\b/.test(fn + "")
    } catch (e) {
        return false
    }
} : function (fn) {
    return serialize.call(fn) === "[object Function]"
}
avalon.isFunction = isFunction

avalon.isWindow = function (obj) {
    if (!obj)
        return false
    // 利用IE678 window == document为true,document == window竟然为false的神奇特性
    // 标准浏览器及IE9，IE10等使用 正则检测
    return obj == obj.document && obj.document != obj //jshint ignore:line
}

function isWindow(obj) {
    return rwindow.test(serialize.call(obj))
}
if (isWindow(window)) {
    avalon.isWindow = isWindow
}
var enu
for (enu in avalon({})) {
    break
}
var enumerateBUG = enu !== "0" //IE6下为true, 其他为false
/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
avalon.isPlainObject = function (obj, key) {
    if (!obj || avalon.type(obj) !== "object" || obj.nodeType || avalon.isWindow(obj)) {
        return false;
    }
    try { //IE内置对象没有constructor
        if (obj.constructor && !ohasOwn.call(obj, "constructor") && !ohasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
        }
    } catch (e) { //IE8 9会在这里抛错
        return false;
    }
    if (enumerateBUG) {
        for (key in obj) {
            return ohasOwn.call(obj, key)
        }
    }
    for (key in obj) {
    }
    return key === void 0 || ohasOwn.call(obj, key)
}
if (rnative.test(Object.getPrototypeOf)) {
    avalon.isPlainObject = function (obj) {
        // 简单的 typeof obj === "object"检测，会致使用isPlainObject(window)在opera下通不过
        return serialize.call(obj) === "[object Object]" && Object.getPrototypeOf(obj) === oproto
    }
}
//与jQuery.extend方法，可用于浅拷贝，深拷贝
avalon.mix = avalon.fn.mix = function () {
    var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false

    // 如果第一个参数为布尔,判定是否深拷贝
    if (typeof target === "boolean") {
        deep = target
        target = arguments[1] || {}
        i++
    }

    //确保接受方为一个复杂的数据类型
    if (typeof target !== "object" && !isFunction(target)) {
        target = {}
    }

    //如果只有一个参数，那么新成员添加于mix所在的对象上
    if (i === length) {
        target = this
        i--
    }

    for (; i < length; i++) {
        //只处理非空参数
        if ((options = arguments[i]) != null) {
            for (name in options) {
                src = target[name]
                try {
                    copy = options[name] //当options为VBS对象时报错
                } catch (e) {
                    continue
                }

                // 防止环引用
                if (target === copy) {
                    continue
                }
                if (deep && copy && (avalon.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {

                    if (copyIsArray) {
                        copyIsArray = false
                        clone = src && Array.isArray(src) ? src : []

                    } else {
                        clone = src && avalon.isPlainObject(src) ? src : {}
                    }

                    target[name] = avalon.mix(deep, clone, copy)
                } else if (copy !== void 0) {
                    target[name] = copy
                }
            }
        }
    }
    return target
}

function _number(a, len) { //用于模拟slice, splice的效果
    a = Math.floor(a) || 0
    return a < 0 ? Math.max(len + a, 0) : Math.min(a, len);
}
avalon.mix({
    rword: rword,
    subscribers: subscribers,
    version: 1.45,
    ui: {},
    log: log,
    slice: W3C ? function (nodes, start, end) {
        return aslice.call(nodes, start, end)
    } : function (nodes, start, end) {
        var ret = []
        var len = nodes.length
        if (end === void 0)
            end = len
        if (typeof end === "number" && isFinite(end)) {
            start = _number(start, len)
            end = _number(end, len)
            for (var i = start; i < end; ++i) {
                ret[i - start] = nodes[i]
            }
        }
        return ret
    },
    noop: noop,
    /*如果不用Error对象封装一下，str在控制台下可能会乱码*/
    error: function (str, e) {
        throw  (e || Error)(str)
    },
    /*将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象*/
    oneObject: oneObject,
    /* avalon.range(10)
     => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     avalon.range(1, 11)
     => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     avalon.range(0, 30, 5)
     => [0, 5, 10, 15, 20, 25]
     avalon.range(0, -10, -1)
     => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     avalon.range(0)
     => []*/
    range: function (start, end, step) { // 用于生成整数数组
        step || (step = 1)
        if (end == null) {
            end = start || 0
            start = 0
        }
        var index = -1,
                length = Math.max(0, Math.ceil((end - start) / step)),
                result = new Array(length)
        while (++index < length) {
            result[index] = start
            start += step
        }
        return result
    },
    eventHooks: [],
    /*绑定事件*/
    bind: function(el, type, fn, phase) {
        var hooks = avalon.eventHooks
        var hook = hooks[type]
        if (typeof hook === "object") {
            type = hook.type
            if (hook.deel) {
                 fn = hook.deel(el, type, fn, phase)
            }
        }
        var callback = W3C ? fn : function(e) {
            fn.call(el, fixEvent(e));
        }
        if (W3C) {
            el.addEventListener(type, callback, !!phase)
        } else {
            el.attachEvent("on" + type, callback)
        }
        return callback
    },
    /*卸载事件*/
    unbind: function(el, type, fn, phase) {
        var hooks = avalon.eventHooks
        var hook = hooks[type]
        var callback = fn || noop
        if (typeof hook === "object") {
            type = hook.type
            if (hook.deel) {
                fn = hook.deel(el, type, fn, false)
            }
        }
        if (W3C) {
            el.removeEventListener(type, callback, !!phase)
        } else {
            el.detachEvent("on" + type, callback)
        }
    },
    /*读写删除元素节点的样式*/
    css: function (node, name, value) {
        if (node instanceof avalon) {
            node = node[0]
        }
        var prop = /[_-]/.test(name) ? camelize(name) : name, fn
        name = avalon.cssName(prop) || prop
        if (value === void 0 || typeof value === "boolean") { //获取样式
            fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
            if (name === "background") {
                name = "backgroundColor"
            }
            var val = fn(node, name)
            return value === true ? parseFloat(val) || 0 : val
        } else if (value === "") { //请除样式
            node.style[name] = ""
        } else { //设置样式
            if (value == null || value !== value) {
                return
            }
            if (isFinite(value) && !avalon.cssNumber[prop]) {
                value += "px"
            }
            fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
            fn(node, name, value)
        }
    },
    /*遍历数组与对象,回调的第一个参数为索引或键名,第二个或元素或键值*/
    each: function (obj, fn) {
        if (obj) { //排除null, undefined
            var i = 0
            if (isArrayLike(obj)) {
                for (var n = obj.length; i < n; i++) {
                    if (fn(i, obj[i]) === false)
                        break
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i) && fn(i, obj[i]) === false) {
                        break
                    }
                }
            }
        }
    },
    //收集元素的data-{{prefix}}-*属性，并转换为对象
    getWidgetData: function (elem, prefix) {
        var raw = avalon(elem).data()
        var result = {}
        for (var i in raw) {
            if (i.indexOf(prefix) === 0) {
                result[i.replace(prefix, "").replace(/\w/, function (a) {
                    return a.toLowerCase()
                })] = raw[i]
            }
        }
        return result
    },
    Array: {
        /*只有当前数组不存在此元素时只添加它*/
        ensure: function (target, item) {
            if (target.indexOf(item) === -1) {
                return target.push(item)
            }
        },
        /*移除数组中指定位置的元素，返回布尔表示成功与否*/
        removeAt: function (target, index) {
            return !!target.splice(index, 1).length
        },
        /*移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否*/
        remove: function (target, item) {
            var index = target.indexOf(item)
            if (~index)
                return avalon.Array.removeAt(target, index)
            return false
        }
    }
})

var bindingHandlers = avalon.bindingHandlers = {}
var bindingExecutors = avalon.bindingExecutors = {}

/*判定是否类数组，如节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象*/
function isArrayLike(obj) {
    if (!obj)
        return false
    var n = obj.length
    if (n === (n >>> 0)) { //检测length属性是否为非负整数
        var type = serialize.call(obj).slice(8, -1)
        if (/(?:regexp|string|function|window|global)$/i.test(type))
            return false
        if (type === "Array")
            return true
        try {
            if ({}.propertyIsEnumerable.call(obj, "length") === false) { //如果是原生对象
                return  /^\s?function/.test(obj.item || obj.callee)
            }
            return true
        } catch (e) { //IE的NodeList直接抛错
            return !obj.window //IE6-8 window
        }
    }
    return false
}


// https://github.com/rsms/js-lru
var Cache = new function() {// jshint ignore:line
    function LRU(maxLength) {
        this.size = 0
        this.limit = maxLength
        this.head = this.tail = void 0
        this._keymap = {}
    }

    var p = LRU.prototype

    p.put = function(key, value) {
        var entry = {
            key: key,
            value: value
        }
        this._keymap[key] = entry
        if (this.tail) {
            this.tail.newer = entry
            entry.older = this.tail
        } else {
            this.head = entry
        }
        this.tail = entry
        if (this.size === this.limit) {
            this.shift()
        } else {
            this.size++
        }
        return value
    }

    p.shift = function() {
        var entry = this.head
        if (entry) {
            this.head = this.head.newer
            this.head.older =
                    entry.newer =
                    entry.older =
                    this._keymap[entry.key] = void 0
        }
    }
    p.get = function(key) {
        var entry = this._keymap[key]
        if (entry === void 0)
            return
        if (entry === this.tail) {
            return  entry.value
        }
        // HEAD--------------TAIL
        //   <.older   .newer>
        //  <--- add direction --
        //   A  B  C  <D>  E
        if (entry.newer) {
            if (entry === this.head) {
                this.head = entry.newer
            }
            entry.newer.older = entry.older // C <-- E.
        }
        if (entry.older) {
            entry.older.newer = entry.newer // C. --> E
        }
        entry.newer = void 0 // D --x
        entry.older = this.tail // D. --> E
        if (this.tail) {
            this.tail.newer = entry // E. <-- D
        }
        this.tail = entry
        return entry.value
    }
    return LRU
}// jshint ignore:line

/*********************************************************************
 *                         javascript 底层补丁                       *
 **********************************************************************/
if (!"司徒正美".trim) {
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
    String.prototype.trim = function () {
        return this.replace(rtrim, "")
    }
}
var hasDontEnumBug = !({
    'toString': null
}).propertyIsEnumerable('toString'),
        hasProtoEnumBug = (function () {
        }).propertyIsEnumerable('prototype'),
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;
if (!Object.keys) {
    Object.keys = function (object) { //ecma262v5 15.2.3.14
        var theKeys = []
        var skipProto = hasProtoEnumBug && typeof object === "function"
        if (typeof object === "string" || (object && object.callee)) {
            for (var i = 0; i < object.length; ++i) {
                theKeys.push(String(i))
            }
        } else {
            for (var name in object) {
                if (!(skipProto && name === "prototype") && ohasOwn.call(object, name)) {
                    theKeys.push(String(name))
                }
            }
        }

        if (hasDontEnumBug) {
            var ctor = object.constructor,
                    skipConstructor = ctor && ctor.prototype === object
            for (var j = 0; j < dontEnumsLength; j++) {
                var dontEnum = dontEnums[j]
                if (!(skipConstructor && dontEnum === "constructor") && ohasOwn.call(object, dontEnum)) {
                    theKeys.push(dontEnum)
                }
            }
        }
        return theKeys
    }
}
if (!Array.isArray) {
    Array.isArray = function (a) {
        return serialize.call(a) === "[object Array]"
    }
}

if (!noop.bind) {
    Function.prototype.bind = function (scope) {
        if (arguments.length < 2 && scope === void 0)
            return this
        var fn = this,
                argv = arguments
        return function () {
            var args = [],
                    i
            for (i = 1; i < argv.length; i++)
                args.push(argv[i])
            for (i = 0; i < arguments.length; i++)
                args.push(arguments[i])
            return fn.apply(scope, args)
        }
    }
}

function iterator(vars, body, ret) {
    var fun = 'for(var ' + vars + 'i=0,n = this.length; i < n; i++){' + body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))') + '}' + ret
    /* jshint ignore:start */
    return Function("fn,scope", fun)
    /* jshint ignore:end */
}
if (!rnative.test([].map)) {
    avalon.mix(ap, {
        //定位操作，返回数组中第一个等于给定参数的元素的索引值。
        indexOf: function (item, index) {
            var n = this.length,
                    i = ~~index
            if (i < 0)
                i += n
            for (; i < n; i++)
                if (this[i] === item)
                    return i
            return -1
        },
        //定位操作，同上，不过是从后遍历。
        lastIndexOf: function (item, index) {
            var n = this.length,
                    i = index == null ? n - 1 : index
            if (i < 0)
                i = Math.max(0, n + i)
            for (; i >= 0; i--)
                if (this[i] === item)
                    return i
            return -1
        },
        //迭代操作，将数组的元素挨个儿传入一个函数中执行。Prototype.js的对应名字为each。
        forEach: iterator("", '_', ""),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
        filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
        //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Prototype.js的对应名字为collect。
        map: iterator('r=[],', 'r[i]=_', 'return r'),
        //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Prototype.js的对应名字为any。
        some: iterator("", 'if(_)return true', 'return false'),
        //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Prototype.js的对应名字为all。
        every: iterator("", 'if(!_)return false', 'return true')
    })
}
/*********************************************************************
 *                           DOM 底层补丁                             *
 **********************************************************************/

function fixContains(root, el) {
    try { //IE6-8,游离于DOM树外的文本节点，访问parentNode有时会抛错
        while ((el = el.parentNode))
            if (el === root)
                return true
        return false
    } catch (e) {
        return false
    }
}
avalon.contains = fixContains
//IE6-11的文档对象没有contains
if (!DOC.contains) {
    DOC.contains = function (b) {
        return fixContains(DOC, b)
    }
}

function outerHTML() {
    return new XMLSerializer().serializeToString(this)
}

if (window.SVGElement) {
    //safari5+是把contains方法放在Element.prototype上而不是Node.prototype
    if (!DOC.createTextNode("x").contains) {
        Node.prototype.contains = function (arg) {//IE6-8没有Node对象
            return !!(this.compareDocumentPosition(arg) & 16)
        }
    }
    var svgns = "http://www.w3.org/2000/svg"
    var svg = DOC.createElementNS(svgns, "svg")
    svg.innerHTML = '<circle cx="50" cy="50" r="40" fill="red" />'
    if (!rsvg.test(svg.firstChild)) { // #409
        function enumerateNode(node, targetNode) {// jshint ignore:line
            if (node && node.childNodes) {
                var nodes = node.childNodes
                for (var i = 0, el; el = nodes[i++]; ) {
                    if (el.tagName) {
                        var svg = DOC.createElementNS(svgns,
                                el.tagName.toLowerCase())
                        ap.forEach.call(el.attributes, function (attr) {
                            svg.setAttribute(attr.name, attr.value) //复制属性
                        })// jshint ignore:line
                        // 递归处理子节点
                        enumerateNode(el, svg)
                        targetNode.appendChild(svg)
                    }
                }
            }
        }
        Object.defineProperties(SVGElement.prototype, {
            "outerHTML": {//IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
                enumerable: true,
                configurable: true,
                get: outerHTML,
                set: function (html) {
                    var tagName = this.tagName.toLowerCase(),
                            par = this.parentNode,
                            frag = avalon.parseHTML(html)
                    // 操作的svg，直接插入
                    if (tagName === "svg") {
                        par.insertBefore(frag, this)
                        // svg节点的子节点类似
                    } else {
                        var newFrag = DOC.createDocumentFragment()
                        enumerateNode(frag, newFrag)
                        par.insertBefore(newFrag, this)
                    }
                    par.removeChild(this)
                }
            },
            "innerHTML": {
                enumerable: true,
                configurable: true,
                get: function () {
                    var s = this.outerHTML
                    var ropen = new RegExp("<" + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>', "i")
                    var rclose = new RegExp("<\/" + this.nodeName + ">$", "i")
                    return s.replace(ropen, "").replace(rclose, "")
                },
                set: function (html) {
                    if (avalon.clearHTML) {
                        avalon.clearHTML(this)
                        var frag = avalon.parseHTML(html)
                        enumerateNode(frag, this)
                    }
                }
            }
        })
    }
}
if (!root.outerHTML && window.HTMLElement) { //firefox 到11时才有outerHTML
    HTMLElement.prototype.__defineGetter__("outerHTML", outerHTML);
}


//============================= event binding =======================
var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/
function fixEvent(event) {
    var ret = {}
    for (var i in event) {
        ret[i] = event[i]
    }
    var target = ret.target = event.srcElement
    if (event.type.indexOf("key") === 0) {
        ret.which = event.charCode != null ? event.charCode : event.keyCode
    } else if (rmouseEvent.test(event.type)) {
        var doc = target.ownerDocument || DOC
        var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
        ret.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
        ret.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        ret.wheelDeltaY = ret.wheelDelta
        ret.wheelDeltaX = 0
    }
    ret.timeStamp = new Date() - 0
    ret.originalEvent = event
    ret.preventDefault = function () { //阻止默认行为
        event.returnValue = false
    }
    ret.stopPropagation = function () { //阻止事件在DOM树中的传播
        event.cancelBubble = true
    }
    return ret
}

var eventHooks = avalon.eventHooks
//针对firefox, chrome修正mouseenter, mouseleave
if (!("onmouseenter" in root)) {
    avalon.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function (origType, fixType) {
        eventHooks[origType] = {
            type: fixType,
            deel: function (elem, _, fn) {
                return function (e) {
                    var t = e.relatedTarget
                    if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
                        delete e.type
                        e.type = origType
                        return fn.call(elem, e)
                    }
                }
            }
        }
    })
}
//针对IE9+, w3c修正animationend
avalon.each({
    AnimationEvent: "animationend",
    WebKitAnimationEvent: "webkitAnimationEnd"
}, function (construct, fixType) {
    if (window[construct] && !eventHooks.animationend) {
        eventHooks.animationend = {
            type: fixType
        }
    }
})
//针对IE6-8修正input
if (!("oninput" in DOC.createElement("input"))) {
    eventHooks.input = {
        type: "propertychange",
        deel: function (elem, _, fn) {
            return function (e) {
                if (e.propertyName === "value") {
                    e.type = "input"
                    return fn.call(elem, e)
                }
            }
        }
    }
}
if (DOC.onmousewheel === void 0) {
    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
     firefox DOMMouseScroll detail 下3 上-3
     firefox wheel detlaY 下3 上-3
     IE9-11 wheel deltaY 下40 上-40
     chrome wheel deltaY 下100 上-100 */
    var fixWheelType = DOC.onwheel !== void 0 ? "wheel" : "DOMMouseScroll"
    var fixWheelDelta = fixWheelType === "wheel" ? "deltaY" : "detail"
    eventHooks.mousewheel = {
        type: fixWheelType,
        deel: function (elem, _, fn) {
            return function (e) {
                e.wheelDeltaY = e.wheelDelta = e[fixWheelDelta] > 0 ? -120 : 120
                e.wheelDeltaX = 0
                if (Object.defineProperty) {
                    Object.defineProperty(e, "type", {
                        value: "mousewheel"
                    })
                }
                fn.call(elem, e)
            }
        }
    }
}



/*********************************************************************
 *                           配置系统                                 *
 **********************************************************************/

function kernel(settings) {
    for (var p in settings) {
        if (!ohasOwn.call(settings, p))
            continue
        var val = settings[p]
        if (typeof kernel.plugins[p] === "function") {
            kernel.plugins[p](val)
        } else if (typeof kernel[p] === "object") {
            avalon.mix(kernel[p], val)
        } else {
            kernel[p] = val
        }
    }
    return this
}
var openTag, closeTag, rexpr, rexprg, rbind, rregexp = /[-.*+?^${}()|[\]\/\\]/g

function escapeRegExp(target) {
    //http://stevenlevithan.com/regex/xregexp/
    //将字符串安全格式化为正则表达式的源码
    return (target + "").replace(rregexp, "\\$&")
}

var plugins = {
    loader: function (builtin) {
        var flag = innerRequire && builtin
        window.require = flag ? innerRequire : otherRequire
        window.define = flag ? innerRequire.define : otherDefine
    },
    interpolate: function (array) {
        openTag = array[0]
        closeTag = array[1]
        if (openTag === closeTag) {
            throw new SyntaxError("openTag!==closeTag")
            var test = openTag + "test" + closeTag
            cinerator.innerHTML = test
            if (cinerator.innerHTML !== test && cinerator.innerHTML.indexOf("&lt;") > -1) {
                throw new SyntaxError("此定界符不合法")
            }
            cinerator.innerHTML = ""
        }
        var o = escapeRegExp(openTag),
                c = escapeRegExp(closeTag)
        rexpr = new RegExp(o + "(.*?)" + c)
        rexprg = new RegExp(o + "(.*?)" + c, "g")
        rbind = new RegExp(o + ".*?" + c + "|\\sms-")
    }
}

kernel.debug = true
kernel.plugins = plugins
kernel.plugins['interpolate'](["{{", "}}"])
kernel.paths = {}
kernel.shim = {}
kernel.maxRepeatSize = 100
avalon.config = kernel
var ravalon = /(\w+)\[(avalonctrl)="(\S+)"\]/
var findNodes = DOC.querySelectorAll ? function(str) {
    return DOC.querySelectorAll(str)
} : function(str) {
    var match = str.match(ravalon)
    var all = DOC.getElementsByTagName(match[1])
    var nodes = []
    for (var i = 0, el; el = all[i++]; ) {
        if (el.getAttribute(match[2]) === match[3]) {
            nodes.push(el)
        }
    }
    return nodes
}
/*********************************************************************
 *                            事件总线                               *
 **********************************************************************/
var EventBus = {
    $watch: function (type, callback) {
        if (typeof callback === "function") {
            var callbacks = this.$events[type]
            if (callbacks) {
                callbacks.push(callback)
            } else {
                this.$events[type] = [callback]
            }
        } else { //重新开始监听此VM的第一重简单属性的变动
            this.$events = this.$watch.backup
        }
        return this
    },
    $unwatch: function (type, callback) {
        var n = arguments.length
        if (n === 0) { //让此VM的所有$watch回调无效化
            this.$watch.backup = this.$events
            this.$events = {}
        } else if (n === 1) {
            this.$events[type] = []
        } else {
            var callbacks = this.$events[type] || []
            var i = callbacks.length
            while (~--i < 0) {
                if (callbacks[i] === callback) {
                    return callbacks.splice(i, 1)
                }
            }
        }
        return this
    },
    $fire: function (type) {
        var special, i, v, callback
        if (/^(\w+)!(\S+)$/.test(type)) {
            special = RegExp.$1
            type = RegExp.$2
        }
        var events = this.$events
        if (!events)
            return
        var args = aslice.call(arguments, 1)
        var detail = [type].concat(args)
        if (special === "all") {
            for (i in avalon.vmodels) {
                v = avalon.vmodels[i]
                if (v !== this) {
                    v.$fire.apply(v, detail)
                }
            }
        } else if (special === "up" || special === "down") {
            var elements = events.expr ? findNodes(events.expr) : []
            if (elements.length === 0)
                return
            for (i in avalon.vmodels) {
                v = avalon.vmodels[i]
                if (v !== this) {
                    if (v.$events.expr) {
                        var eventNodes = findNodes(v.$events.expr)
                        if (eventNodes.length === 0) {
                            continue
                        }
                        //循环两个vmodel中的节点，查找匹配（向上匹配或者向下匹配）的节点并设置标识
                        /* jshint ignore:start */
                        ap.forEach.call(eventNodes, function (node) {
                            ap.forEach.call(elements, function (element) {
                                var ok = special === "down" ? element.contains(node) : //向下捕获
                                        node.contains(element) //向上冒泡
                                if (ok) {
                                    node._avalon = v //符合条件的加一个标识
                                }
                            });
                        })
                        /* jshint ignore:end */
                    }
                }
            }
            var nodes = DOC.getElementsByTagName("*") //实现节点排序
            var alls = []
            ap.forEach.call(nodes, function (el) {
                if (el._avalon) {
                    alls.push(el._avalon)
                    el._avalon = ""
                    el.removeAttribute("_avalon")
                }
            })
            if (special === "up") {
                alls.reverse()
            }
            for (i = 0; callback = alls[i++]; ) {
                if (callback.$fire.apply(callback, detail) === false) {
                    break
                }
            }
        } else {
            var callbacks = events[type] || []
            var all = events.$all || []
            for (i = 0; callback = callbacks[i++]; ) {
                if (isFunction(callback))
                    callback.apply(this, args)
            }
            for (i = 0; callback = all[i++]; ) {
                if (isFunction(callback))
                    callback.apply(this, arguments)
            }
        }
    }
}

/*********************************************************************
 *                           modelFactory                             *
 **********************************************************************/
//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
var VMODELS = avalon.vmodels = {} //所有vmodel都储存在这里
avalon.define = function (id, factory) {
    var $id = id.$id || id
    if (!$id) {
        log("warning: vm必须指定$id")
    }
    if (VMODELS[$id]) {
        log("warning: " + $id + " 已经存在于avalon.vmodels中")
    }
    if (typeof id === "object") {
        var model = modelFactory(id)
    } else {
        var scope = {
            $watch: noop
        }
        factory(scope) //得到所有定义

        model = modelFactory(scope) //偷天换日，将scope换为model
        stopRepeatAssign = true
        factory(model)
        stopRepeatAssign = false
    }
    model.$id = $id
    return VMODELS[$id] = model
}

//一些不需要被监听的属性
var $$skipArray = String("$id,$watch,$unwatch,$fire,$events,$model,$skipArray,$proxy,$reinitialize,$propertyNames").match(rword)
var defineProperty = Object.defineProperty
var canHideOwn = true
//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现
try {
    defineProperty({}, "_", {
        value: "x"
    })
    var defineProperties = Object.defineProperties
} catch (e) {
    canHideOwn = false
}

function modelFactory(source, $special, $model) {
    if (Array.isArray(source)) {
        var arr = source.concat()
        source.length = 0
        var collection = arrayFactory(source)
        collection.pushArray(arr)
        return collection
    }
    //0 null undefined || Node || VModel(fix IE6-8 createWithProxy $val: val引发的BUG)
    if (!source || source.nodeType > 0 || (source.$id && source.$events)) {
        return source
    }
    var $skipArray = Array.isArray(source.$skipArray) ? source.$skipArray : []
    $skipArray.$special = $special || {} //强制要监听的属性
    var $vmodel = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
    $model = $model || {} //vmodels.$model属性
    var $events = {} //vmodel.$events属性
    var accessors = {} //监控属性
    var computed = []
    $$skipArray.forEach(function (name) {
        delete source[name]
    })
    var names = Object.keys(source)
    /* jshint ignore:start */
    names.forEach(function (name, accessor) {
        var val = source[name]
        $model[name] = val
        if (isObservable(name, val, $skipArray)) {
            //总共产生三种accessor
            $events[name] = []
            var valueType = avalon.type(val)
            //总共产生三种accessor
            if (valueType === "object" && isFunction(val.get) && Object.keys(val).length <= 2) {
                accessor = makeComputedAccessor(name, val)
                computed.push(accessor)
            } else if (rcomplexType.test(valueType)) {
                accessor = makeComplexAccessor(name, val, valueType, $events[name])
            } else {
                accessor = makeSimpleAccessor(name, val)
            }
            accessors[name] = accessor
        }
    })
    /* jshint ignore:end */

    $vmodel = defineProperties($vmodel, descriptorFactory(accessors), source) //生成一个空的ViewModel
    for (var i = 0; i < names.length; i++) {
        var name = names[i]
        if (!accessors[name]) {
            $vmodel[name] = source[name]
        }
    }
    //添加$id, $model, $events, $watch, $unwatch, $fire
    $vmodel.$propertyNames = names.sort().join("&shy;")
    $vmodel.$id = generateID()
    $vmodel.$model = $model
    $vmodel.$events = $events
    for (i in EventBus) {
        var fn = EventBus[i]
        if (!W3C) { //在IE6-8下，VB对象的方法里的this并不指向自身，需要用bind处理一下
            fn = fn.bind($vmodel)
        }
        $vmodel[i] = fn
    }
    if (canHideOwn) {
        Object.defineProperty($vmodel, "hasOwnProperty", hasOwnDescriptor)
    } else {
        /* jshint ignore:start */
        $vmodel.hasOwnProperty = function (name) {
            return name in $vmodel.$model
        }
        /* jshint ignore:end */
    }

    $vmodel.$reinitialize = function () {
        computed.forEach(function (accessor) {
            delete accessor._value
            delete accessor.oldArgs
            accessor.digest = function () {
                accessor.call($vmodel)
            }
            dependencyDetection.begin({
                callback: function (vm, dependency) {//dependency为一个accessor
                    var name = dependency._name
                    if (dependency !== accessor) {
                        var list = vm.$events[name]
                        injectDependency(list, accessor.digest)
                    }
                }
            })
            try {
                accessor.get.call($vmodel)
            } finally {
                dependencyDetection.end()
            }
        })
    }
    $vmodel.$reinitialize()
    return $vmodel
}

var hasOwnDescriptor = {
    value: function (name) {
        return name in this.$model
    },
    writable: false,
    enumerable: false,
    configurable: true
}
//创建一个简单访问器
function makeSimpleAccessor(name, value) {
    function accessor(value) {
        var oldValue = accessor._value
        if (arguments.length > 0) {
            if (!stopRepeatAssign && !isEqual(value, oldValue)) {
                accessor.updateValue(this, value)
                accessor.notify(this, value, oldValue)
            }
            return this
        } else {
            dependencyDetection.collectDependency(this, accessor)
            return oldValue
        }
    }
    accessorFactory(accessor, name)
    accessor._value = value
    return accessor;
}

//创建一个计算访问器
function makeComputedAccessor(name, options) {
    function accessor(value) {//计算属性
        var oldValue = accessor._value
        var init = ("_value" in accessor)
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            if (typeof accessor.set === "function") {
                if (accessor.oldArgs !== value) {
                    accessor.oldArgs = value
                    var $events = this.$events
                    var lock = $events[name]
                    $events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                    accessor.set.call(this, value)
                    $events[name] = lock
                    value = accessor.get.call(this)
                    if (value !== oldValue) {
                        accessor.updateValue(this, value)
                        accessor.notify(this, value, oldValue) //触发$watch回调
                    }
                }
            }
            return this
        } else {
            //将依赖于自己的高层访问器或视图刷新函数（以绑定对象形式）放到自己的订阅数组中
            //将自己注入到低层访问器的订阅数组中
            value = accessor.get.call(this)
            accessor.updateValue(this, value)
            if (init && oldValue !== value) {
                accessor.notify(this, value, oldValue) //触发$watch回调
            }
            return value
        }
    }
    accessor.set = options.set
    accessor.get = options.get
    accessorFactory(accessor, name)
    return accessor
}

//创建一个复杂访问器
function makeComplexAccessor(name, initValue, valueType, list) {
    function accessor(value) {
        var oldValue = accessor._value

        var son = accessor._vmodel
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            if (valueType === "array") {
                var a = son, b = value,
                        an = a.length,
                        bn = b.length
                a.$lock = true
                if (an > bn) {
                    a.splice(bn, an - bn)
                } else if (bn > an) {
                    a.push.apply(a, b.slice(an))
                }
                var n = Math.min(an, bn)
                for (var i = 0; i < n; i++) {
                    a.set(i, b[i])
                }
                delete a.$lock
                a._fire("set")
            } else if (valueType === "object") {
                var newPropertyNames = Object.keys(value).sort().join("&shy;")
                if (son.$propertyNames === newPropertyNames) {
                    for (i in value) {
                        son[i] = value[i]
                    }
                } else if(W3C){
                      var a  = accessor._vmodel = modelFactory(value)
                      a.$events = son.$events
                } else{
                    var $proxy = son.$proxy
                    son = accessor._vmodel = modelFactory(value)
                    var observes = son.$events[subscribers] = this.$events[name] || []
                    var iterators = observes.concat()
                    observes.length = 0
                    son.$proxy = $proxy
                    while (a = iterators.shift()) {
                        var fn = bindingHandlers[a.type]
                        if (fn) { //#753
                            a.rollback && a.rollback() //还原 ms-with ms-on
                            fn(a, a.vmodels)
                        }
                    }
                }
            }
            accessor.updateValue(this, son.$model)
            accessor.notify(this, this._value, oldValue)
            return this
        } else {
            dependencyDetection.collectDependency(this, accessor)
            return son
        }
    }
    accessorFactory(accessor, name)
    var son = accessor._vmodel = modelFactory(initValue)
    son.$events[subscribers] = list
    return accessor
}

function globalUpdateValue(vmodel, value) {
    vmodel.$model[this._name] = this._value = value
}

function globalNotify(vmodel, value, oldValue) {
    var name = this._name
    var array = vmodel.$events[name] //刷新值
    if (array) {
        fireDependencies(array) //同步视图
        EventBus.$fire.call(vmodel, name, value, oldValue) //触发$watch回调
    }
}

function accessorFactory(accessor, name) {
    accessor._name = name
    //同时更新_value与model
    accessor.updateValue = globalUpdateValue
    accessor.notify = globalNotify
}

//比较两个值是否相等
var isEqual = Object.is || function (v1, v2) {
    if (v1 === 0 && v2 === 0) {
        return 1 / v1 === 1 / v2
    } else if (v1 !== v1) {
        return v2 !== v2
    } else {
        return v1 === v2
    }
}

function isObservable(name, value, $skipArray) {
    if (isFunction(value) || value && value.nodeType) {
        return false
    }
    if ($skipArray.indexOf(name) !== -1) {
        return false
    }
    var $special = $skipArray.$special
    if (name && name.charAt(0) === "$" && !$special[name]) {
        return false
    }
    return true
}

var descriptorFactory = W3C ? function (obj) {
    var descriptors = {}
    for (var i in obj) {
        descriptors[i] = {
            get: obj[i],
            set: obj[i],
            enumerable: true,
            configurable: true
        }
    }
    return descriptors
} : function (a) {
    return a
}

//    function diff(newObject, oldObject) {
//        var added = []
//        for (var i in newObject) {
//            if (newObject.hasOwnProperty(i)) {
//                if (!oldObject.hasOwnerProperty(i)) {
//                    added.push({
//                        name: i,
//                        value: newObject[i]
//                    })
//                }
//            }
//        }
//        var deleted = []
//        for (var i in newObject) {
//            if (oldObject.hasOwnProperty(i)) {
//                if (!newObject.hasOwnerProperty(i)) {
//                    deleted.push( Object.getOwnPropertyDescriptor(oldObject, i).get)
//                }
//            }
//        }
//        for(var i = 0; i < added.length; i++){
//            var a = added[i]
//            var fn = deleted.shift()
//            fn._name = a.name
//            fn._value = a.value
//        }
//    }
//===================修复浏览器对Object.defineProperties的支持=================
if (!canHideOwn) {
    if ("__defineGetter__" in avalon) {
        defineProperty = function (obj, prop, desc) {
            if ('value' in desc) {
                obj[prop] = desc.value
            }
            if ("get" in desc) {
                obj.__defineGetter__(prop, desc.get)
            }
            if ('set' in desc) {
                obj.__defineSetter__(prop, desc.set)
            }
            return obj
        }
        defineProperties = function (obj, descs) {
            for (var prop in descs) {
                if (descs.hasOwnProperty(prop)) {
                    defineProperty(obj, prop, descs[prop])
                }
            }
            return obj
        }
    }
    if (IEVersion) {
        var VBClassPool = {}
        window.execScript([// jshint ignore:line
            "Function parseVB(code)",
            "\tExecuteGlobal(code)",
            "End Function" //转换一段文本为VB代码
        ].join("\n"), "VBScript")
        function VBMediator(instance, accessors, name, value) {// jshint ignore:line
            var accessor = accessors[name]
            if (arguments.length === 4) {
                accessor.call(instance, value)
            } else {
                return accessor.call(instance)
            }
        }
        defineProperties = function (name, accessors, properties) {
            // jshint ignore:line
            var buffer = []
            buffer.push(
                    "\r\n\tPrivate [__data__], [__proxy__]",
                    "\tPublic Default Function [__const__](d, p)",
                    "\t\tSet [__data__] = d: set [__proxy__] = p",
                    "\t\tSet [__const__] = Me", //链式调用
                    "\tEnd Function")
            //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
            for (name in properties) {
                if (!accessors.hasOwnProperty(name)) {
                    buffer.push("\tPublic [" + name + "]")
                }
            }
            $$skipArray.forEach(function (name) {
                if (!accessors.hasOwnProperty(name)) {
                    buffer.push("\tPublic [" + name + "]")
                }
            })
            buffer.push("\tPublic [" + 'hasOwnProperty' + "]")
            //添加访问器属性 
            for (name in accessors) {
                buffer.push(
                        //由于不知对方会传入什么,因此set, let都用上
                        "\tPublic Property Let [" + name + "](val" + expose + ")", //setter
                        "\t\tCall [__proxy__](Me,[__data__], \"" + name + "\", val" + expose + ")",
                        "\tEnd Property",
                        "\tPublic Property Set [" + name + "](val" + expose + ")", //setter
                        "\t\tCall [__proxy__](Me,[__data__], \"" + name + "\", val" + expose + ")",
                        "\tEnd Property",
                        "\tPublic Property Get [" + name + "]", //getter
                        "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
                        "\t\tSet[" + name + "] = [__proxy__](Me,[__data__],\"" + name + "\")",
                        "\tIf Err.Number <> 0 Then",
                        "\t\t[" + name + "] = [__proxy__](Me,[__data__],\"" + name + "\")",
                        "\tEnd If",
                        "\tOn Error Goto 0",
                        "\tEnd Property")

            }

            buffer.push("End Class")
            var body = buffer.join("\r\n")
            var className =VBClassPool[body]   
            if (!className) {
                className = generateID("VBClass")
                window.parseVB("Class " + className + body)
                window.parseVB([
                    "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
                    "\tDim o",
                    "\tSet o = (New " + className + ")(a, b)",
                    "\tSet " + className + "Factory = o",
                    "End Function"
                ].join("\r\n"))
                VBClassPool[body] = className
            }
            var ret = window[className + "Factory"](accessors, VBMediator) //得到其产品
            return ret //得到其产品
        }
    }
}

/*********************************************************************
 *          监控数组（与ms-each, ms-repeat配合使用）                     *
 **********************************************************************/

function arrayFactory(model) {
    var array = []
    array.$id = generateID()
    array.$model = model //数据模型
    array.$events = {}
    array.$events[subscribers] = []
    array._ = modelFactory({
        length: model.length
    })
    array._.$watch("length", function (a, b) {
        array.$fire("length", a, b)
    })
    for (var i in EventBus) {
        array[i] = EventBus[i]
    }
    avalon.mix(array, arrayPrototype)
    return array
}

function mutateArray(method, pos, n, index, method2, pos2, n2) {
    var oldLen = this.length, loop = 2
    while (--loop) {
        switch (method) {
      case "add":
                /* jshint ignore:start */
                var array = this.$model.slice(pos, pos + n).map(function (el) {
                    if (rcomplexType.test(avalon.type(el))) {
                        return el.$id ? el : modelFactory(el, 0, el)
                    } else {
                        return el
                    }
                })
                /* jshint ignore:end */
                _splice.apply(this, [pos, 0].concat(array))
                this._fire("add", pos, n)
                break
            case "del":
                var ret = this._splice(pos, n)
                this._fire("del", pos, n)
                break
        }
        if (method2) {
            method = method2
            pos = pos2
            n = n2
            loop = 2
            method2 = 0
        }
    }
    this._fire("index", index)
    if (this.length !== oldLen) {
        this._.length = this.length
    }
    return ret
}

var _splice = ap.splice
var arrayPrototype = {
    _splice: _splice,
    _fire: function (method, a, b) {
        fireDependencies(this.$events[subscribers], method, a, b)
    },
    size: function () { //取得数组长度，这个函数可以同步视图，length不能
        return this._.length
    },
    pushArray: function (array) {
        var m = array.length, n = this.length
        if (m) {
            ap.push.apply(this.$model, array)
            mutateArray.call(this, "add", n, m, Math.max(0, n - 1))
        }
        return  m + n
    },
    push: function () {
        //http://jsperf.com/closure-with-arguments
        var array = []
        var i, n = arguments.length
        for (i = 0; i < n; i++) {
            array[i] = arguments[i]
        }
        return this.pushArray(array)
    },
    unshift: function () {
        var m = arguments.length, n = this.length
        if (m) {
            ap.unshift.apply(this.$model, arguments)
            mutateArray.call(this, "add", 0, m, 0)
        }
        return  m + n //IE67的unshift不会返回长度
    },
    shift: function () {
        if (this.length) {
            var el = this.$model.shift()
            mutateArray.call(this, "del", 0, 1, 0)
            return el //返回被移除的元素
        }
    },
    pop: function () {
        var n = this.length
        if (n) {
            var el = this.$model.pop()
            mutateArray.call(this, "del", n - 1, 1, Math.max(0, n - 2))
            return el //返回被移除的元素
        }
    },
    splice: function (start) {
        var m = arguments.length, args = [], change
        var removed = _splice.apply(this.$model, arguments)
        if (removed.length) { //如果用户删掉了元素
            args.push("del", start, removed.length, 0)
            change = true
        }
        if (m > 2) {  //如果用户添加了元素
            if (change) {
                args.splice(3, 1, 0, "add", start, m - 2)
            } else {
                args.push("add", start, m - 2, 0)
            }
            change = true
        }
        if (change) { //返回被移除的元素
            return mutateArray.apply(this, args)
        } else {
            return []
        }
    },
    contains: function (el) { //判定是否包含
        return this.indexOf(el) !== -1
    },
    remove: function (el) { //移除第一个等于给定值的元素
        return this.removeAt(this.indexOf(el))
    },
    removeAt: function (index) { //移除指定索引上的元素
        if (index >= 0) {
            this.$model.splice(index, 1)
            return mutateArray.call(this, "del", index, 1, 0)
        }
        return  []
    },
    clear: function () {
        this.$model.length = this.length = this._.length = 0 //清空数组
        this._fire("clear", 0)
        return this
    },
    removeAll: function (all) { //移除N个元素
        if (Array.isArray(all)) {
            for (var i = this.length - 1; i >= 0; i--) {
                if (all.indexOf(this[i]) !== -1) {
                    this.removeAt(i)
                }
            }
        } else if (typeof all === "function") {
            for ( i = this.length - 1; i >= 0; i--) {
                var el = this[i]
                if (all(el, i)) {
                    this.removeAt(i)
                }
            }
        } else {
            this.clear()
        }
    },
    ensure: function (el) {
        if (!this.contains(el)) { //只有不存在才push
            this.push(el)
        }
        return this
    },
    set: function (index, val) {
        if (index >= 0) {
            var valueType = avalon.type(val)
            if (val && val.$model) {
                val = val.$model
            }
            var target = this[index]
            if (valueType === "object") {
                for (var i in val) {
                    if (target.hasOwnProperty(i)) {
                        target[i] = val[i]
                    }
                }
            } else if (valueType === "array") {
                target.clear().push.apply(target, val)
            } else if (target !== val) {
                this[index] = val
                this.$model[index] = val
                this._fire("set", index, val)
            }
        }
        return this
    }
}
//相当于原来bindingExecutors.repeat 的index分支
function resetIndex(array, pos) {
    var last = array.length - 1
    for (var el; el = array[pos]; pos++) {
        el.$index = pos
        el.$first = pos === 0
        el.$last = pos === last
    }
}

function sortByIndex(array, indexes) {
    var map = {};
    for (var i = 0, n = indexes.length; i < n; i++) {
        map[i] = array[i] // preserve
        var j = indexes[i]
        if (j in map) {
            array[i] = map[j]
            delete map[j]
        } else {
            array[i] = array[j]
        }
    }
}

"sort,reverse".replace(rword, function (method) {
    arrayPrototype[method] = function () {
        var newArray = this.$model//这是要排序的新数组
        var oldArray = newArray.concat() //保持原来状态的旧数组
        var mask = Math.random()
        var indexes = []
        var hasSort
        ap[method].apply(newArray, arguments) //排序
        for (var i = 0, n = oldArray.length; i < n; i++) {
            var neo = newArray[i]
            var old = oldArray[i]
            if (isEqual(neo, old)) {
                indexes.push(i)
            } else {
                var index = oldArray.indexOf(neo)
                indexes.push(index)//得到新数组的每个元素在旧数组对应的位置
                oldArray[index] = mask    //屏蔽已经找过的元素
                hasSort = true
            }
        }
        if (hasSort) {
            sortByIndex(this, indexes)
            // sortByIndex(this.$proxy, indexes)
            this._fire("move", indexes)
              this._fire("index", 0)
        }
        return this
    }
})


/*********************************************************************
 *                           依赖调度系统                             *
 **********************************************************************/
//检测两个对象间的依赖关系
var dependencyDetection = (function () {
    var outerFrames = []
    var currentFrame
    return {
        begin: function (accessorObject) {
            //accessorObject为一个拥有callback的对象
            outerFrames.push(currentFrame)
            currentFrame = accessorObject
        },
        end: function () {
            currentFrame = outerFrames.pop()
        },
        collectDependency: function (vmodel, accessor) {
            if (currentFrame) {
                //被dependencyDetection.begin调用
                currentFrame.callback(vmodel, accessor);
            }
        }
    };
})()
//将绑定对象注入到其依赖项的订阅数组中
var ronduplex = /^(duplex|on)$/
avalon.injectBinding = function (data) {
    var fn = data.evaluator
    if (fn) { //如果是求值函数
        dependencyDetection.begin({
            callback: function (vmodel, dependency) {
                injectDependency(vmodel.$events[dependency._name], data)
            }
        })
        try {
            var c = ronduplex.test(data.type) ? data : fn.apply(0, data.args)
            data.handler(c, data.element, data)
        } catch (e) {
            //log("warning:exception throwed in [avalon.injectBinding] " + e)
            delete data.evaluator
            var node = data.element
            if (node.nodeType === 3) {
                var parent = node.parentNode
                if (kernel.commentInterpolate) {
                    parent.replaceChild(DOC.createComment(data.value), node)
                } else {
                    node.data = openTag + (data.oneTime ? "::" : "") + data.value + closeTag
                }
            }
        } finally {
            dependencyDetection.end()
        }
    }
}

//将依赖项(比它高层的访问器或构建视图刷新函数的绑定对象)注入到订阅者数组 
function injectDependency(list, data) {
    if (data.oneTime)
        return
    if (list && avalon.Array.ensure(list, data) && data.element) {
        injectDisposeQueue(data, list)
    }
}

//通知依赖于这个访问器的订阅者更新自身
function fireDependencies(list) {
    if (list && list.length) {
        if (new Date() - beginTime > 444 && typeof list[0] === "object") {
            rejectDisposeQueue()
        }
        var args = aslice.call(arguments, 1)
        for (var i = list.length, fn; fn = list[--i]; ) {
            var el = fn.element
            if (el && el.parentNode) {
                try {
                    if (fn.$repeat) {
                        fn.handler.apply(fn, args) //处理监控数组的方法
                    } else if (fn.type !== "on") { //事件绑定只能由用户触发,不能由程序触发
                        var fun = fn.evaluator || noop
                        fn.handler(fun.apply(0, fn.args || []), el, fn)

                    }
                } catch (e) {
                }
            }
        }
    }
}
/*********************************************************************
 *                          定时GC回收机制                             *
 **********************************************************************/
var disposeCount = 0
var disposeQueue = avalon.$$subscribers = []
var beginTime = new Date()
var oldInfo = {}
var uuid2Node = {}
function getUid(obj, makeID) { //IE9+,标准浏览器
    if (!obj.uuid && !makeID) {
        obj.uuid = ++disposeCount
        uuid2Node[obj.uuid] = obj
    }
    return obj.uuid
}
function getNode(uuid) {
    return uuid2Node[uuid]
}
//添加到回收列队中
function injectDisposeQueue(data, list) {
    var elem = data.element
    if (!data.uuid) {
        if (elem.nodeType !== 1) {
            data.uuid = data.type + (data.pos || 0) + "-" + getUid(elem.parentNode)
        } else {
            data.uuid = data.name + "-" + getUid(elem)
        }
    }
    var lists = data.lists || (data.lists = [])
    avalon.Array.ensure(lists, list)
    list.$uuid = list.$uuid || generateID()
    if (!disposeQueue[data.uuid]) {
        disposeQueue[data.uuid] = 1
        disposeQueue.push(data)
    }
}

function rejectDisposeQueue(data) {
    if (avalon.optimize)
        return
    var i = disposeQueue.length
    var n = i
    var allTypes = []
    var iffishTypes = {}
    var newInfo = {}
    //对页面上所有绑定对象进行分门别类, 只检测个数发生变化的类型
    while (data = disposeQueue[--i]) {
        var type = data.type
        if (newInfo[type]) {
            newInfo[type]++
        } else {
            newInfo[type] = 1
            allTypes.push(type)
        }
    }
    var diff = false
    allTypes.forEach(function (type) {
        if (oldInfo[type] !== newInfo[type]) {
            iffishTypes[type] = 1
            diff = true
        }
    })
    i = n
    if (diff) {
        while (data = disposeQueue[--i]) {
            if (!data.element)
                continue
            if (iffishTypes[data.type] && shouldDispose(data.element)) { //如果它没有在DOM树
                disposeQueue.splice(i, 1)
                delete disposeQueue[data.uuid]
                delete uuid2Node[data.element.uuid]
                var lists = data.lists
                for (var k = 0, list; list = lists[k++]; ) {
                    avalon.Array.remove(lists, list)
                    avalon.Array.remove(list, data)
                }
                disposeData(data)
            }
        }
    }
    oldInfo = newInfo
    beginTime = new Date()
}

function disposeData(data) {
    data.element = null
    data.rollback && data.rollback()
    for (var key in data) {
        data[key] = null
    }
}

function shouldDispose(el) {
    try {//IE下，如果文本节点脱离DOM树，访问parentNode会报错
        if (!el.parentNode) {
            return true
        }
    } catch (e) {
        return true
    }

    return el.msRetain ? 0 : (el.nodeType === 1 ? !root.contains(el) : !avalon.contains(root, el))
}

/************************************************************************
 *            HTML处理(parseHTML, innerHTML, clearHTML)                  *
 ************************************************************************/
// We have to close these tags to support XHTML 
var tagHooks = {
    area: [1, "<map>", "</map>"],
    param: [1, "<object>", "</object>"],
    col: [2, "<table><colgroup>", "</colgroup></table>"],
    legend: [1, "<fieldset>", "</fieldset>"],
    option: [1, "<select multiple='multiple'>", "</select>"],
    thead: [1, "<table>", "</table>"],
    tr: [2, "<table>", "</table>"],
    td: [3, "<table><tr>", "</tr></table>"],
    g: [1, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">', '</svg>'],
    //IE6-8在用innerHTML生成节点时，不能直接创建no-scope元素与HTML5的新标签
    _default: W3C ? [0, "", ""] : [1, "X<div>", "</div>"] //div可以不用闭合
}
tagHooks.th = tagHooks.td
tagHooks.optgroup = tagHooks.option
tagHooks.tbody = tagHooks.tfoot = tagHooks.colgroup = tagHooks.caption = tagHooks.thead
String("circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use").replace(rword, function (tag) {
    tagHooks[tag] = tagHooks.g //处理SVG
})
var rtagName = /<([\w:]+)/  //取得其tagName
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
var rcreate = W3C ? /[^\d\D]/ : /(<(?:script|link|style|meta|noscript))/ig
var scriptTypes = oneObject(["", "text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript"])
var rnest = /<(?:tb|td|tf|th|tr|col|opt|leg|cap|area)/ //需要处理套嵌关系的标签
var script = DOC.createElement("script")
var rhtml = /<|&#?\w+;/
avalon.parseHTML = function (html) {
    var fragment = avalonFragment.cloneNode(false)
    if (typeof html !== "string") {
        return fragment
    }
    if (!rhtml.test(html)) {
        fragment.appendChild(DOC.createTextNode(html))
        return fragment
    }
    html = html.replace(rxhtml, "<$1></$2>").trim()
    var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
            //取得其标签名
            wrap = tagHooks[tag] || tagHooks._default,
            wrapper = cinerator,
            firstChild, neo
    if (!W3C) { //fix IE
        html = html.replace(rcreate, "<br class=msNoScope>$1") //在link style script等标签之前添加一个补丁
    }
    wrapper.innerHTML = wrap[1] + html + wrap[2]
    var els = wrapper.getElementsByTagName("script")
    if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
        for (var i = 0, el; el = els[i++]; ) {
            if (scriptTypes[el.type]) {
                //以偷龙转凤方式恢复执行脚本功能
                neo = script.cloneNode(false) //FF不能省略参数
                ap.forEach.call(el.attributes, function (attr) {
                    if (attr && attr.specified) {
                        neo[attr.name] = attr.value //复制其属性
                        neo.setAttribute(attr.name, attr.value)
                    }
                })  // jshint ignore:line
                neo.text = el.text
                el.parentNode.replaceChild(neo, el) //替换节点
            }
        }
    }
    if (!W3C) { //fix IE
        var target = wrap[1] === "X<div>" ? wrapper.lastChild.firstChild : wrapper.lastChild
        if (target && target.tagName === "TABLE" && tag !== "tbody") {
            //IE6-7处理 <thead> --> <thead>,<tbody>
            //<tfoot> --> <tfoot>,<tbody>
            //<table> --> <table><tbody></table>
            for (els = target.childNodes, i = 0; el = els[i++]; ) {
                if (el.tagName === "TBODY" && !el.innerHTML) {
                    target.removeChild(el)
                    break
                }
            }
        }
        els = wrapper.getElementsByTagName("br")
        var n = els.length
        while (el = els[--n]) {
            if (el.className === "msNoScope") {
                el.parentNode.removeChild(el)
            }
        }
        for (els = wrapper.all, i = 0; el = els[i++]; ) { //fix VML
            if (isVML(el)) {
                fixVML(el)
            }
        }
    }
    //移除我们为了符合套嵌关系而添加的标签
    for (i = wrap[0]; i--; wrapper = wrapper.lastChild) {
    }
    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
        fragment.appendChild(firstChild)
    }
    return fragment
}

function isVML(src) {
    var nodeName = src.nodeName
    return nodeName.toLowerCase() === nodeName && src.scopeName && src.outerText === ""
}

function fixVML(node) {
    if (node.currentStyle.behavior !== "url(#default#VML)") {
        node.style.behavior = "url(#default#VML)"
        node.style.display = "inline-block"
        node.style.zoom = 1 //hasLayout
    }
}
avalon.innerHTML = function (node, html) {
    if (!W3C && (!rcreate.test(html) && !rnest.test(html))) {
        try {
            node.innerHTML = html
            return
        } catch (e) {
        }
    }
    var a = this.parseHTML(html)
    this.clearHTML(node).appendChild(a)
}
avalon.clearHTML = function (node) {
    node.textContent = ""
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
    return node
}

/*********************************************************************
 *                  avalon的原型方法定义区                            *
 **********************************************************************/

function hyphen(target) {
    //转换为连字符线风格
    return target.replace(/([a-z\d])([A-Z]+)/g, "$1-$2").toLowerCase()
}

function camelize(target) {
    //提前判断，提高getStyle等的效率
    if (!target || target.indexOf("-") < 0 && target.indexOf("_") < 0) {
        return target
    }
    //转换为驼峰风格
    return target.replace(/[-_][^-_]/g, function(match) {
        return match.charAt(1).toUpperCase()
    })
}

var fakeClassListMethods = {
    _toString: function() {
        var node = this.node
        var cls = node.className
        var str = typeof cls === "string" ? cls : cls.baseVal
        return str.split(/\s+/).join(" ")
    },
    _contains: function(cls) {
        return (" " + this + " ").indexOf(" " + cls + " ") > -1
    },
    _add: function(cls) {
        if (!this.contains(cls)) {
            this._set(this + " " + cls)
        }
    },
    _remove: function(cls) {
        this._set((" " + this + " ").replace(" " + cls + " ", " "))
    },
    __set: function(cls) {
        cls = cls.trim()
        var node = this.node
        if (rsvg.test(node)) {
            //SVG元素的className是一个对象 SVGAnimatedString { baseVal="", animVal=""}，只能通过set/getAttribute操作
            node.setAttribute("class", cls)
        } else {
            node.className = cls
        }
    } //toggle存在版本差异，因此不使用它
}

    function fakeClassList(node) {
        if (!("classList" in node)) {
            node.classList = {
                node: node
            }
            for (var k in fakeClassListMethods) {
                node.classList[k.slice(1)] = fakeClassListMethods[k]
            }
        }
        return node.classList
    }


    "add,remove".replace(rword, function(method) {
        avalon.fn[method + "Class"] = function(cls) {
            var el = this[0]
            //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
            if (cls && typeof cls === "string" && el && el.nodeType === 1) {
                cls.replace(/\S+/g, function(c) {
                    fakeClassList(el)[method](c)
                })
            }
            return this
        }
    })
    avalon.fn.mix({
        hasClass: function(cls) {
            var el = this[0] || {}
            return el.nodeType === 1 && fakeClassList(el).contains(cls)
        },
        toggleClass: function(value, stateVal) {
            var className, i = 0
            var classNames = String(value).split(/\s+/)
            var isBool = typeof stateVal === "boolean"
            while ((className = classNames[i++])) {
                var state = isBool ? stateVal : !this.hasClass(className)
                this[state ? "addClass" : "removeClass"](className)
            }
            return this
        },
        attr: function(name, value) {
            if (arguments.length === 2) {
                this[0].setAttribute(name, value)
                return this
            } else {
                return this[0].getAttribute(name)
            }
        },
        data: function(name, value) {
            name = "data-" + hyphen(name || "")
            switch (arguments.length) {
                case 2:
                    this.attr(name, value)
                    return this
                case 1:
                    var val = this.attr(name)
                    return parseData(val)
                case 0:
                    var ret = {}
                    ap.forEach.call(this[0].attributes, function(attr) {
                        if (attr) {
                            name = attr.name
                            if (!name.indexOf("data-")) {
                                name = camelize(name.slice(5))
                                ret[name] = parseData(attr.value)
                            }
                        }
                    })
                    return ret
            }
        },
        removeData: function(name) {
            name = "data-" + hyphen(name)
            this[0].removeAttribute(name)
            return this
        },
        css: function(name, value) {
            if (avalon.isPlainObject(name)) {
                for (var i in name) {
                    avalon.css(this, i, name[i])
                }
            } else {
                var ret = avalon.css(this, name, value)
            }
            return ret !== void 0 ? ret : this
        },
        position: function() {
            var offsetParent, offset,
                elem = this[0],
                parentOffset = {
                    top: 0,
                    left: 0
                }
            if (!elem) {
                return
            }
            if (this.css("position") === "fixed") {
                offset = elem.getBoundingClientRect()
            } else {
                offsetParent = this.offsetParent() //得到真正的offsetParent
                offset = this.offset() // 得到正确的offsetParent
                if (offsetParent[0].tagName !== "HTML") {
                    parentOffset = offsetParent.offset()
                }
                parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true)
                parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true)

                // Subtract offsetParent scroll positions
                parentOffset.top -= offsetParent.scrollTop()
                parentOffset.left -= offsetParent.scrollLeft()
            }
            return {
                top: offset.top - parentOffset.top - avalon.css(elem, "marginTop", true),
                left: offset.left - parentOffset.left - avalon.css(elem, "marginLeft", true)
            }
        },
        offsetParent: function() {
            var offsetParent = this[0].offsetParent
            while (offsetParent && avalon.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent;
            }
            return avalon(offsetParent || root)
        },
        bind: function(type, fn, phase) {
            if (this[0]) { //此方法不会链
                return avalon.bind(this[0], type, fn, phase)
            }
        },
        unbind: function(type, fn, phase) {
            if (this[0]) {
                avalon.unbind(this[0], type, fn, phase)
            }
            return this
        },
        val: function(value) {
            var node = this[0]
            if (node && node.nodeType === 1) {
                var get = arguments.length === 0
                var access = get ? ":get" : ":set"
                var fn = valHooks[getValType(node) + access]
                if (fn) {
                    var val = fn(node, value)
                } else if (get) {
                    return (node.value || "").replace(/\r/g, "")
                } else {
                    node.value = value
                }
            }
            return get ? val : this
        }
    })

    function parseData(data) {
        try {
            if (typeof data === "object")
                return data
            data = data === "true" ? true :
                data === "false" ? false :
                data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? avalon.parseJSON(data) : data
        } catch (e) {}
        return data
    }
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g
avalon.parseJSON = window.JSON ? JSON.parse : function(data) {
    if (typeof data === "string") {
        data = data.trim();
        if (data) {
            if (rvalidchars.test(data.replace(rvalidescape, "@")
                .replace(rvalidtokens, "]")
                .replace(rvalidbraces, ""))) {
                return (new Function("return " + data))() // jshint ignore:line
            }
        }
        avalon.error("Invalid JSON: " + data)
    }
    return data
}

//生成avalon.fn.scrollLeft, avalon.fn.scrollTop方法
avalon.each({
    scrollLeft: "pageXOffset",
    scrollTop: "pageYOffset"
}, function(method, prop) {
    avalon.fn[method] = function(val) {
        var node = this[0] || {}, win = getWindow(node),
            top = method === "scrollTop"
        if (!arguments.length) {
            return win ? (prop in win) ? win[prop] : root[method] : node[method]
        } else {
            if (win) {
                win.scrollTo(!top ? val : avalon(win).scrollLeft(), top ? val : avalon(win).scrollTop())
            } else {
                node[method] = val
            }
        }
    }
})

function getWindow(node) {
    return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
}
//=============================css相关=======================
var cssHooks = avalon.cssHooks = {}
var prefixes = ["", "-webkit-", "-o-", "-moz-", "-ms-"]
var cssMap = {
    "float": W3C ? "cssFloat" : "styleFloat"
}
avalon.cssNumber = oneObject("columnCount,order,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

avalon.cssName = function(name, host, camelCase) {
    if (cssMap[name]) {
        return cssMap[name]
    }
    host = host || root.style
    for (var i = 0, n = prefixes.length; i < n; i++) {
        camelCase = camelize(prefixes[i] + name)
        if (camelCase in host) {
            return (cssMap[name] = camelCase)
        }
    }
    return null
}
cssHooks["@:set"] = function(node, name, value) {
    try { //node.style.width = NaN;node.style.width = "xxxxxxx";node.style.width = undefine 在旧式IE下会抛异常
        node.style[name] = value
    } catch (e) {}
}
if (window.getComputedStyle) {
    cssHooks["@:get"] = function(node, name) {
        if (!node || !node.style) {
            throw new Error("getComputedStyle要求传入一个节点 " + node)
        }
        var ret, styles = getComputedStyle(node, null)
            if (styles) {
                ret = name === "filter" ? styles.getPropertyValue(name) : styles[name]
                if (ret === "") {
                    ret = node.style[name] //其他浏览器需要我们手动取内联样式
                }
            }
        return ret
    }
    cssHooks["opacity:get"] = function(node) {
        var ret = cssHooks["@:get"](node, "opacity")
        return ret === "" ? "1" : ret
    }
} else {
    var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
    var rposition = /^(top|right|bottom|left)$/
    var ralpha = /alpha\([^)]*\)/i
    var ie8 = !! window.XDomainRequest
    var salpha = "DXImageTransform.Microsoft.Alpha"
    var border = {
        thin: ie8 ? '1px' : '2px',
        medium: ie8 ? '3px' : '4px',
        thick: ie8 ? '5px' : '6px'
    }
    cssHooks["@:get"] = function(node, name) {
        //取得精确值，不过它有可能是带em,pc,mm,pt,%等单位
        var currentStyle = node.currentStyle
        var ret = currentStyle[name]
        if ((rnumnonpx.test(ret) && !rposition.test(ret))) {
            //①，保存原有的style.left, runtimeStyle.left,
            var style = node.style,
                left = style.left,
                rsLeft = node.runtimeStyle.left
                //②由于③处的style.left = xxx会影响到currentStyle.left，
                //因此把它currentStyle.left放到runtimeStyle.left，
                //runtimeStyle.left拥有最高优先级，不会style.left影响
                node.runtimeStyle.left = currentStyle.left
                //③将精确值赋给到style.left，然后通过IE的另一个私有属性 style.pixelLeft
                //得到单位为px的结果；fontSize的分支见http://bugs.jquery.com/ticket/760
                style.left = name === 'fontSize' ? '1em' : (ret || 0)
                ret = style.pixelLeft + "px"
                //④还原 style.left，runtimeStyle.left
            style.left = left
            node.runtimeStyle.left = rsLeft
        }
        if (ret === "medium") {
            name = name.replace("Width", "Style")
            //border width 默认值为medium，即使其为0"
            if (currentStyle[name] === "none") {
                ret = "0px"
            }
        }
        return ret === "" ? "auto" : border[ret] || ret
    }
    cssHooks["opacity:set"] = function(node, name, value) {
        var style = node.style
        var opacity = isFinite(value) && value <= 1 ? "alpha(opacity=" + value * 100 + ")" : ""
        var filter = style.filter || "";
        style.zoom = 1
        //不能使用以下方式设置透明度
        //node.filters.alpha.opacity = value * 100
        style.filter = (ralpha.test(filter) ?
            filter.replace(ralpha, opacity) :
            filter + " " + opacity).trim()
        if (!style.filter) {
            style.removeAttribute("filter")
        }
    }
    cssHooks["opacity:get"] = function(node) {
        //这是最快的获取IE透明值的方式，不需要动用正则了！
        var alpha = node.filters.alpha || node.filters[salpha],
            op = alpha && alpha.enabled ? alpha.opacity : 100
        return (op / 100) + "" //确保返回的是字符串
    }
}

"top,left".replace(rword, function(name) {
    cssHooks[name + ":get"] = function(node) {
        var computed = cssHooks["@:get"](node, name)
        return /px$/.test(computed) ? computed :
            avalon(node).position()[name] + "px"
    }
})

var cssShow = {
    position: "absolute",
    visibility: "hidden",
    display: "block"
}

var rdisplayswap = /^(none|table(?!-c[ea]).+)/

    function showHidden(node, array) {
        //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
        if (node.offsetWidth <= 0) { //opera.offsetWidth可能小于0
            if (rdisplayswap.test(cssHooks["@:get"](node, "display"))) {
                var obj = {
                    node: node
                }
                for (var name in cssShow) {
                    obj[name] = node.style[name]
                    node.style[name] = cssShow[name]
                }
                array.push(obj)
            }
            var parent = node.parentNode
            if (parent && parent.nodeType === 1) {
                showHidden(parent, array)
            }
        }
    }
    "Width,Height".replace(rword, function(name) { //fix 481
        var method = name.toLowerCase(),
            clientProp = "client" + name,
            scrollProp = "scroll" + name,
            offsetProp = "offset" + name
            cssHooks[method + ":get"] = function(node, which, override) {
                var boxSizing = -4
                if (typeof override === "number") {
                    boxSizing = override
                }
                which = name === "Width" ? ["Left", "Right"] : ["Top", "Bottom"]
                var ret = node[offsetProp] // border-box 0
                if (boxSizing === 2) { // margin-box 2
                    return ret + avalon.css(node, "margin" + which[0], true) + avalon.css(node, "margin" + which[1], true)
                }
                if (boxSizing < 0) { // padding-box  -2
                    ret = ret - avalon.css(node, "border" + which[0] + "Width", true) - avalon.css(node, "border" + which[1] + "Width", true)
                }
                if (boxSizing === -4) { // content-box -4
                    ret = ret - avalon.css(node, "padding" + which[0], true) - avalon.css(node, "padding" + which[1], true)
                }
                return ret
            }
        cssHooks[method + "&get"] = function(node) {
            var hidden = [];
            showHidden(node, hidden);
            var val = cssHooks[method + ":get"](node)
            for (var i = 0, obj; obj = hidden[i++];) {
                node = obj.node
                for (var n in obj) {
                    if (typeof obj[n] === "string") {
                        node.style[n] = obj[n]
                    }
                }
            }
            return val;
        }
        avalon.fn[method] = function(value) { //会忽视其display
            var node = this[0]
            if (arguments.length === 0) {
                if (node.setTimeout) { //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
                    return node["inner" + name] || node.document.documentElement[clientProp]
                }
                if (node.nodeType === 9) { //取得页面尺寸
                    var doc = node.documentElement
                    //FF chrome    html.scrollHeight< body.scrollHeight
                    //IE 标准模式 : html.scrollHeight> body.scrollHeight
                    //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
                    return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
                }
                return cssHooks[method + "&get"](node)
            } else {
                return this.css(method, value)
            }
        }
        avalon.fn["inner" + name] = function() {
            return cssHooks[method + ":get"](this[0], void 0, -2)
        }
        avalon.fn["outer" + name] = function(includeMargin) {
            return cssHooks[method + ":get"](this[0], void 0, includeMargin === true ? 2 : 0)
        }
    })
    avalon.fn.offset = function() { //取得距离页面左右角的坐标
        var node = this[0],
            box = {
                left: 0,
                top: 0
            }
        if (!node || !node.tagName || !node.ownerDocument) {
            return box
        }
        var doc = node.ownerDocument,
            body = doc.body,
            root = doc.documentElement,
            win = doc.defaultView || doc.parentWindow
        if (!avalon.contains(root, node)) {
            return box
        }
        //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
        //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
        //http://msdn.microsoft.com/en-us/library/ms536433.aspx
        if (node.getBoundingClientRect) {
            box = node.getBoundingClientRect() // BlackBerry 5, iOS 3 (original iPhone)
        }
        //chrome/IE6: body.scrollTop, firefox/other: root.scrollTop
        var clientTop = root.clientTop || body.clientTop,
            clientLeft = root.clientLeft || body.clientLeft,
            scrollTop = Math.max(win.pageYOffset || 0, root.scrollTop, body.scrollTop),
            scrollLeft = Math.max(win.pageXOffset || 0, root.scrollLeft, body.scrollLeft)
            // 把滚动距离加到left,top中去。
            // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
            // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
            return {
                top: box.top + scrollTop - clientTop,
                left: box.left + scrollLeft - clientLeft
            }
    }

    //==================================val相关============================

    function getValType(elem) {
        var ret = elem.tagName.toLowerCase()
        return ret === "input" && /checkbox|radio/.test(elem.type) ? "checked" : ret
    }
var roption = /^<option(?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s+value[\s=]/i
var valHooks = {
    "option:get": IEVersion ? function(node) {
        //在IE11及W3C，如果没有指定value，那么node.value默认为node.text（存在trim作），但IE9-10则是取innerHTML(没trim操作)
        //specified并不可靠，因此通过分析outerHTML判定用户有没有显示定义value
        return roption.test(node.outerHTML) ? node.value : node.text.trim()
    } : function(node) {
        return node.value
    },
    "select:get": function(node, value) {
        var option, options = node.options,
            index = node.selectedIndex,
            getter = valHooks["option:get"],
            one = node.type === "select-one" || index < 0,
            values = one ? null : [],
            max = one ? index + 1 : options.length,
            i = index < 0 ? max : one ? index : 0
        for (; i < max; i++) {
            option = options[i]
            //旧式IE在reset后不会改变selected，需要改用i === index判定
            //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
            //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
            if ((option.selected || i === index) && !option.disabled) {
                value = getter(option)
                if (one) {
                    return value
                }
                //收集所有selected值组成数组返回
                values.push(value)
            }
        }
        return values
    },
    "select:set": function(node, values, optionSet) {
        values = [].concat(values) //强制转换为数组
        var getter = valHooks["option:get"]
        for (var i = 0, el; el = node.options[i++];) {
            if ((el.selected = values.indexOf(getter(el)) > -1)) {
                optionSet = true
            }
        }
        if (!optionSet) {
            node.selectedIndex = -1
        }
    }
}

/*********************************************************************
 *                          编译系统                                  *
 **********************************************************************/
var meta = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\'
}
var quote = window.JSON && JSON.stringify || function(str) {
    return '"' + str.replace(/[\\\"\x00-\x1f]/g, function(a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"'
}

var keywords = [
    "break,case,catch,continue,debugger,default,delete,do,else,false",
    "finally,for,function,if,in,instanceof,new,null,return,switch,this",
    "throw,true,try,typeof,var,void,while,with", /* 关键字*/
    "abstract,boolean,byte,char,class,const,double,enum,export,extends",
    "final,float,goto,implements,import,int,interface,long,native",
    "package,private,protected,public,short,static,super,synchronized",
    "throws,transient,volatile", /*保留字*/
    "arguments,let,yield,undefined" /* ECMA 5 - use strict*/].join(",")
var rrexpstr = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g
var rsplit = /[^\w$]+/g
var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g')
var rnumber = /\b\d[^,]*/g
var rcomma = /^,+|,+$/g
var variablePool = new Cache(512)
var getVariables = function (code) {
    var key = "," + code.trim()
    var ret = variablePool.get(key)
    if (ret) {
        return ret
    }
    var match = code
            .replace(rrexpstr, "")
            .replace(rsplit, ",")
            .replace(rkeywords, "")
            .replace(rnumber, "")
            .replace(rcomma, "")
            .split(/^$|,+/)
    return variablePool.put(key, uniqSet(match))
}
/*添加赋值语句*/

function addAssign(vars, scope, name, data) {
    var ret = [],
            prefix = " = " + name + "."
    for (var i = vars.length, prop; prop = vars[--i]; ) {
        if (scope.hasOwnProperty(prop)) {
            ret.push(prop + prefix + prop)
            data.vars.push(prop)
            if (data.type === "duplex") {
                vars.get = name + "." + prop
            }
            vars.splice(i, 1)
        }
    }
    return ret
}

function uniqSet(array) {
    var ret = [],
            unique = {}
    for (var i = 0; i < array.length; i++) {
        var el = array[i]
        var id = el && typeof el.$id === "string" ? el.$id : el
        if (!unique[id]) {
            unique[id] = ret.push(el)
        }
    }
    return ret
}
//缓存求值函数，以便多次利用
var evaluatorPool = new Cache(128)
//取得求值函数及其传参
var rduplex = /\w\[.*\]|\w\.\w/
var rproxy = /(\$proxy\$[a-z]+)\d+$/
var rthimRightParentheses = /\)\s*$/
var rthimOtherParentheses = /\)\s*\|/g
var rquoteFilterName = /\|\s*([$\w]+)/g
var rpatchBracket = /"\s*\["/g
var rthimLeftParentheses = /"\s*\(/g
function parseFilter(val, filters) {
    filters = filters
            .replace(rthimRightParentheses, "")//处理最后的小括号
            .replace(rthimOtherParentheses, function () {//处理其他小括号
                return "],|"
            })
            .replace(rquoteFilterName, function (a, b) { //处理|及它后面的过滤器的名字
                return "[" + quote(b)
            })
            .replace(rpatchBracket, function () {
                return '"],["'
            })
            .replace(rthimLeftParentheses, function () {
                return '",'
            }) + "]"
    return  "return avalon.filters.$filter(" + val + ", " + filters + ")"
}

function parseExpr(code, scopes, data) {
    var dataType = data.type
    var filters = data.filters || ""
    var exprId = scopes.map(function (el) {
        return String(el.$id).replace(rproxy, "$1")
    }) + code + dataType + filters
    var vars = getVariables(code).concat(),
            assigns = [],
            names = [],
            args = [],
            prefix = ""
    //args 是一个对象数组， names 是将要生成的求值函数的参数
    scopes = uniqSet(scopes)
    data.vars = []
    for (var i = 0, sn = scopes.length; i < sn; i++) {
        if (vars.length) {
            var name = "vm" + expose + "_" + i
            names.push(name)
            args.push(scopes[i])
            assigns.push.apply(assigns, addAssign(vars, scopes[i], name, data))
        }
    }
    if (!assigns.length && dataType === "duplex") {
        return
    }
    if (dataType !== "duplex" && (code.indexOf("||") > -1 || code.indexOf("&&") > -1)) {
        //https://github.com/RubyLouvre/avalon/issues/583
        data.vars.forEach(function (v) {
            var reg = new RegExp("\\b" + v + "(?:\\.\\w+|\\[\\w+\\])+", "ig")
            code = code.replace(reg, function (_) {
                var c = _.charAt(v.length)
                var r = IEVersion ? code.slice(arguments[1] + _.length) : RegExp.rightContext
                var method = /^\s*\(/.test(r)
                if (c === "." || c === "[" || method) {//比如v为aa,我们只匹配aa.bb,aa[cc],不匹配aaa.xxx
                    var name = "var" + String(Math.random()).replace(/^0\./, "")
                    if (method) {//array.size()
                        var array = _.split(".")
                        if (array.length > 2) {
                            var last = array.pop()
                            assigns.push(name + " = " + array.join("."))
                            return name + "." + last
                        } else {
                            return _
                        }
                    }
                    assigns.push(name + " = " + _)
                    return name
                } else {
                    return _
                }
            })
        })
    }
    //---------------args----------------
    data.args = args
    //---------------cache----------------
    delete data.vars
    var fn = evaluatorPool.get(exprId) //直接从缓存，免得重复生成
    if (fn) {
        data.evaluator = fn
        return
    }
    prefix = assigns.join(", ")
    if (prefix) {
        prefix = "var " + prefix
    }
    if (/\S/.test(filters)) { //文本绑定，双工绑定才有过滤器
        if (!/text|html/.test(data.type)) {
            throw Error("ms-" + data.type + "不支持过滤器")
        }
        code = "\nvar ret" + expose + " = " + code + ";\r\n"
        code += parseFilter("ret" + expose, filters)
    } else if (dataType === "duplex") { //双工绑定
        var _body = "\nreturn function(vvv){\n\t" +
                prefix +
                ";\n\tif(!arguments.length){\n\t\treturn " +
                code +
                "\n\t}\n\t" + (!rduplex.test(code) ? vars.get : code) +
                "= vvv;\n} "
        try {
            fn = Function.apply(noop, names.concat(_body))
            data.evaluator = evaluatorPool.put(exprId, fn)
        } catch (e) {
            log("debug: parse error," + e.message)
        }
        return
    } else if (dataType === "on") { //事件绑定
        if (code.indexOf("(") === -1) {
            code += ".call(this, $event)"
        } else {
            code = code.replace("(", ".call(this,")
        }
        names.push("$event")
        code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
        var lastIndex = code.lastIndexOf("\nreturn")
        var header = code.slice(0, lastIndex)
        var footer = code.slice(lastIndex)
        code = header + "\n" + footer
    } else { //其他绑定
        code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
    }
    try {
        fn = Function.apply(noop, names.concat("\n" + prefix + code))
        data.evaluator = evaluatorPool.put(exprId, fn)
    } catch (e) {
        log("debug: parse error," + e.message)
    } finally {
        vars = assigns = names = null //释放内存
    }
}


//parseExpr的智能引用代理

function parseExprProxy(code, scopes, data, tokens, noRegister) {
    if (Array.isArray(tokens)) {
        code = tokens.map(function (el) {
            return el.expr ? "(" + el.value + ")" : quote(el.value)
        }).join(" + ")
    }
    parseExpr(code, scopes, data)
    if (data.evaluator && !noRegister) {
        data.handler = bindingExecutors[data.handlerName || data.type]
        //方便调试
        //这里非常重要,我们通过判定视图刷新函数的element是否在DOM树决定
        //将它移出订阅者列表
        avalon.injectBinding(data)
    }
}
avalon.parseExprProxy = parseExprProxy
/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/

avalon.scan = function(elem, vmodel) {
    elem = elem || root
    var vmodels = vmodel ? [].concat(vmodel) : []
    scanTag(elem, vmodels)
}

//http://www.w3.org/TR/html5/syntax.html#void-elements
var stopScan = oneObject("area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr,noscript,script,style,textarea".toUpperCase())

function checkScan(elem, callback, innerHTML) {
    var id = setTimeout(function() {
        var currHTML = elem.innerHTML
        clearTimeout(id)
        if (currHTML === innerHTML) {
            callback()
        } else {
            checkScan(elem, callback, currHTML)
        }
    })
}


function createSignalTower(elem, vmodel) {
    var id = elem.getAttribute("avalonctrl") || vmodel.$id
    elem.setAttribute("avalonctrl", id)
    vmodel.$events.expr = elem.tagName + '[avalonctrl="' + id + '"]'
}

var getBindingCallback = function(elem, name, vmodels) {
    var callback = elem.getAttribute(name)
    if (callback) {
        for (var i = 0, vm; vm = vmodels[i++]; ) {
            if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                return vm[callback]
            }
        }
    }
}

function executeBindings(bindings, vmodels) {
    for (var i = 0, data; data = bindings[i++]; ) {
        data.vmodels = vmodels
        bindingHandlers[data.type](data, vmodels)
        if (data.evaluator && data.element && data.element.nodeType === 1) { //移除数据绑定，防止被二次解析
            //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
            data.element.removeAttribute(data.name)
        }
    }
    bindings.length = 0
}

//https://github.com/RubyLouvre/avalon/issues/636
var mergeTextNodes = IEVersion && window.MutationObserver ? function (elem) {
    var node = elem.firstChild, text
    while (node) {
        var aaa = node.nextSibling
        if (node.nodeType === 3) {
            if (text) {
                text.nodeValue += node.nodeValue
                elem.removeChild(node)
            } else {
                text = node
            }
        } else {
            text = null
        }
        node = aaa
    }
} : 0
var roneTime = /^\s*::/
var rmsAttr = /ms-(\w+)-?(.*)/
var priorityMap = {
    "if": 10,
    "repeat": 90,
    "data": 100,
    "widget": 110,
    "each": 1400,
    "with": 1500,
    "duplex": 2000,
    "on": 3000
}

var events = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")
var obsoleteAttrs = oneObject("value,title,alt,checked,selected,disabled,readonly,enabled")
function bindingSorter(a, b) {
    return a.priority - b.priority
}

function scanAttr(elem, vmodels, match) {
    var scanNode = true
    if (vmodels.length) {
        var attributes = getAttributes ? getAttributes(elem) : elem.attributes
        var bindings = []
        var fixAttrs = []
        var msData = {}
        for (var i = 0, attr; attr = attributes[i++]; ) {
            if (attr.specified) {
                if (match = attr.name.match(rmsAttr)) {
                    //如果是以指定前缀命名的
                    var type = match[1]
                    var param = match[2] || ""
                    var value = attr.value
                    var name = attr.name
                    if (events[type]) {
                        param = type
                        type = "on"
                    } else if (obsoleteAttrs[type]) {
                        if (type === "enabled") {//吃掉ms-enabled绑定,用ms-disabled代替
                            log("warning!ms-enabled或ms-attr-enabled已经被废弃")
                            type = "disabled"
                            value = "!(" + value + ")"
                        }
                        param = type
                        type = "attr"
                        name = "ms-" + type + "-"+ param
                        fixAttrs.push([attr.name, name, value])
                    }
                    msData[name] = value
                    if (typeof bindingHandlers[type] === "function") {
                        var newValue = value.replace(roneTime, "")
                        var oneTime = value !== newValue
                        var binding = {
                            type: type,
                            param: param,
                            element: elem,
                            name: name,
                            value: newValue,
                            oneTime: oneTime,
                            uuid: name+"-"+getUid(elem),
                             //chrome与firefox下Number(param)得到的值不一样 #855
                            priority:  (priorityMap[type] || type.charCodeAt(0) * 10 )+ (Number(param.replace(/\D/g, "")) || 0)
                        }
                        if (type === "html" || type === "text") {
                            var token = getToken(value)
                            avalon.mix(binding, token)
                            binding.filters = binding.filters.replace(rhasHtml, function () {
                                binding.type = "html"
                                binding.group = 1
                                return ""
                            })// jshint ignore:line
                        } else if (type === "duplex") {
                            var hasDuplex = name
                        } else if (name === "ms-if-loop") {
                            binding.priority += 100
                        }
                        bindings.push(binding)
                        if (type === "widget") {
                            elem.msData = elem.msData || msData
                        }
                    }
                }
            }
        }
        if (bindings.length) {
            bindings.sort(bindingSorter)
            fixAttrs.forEach(function (arr) {
                log("warning!请改用" + arr[1] + "代替" + arr[0] + "!")
                elem.removeAttribute(arr[0])
                elem.setAttribute(arr[1], arr[2])
            })
            //http://bugs.jquery.com/ticket/7071
            //在IE下对VML读取type属性,会让此元素所有属性都变成<Failed>
            if (hasDuplex) {
                if (msData["ms-attr-checked"]) {
                    log("warning!一个控件不能同时定义ms-attr-checked与" + hasDuplex)
                }
                if (msData["ms-attr-value"]) {
                    log("warning!一个控件不能同时定义ms-attr-value与" + hasDuplex)
                }
            }
            for (i = 0; binding = bindings[i]; i++) {
                type = binding.type
                if (rnoscanAttrBinding.test(type)) {
                    return executeBindings(bindings.slice(0, i + 1), vmodels)
                } else if (scanNode) {
                    scanNode = !rnoscanNodeBinding.test(type)
                }
            }
            executeBindings(bindings, vmodels)
        }
    }
    if (scanNode && !stopScan[elem.tagName] && rbind.test(elem.innerHTML.replace(rlt, "<").replace(rgt, ">"))) {
        mergeTextNodes && mergeTextNodes(elem)
        scanNodeList(elem, vmodels) //扫描子孙元素
    }
}
var rnoscanAttrBinding = /^if|widget|repeat$/
var rnoscanNodeBinding = /^each|with|html|include$/
//IE67下，在循环绑定中，一个节点如果是通过cloneNode得到，自定义属性的specified为false，无法进入里面的分支，
//但如果我们去掉scanAttr中的attr.specified检测，一个元素会有80+个特性节点（因为它不区分固有属性与自定义属性），很容易卡死页面
if (!"1" [0]) {
    var attrPool = new Cache(512)
    var rattrs = /\s+(ms-[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g,
            rquote = /^['"]/,
            rtag = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/i,
            ramp = /&amp;/g
    //IE6-8解析HTML5新标签，会将它分解两个元素节点与一个文本节点
    //<body><section>ddd</section></body>
    //        window.onload = function() {
    //            var body = document.body
    //            for (var i = 0, el; el = body.children[i++]; ) {
    //                avalon.log(el.outerHTML)
    //            }
    //        }
    //依次输出<SECTION>, </SECTION>
    var getAttributes = function (elem) {
        var html = elem.outerHTML
        //处理IE6-8解析HTML5新标签的情况，及<br>等半闭合标签outerHTML为空的情况
        if (html.slice(0, 2) === "</" || !html.trim()) {
            return []
        }
        var str = html.match(rtag)[0]
        var attributes = [],
                match,
                k, v
        var ret = attrPool.get(str)
        if (ret) {
            return ret
        }
        while (k = rattrs.exec(str)) {
            v = k[2]
            if (v) {
                v = (rquote.test(v) ? v.slice(1, -1) : v).replace(ramp, "&")
            }
            var name = k[1].toLowerCase()
            match = name.match(rmsAttr)
            var binding = {
                name: name,
                specified: true,
                value: v || ""
            }
            attributes.push(binding)
        }
        return attrPool.put(str, attributes)
    }
}

function scanNodeList(parent, vmodels) {
    var nodes = avalon.slice(parent.childNodes)
    scanNodeArray(nodes, vmodels)
}

function scanNodeArray(nodes, vmodels) {
    for (var i = 0, node; node = nodes[i++];) {
        switch (node.nodeType) {
            case 1:
                scanTag(node, vmodels) //扫描元素节点
                if (node.msCallback) {
                    node.msCallback()
                    node.msCallback = void 0
                }
                break
            case 3:
               if(rexpr.test(node.nodeValue)){
                    scanText(node, vmodels, i) //扫描文本节点
               }
               break
        }
    }
}


function scanTag(elem, vmodels, node) {
    //扫描顺序  ms-skip(0) --> ms-important(1) --> ms-controller(2) --> ms-if(10) --> ms-repeat(100) 
    //--> ms-if-loop(110) --> ms-attr(970) ...--> ms-each(1400)-->ms-with(1500)--〉ms-duplex(2000)垫后
    var a = elem.getAttribute("ms-skip")
    //#360 在旧式IE中 Object标签在引入Flash等资源时,可能出现没有getAttributeNode,innerHTML的情形
    if (!elem.getAttributeNode) {
        return log("warning " + elem.tagName + " no getAttributeNode method")
    }
    var b = elem.getAttributeNode("ms-important")
    var c = elem.getAttributeNode("ms-controller")
    if (typeof a === "string") {
        return
    } else if (node = b || c) {
        var newVmodel = avalon.vmodels[node.value]
        if (!newVmodel) {
            return
        }
        //ms-important不包含父VM，ms-controller相反
        vmodels = node === b ? [newVmodel] : [newVmodel].concat(vmodels)
        var name = node.name
        elem.removeAttribute(name) //removeAttributeNode不会刷新[ms-controller]样式规则
        avalon(elem).removeClass(name)
        createSignalTower(elem, newVmodel)
    }
    scanAttr(elem, vmodels) //扫描特性节点
}
var rhasHtml = /\|\s*html\s*/,
        r11a = /\|\|/g,
        rlt = /&lt;/g,
        rgt = /&gt;/g,
        rstringLiteral = /(['"])(\\\1|.)+?\1/g
function getToken(value) {
    if (value.indexOf("|") > 0) {
        var scapegoat = value.replace(rstringLiteral, function (_) {
            return Array(_.length + 1).join("1")// jshint ignore:line
        })
        var index = scapegoat.replace(r11a, "\u1122\u3344").indexOf("|") //干掉所有短路或
        if (index > -1) {
            return {
                filters: value.slice(index),
                value: value.slice(0, index),
                expr: true
            }
        }
    }
    return {
        value: value,
        filters: "",
        expr: true
    }
}

function scanExpr(str) {
    var tokens = [],
            value, start = 0,
            stop
    do {
        stop = str.indexOf(openTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { // {{ 左边的文本
            tokens.push({
                value: value,
                filters: "",
                expr: false
            })
        }
        start = stop + openTag.length
        stop = str.indexOf(closeTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { //处理{{ }}插值表达式
            tokens.push(getToken(value, start))
        }
        start = stop + closeTag.length
    } while (1)
    value = str.slice(start)
    if (value) { //}} 右边的文本
        tokens.push({
            value: value,
            expr: false,
            filters: ""
        })
    }
    return tokens
}

function scanText(textNode, vmodels, index) {
    var bindings = []
    tokens = scanExpr(textNode.data)
    if (tokens.length) {
        for (var i = 0; token = tokens[i++]; ) {
            var node = DOC.createTextNode(token.value) //将文本转换为文本节点，并替换原来的文本节点
            if (token.expr) {
                token.value = token.value.replace(roneTime, function () {
                    token.oneTime = true
                    return ""
                })
                token.type = "text"
                token.element = node
                token.filters = token.filters.replace(rhasHtml, function () {
                    token.type = "html"
                    return ""
                })// jshint ignore:line
                token.pos = index * 1000 + i
                bindings.push(token) //收集带有插值表达式的文本
            }
            avalonFragment.appendChild(node)
        }
        textNode.parentNode.replaceChild(avalonFragment, textNode)
        if (bindings.length)
            executeBindings(bindings, vmodels)
    }
}

var bools = ["autofocus,autoplay,async,allowTransparency,checked,controls",
    "declare,disabled,defer,defaultChecked,defaultSelected",
    "contentEditable,isMap,loop,multiple,noHref,noResize,noShade",
    "open,readOnly,selected"
].join(",")
var boolMap = {}
bools.replace(rword, function(name) {
    boolMap[name.toLowerCase()] = name
})

var propMap = { //属性名映射
    "accept-charset": "acceptCharset",
    "char": "ch",
    "charoff": "chOff",
    "class": "className",
    "for": "htmlFor",
    "http-equiv": "httpEquiv"
}

var anomaly = ["accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan",
    "dateTime,defaultValue,frameBorder,longDesc,maxLength,marginWidth,marginHeight",
    "rowSpan,tabIndex,useMap,vSpace,valueType,vAlign"
].join(",")
anomaly.replace(rword, function(name) {
    propMap[name.toLowerCase()] = name
})

var rnoscripts = /<noscript.*?>(?:[\s\S]+?)<\/noscript>/img
var rnoscriptText = /<noscript.*?>([\s\S]+?)<\/noscript>/im

var getXHR = function() {
    return new(window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP") // jshint ignore:line
}

var templatePool = avalon.templateCache = {}

bindingHandlers.attr = function(data, vmodels) {
    var text = data.value.trim(),
        simple = true
    if (text.indexOf(openTag) > -1 && text.indexOf(closeTag) > 2) {
        simple = false
        if (rexpr.test(text) && RegExp.rightContext === "" && RegExp.leftContext === "") {
            simple = true
            text = RegExp.$1
        }
    }
    if (data.type === "include") {
        var elem = data.element
        data.includeRendered = getBindingCallback(elem, "data-include-rendered", vmodels)
        data.includeLoaded = getBindingCallback(elem, "data-include-loaded", vmodels)
        var outer = data.includeReplace = !! avalon(elem).data("includeReplace")
        if (avalon(elem).data("includeCache")) {
            data.templateCache = {}
        }
        data.startInclude = DOC.createComment("ms-include")
        data.endInclude = DOC.createComment("ms-include-end")
        if (outer) {
            data.element = data.startInclude
            elem.parentNode.insertBefore(data.startInclude, elem)
            elem.parentNode.insertBefore(data.endInclude, elem.nextSibling)
        } else {
            elem.insertBefore(data.startInclude, elem.firstChild)
            elem.appendChild(data.endInclude)
        }
    }
    data.handlerName = "attr" //handleName用于处理多种绑定共用同一种bindingExecutor的情况
    parseExprProxy(text, vmodels, data, (simple ? 0 : scanExpr(data.value)))
}

bindingExecutors.attr = function(val, elem, data) {
    var method = data.type,
        attrName = data.param
    if (method === "css") {
        avalon(elem).css(attrName, val)
    } else if (method === "attr") {
       
        // ms-attr-class="xxx" vm.xxx="aaa bbb ccc"将元素的className设置为aaa bbb ccc
        // ms-attr-class="xxx" vm.xxx=false  清空元素的所有类名
        // ms-attr-name="yyy"  vm.yyy="ooo" 为元素设置name属性
        var toRemove = (val === false) || (val === null) || (val === void 0)

        if (!W3C && propMap[attrName]) { //旧式IE下需要进行名字映射
            attrName = propMap[attrName]
        }
        var bool = boolMap[attrName]
        if (typeof elem[bool] === "boolean") {
            elem[bool] = !! val //布尔属性必须使用el.xxx = true|false方式设值
            if (!val) { //如果为false, IE全系列下相当于setAttribute(xxx,''),会影响到样式,需要进一步处理
                toRemove = true
            }
        }
        if (toRemove) {
            return elem.removeAttribute(attrName)
        }
        //SVG只能使用setAttribute(xxx, yyy), VML只能使用elem.xxx = yyy ,HTML的固有属性必须elem.xxx = yyy
        var isInnate = rsvg.test(elem) ? false : (DOC.namespaces && isVML(elem)) ? true : attrName in elem.cloneNode(false)
        if (isInnate) {
            elem[attrName] = val+""
        } else {
            elem.setAttribute(attrName, val)
        }
    } else if (method === "include" && val) {
        var vmodels = data.vmodels
        var rendered = data.includeRendered
        var loaded = data.includeLoaded
        var replace = data.includeReplace
        var target = replace ? elem.parentNode : elem
        var scanTemplate = function(text) {
            if (loaded) {
                var newText = loaded.apply(target, [text].concat(vmodels))
                if (typeof newText === "string")
                    text = newText
            }
            if (rendered) {
                checkScan(target, function() {
                    rendered.call(target)
                }, NaN)
            }
            var lastID = data.includeLastID
            if (data.templateCache && lastID && lastID !== val) {
                var lastTemplate = data.templateCache[lastID]
                if (!lastTemplate) {
                    lastTemplate = data.templateCache[lastID] = DOC.createElement("div")
                    ifGroup.appendChild(lastTemplate)
                }
            }
            data.includeLastID = val
            while (true) {
                var node = data.startInclude.nextSibling
                if (node && node !== data.endInclude) {
                    target.removeChild(node)
                    if (lastTemplate)
                        lastTemplate.appendChild(node)
                } else {
                    break
                }
            }
            var dom = getTemplateNodes(data, val, text)
            var nodes = avalon.slice(dom.childNodes)
            target.insertBefore(dom, data.endInclude)
            scanNodeArray(nodes, vmodels)
        }

        if (data.param === "src") {
            if (typeof templatePool[val] === "string") {
                avalon.nextTick(function() {
                    scanTemplate(templatePool[val])
                })
            } else if (Array.isArray(templatePool[val])) { //#805 防止在循环绑定中发出许多相同的请求
                templatePool[val].push(scanTemplate)
            } else {
                var xhr = getXHR()
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        var s = xhr.status
                        if (s >= 200 && s < 300 || s === 304 || s === 1223) {
                            var text = xhr.responseText
                            for (var f = 0, fn; fn = templatePool[val][f++];) {
                                fn(text)
                            }
                            templatePool[val] = text
                        }
                    }
                }
                templatePool[val] = [scanTemplate]
                xhr.open("GET", val, true)
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = true
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                xhr.send(null)
            }
        } else {
            //IE系列与够新的标准浏览器支持通过ID取得元素（firefox14+）
            //http://tjvantoll.com/2012/07/19/dom-element-references-as-global-variables/
            var el = val && val.nodeType === 1 ? val : DOC.getElementById(val)
            if (el) {
                if (el.tagName === "NOSCRIPT" && !(el.innerHTML || el.fixIE78)) { //IE7-8 innerText,innerHTML都无法取得其内容，IE6能取得其innerHTML
                    xhr = getXHR() //IE9-11与chrome的innerHTML会得到转义的内容，它们的innerText可以
                    xhr.open("GET", location, false) //谢谢Nodejs 乱炖群 深圳-纯属虚构
                    xhr.send(null)
                    //http://bbs.csdn.net/topics/390349046?page=1#post-393492653
                    var noscripts = DOC.getElementsByTagName("noscript")
                    var array = (xhr.responseText || "").match(rnoscripts) || []
                    var n = array.length
                    for (var i = 0; i < n; i++) {
                        var tag = noscripts[i]
                        if (tag) { //IE6-8中noscript标签的innerHTML,innerText是只读的
                            tag.style.display = "none" //http://haslayout.net/css/noscript-Ghost-Bug
                            tag.fixIE78 = (array[i].match(rnoscriptText) || ["", "&nbsp;"])[1]
                        }
                    }
                }
                avalon.nextTick(function() {
                    scanTemplate(el.fixIE78 || el.value || el.innerText || el.innerHTML)
                })
            }
        }
    } else {
        if (!root.hasAttribute && typeof val === "string" && (method === "src" || method === "href")) {
            val = val.replace(/&amp;/g, "&") //处理IE67自动转义的问题
        }
        elem[method] = val
        if (window.chrome && elem.tagName === "EMBED") {
            var parent = elem.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
            var comment = document.createComment("ms-src")
            parent.replaceChild(comment, elem)
            parent.replaceChild(elem, comment)
        }
    }
}

function getTemplateNodes(data, id, text) {
    var div = data.templateCache && data.templateCache[id]
    if (div) {
        var dom = DOC.createDocumentFragment(),
            firstChild
        while (firstChild = div.firstChild) {
            dom.appendChild(firstChild)
        }
        return dom
    }
    return avalon.parseHTML(text)
}

//这几个指令都可以使用插值表达式，如ms-src="aaa/{{b}}/{{c}}.html"
"title,alt,src,value,css,include,href".replace(rword, function(name) {
    bindingHandlers[name] = bindingHandlers.attr
})
//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag" 
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
bindingHandlers["class"] = function(data, vmodels) {
    var oldStyle = data.param,
        text = data.value,
        rightExpr
        data.handlerName = "class"
    if (!oldStyle || isFinite(oldStyle)) {
        data.param = "" //去掉数字
        var noExpr = text.replace(rexprg, function(a) {
            return a.replace(/./g, "0")
            //return Math.pow(10, a.length - 1) //将插值表达式插入10的N-1次方来占位
        })
        var colonIndex = noExpr.indexOf(":") //取得第一个冒号的位置
        if (colonIndex === -1) { // 比如 ms-class="aaa bbb ccc" 的情况
            var className = text
        } else { // 比如 ms-class-1="ui-state-active:checked" 的情况 
            className = text.slice(0, colonIndex)
            rightExpr = text.slice(colonIndex + 1)
            parseExpr(rightExpr, vmodels, data) //决定是添加还是删除
            if (!data.evaluator) {
                log("debug: ms-class '" + (rightExpr || "").trim() + "' 不存在于VM中")
                return false
            } else {
                data._evaluator = data.evaluator
                data._args = data.args
            }
        }
        var hasExpr = rexpr.test(className) //比如ms-class="width{{w}}"的情况
        if (!hasExpr) {
            data.immobileClass = className
        }
        parseExprProxy("", vmodels, data, (hasExpr ? scanExpr(className) : 0))
    } else {
        data.immobileClass = data.oldStyle = data.param
        parseExprProxy(text, vmodels, data)
    }
}

bindingExecutors["class"] = function(val, elem, data) {
    var $elem = avalon(elem),
        method = data.type
    if (method === "class" && data.oldStyle) { //如果是旧风格
        $elem.toggleClass(data.oldStyle, !! val)
    } else {
        //如果存在冒号就有求值函数
        data.toggleClass = data._evaluator ? !! data._evaluator.apply(elem, data._args) : true
        data.newClass = data.immobileClass || val
        if (data.oldClass && data.newClass !== data.oldClass) {
            $elem.removeClass(data.oldClass)
        }
        data.oldClass = data.newClass
        switch (method) {
            case "class":
                $elem.toggleClass(data.newClass, data.toggleClass)
                break
            case "hover":
            case "active":
                if (!data.hasBindEvent) { //确保只绑定一次
                    var activate = "mouseenter" //在移出移入时切换类名
                    var abandon = "mouseleave"
                    if (method === "active") { //在聚焦失焦中切换类名
                        elem.tabIndex = elem.tabIndex || -1
                        activate = "mousedown"
                        abandon = "mouseup"
                        var fn0 = $elem.bind("mouseleave", function() {
                            data.toggleClass && $elem.removeClass(data.newClass)
                        })
                    }
                    var fn1 = $elem.bind(activate, function() {
                        data.toggleClass && $elem.addClass(data.newClass)
                    })
                    var fn2 = $elem.bind(abandon, function() {
                        data.toggleClass && $elem.removeClass(data.newClass)
                    })
                    data.rollback = function() {
                        $elem.unbind("mouseleave", fn0)
                        $elem.unbind(activate, fn1)
                        $elem.unbind(abandon, fn2)
                    }
                    data.hasBindEvent = true
                }
                break;
        }
    }
}

"hover,active".replace(rword, function(method) {
    bindingHandlers[method] = bindingHandlers["class"]
})
//ms-controller绑定已经在scanTag 方法中实现
//ms-css绑定已由ms-attr绑定实现


// bindingHandlers.data 定义在if.js
bindingExecutors.data = function(val, elem, data) {
	var key = "data-" + data.param
	if (val && typeof val === "object") {
		elem[key] = val
	} else {
		elem.setAttribute(key, String(val))
	}
}
//双工绑定
var duplexBinding = bindingHandlers.duplex = function(data, vmodels) {
    var elem = data.element,
        hasCast
        parseExprProxy(data.value, vmodels, data, 0, 1)

        data.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || noop
    if (data.evaluator && data.args) {
        var params = []
        var casting = oneObject("string,number,boolean,checked")
        if (elem.type === "radio" && data.param === "") {
            data.param = "checked"
        }
        if (elem.msData) {
            elem.msData["ms-duplex"] = data.value
        }
        data.param.replace(/\w+/g, function(name) {
            if (/^(checkbox|radio)$/.test(elem.type) && /^(radio|checked)$/.test(name)) {
                if (name === "radio")
                    log("ms-duplex-radio已经更名为ms-duplex-checked")
                name = "checked"
                data.isChecked = true
            }
            if (name === "bool") {
                name = "boolean"
                log("ms-duplex-bool已经更名为ms-duplex-boolean")
            } else if (name === "text") {
                name = "string"
                log("ms-duplex-text已经更名为ms-duplex-string")
            }
            if (casting[name]) {
                hasCast = true
            }
            avalon.Array.ensure(params, name)
        })
        if (!hasCast) {
            params.push("string")
        }
        data.param = params.join("-")
        data.bound = function(type, callback) {
            if (elem.addEventListener) {
                elem.addEventListener(type, callback, false)
            } else {
                elem.attachEvent("on" + type, callback)
            }
            var old = data.rollback
            data.rollback = function() {
                elem.avalonSetter = null
                avalon.unbind(elem, type, callback)
                old && old()
            }
        }
        for (var i in avalon.vmodels) {
            var v = avalon.vmodels[i]
            v.$fire("avalon-ms-duplex-init", data)
        }
        var cpipe = data.pipe || (data.pipe = pipe)
        cpipe(null, data, "init")
        var tagName = elem.tagName
        duplexBinding[tagName] && duplexBinding[tagName](elem, data.evaluator.apply(null, data.args), data)
    }
}
//不存在 bindingExecutors.duplex

    function fixNull(val) {
        return val == null ? "" : val
    }
avalon.duplexHooks = {
    checked: {
        get: function(val, data) {
            return !data.element.oldValue
        }
    },
    string: {
        get: function(val) { //同步到VM
            return val
        },
        set: fixNull
    },
    "boolean": {
        get: function(val) {
            return val === "true"
        },
        set: fixNull
    },
    number: {
        get: function(val, data) {
            var number = parseFloat(val)
            if (-val === -number) {
                return number
            }
            var arr = /strong|medium|weak/.exec(data.element.getAttribute("data-duplex-number")) || ["medium"]
            switch (arr[0]) {
                case "strong":
                    return 0
                case "medium":
                    return val === "" ? "" : 0
                case "weak":
                    return val
            }
        },
        set: fixNull
    }
}

function pipe(val, data, action, e) {
    data.param.replace(/\w+/g, function(name) {
        var hook = avalon.duplexHooks[name]
        if (hook && typeof hook[action] === "function") {
            val = hook[action](val, data)
        }
    })
    return val
}

var TimerID, ribbon = []

    avalon.tick = function(fn) {
        if (ribbon.push(fn) === 1) {
            TimerID = setInterval(ticker, 60)
        }
    }

    function ticker() {
        for (var n = ribbon.length - 1; n >= 0; n--) {
            var el = ribbon[n]
            if (el() === false) {
                ribbon.splice(n, 1)
            }
        }
        if (!ribbon.length) {
            clearInterval(TimerID)
        }
    }

var watchValueInTimer = noop
var rmsinput = /text|password|hidden/
new function() { // jshint ignore:line
    try { //#272 IE9-IE11, firefox
        var setters = {}
        var aproto = HTMLInputElement.prototype
        var bproto = HTMLTextAreaElement.prototype
        function newSetter(value) { // jshint ignore:line
                setters[this.tagName].call(this, value)
                if (rmsinput.test(this.type) && !this.msFocus && this.avalonSetter) {
                    this.avalonSetter()
                }
        }
        var inputProto = HTMLInputElement.prototype
        Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
        setters["INPUT"] = Object.getOwnPropertyDescriptor(aproto, "value").set
    
        Object.defineProperty(aproto, "value", {
            set: newSetter
        })
        setters["TEXTAREA"] = Object.getOwnPropertyDescriptor(bproto, "value").set
        Object.defineProperty(bproto, "value", {
            set: newSetter
        })
    } catch (e) {
        //在chrome 43中 ms-duplex终于不需要使用定时器实现双向绑定了
        // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
        // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
        watchValueInTimer = avalon.tick
    }
} // jshint ignore:line
if (IEVersion) {
    avalon.bind(DOC, "selectionchange", function(e) {
        var el = DOC.activeElement
        if (el && typeof el.avalonSetter === "function") {
            el.avalonSetter()
        }
    })
}

//处理radio, checkbox, text, textarea, password
duplexBinding.INPUT = function(element, evaluator, data) {
    var $type = element.type,
        bound = data.bound,
        $elem = avalon(element),
        composing = false

        function callback(value) {
            data.changed.call(this, value, data)
        }

        function compositionStart() {
            composing = true
        }

        function compositionEnd() {
            composing = false
        }
        //当value变化时改变model的值
    var updateVModel = function() {
        if (composing) //处理中文输入法在minlengh下引发的BUG
            return
        var val = element.oldValue = element.value //防止递归调用形成死循环
        var lastValue = data.pipe(val, data, "get")
        if ($elem.data("duplexObserve") !== false) {
            evaluator(lastValue)
            callback.call(element, lastValue)
            if ($elem.data("duplex-focus")) {
                avalon.nextTick(function() {
                    element.focus()
                })
            }
        }
    }
    //当model变化时,它就会改变value的值
    data.handler = function() {
        var val = data.pipe(evaluator(), data, "set") + "" //fix #673
        if (val !== element.oldValue) {
            element.value = val
        }
    }
    if (data.isChecked || $type === "radio") {
        var IE6 = IEVersion === 6
        updateVModel = function() {
            if ($elem.data("duplexObserve") !== false) {
                var lastValue = data.pipe(element.value, data, "get")
                evaluator(lastValue)
                callback.call(element, lastValue)
            }
        }
        data.handler = function() {
            var val = evaluator()
            var checked = data.isChecked ? !! val : val + "" === element.value
            element.oldValue = checked
            if (IE6) {
                setTimeout(function() {
                    //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                    //并且要先设置defaultChecked后设置checked
                    //并且必须设置延迟
                    element.defaultChecked = checked
                    element.checked = checked
                }, 31)
            } else {
                element.checked = checked
            }
        }
        bound("click", updateVModel)
    } else if ($type === "checkbox") {
        updateVModel = function() {
            if ($elem.data("duplexObserve") !== false) {
                var method = element.checked ? "ensure" : "remove"
                var array = evaluator()
                if (!Array.isArray(array)) {
                    log("ms-duplex应用于checkbox上要对应一个数组")
                    array = [array]
                }
                var val = data.pipe(element.value, data, "get")
                avalon.Array[method](array, val)
                callback.call(element, array)
            }
        }

        data.handler = function() {
            var array = [].concat(evaluator()) //强制转换为数组
            var val = data.pipe(element.value, data, "get")
            element.checked = array.indexOf(val) > -1
        }
        bound(W3C ? "change" : "click", updateVModel)
    } else {
        var events = element.getAttribute("data-duplex-event") || "input"
        if (element.attributes["data-event"]) {
            log("data-event指令已经废弃，请改用data-duplex-event")
        }

        function delay(e) { // jshint ignore:line
            setTimeout(function() {
                updateVModel(e)
            })
        }
        events.replace(rword, function(name) {
            switch (name) {
                case "input":
                    if (!IEVersion) { // W3C
                        bound("input", updateVModel)
                        //非IE浏览器才用这个
                        bound("compositionstart", compositionStart)
                        bound("compositionend", compositionEnd)
                        bound("DOMAutoComplete", updateVModel)
                    } else { //onpropertychange事件无法区分是程序触发还是用户触发
                        // IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                        if (IEVersion > 8) {
                            bound("input", updateVModel) //IE9使用propertychange无法监听中文输入改动
                        } else {
                            bound("propertychange", function(e) { //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                                if (e.propertyName === "value") {
                                    updateVModel()
                                }
                            })
                        }
                        bound("dragend", delay)
                        //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                        //http://www.matts411.com/post/internet-explorer-9-oninput/
                    }
                    break
                default:
                    bound(name, updateVModel)
                    break
            }
        })
        bound("focus", function() {
            element.msFocus = true
        })
        bound("blur", function() {
            element.msFocus = false
        })

        if (rmsinput.test($type)) {
            watchValueInTimer(function() {
                if (root.contains(element)) {
                    if (!element.msFocus && element.oldValue !== element.value) {
                        updateVModel()
                    }
                } else if (!element.msRetain) {
                    return false
                }
            })
        }

        element.avalonSetter = updateVModel //#765
    }

    element.oldValue = element.value
    avalon.injectBinding(data)
    callback.call(element, element.value)
}
duplexBinding.TEXTAREA = duplexBinding.INPUT
duplexBinding.SELECT = function(element, evaluator, data) {
    var $elem = avalon(element)

        function updateVModel() {
            if ($elem.data("duplexObserve") !== false) {
                var val = $elem.val() //字符串或字符串数组
                if (Array.isArray(val)) {
                    val = val.map(function(v) {
                        return data.pipe(v, data, "get")
                    })
                } else {
                    val = data.pipe(val, data, "get")
                }
                if (val + "" !== element.oldValue) {
                    evaluator(val)
                }
                data.changed.call(element, val, data)
            }
        }
    data.handler = function() {
        var val = evaluator()
        val = val && val.$model || val
        if (Array.isArray(val)) {
            if (!element.multiple) {
                log("ms-duplex在<select multiple=true>上要求对应一个数组")
            }
        } else {
            if (element.multiple) {
                log("ms-duplex在<select multiple=false>不能对应一个数组")
            }
        }
        //必须变成字符串后才能比较
        val = Array.isArray(val) ? val.map(String) : val + ""
        if (val + "" !== element.oldValue) {
            $elem.val(val)
            element.oldValue = val + ""
        }
    }
    data.bound("change", updateVModel)
    element.msCallback = function() {
        avalon.injectBinding(data)
        data.changed.call(element, evaluator(), data)
    }
}
// bindingHandlers.html 定义在if.js
bindingExecutors.html = function (val, elem, data) {
    var isHtmlFilter = elem.nodeType !== 1
    var parent = isHtmlFilter ? elem.parentNode : elem
    if (!parent)
        return
    val = val == null ? "" : val
    if (data.oldText !== val) {
        data.oldText = val
    } else {
        return
    }
    if (elem.nodeType === 3) {
        var signature = generateID("html")
        parent.insertBefore(DOC.createComment(signature), elem)
        data.element = DOC.createComment(signature + ":end")
        parent.replaceChild(data.element, elem)
        elem = data.element
    }
    if (typeof val !== "object") {//string, number, boolean
        var fragment = avalon.parseHTML(String(val))
    } else if (val.nodeType === 11) { //将val转换为文档碎片
        fragment = val
    } else if (val.nodeType === 1 || val.item) {
        var nodes = val.nodeType === 1 ? val.childNodes : val.item
        fragment = avalonFragment.cloneNode(true)
        while (nodes[0]) {
            fragment.appendChild(nodes[0])
        }
    }

    nodes = avalon.slice(fragment.childNodes)
    //插入占位符, 如果是过滤器,需要有节制地移除指定的数量,如果是html指令,直接清空
    if (isHtmlFilter) {
        var endValue = elem.nodeValue.slice(0, -4)
        while (true) {
            var node = elem.previousSibling
            if (!node || node.nodeType === 8 && node.nodeValue === endValue) {
                break
            } else {
                parent.removeChild(node)
            }
        }
        parent.insertBefore(fragment, elem)
    } else {
        avalon.clearHTML(elem).appendChild(fragment)
    }
    scanNodeArray(nodes, data.vmodels)
}
bindingHandlers["if"] =
    bindingHandlers.data =
    bindingHandlers.text =
    bindingHandlers.html =
    function(data, vmodels) {
        parseExprProxy(data.value, vmodels, data)
}

bindingExecutors["if"] = function(val, elem, data) {
     try {
         if(!elem.parentNode) return
     } catch(e) {return}
    if (val) { //插回DOM树
        if (elem.nodeType === 8) {
            elem.parentNode.replaceChild(data.template, elem)
         //   animate.enter(data.template, elem.parentNode)
            elem = data.element = data.template //这时可能为null
        }
        if (elem.getAttribute(data.name)) {
            elem.removeAttribute(data.name)
            scanAttr(elem, data.vmodels)
        }
        data.rollback = null
    } else { //移出DOM树，并用注释节点占据原位置
        if (elem.nodeType === 1) {
            var node = data.element = DOC.createComment("ms-if")
            elem.parentNode.replaceChild(node, elem)
       //     animate.leave(elem, node.parentNode, node)
            data.template = elem //元素节点
            ifGroup.appendChild(elem)
            data.rollback = function() {
                if (elem.parentNode === ifGroup) {
                    ifGroup.removeChild(elem)
                }
            }
        }
    }
}
//ms-important绑定已经在scanTag 方法中实现
//ms-include绑定已由ms-attr绑定实现

var rdash = /\(([^)]*)\)/
bindingHandlers.on = function(data, vmodels) {
    var value = data.value
    data.type = "on"
    var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
    if (typeof bindingHandlers.on[eventType + "Hook"] === "function") {
        bindingHandlers.on[eventType + "Hook"](data)
    }
    if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
        var matched = (value.match(rdash) || ["", ""])[1].trim()
        if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
            value = value.replace(rdash, "")
        }
    }
    parseExprProxy(value, vmodels, data)
}

bindingExecutors.on = function(callback, elem, data) {
    callback = function(e) {
        var fn = data.evaluator || noop
        return fn.apply(this, data.args.concat(e))
    }
    var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
    if (eventType === "scan") {
        callback.call(elem, {
            type: eventType
        })
    } else if (typeof data.specialBind === "function") {
        data.specialBind(elem, callback)
    } else {
        var removeFn = avalon.bind(elem, eventType, callback)
    }
    data.rollback = function() {
        if (typeof data.specialUnbind === "function") {
            data.specialUnbind()
        } else {
            avalon.unbind(elem, eventType, removeFn)
        }
    }
}
bindingHandlers.repeat = function (data, vmodels) {
    var type = data.type
    parseExprProxy(data.value, vmodels, data, 0, 1)
    data.proxies = []
    var freturn = false
    try {
        var $repeat = data.$repeat = data.evaluator.apply(0, data.args || [])
        var xtype = avalon.type($repeat)
        if (xtype !== "object" && xtype !== "array") {
            freturn = true
            avalon.log("warning:" + data.value + "只能是对象或数组")
        }
    } catch (e) {
        freturn = true
    }
    var arr = data.value.split(".") || []
    if (arr.length > 1) {
        arr.pop()
        var n = arr[0]
        for (var i = 0, v; v = vmodels[i++]; ) {
            if (v && v.hasOwnProperty(n)) {
                var events = v[n].$events || {}
                events[subscribers] = events[subscribers] || []
                events[subscribers].push(data)
                break
            }
        }
    }

    var elem = data.element
    if (elem.nodeType === 1) {
        elem.removeAttribute(data.name)
        data.sortedCallback = getBindingCallback(elem, "data-with-sorted", vmodels)
        data.renderedCallback = getBindingCallback(elem, "data-" + type + "-rendered", vmodels)
        var signature = generateID(type)
        var start = DOC.createComment(signature)
        var end = DOC.createComment(signature + ":end")
        data.signature = signature
        data.template = avalonFragment.cloneNode(false)
        if (type === "repeat") {
            var parent = elem.parentNode
            parent.replaceChild(end, elem)
            parent.insertBefore(start, end)
            data.template.appendChild(elem)
        } else {
            while (elem.firstChild) {
                data.template.appendChild(elem.firstChild)
            }
            elem.appendChild(start)
            elem.appendChild(end)
        }
        data.element = end
        data.handler = bindingExecutors.repeat
        data.rollback = function () {
            var elem = data.element
            if (!elem)
                return
            data.handler("clear")
        }
    }

    if (freturn) {
        return
    }

    data.$outer = {}
    var check0 = "$key"
    var check1 = "$val"
    if (Array.isArray($repeat)) {
        check0 = "$first"
        check1 = "$last"
    }
   
    for (i = 0; v = vmodels[i++]; ) {
        if (v.hasOwnProperty(check0) && v.hasOwnProperty(check1)) {
            data.$outer = v
            break
        }
    }
    var $events = $repeat.$events
    var $list = ($events || {})[subscribers]
    injectDependency($list, data)
    if (xtype === "object") {
        data.$with = true
        $repeat.$proxy || ($repeat.$proxy = {})
        data.handler("append", $repeat)
    } else if ($repeat.length) {
        data.handler("add", 0, $repeat.length)
    }
}

bindingExecutors.repeat = function (method, pos, el) {
    if (method) {
        var data = this, start, fragment
        var end = data.element
        var comments = getComments(data)
        var parent = end.parentNode
        var proxies = data.proxies
        var transation = avalonFragment.cloneNode(false)
        switch (method) {
            case "add": //在pos位置后添加el数组（pos为插入位置,el为要插入的个数）
                var n = pos + el
                var fragments = []
                for (var i = pos; i < n; i++) {
                    var proxy = eachProxyAgent(i, data)
                    proxies.splice(i, 0, proxy)
                    shimController(data, transation, proxy, fragments)
                }
                var now = new Date() - 0
                avalon.optimize = avalon.optimize || now
                for (i = 0; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                if (avalon.optimize === now) {
                    delete avalon.optimize
                }
                parent.insertBefore(transation, comments[pos] || end)
                avalon.profile("插入操作花费了 " + (new Date - now))
                break
            case "del": //将pos后的el个元素删掉(pos, el都是数字)
                sweepNodes(comments[pos], comments[pos + el] || end)
                var removed = proxies.splice(pos, el)
                recycleProxies(removed, "each")
                break
            case "clear":
                start = comments[0]
                if (start) {
                    sweepNodes(start, end)
                    if (data.$with) {
                        parent.insertBefore(start, end)
                    }
                }
                recycleProxies(proxies, "each")
                break
            case "move":
                start = comments[0]
                if (start) {
                    var signature = start.nodeValue
                    var rooms = []
                    var room = [],
                            node
                    sweepNodes(start, end, function () {
                        room.unshift(this)
                        if (this.nodeValue === signature) {
                            rooms.unshift(room)
                            room = []
                        }
                    })
                    sortByIndex(rooms, pos)
                    sortByIndex(proxies, pos)
                    while (room = rooms.shift()) {
                        while (node = room.shift()) {
                            transation.appendChild(node)
                        }
                    }
                    parent.insertBefore(transation, end)
                }
                break
        case "index": //将proxies中的第pos个起的所有元素重新索引
                var last = proxies.length - 1
                for (; el = proxies[pos]; pos++) {
                    el.$index = pos
                    el.$first = pos === 0
                    el.$last = pos === last
                }
                return
            case "set": //将proxies中的第pos个元素的VM设置为el（pos为数字，el任意）
                proxy = proxies[pos]
                if (proxy) {
                    fireDependencies(proxy.$events[data.param || "el"])
                }
                break
            case "append":
                var object = pos //原来第2参数， 被循环对象
                var pool = object.$proxy   //代理对象组成的hash
                var keys = []
                fragments = []
                for (var key in pool) {
                    if (!object.hasOwnProperty(key)) {
                        proxyRecycler(pool[key], withProxyPool) //去掉之前的代理VM
                        delete(pool[key])
                    }
                }
                for (key in object) { //得到所有键名
                    if (object.hasOwnProperty(key) && key !== "hasOwnProperty" && key !== "$proxy") {
                        keys.push(key)
                    }
                }
                if (data.sortedCallback) { //如果有回调，则让它们排序
                    var keys2 = data.sortedCallback.call(parent, keys)
                    if (keys2 && Array.isArray(keys2) && keys2.length) {
                        keys = keys2
                    }
                }

                for (i = 0; key = keys[i++]; ) {
                    if (key !== "hasOwnProperty") {
                        pool[key] = withProxyAgent(pool[key], key, data)
                        shimController(data, transation, pool[key], fragments)
                    }
                }

                parent.insertBefore(transation, end)
                for (i = 0; fragment = fragments[i++]; ) {
                    scanNodeArray(fragment.nodes, fragment.vmodels)
                    fragment.nodes = fragment.vmodels = null
                }
                break
        }
        if (!data.$repeat || data.$repeat.hasOwnProperty("$lock")) //IE6-8 VBScript对象会报错, 有时候data.$repeat不存在
            return
        if (method === "clear")
            method = "del"
        var callback = data.renderedCallback || noop,
                args = arguments
        if (parent.oldValue && parent.tagName === "SELECT") { //fix #503
            avalon(parent).val(parent.oldValue.split(","))
        }
        callback.apply(parent, args)
    }
}

"with,each".replace(rword, function (name) {
    bindingHandlers[name] = bindingHandlers.repeat
})

function shimController(data, transation, proxy, fragments) {
    var content = data.template.cloneNode(true)
    var nodes = avalon.slice(content.childNodes)
    if (!data.$with) {
        content.insertBefore(DOC.createComment(data.signature), content.firstChild)
    }
    transation.appendChild(content)
    var nv = [proxy].concat(data.vmodels)
    var fragment = {
        nodes: nodes,
        vmodels: nv
    }
    fragments.push(fragment)
}

function getComments(data) {
    var end = data.element
    var signature = end.nodeValue.replace(":end", "")
    var node = end.previousSibling
    var array = []
    while (node) {
        if (node.nodeValue === signature) {
            array.unshift(node)
        }
        node = node.previousSibling
    }
    return array
}


//移除掉start与end之间的节点(保留end)
function sweepNodes(start, end, callback) {
    while (true) {
        var node = end.previousSibling
        if (!node)
            break
        node.parentNode.removeChild(node)
        callback && callback.call(node)
        if (node === start) {
            break
        }
    }
}

// 为ms-each,ms-with, ms-repeat会创建一个代理VM，
// 通过它们保持一个下上文，让用户能调用$index,$first,$last,$remove,$key,$val,$outer等属性与方法
// 所有代理VM的产生,消费,收集,存放通过xxxProxyFactory,xxxProxyAgent, recycleProxies,xxxProxyPool实现
var withProxyPool = []
function withProxyFactory() {
    var proxy = modelFactory({
        $key: "",
        $outer: {},
        $host: {},
        $val: {
            get: function () {
                return this.$host[this.$key]
            },
            set: function (val) {
                this.$host[this.$key] = val
            }
        }
    }, {
        $val: 1
    })
    proxy.$id = generateID("$proxy$with")
    return proxy
}

function withProxyAgent(proxy, key, data) {
    proxy = proxy || withProxyPool.pop()
    if (!proxy) {
        proxy = withProxyFactory()
    } else {
        proxy.$reinitialize()
    }
    var host = data.$repeat
    proxy.$key = key
    proxy.$host = host
    proxy.$outer = data.$outer
    if (host.$events) {
        proxy.$events.$val = host.$events[key]
    } else {
        proxy.$events = {}
    }
    return proxy
}


function  recycleProxies(proxies) {
    eachProxyRecycler(proxies)
}
function eachProxyRecycler(proxies) {
    proxies.forEach(function (proxy) {
        proxyRecycler(proxy, eachProxyPool)
    })
    proxies.length = 0
}


var eachProxyPool = []
function eachProxyFactory(name) {
    var source = {
        $host: [],
        $outer: {},
        $index: 0,
        $first: false,
        $last: false,
        $remove: avalon.noop
    }
    source[name] = {
        get: function () {
            var e = this.$events
            var array = e.$index
            e.$index = e[name] //#817 通过$index为el收集依赖
            try {
                return this.$host[this.$index]
            } finally {
                e.$index = array
            }
        },
        set: function (val) {
            try {
                var e = this.$events
                var array = e.$index
                e.$index = []
                this.$host.set(this.$index, val)
            } finally {
                e.$index = array
            }
        }
    }
    var second = {
        $last: 1,
        $first: 1,
        $index: 1
    }
    var proxy = modelFactory(source, second)
    proxy.$id = generateID("$proxy$each")
    return proxy
}

function eachProxyAgent(index, data) {
    var param = data.param || "el",
            proxy
    for (var i = 0, n = eachProxyPool.length; i < n; i++) {
        var candidate = eachProxyPool[i]
        if (candidate && candidate.hasOwnProperty(param)) {
            proxy = candidate
            eachProxyPool.splice(i, 1)
        }
    }
    if (!proxy) {
        proxy = eachProxyFactory(param)
    }
    var host = data.$repeat
    var last = host.length - 1
    proxy.$index = index
    proxy.$first = index === 0
    proxy.$last = index === last
    proxy.$host = host
    proxy.$outer = data.$outer
    proxy.$remove = function () {
        return host.removeAt(proxy.$index)
    }
    return proxy
}


function proxyRecycler(proxy, proxyPool) {
    for (var i in proxy.$events) {
        if (Array.isArray(proxy.$events[i])) {
            proxy.$events[i].forEach(function (data) {
                if (typeof data === "object")
                    disposeData(data)
            })// jshint ignore:line
            proxy.$events[i].length = 0
        }
    }
    proxy.$host = proxy.$outer = {}
    if (proxyPool.unshift(proxy) > kernel.maxRepeatSize) {
        proxyPool.pop()
    }
}
/*********************************************************************
 *                         各种指令                                  *
 **********************************************************************/
//ms-skip绑定已经在scanTag 方法中实现
// bindingHandlers.text 定义在if.js
bindingExecutors.text = function(val, elem) {
    val = val == null ? "" : val //不在页面上显示undefined null
    if (elem.nodeType === 3) { //绑定在文本节点上
        try { //IE对游离于DOM树外的节点赋值会报错
            elem.data = val
        } catch (e) {}
    } else { //绑定在特性节点上
        if ("textContent" in elem) {
            elem.textContent = val
        } else {
            elem.innerText = val
        }
    }
}
function parseDisplay(nodeName, val) {
    //用于取得此类标签的默认display值
    var key = "_" + nodeName
    if (!parseDisplay[key]) {
        var node = DOC.createElement(nodeName)
        root.appendChild(node)
        if (W3C) {
            val = getComputedStyle(node, null).display
        } else {
            val = node.currentStyle.display
        }
        root.removeChild(node)
        parseDisplay[key] = val
    }
    return parseDisplay[key]
}

avalon.parseDisplay = parseDisplay

bindingHandlers.visible = function(data, vmodels) {
    var elem = avalon(data.element)
    var display = elem.css("display")
    if (display === "none") {
        var style = elem[0].style
        var has = /visibility/i.test(style.cssText)
        var visible = elem.css("visibility")
        style.display = ""
        style.visibility = "hidden"
        display = elem.css("display")
        if (display === "none") {
            display = parseDisplay(elem[0].nodeName)
        }
        style.visibility = has ? visible : ""
    }
    data.display = display
    parseExprProxy(data.value, vmodels, data)
}

bindingExecutors.visible = function(val, elem, data) {
    elem.style.display = val ? data.display : "none"
}
bindingHandlers.widget = function(data, vmodels) {
    var args = data.value.match(rword)
    var elem = data.element
    var widget = args[0]
    var id = args[1]
    if (!id || id === "$") { //没有定义或为$时，取组件名+随机数
        id = generateID(widget)
    }
    var optName = args[2] || widget //没有定义，取组件名
    var constructor = avalon.ui[widget]
    if (typeof constructor === "function") { //ms-widget="tabs,tabsAAA,optname"
        vmodels = elem.vmodels || vmodels
        for (var i = 0, v; v = vmodels[i++];) {
            if (v.hasOwnProperty(optName) && typeof v[optName] === "object") {
                var vmOptions = v[optName]
                vmOptions = vmOptions.$model || vmOptions
                break
            }
        }
        if (vmOptions) {
            var wid = vmOptions[widget + "Id"]
            if (typeof wid === "string") {
                log("warning!不再支持" + widget + "Id")
                id = wid
            }
        }
        //抽取data-tooltip-text、data-tooltip-attr属性，组成一个配置对象
        var widgetData = avalon.getWidgetData(elem, widget)
        data.value = [widget, id, optName].join(",")
        data[widget + "Id"] = id
        data.evaluator = noop
        elem.msData["ms-widget-id"] = id
        var options = data[widget + "Options"] = avalon.mix({}, constructor.defaults, vmOptions || {}, widgetData)
        elem.removeAttribute("ms-widget")
        var vmodel = constructor(elem, data, vmodels) || {} //防止组件不返回VM
        if (vmodel.$id) {
            avalon.vmodels[id] = vmodel
            createSignalTower(elem, vmodel)
            try {
                vmodel.$init(function() {
                    avalon.scan(elem, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(elem, vmodel, options, vmodels)
                    }
                })
            } catch (e) {}
            data.rollback = function() {
                try {
                    vmodel.widgetElement = null
                    vmodel.$remove()
                } catch (e) {}
                elem.msData = {}
                delete avalon.vmodels[vmodel.$id]
            }
            injectDisposeQueue(data, widgetList)
            if (window.chrome) {
                elem.addEventListener("DOMNodeRemovedFromDocument", function() {
                    setTimeout(rejectDisposeQueue)
                })
            }
        } else {
            avalon.scan(elem, vmodels)
        }
    } else if (vmodels.length) { //如果该组件还没有加载，那么保存当前的vmodels
        elem.vmodels = vmodels
    }
}
var widgetList = []
//不存在 bindingExecutors.widget
/*********************************************************************
 *                             自带过滤器                            *
 **********************************************************************/
var rscripts = /<script[^>]*>([\S\s]*?)<\/script\s*>/gim
var ron = /\s+(on[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
var ropen = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/ig
var rsanitize = {
    a: /\b(href)\=("javascript[^"]*"|'javascript[^']*')/ig,
    img: /\b(src)\=("javascript[^"]*"|'javascript[^']*')/ig,
    form: /\b(action)\=("javascript[^"]*"|'javascript[^']*')/ig
}
var rsurrogate = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
var rnoalphanumeric = /([^\#-~| |!])/g;

function numberFormat(number, decimals, point, thousands) {
    //form http://phpjs.org/functions/number_format/
    //number	必需，要格式化的数字
    //decimals	可选，规定多少个小数位。
    //point	可选，规定用作小数点的字符串（默认为 . ）。
    //thousands	可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
    number = (number + '')
            .replace(/[^0-9+\-Ee.]/g, '')
    var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 3 : Math.abs(decimals),
            sep = thousands || ",",
            dec = point || ".",
            s = '',
            toFixedFix = function(n, prec) {
                var k = Math.pow(10, prec)
                return '' + (Math.round(n * k) / k)
                        .toFixed(prec)
            }
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
            .split('.')
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '')
            .length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1)
                .join('0')
    }
    return s.join(dec)
}


var filters = avalon.filters = {
    uppercase: function(str) {
        return str.toUpperCase()
    },
    lowercase: function(str) {
        return str.toLowerCase()
    },
    truncate: function(str, length, truncation) {
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        length = length || 30
        truncation = typeof truncation === "string" ?  truncation : "..." 
        return str.length > length ? str.slice(0, length - truncation.length) + truncation : String(str)
    },
    $filter: function(val) {
        for (var i = 1, n = arguments.length; i < n; i++) {
            var array = arguments[i]
            var fn = avalon.filters[array.shift()]
            if (typeof fn === "function") {
                var arr = [val].concat(array)
                val = fn.apply(null, arr)
            }
        }
        return val
    },
    camelize: camelize,
    //https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    //    <a href="javasc&NewLine;ript&colon;alert('XSS')">chrome</a> 
    //    <a href="data:text/html;base64, PGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KDEpPg==">chrome</a>
    //    <a href="jav	ascript:alert('XSS');">IE67chrome</a>
    //    <a href="jav&#x09;ascript:alert('XSS');">IE67chrome</a>
    //    <a href="jav&#x0A;ascript:alert('XSS');">IE67chrome</a>
    sanitize: function(str) {
        return str.replace(rscripts, "").replace(ropen, function(a, b) {
            var match = a.toLowerCase().match(/<(\w+)\s/)
            if (match) { //处理a标签的href属性，img标签的src属性，form标签的action属性
                var reg = rsanitize[match[1]]
                if (reg) {
                    a = a.replace(reg, function(s, name, value) {
                        var quote = value.charAt(0)
                        return name + "=" + quote + "javascript:void(0)" + quote// jshint ignore:line
                    })
                }
            }
            return a.replace(ron, " ").replace(/\s+/g, " ") //移除onXXX事件
        })
    },
    escape: function(str) {
        //将字符串经过 str 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
        return String(str).
                replace(/&/g, '&amp;').
                replace(rsurrogate, function(value) {
                    var hi = value.charCodeAt(0)
                    var low = value.charCodeAt(1)
                    return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';'
                }).
                replace(rnoalphanumeric, function(value) {
                    return '&#' + value.charCodeAt(0) + ';'
                }).
                replace(/</g, '&lt;').
                replace(/>/g, '&gt;')
    },
    currency: function(amount, symbol, fractionSize) {
        return (symbol || "\uFFE5") + numberFormat(amount, isFinite(fractionSize) ? fractionSize : 2)
    },
    number: numberFormat
}
/*
 'yyyy': 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
 'yy': 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
 'y': 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
 'MMMM': Month in year (January-December)
 'MMM': Month in year (Jan-Dec)
 'MM': Month in year, padded (01-12)
 'M': Month in year (1-12)
 'dd': Day in month, padded (01-31)
 'd': Day in month (1-31)
 'EEEE': Day in Week,(Sunday-Saturday)
 'EEE': Day in Week, (Sun-Sat)
 'HH': Hour in day, padded (00-23)
 'H': Hour in day (0-23)
 'hh': Hour in am/pm, padded (01-12)
 'h': Hour in am/pm, (1-12)
 'mm': Minute in hour, padded (00-59)
 'm': Minute in hour (0-59)
 'ss': Second in minute, padded (00-59)
 's': Second in minute (0-59)
 'a': am/pm marker
 'Z': 4 digit (+sign) representation of the timezone offset (-1200-+1200)
 format string can also be one of the following predefined localizable formats:
 
 'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
 'short': equivalent to 'M/d/yy h:mm a' for en_US locale (e.g. 9/3/10 12:05 pm)
 'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US locale (e.g. Friday, September 3, 2010)
 'longDate': equivalent to 'MMMM d, y' for en_US locale (e.g. September 3, 2010
 'mediumDate': equivalent to 'MMM d, y' for en_US locale (e.g. Sep 3, 2010)
 'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
 'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
 'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
 */
new function() {// jshint ignore:line
    function toInt(str) {
        return parseInt(str, 10) || 0
    }

    function padNumber(num, digits, trim) {
        var neg = ""
        if (num < 0) {
            neg = '-'
            num = -num
        }
        num = "" + num
        while (num.length < digits)
            num = "0" + num
        if (trim)
            num = num.substr(num.length - digits)
        return neg + num
    }

    function dateGetter(name, size, offset, trim) {
        return function(date) {
            var value = date["get" + name]()
            if (offset > 0 || value > -offset)
                value += offset
            if (value === 0 && offset === -12) {
                value = 12
            }
            return padNumber(value, size, trim)
        }
    }

    function dateStrGetter(name, shortForm) {
        return function(date, formats) {
            var value = date["get" + name]()
            var get = (shortForm ? ("SHORT" + name) : name).toUpperCase()
            return formats[get][value]
        }
    }

    function timeZoneGetter(date) {
        var zone = -1 * date.getTimezoneOffset()
        var paddedZone = (zone >= 0) ? "+" : ""
        paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2)
        return paddedZone
    }
    //取得上午下午

    function ampmGetter(date, formats) {
        return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1]
    }
    var DATE_FORMATS = {
        yyyy: dateGetter("FullYear", 4),
        yy: dateGetter("FullYear", 2, 0, true),
        y: dateGetter("FullYear", 1),
        MMMM: dateStrGetter("Month"),
        MMM: dateStrGetter("Month", true),
        MM: dateGetter("Month", 2, 1),
        M: dateGetter("Month", 1, 1),
        dd: dateGetter("Date", 2),
        d: dateGetter("Date", 1),
        HH: dateGetter("Hours", 2),
        H: dateGetter("Hours", 1),
        hh: dateGetter("Hours", 2, -12),
        h: dateGetter("Hours", 1, -12),
        mm: dateGetter("Minutes", 2),
        m: dateGetter("Minutes", 1),
        ss: dateGetter("Seconds", 2),
        s: dateGetter("Seconds", 1),
        sss: dateGetter("Milliseconds", 3),
        EEEE: dateStrGetter("Day"),
        EEE: dateStrGetter("Day", true),
        a: ampmGetter,
        Z: timeZoneGetter
    }
    var rdateFormat = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/
    var raspnetjson = /^\/Date\((\d+)\)\/$/
    filters.date = function(date, format) {
        var locate = filters.date.locate,
                text = "",
                parts = [],
                fn, match
        format = format || "mediumDate"
        format = locate[format] || format
        if (typeof date === "string") {
            if (/^\d+$/.test(date)) {
                date = toInt(date)
            } else if (raspnetjson.test(date)) {
                date = +RegExp.$1
            } else {
                var trimDate = date.trim()
                var dateArray = [0, 0, 0, 0, 0, 0, 0]
                var oDate = new Date(0)
                //取得年月日
                trimDate = trimDate.replace(/^(\d+)\D(\d+)\D(\d+)/, function(_, a, b, c) {
                    var array = c.length === 4 ? [c, a, b] : [a, b, c]
                    dateArray[0] = toInt(array[0])     //年
                    dateArray[1] = toInt(array[1]) - 1 //月
                    dateArray[2] = toInt(array[2])     //日
                    return ""
                })
                var dateSetter = oDate.setFullYear
                var timeSetter = oDate.setHours
                trimDate = trimDate.replace(/[T\s](\d+):(\d+):?(\d+)?\.?(\d)?/, function(_, a, b, c, d) {
                    dateArray[3] = toInt(a) //小时
                    dateArray[4] = toInt(b) //分钟
                    dateArray[5] = toInt(c) //秒
                    if (d) {                //毫秒
                        dateArray[6] = Math.round(parseFloat("0." + d) * 1000)
                    }
                    return ""
                })
                var tzHour = 0
                var tzMin = 0
                trimDate = trimDate.replace(/Z|([+-])(\d\d):?(\d\d)/, function(z, symbol, c, d) {
                    dateSetter = oDate.setUTCFullYear
                    timeSetter = oDate.setUTCHours
                    if (symbol) {
                        tzHour = toInt(symbol + c)
                        tzMin = toInt(symbol + d)
                    }
                    return ""
                })

                dateArray[3] -= tzHour
                dateArray[4] -= tzMin
                dateSetter.apply(oDate, dateArray.slice(0, 3))
                timeSetter.apply(oDate, dateArray.slice(3))
                date = oDate
            }
        }
        if (typeof date === "number") {
            date = new Date(date)
        }
        if (avalon.type(date) !== "date") {
            return
        }
        while (format) {
            match = rdateFormat.exec(format)
            if (match) {
                parts = parts.concat(match.slice(1))
                format = parts.pop()
            } else {
                parts.push(format)
                format = null
            }
        }
        parts.forEach(function(value) {
            fn = DATE_FORMATS[value]
            text += fn ? fn(date, locate) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'")
        })
        return text
    }
    var locate = {
        AMPMS: {
            0: "上午",
            1: "下午"
        },
        DAY: {
            0: "星期日",
            1: "星期一",
            2: "星期二",
            3: "星期三",
            4: "星期四",
            5: "星期五",
            6: "星期六"
        },
        MONTH: {
            0: "1月",
            1: "2月",
            2: "3月",
            3: "4月",
            4: "5月",
            5: "6月",
            6: "7月",
            7: "8月",
            8: "9月",
            9: "10月",
            10: "11月",
            11: "12月"
        },
        SHORTDAY: {
            "0": "周日",
            "1": "周一",
            "2": "周二",
            "3": "周三",
            "4": "周四",
            "5": "周五",
            "6": "周六"
        },
        fullDate: "y年M月d日EEEE",
        longDate: "y年M月d日",
        medium: "yyyy-M-d H:mm:ss",
        mediumDate: "yyyy-M-d",
        mediumTime: "H:mm:ss",
        "short": "yy-M-d ah:mm",
        shortDate: "yy-M-d",
        shortTime: "ah:mm"
    }
    locate.SHORTMONTH = locate.MONTH
    filters.date.locate = locate
}// jshint ignore:line
/*********************************************************************
 *                     END                                  *
 **********************************************************************/
new function () {
    avalon.config({
        loader: false
    })
    var fns = [], loaded = DOC.readyState === "complete", fn
    function flush(f) {
        loaded = 1
        while (f = fns.shift())
            f()
    }

    avalon.bind(DOC, "DOMContentLoaded", fn = function () {
        avalon.unbind(DOC, "DOMContentLoaded", fn)
        flush()
    })

    var id = setInterval(function () {
        if (document.readyState === "complete" && document.body) {
            clearInterval(id)
            flush()
        }
    }, 50)

    avalon.ready = function (fn) {
        loaded ? fn(avalon) : fns.push(fn)
    }
    avalon.ready(function () {
        avalon.scan(DOC.body)
    })
}


// Register as a named AMD module, since avalon can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase avalon is used because AMD module names are
// derived from file names, and Avalon is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of avalon, it will work.

// Note that for maximum portability, libraries that are not avalon should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. avalon is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon
    if (typeof define === "function" && define.amd) {
        define("avalon", [], function() {
            return avalon
        })
    }
// Map over avalon in case of overwrite
    var _avalon = window.avalon
    avalon.noConflict = function(deep) {
        if (deep && window.avalon === avalon) {
            window.avalon = _avalon
        }
        return avalon
    }
// Expose avalon identifiers, even in AMD
// and CommonJS for browser emulators
    if (noGlobal === void 0) {
        window.avalon = avalon
    }
    return avalon

}));
/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define('domReady',[],function () {
    

    var isTop, testDiv, scrollIntervalId,
        isBrowser = typeof window !== "undefined" && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i;
        for (i = 0; i < callbacks.length; i += 1) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded) {
            //Call the DOM ready callbacks
            if (callbacks.length) {
                readyCalls = [];
                runCallbacks(callbacks);
            }
        }
    }

    /**
     * Sets the page as loaded.
     */
    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", pageLoaded, false);
            window.addEventListener("load", pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", pageLoaded);

            testDiv = document.createElement('div');
            try {
                isTop = window.frameElement === null;
            } catch (e) {}

            //DOMContentLoaded approximation that uses a doScroll, as found by
            //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
            //but modified by other contributors, including jdalton
            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. Latest webkit browsers also use "interactive", and
        //will fire the onDOMContentLoaded before "interactive" but not after
        //entering "interactive" or "complete". More details:
        //http://dev.w3.org/html5/spec/the-end.html#the-end
        //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
        //Hmm, this is more complicated on further use, see "firing too early"
        //bug: https://github.com/requirejs/domReady/issues/1
        //so removing the || document.readyState === "interactive" test.
        //There is still a window.onload binding that should get fired if
        //DOMContentLoaded is missed.
        if (document.readyState === "complete") {
            pageLoaded();
        }
    }

    /** START OF PUBLIC API **/

    /**
     * Registers a callback for DOM ready. If DOM is already ready, the
     * callback is called immediately.
     * @param {Function} callback
     */
    function domReady(callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
        return domReady;
    }

    domReady.version = '2.0.1';

    /**
     * Loader Plugin API method
     */
    domReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            domReady(onLoad);
        }
    };

    /** END OF PUBLIC API **/

    return domReady;
});

/**
 * @license RequireJS text 2.0.13+ Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('text',['module'], function (module) {
    

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.13+',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.lastIndexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'] &&
            !process.versions['atom-shell'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file[0] === '\uFEFF') {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes;
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});

define('text!tab/avalon.tab.html',[],function () { return '<div class="oni-tab-slider"\r\n    ms-visible="toggle">\r\n    <a href="#" class="oni-tab-slider-button oni-tab-slider-button-left oni-icon" \r\n       ms-visible="prevEnable" \r\n       ms-click="slider($event,\'prev\')">&#xf047;</a>\r\n    <div class="oni-tab-slider-ct oni-tab-slider-enable" \r\n         ms-css-margin-left="-sliderIndex*100+\'%\'">\r\n        <ul class="oni-tab-nav oni-helper-clearfix oni-widget-header oni-helper-reset" \r\n        ms-attr-id="\'tabs\' + tabs.$id">\r\n            <li class="oni-state-default" \r\n                data-repeat-rendered="computeSlider" \r\n                ms-repeat-tab="tabs" \r\n                ms-class="oni-tab-item"  \r\n                ms-class-1="oni-state-active:!!_canActive(tab, $index)" \r\n                ms-class-2="oni-state-disabled:tab.disabled" \r\n                ms-class-3="oni-tab-last:$last" \r\n                ms-class-4="oni-tab-removable:!!_canRemove(tab)" \r\n                ms-hover="oni-state-hover:!tab.disabled" \r\n                ms-{{MS_OPTION_EVENT}}="activate($event, $index)" \r\n                > \r\n                <a ms-href="tab.href?tab.href:\'#\'" ms-attr-target="tab.target||target||\'_self\'">{{_tabTitle(tab.title, tab, _cutCounter(), cutEnd) | sanitize | html}}</a>\r\n                {{MS_OPTION_REMOVABLE}}\r\n            </li>\r\n        </ul>\r\n    </div>\r\n    <a href="#" class="oni-tab-slider-button oni-icon" \r\n       ms-visible="nextEnable"\r\n       ms-click="slider($event,\'next\')">&#xf03e;</a>\r\n</div>';});


define('text!tab/avalon.tab.panels.html',[],function () { return '<div class="oni-tab-panel-container" ms-each-panel="tabpanels"\r\n\t ms-visible="toggle"\r\n\t ms-if="tabpanels.size()">\r\n     <div class="oni-tab-panel oni-widget-content" \r\n          ms-visible="_shallPanelAlwaysShow($index)" \r\n          ms-if-loop="_isAjax(panel)">{{panel.content | sanitize | html }}</div>\r\n     <div class="oni-tab-panel oni-widget-content"\r\n          ms-visible="_shallPanelAlwaysShow($index)" \r\n          ms-include-src="panel.content" \r\n          ms-if-loop="!_isAjax(panel)" data-include-rendered="onAjaxCallback">\r\n     </div>\r\n</div>';});


define('text!tab/avalon.tab.close.html',[],function () { return '<span  class="oni-tab-close oni-icon oni-icon-close"\r\n       ms-visible="!tab.disabled"\r\n       ms-click="remove($event, $index)" \r\n       ms-hover="oni-tab-close-hover" \r\n       ms-if="!!_canRemove(tab)">&#xF003;\r\n</span>';});

define('normalize',[],function() {
  
  // regular expression for removing double slashes
  // eg http://www.example.com//my///url/here -> http://www.example.com/my/url/here
  var slashes = /([^:])\/+/g
  var removeDoubleSlashes = function(uri) {
    return uri.replace(slashes, '$1/');
  }

  // given a relative URI, and two absolute base URIs, convert it from one base to another
  var protocolRegEx = /[^\:\/]*:\/\/([^\/])*/;
  var absUrlRegEx = /^(\/|data:)/;
  function convertURIBase(uri, fromBase, toBase) {
    if (uri.match(absUrlRegEx) || uri.match(protocolRegEx))
      return uri;
    uri = removeDoubleSlashes(uri);
    // if toBase specifies a protocol path, ensure this is the same protocol as fromBase, if not
    // use absolute path at fromBase
    var toBaseProtocol = toBase.match(protocolRegEx);
    var fromBaseProtocol = fromBase.match(protocolRegEx);
    if (fromBaseProtocol && (!toBaseProtocol || toBaseProtocol[1] != fromBaseProtocol[1] || toBaseProtocol[2] != fromBaseProtocol[2]))
      return absoluteURI(uri, fromBase);
    
    else {
      return relativeURI(absoluteURI(uri, fromBase), toBase);
    }
  };
  
  // given a relative URI, calculate the absolute URI
  function absoluteURI(uri, base) {
    if (uri.substr(0, 2) == './')
      uri = uri.substr(2);

    // absolute urls are left in tact
    if (uri.match(absUrlRegEx) || uri.match(protocolRegEx))
      return uri;
    
    var baseParts = base.split('/');
    var uriParts = uri.split('/');
    
    baseParts.pop();
    
    while (curPart = uriParts.shift())
      if (curPart == '..')
        baseParts.pop();
      else
        baseParts.push(curPart);
    
    return baseParts.join('/');
  };


  // given an absolute URI, calculate the relative URI
  function relativeURI(uri, base) {
    
    // reduce base and uri strings to just their difference string
    var baseParts = base.split('/');
    baseParts.pop();
    base = baseParts.join('/') + '/';
    i = 0;
    while (base.substr(i, 1) == uri.substr(i, 1))
      i++;
    while (base.substr(i, 1) != '/')
      i--;
    base = base.substr(i + 1);
    uri = uri.substr(i + 1);

    // each base folder difference is thus a backtrack
    baseParts = base.split('/');
    var uriParts = uri.split('/');
    out = '';
    while (baseParts.shift())
      out += '../';
    
    // finally add uri parts
    while (curPart = uriParts.shift())
      out += curPart + '/';
    
    return out.substr(0, out.length - 1);
  };
  
  var normalizeCSS = function(source, fromBase, toBase) {

    fromBase = removeDoubleSlashes(fromBase);
    toBase = removeDoubleSlashes(toBase);

    var urlRegEx = /@import\s*("([^"]*)"|'([^']*)')|url\s*\((?!#)\s*(\s*"([^"]*)"|'([^']*)'|[^\)]*\s*)\s*\)/ig;
    var result, url, source;

    while (result = urlRegEx.exec(source)) {
      url = result[3] || result[2] || result[5] || result[6] || result[4];
      var newUrl;
      newUrl = convertURIBase(url, fromBase, toBase);
      var quoteLen = result[5] || result[6] ? 1 : 0;
      source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1) + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
      urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
    }
    
    return source;
  };
  
  normalizeCSS.convertURIBase = convertURIBase;
  normalizeCSS.absoluteURI = absoluteURI;
  normalizeCSS.relativeURI = relativeURI;
  
  return normalizeCSS;
});
//>>excludeEnd('excludeRequireCss');
/*
 * Require-CSS RequireJS css! loader plugin
 * 0.1.8
 * Guy Bedford 2014
 * MIT
 */

/*
 *
 * Usage:
 *  require(['css!./mycssFile']);
 *
 * Tested and working in (up to latest versions as of March 2013):
 * Android
 * iOS 6
 * IE 6 - 10
 * Chome 3 - 26
 * Firefox 3.5 - 19
 * Opera 10 - 12
 * 
 * browserling.com used for virtual testing environment
 *
 * Credit to B Cavalier & J Hann for the IE 6 - 9 method,
 * refined with help from Martin Cermak
 * 
 * Sources that helped along the way:
 * - https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
 * - http://www.phpied.com/when-is-a-stylesheet-really-loaded/
 * - https://github.com/cujojs/curl/blob/master/src/curl/plugin/css.js
 *
 */

define('css',[],function() {
  if (typeof window == 'undefined')
    return { load: function(n, r, load){ load() } };

  var head = document.getElementsByTagName('head')[0];

  var engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)|AndroidWebKit\/([^ ;]*)/) || 0;

  // use <style> @import load method (IE < 9, Firefox < 18)
  var useImportLoad = false;
  
  // set to false for explicit <link> load checking when onload doesn't work perfectly (webkit)
  var useOnload = true;

  // trident / msie
  if (engine[1] || engine[7])
    useImportLoad = parseInt(engine[1]) < 6 || parseInt(engine[7]) <= 9;
  // webkit
  else if (engine[2] || engine[8])
    useOnload = false;
  // gecko
  else if (engine[4])
    useImportLoad = parseInt(engine[4]) < 18;

  //main api object
  var cssAPI = {};

  cssAPI.pluginBuilder = './css-builder';

  // <style> @import load method
  var curStyle, curSheet;
  var createStyle = function () {
    curStyle = document.createElement('style');
    head.appendChild(curStyle);
    curSheet = curStyle.styleSheet || curStyle.sheet;
  }
  var ieCnt = 0;
  var ieLoads = [];
  var ieCurCallback;
  
  var createIeLoad = function(url) {
    ieCnt++;
    if (ieCnt == 32) {
      createStyle();
      ieCnt = 0;
    }
    curSheet.addImport(url);
    curStyle.onload = function(){ processIeLoad() };
  }
  var processIeLoad = function() {
    ieCurCallback();
 
    var nextLoad = ieLoads.shift();
 
    if (!nextLoad) {
      ieCurCallback = null;
      return;
    }
 
    ieCurCallback = nextLoad[1];
    createIeLoad(nextLoad[0]);
  }
  var importLoad = function(url, callback) {
    if (!curSheet || !curSheet.addImport)
      createStyle();

    if (curSheet && curSheet.addImport) {
      // old IE
      if (ieCurCallback) {
        ieLoads.push([url, callback]);
      }
      else {
        createIeLoad(url);
        ieCurCallback = callback;
      }
    }
    else {
      // old Firefox
      curStyle.textContent = '@import "' + url + '";';

      var loadInterval = setInterval(function() {
        try {
          curStyle.sheet.cssRules;
          clearInterval(loadInterval);
          callback();
        } catch(e) {}
      }, 10);
    }
  }

  // <link> load method
  var linkLoad = function(url, callback) {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    if (useOnload)
      link.onload = function() {
        link.onload = function() {};
        // for style dimensions queries, a short delay can still be necessary
        setTimeout(callback, 7);
      }
    else
      var loadInterval = setInterval(function() {
        for (var i = 0; i < document.styleSheets.length; i++) {
          var sheet = document.styleSheets[i];
          if (sheet.href == link.href) {
            clearInterval(loadInterval);
            return callback();
          }
        }
      }, 10);
    link.href = url;
    head.appendChild(link);
  }

  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);

    return normalize(name);
  }

  cssAPI.load = function(cssId, req, load, config) {

    (useImportLoad ? importLoad : linkLoad)(req.toUrl(cssId + '.css'), load);

  }

  return cssAPI;
});

define('css!tab/avalon.tab',[],function(){});

define('css!chameleon/oniui-common',[],function(){});
/**
 * @cnName tab组件
 * @enName tab
 * @introduce
 *  <p> 实现扫描DOM结构或者接受数组传参，生成tab，支持click、mouseenter事件响应切换，支持mouseenter情形延迟响应切换，支持click情形tab选中情况下再次点击回调，支持自动切换效果，支持tab增删禁用启用并可混合设置同步tab可删除状态，支持混合配制panel内容类型并支持panel内容是ajax配置回调，注意扫描dom情形下，会销毁原有的dom，且会忽略所有的ol，ul，li元素上原有的绑定
</p>
 */
define('tab/avalon.tab',["avalon","text!./avalon.tab.html", "text!./avalon.tab.panels.html", "text!./avalon.tab.close.html", "css!./avalon.tab.css", "css!../chameleon/oniui-common.css"], function(avalon, template, panelTpl, closeTpl) {

    // 对模板进行转换
    function _getTemplate(tpl, vm) {
        return tpl.replace(/\{\{MS_[A-Z_0-9]+\}\}/g, function(mat) {
            var mat = (mat.split("{{MS_OPTION_")[1]||"").replace(/\}\}/g, "").toLowerCase().replace(/_[^_]/g, function(mat) {
                return mat.replace(/_/g, "").toUpperCase()
            })
            // 防止事件绑定覆盖，可能匹配不对，但是不会影响实际效果
            if(mat == "event" && vm[mat]) {
                var m, eventId
                if(m = tpl.match(new RegExp(" ms\-" + vm[mat] + "[^\'\\\"]", "g"))) {
                    eventId = m.length
                    m = m.join(",")
                    while(m.match(new RegExp(eventId, "g"))) {
                        eventId++
                    }
                    return vm[mat] + "-" + eventId
                }
            } else if(mat == "removable") {
                return closeTpl
            }
            return vm[mat] || ""
        })
    }

    function _getData(par, type, target) {
        var res = []
        for (var i = 0, el; el = par && par.children[i++]; ) {
            if(el.tagName.toLowerCase() != type) continue
            var opt = avalon(el).data()
                , obj = type == "div" ? {
                    content: opt.content || el.innerHTML,
                    contentType: opt.contentType || "content"
                } : {
                    title: el.innerHTML,
                    removable: opt.removable,
                    linkOnly: opt.linkOnly,
                    target: opt.target || target || "_self",
                    disabled: opt.disabled == void 0 ? false : opt.disabled
                }
            var href = opt.href || el.getAttribute("href")
            if(href) obj.href = href
            res.push(obj)
        }
        return res
    }

    var widget = avalon.ui.tab = function(element, data, vmodels) {
        var options = data.tabOptions 
            , tabpanels = []
            , tabs = []
            , tabsParent

        // 遍历tabs属性，设置disabled属性，防止在IE里面出错
        avalon.each(options.tabs, function(i, item) {
            item.disabled = !!item.disabled
        })
        // 扫描获取tabs
        if(options.tabs == void 0) {
            tabsParent = options.tabContainerGetter(element)
            avalon.scan(tabsParent, vmodels)
            tabs = _getData(tabsParent, "li", options.target)
            // 销毁dom
            if(options.distroyDom) element.removeChild(tabsParent)
        }
        // 扫描获取panels
        if(options.tabpanels == void 0) {
            panelsParent = options.panelContainerGetter(element)
            if(options.preScanPannel) avalon.scan(panelsParent, vmodels)
            tabpanels = _getData(panelsParent, "div")
            if(options.distroyDom) {
                try{
                    element.removeChild(panelsParent)
                }catch(e){}
            }
        }

        var vmodel = avalon.define(data["tabId"], function(vm) {
            vm.$skipArray = [/*"disable", "enable", "add", "activate", "remove", "getTemplate", */"widgetElement", "callInit"/*, "onActivate", "onAjaxCallback"*/, "rootElement"]


            vm.tabs = []
            vm.tabpanels = []

            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.rootElement = element
           
            var inited
                , switchTimer
            vm.$init = function(continueScan) {
                var force = continueScan && !avalon.isFunction(continueScan)
                if(inited || !force && !vm.callInit) return
                inited = true

                if(!options.tabs) vm.tabs = tabs
                if(!vm.tabpanels.length) vm.tabpanels = tabpanels
                vm.active = vm.active >= vm.tabs.length && vm.tabs.length - 1 || vm.active < 0 && 0 || parseInt(vm.active) >> 0

                avalon(element).addClass("oni-tab oni-widget oni-widget-content" + (vm.event == "click" ? " oni-tab-click" : "") + (vm.dir == "v" ? " oni-tab-vertical" : "") + (vm.dir != "v" && vm.uiSize == "small" ? " oni-tab-small" : ""))
                // tab列表
                var tabFrag = _getTemplate(vm._getTemplate(0, vm), vm)
                    , panelFrag = _getTemplate(vm._getTemplate("panel", vm), vm)
                element.innerHTML = vmodel.bottom ? panelFrag + tabFrag : tabFrag + panelFrag
               
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
                if(vm.autoSwitch) {
                    vm._autoSwitch();
                }
            }

            vm._clearTimeout = function() {
                clearTimeout(switchTimer)
            }

            // 选中tab
            vm.activate = function(event, index, fix) {
                // 猥琐的解决在ie里面报找不到成员的bug
                // !fix && event.preventDefault()
                if (vm.tabs[index].disabled === true) {
                    if(vm.event === "click") event.preventDefault()
                    return
                } 
                if(vm.tabs[index].linkOnly) {
                    return
                }
                var el = this
                // event是click，点击激活状态tab
                if (vm.event === "click" && vm.active === index) {
                    // 去除激活状态
                    if(vm.collapsible) {
                        vm.active = NaN
                        event.preventDefault()
                    // 调用点击激活状态tab回调
                    } else {
                        if(!options.onClickActive.call(el, event, vmodel)) event.preventDefault()
                    }
                    return
                }
                if(vm.event === "click") event.preventDefault()
                if (vm.active !== index) {
                    // avalon.nextTick(function() {
                        vm.active = index
                        options.onActivate.call(el, event, vmodel)
                    // })
                }
            }
            // 延迟切换效果
            if(vm.event == "mouseenter" && vm.activeDelay) {
                var timer
                    , tmp = vm.activate
                vm.activate = function($event, $index) {
                    clearTimeout(timer)
                    var el = this
                        , arg = arguments
                    timer = setTimeout(function() {
                        tmp.apply(el, [$event, $index, "fix event bug in ie"])
                    }, vm.activeDelay)
                    if(!el.getAttribute("leave-binded") && 0) {
                        el.setAttribute("leave-binded", 1)
                        avalon.bind(el, "mouseleave", function() {
                            clearTimeout(timer)
                        })
                    }
                }
            }

            // 自动切换效果
            vm._autoSwitch = function() {
                clearTimeout(switchTimer)
                if(vm.tabs.length < 2) return
                switchTimer = setTimeout(function() {
                    var i = vm.active + 1
                        // 防止死循环
                        , loop = 0
                    while(i != vm.active && loop < vm.tabs.length - 1) {
                        if(i >= vm.tabs.length) {
                            i = 0
                        }
                        if(!vm.tabs[i].disabled) {
                            vm.active = i
                            vm._autoSwitch()
                            break
                        }
                        i++
                        loop++
                    }
                }, vm.autoSwitch)
            }


            //清空构成UI的所有节点，一下代码继承自pilotui
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }
            // 修改使用了avalon的几个方法
            //@interface disable(index) 禁用索引指向的tab，index为数字或者元素为数字的数组
            vm.disable = function(index, disable) {
                disable = disable == void 0 ? true : disable
                if(!(index instanceof Array)) {
                    index = [index]
                }
                var total = vm.tabs.length
                avalon.each(index, function(i, idx) {
                    if (idx >= 0 && total > idx) {
                        vm.tabs[idx].disabled = disable
                    }
                })
            }
            //@interface enable(index) 启用索引指向的tab，index为数字或者元素为数字的数组
            vm.enable = function(index) {
                vm.disable(index, false)
            }
            //@interface add(config) 新增tab, config = {title: "tab title", removable: bool, disabled: bool, content: "panel content", contentType: "ajax" or "content"}
            vm.add = function(config) {
                var title = config.title || "Tab Tile"
                var content = config.content || "<div></div>"
                var exsited = false
                vm.tabpanels.forEach(function(panel) {
                    if (panel.contentType == "include" && panel.content == config.content) {
                        exsited = true
                    }
                })
                if (exsited === true) {
                    return
                }
                vm.tabpanels.push({
                    content: content,
                    contentType: config.contentType
                })
                vm.tabs.push({
                    title: title,
                    removable: config.removable,
                    disabled: false
                })
                if (config.actived) {
                    avalon.nextTick(function() {
                        vmodel.active = vmodel.tabs.length - 1
                    })
                }
            }
            //@interface remove(e, index) 删除索引指向的tab，绑定情形下ms-click="remove($event, index)"，js调用则是vm.remove(index)
            vm.remove = function(e, index) {
                if(arguments.length == 2) {
                    e.preventDefault()
                    e.stopPropagation()
                } else {
                    index = e
                }
                if (vmodel.tabs[index].disabled === true || vmodel.tabs[index].removable === false || vmodel.tabs[index].removable == void 0 && !vm.removable) {
                    return
                }
                vmodel.tabs.removeAt(index)
                vmodel.tabpanels.removeAt(index)
                index = index > 1 ? index - 1 : 0
                avalon.nextTick(function() {
                    vmodel.active = index
                })
                vm.bottom = options.bottom
            }

            vm._canRemove = function(tab) {
                return (tab.removable == true || tab.removable !== false && vm.removable) && !tab.disabled && vm.dir != "v"
            }

            vm._canActive = function(tab, $index) {
                return vm.active == $index && !tab.disabled
            }

            vm._isAjax = function(panel) {
                return vm.contentType=="content" && !panel.contentType || panel.contentType=="content"
            }
            vm._cutCounter = function() {
                return (vmodel.dir == "h" || vmodel.forceCut) && vmodel.titleCutCount
            }
            vm._shallPanelAlwaysShow = function($index) {
                return vmodel.shallPanelAlwaysShow || $index === vmodel.active
            }
            vm.sliderIndex = 0
            vm.sliderLength = 0
            vm.nextEnable = 0
            vm.prevEnable = 0
            vm.slider = function($event, dir) {
                $event.preventDefault()
                var step
                if(dir === "prev") {
                    step = vm.sliderIndex - 1
                    step = step > 0 ? step : 0
                } else {
                    step = vm.sliderIndex + 1
                    step = step <= vm.sliderLength - 1 ? step : vm.sliderLength - 1
                }
                vm.sliderIndex = step
                vm.buttonEnable()
            }
            vm.computeSlider = function() {
                if(vm.dir === "v") return
                var tabs = document.getElementById("tabs" + vm.tabs.$id)
                if(tabs) {
                    var w = tabs.scrollWidth,
                        pw = tabs.parentNode.parentNode.clientWidth;
                    if(w > pw) {
                        vm.sliderLength = w / pw
                    } else {
                        vm.sliderLength = 0
                    }
                    vm.buttonEnable()
                }

            }
            vm.buttonEnable = function() {
                if(vm.sliderIndex >= vm.sliderLength - 1) {
                    vm.nextEnable = 0
                } else {
                    vm.nextEnable = 1
                }
                if(vm.sliderIndex <= 0) {
                    vm.prevEnable = 0
                } else {
                    vm.prevEnable = 1
                }
            }
            return vm
        })


        if(vmodel.autoSwitch) {
            /*
            vmodel.tabs.$watch("length", function(value, oldValue) {
                if(value < 2) {
                    vmodel._clearTimeout()
                } else {
                    vmodel._autoSwitch()
                }
            })
            */
            avalon.bind(element, "mouseenter", function() {
                vmodel._clearTimeout()
            })
            avalon.bind(element, "mouseleave", function() {
                vmodel._clearTimeout()
                vmodel._autoSwitch()
            })
            vmodel.$watch("autoSwitch", function(value, oldValue) {
                vmodel._clearTimeout()
                if(value) {
                    vmodel._autoSwitch()
                }
            })
        }

        // return vmodel使符合框架体系，可以自动调用
        return vmodel
    }

    widget.defaults = {
        target: "_blank",//@config tab item链接打开的方式，可以使_blank,_self,_parent
        toggle: true, //@config 组件是否显示，可以通过设置为false来隐藏组件
        autoSwitch: false,      //@config 是否自动切换，默认否，如果需要设置自动切换，请传递整数，例如200，即200ms
        active: 0,              //@config 默认选中的tab，默认第一个tab，可以通过动态设置该参数的值来切换tab，并可通过vmodel.tabs.length来判断active是否越界
        shallPanelAlwaysShow: false,//@config shallPanelAlwaysShow() panel不通过display:none,block来切换，而是一直显示，通过其他方式切换到视野，默认为false
        event: "mouseenter",    //@config  tab选中事件，默认mouseenter
        removable: false,      //@config  是否支持删除，默认否，另外可能存在某些tab可以删除，某些不可以删除的情况，如果某些tab不能删除则需要在li元素或者tabs数组里给对应的元素指定removable : false，例如 li data-removable="false" or {title: "xxx", removable: false}
        preScanPannel: false, //@config 是否需要先扫面元素，再创建widget，默认否
        activeDelay: 0,         //@config  比较适用于mouseenter事件情形，延迟切换tab，例如200，即200ms
        collapsible: false,     //@config  当切换面板的事件为click时，如果对处于激活状态的按钮再点击，将会它失去激活并且对应的面板会收起来,再次点击它时，它还原，并且对应面板重新出现
        contentType: "content", //@config  panel是静态元素，还是需要通过异步载入，还可取值为ajax，但是需要给对应的panel指定一个正确的ajax地址
        bottom: false,          //@config  tab显示在底部
        dir: "h",          //@config  tab排列方向，横向或纵向v - vertical，默认横向h - horizontal
        callInit: true,         //@config  是否调用即初始化
        titleCutCount: 8,       //@config  tab title截取长度，默认是8
        distroyDom: true,       //@config  扫描dom获取数据，是否销毁dom
        cutEnd: "...",          //@config  tab title截取字符后，连接的字符，默认为省略号
        forceCut: false,        //@config  强制截断，因为竖直方向默认是不截取的，因此添加一个强制截断，使得在纵向排列的时候title也可以被截断
        //tabs:undefined,              //@config  <pre>[/n{/ntitle:"xx",/n linkOnly: false,/n disabled:boolen,/n target: "_self",/n removable:boolen/n}/n]</pre>，单个tabs元素的removable针对该元素的优先级会高于组件的removable设置，linkOnly表示这只是一个链接，不响应active事件，也不阻止默认事件，target对应的是链接打开方式_self默认，可以使_blank,_parent，tab里的target配置优先级高于vm的target配置，应用于某个tab上，可以在元素上 data-target="xxx" 这样配置
        //tabpanels:undefined,         //@config  <pre>[/n{/ncontent:content or url,/n contentType: "content" or "ajax"/n}/n]</pre> 单个panel的contentType配置优先级高于组件的contentType
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        tabContainerGetter: function(element) {
            return element.getElementsByTagName("ul")[0] || element.getElementsByTagName("ol")[0]
        }, //@config tabContainerGetter(element) tab容器，如果指定，则到该容器内扫描tabs，参数为绑定组件的元素，默认返回element内第一个ul或者ol元素
        panelContainerGetter: function(element) {
            return element.getElementsByTagName("div")[0] || element
        }, //@config panelContainerGetter(element)  panel容器，如果指定，则到该容器内扫描panel，参数为绑定组件的元素，默认返回第element内第一个div元素
        onActivate: avalon.noop,  //@config onActivate(event, vmode) 选中tab后的回调，this指向对应的li元素，参数是事件对象，vm对象 fn(event, vmode)，默认为avalon.noop
        onClickActive: avalon.noop, //@config onClickActive(event, vmode)  点击选中的tab，适用于event是"click"的情况，this指向对应的li元素，参数是事件对象，vm对象 fn(event, vmode)，默认为avalon.noop
        onAjaxCallback: avalon.noop, //@config onAjaxCallback  panel内容是ajax，ajax响应后的回调函数，this指向对应的panel元素，无参数，默认为空函数
        // 获取模板，防止用户自定义的getTemplate方法没有返回有效的模板
        _getTemplate: function (tplName, vm) {
            var tpl
                , defineTpl
            if(tplName == "panel") {
                tpl = panelTpl
            } else if(tplName == "close") {
                tpl = closeTpl
            } else {
                tpl = template
            }
            defineTpl = vm.getTemplate(tpl, vm, tplName)
            return  defineTpl || defineTpl === "" ? defineTpl : tpl
        },
        getTemplate: function (template, vm, tplName) {
            return template
        }, //@config getTemplate(template, vm, tplName)  修改模板的接口，参数分别是模板字符串，vm对象，模板名字，返回如果是空字符串则对应的tplName(close,panel,tab)返回为空，return false,null,undedined等于返回组件自带的模板，其他情况为返回值，默认返回组件自带的模板
        _tabTitle : function (title, tab, count, end) {
            var cut
            if(tab.titleCutCount != void 0) {
                cut = tab.titleCutCount
            } else if(count != void 0) {
                cut = count
            }
            if(!cut) return title
            var visibleTitle = title.split(/<[^>]+>/g)
                , len = 0
                , res = 0
                , indexToIgnore
            avalon.each(visibleTitle, function(i, item) {
                if(indexToIgnore >= 0) {
                    res = ""
                } else {
                    var s = item.trim()
                    if(len + s.length > cut) {
                        indexToIgnore = i
                        res = s.substr(0, cut - len) + end
                    } else {
                        len += s.length
                        res = 0
                    }
                }
                if(res === 0) return
                title = title.replace(item, res)
            })
            return title

        }, // 实现截取title逻辑
        // 保留实现配置
        // switchEffect: function() {},     // 切换效果
        // useSkin: false,                  // 载入神马皮肤
        "$author":"skipper@123"
    }
});

define('text!pager/avalon.pager.html',[],function () { return '<div class="oni-pager" onselectstart="return false;" unselectable="on" ms-visible="!!totalPages">\r\n    <span class="oni-pager-prev"\r\n          ms-class="oni-state-disabled:firstPage==1"\r\n          ms-if="isShowPrev()"\r\n          ms-attr-title="getTitle(\'prev\')" \r\n          ms-click="jumpPage($event,\'prev\')" \r\n          ms-text="prevText"\r\n          ></span>\r\n    <span class="oni-pager-item"\r\n          ms-visible="firstPage!==1" \r\n          ms-attr-title="getTitle(\'first\', currentPage)" \r\n          ms-click="jumpPage($event,\'first\')" \r\n          ms-class-oni-state-active="currentPage == 1"\r\n          ms-hover="oni-state-hover">1</span>\r\n    <span class=\'oni-pager-omit\'\r\n          ms-if="showFirstOmit" \r\n          ms-text="ellipseText"\r\n          ></span>\r\n    <span  class="oni-pager-item" \r\n           ms-repeat="pages" \r\n           ms-attr-title="getTitle(el, currentPage)"\r\n           ms-hover="oni-state-hover"\r\n           ms-click="jumpPage($event,el)"\r\n           ms-class-oni-state-active="el == currentPage" \r\n           ms-text="el"\r\n           ></span>\r\n    <span class="oni-pager-omit"\r\n          ms-if="showLastOmit" \r\n          ms-text="ellipseText"\r\n          ></span>\r\n    <span class="oni-pager-item "\r\n          ms-visible="lastPage!==totalPages" \r\n          ms-attr-title="getTitle(\'last\', currentPage, totalPages)" \r\n          ms-hover="oni-state-hover" \r\n          ms-click="jumpPage($event,\'last\')"  \r\n          ms-text="totalPages"\r\n          ></span>\r\n    <span class="oni-pager-next"\r\n          ms-if="isShowNext()" \r\n          ms-attr-title="getTitle(\'next\')"\r\n          ms-click="jumpPage($event,\'next\')" \r\n          ms-class="oni-state-disabled:lastPage==totalPages"\r\n          ms-text="nextText"\r\n          ></span>\r\n    <div class="oni-pager-jump" ms-if="showJumper">\r\n        <span class="oni-pager-text" ms-html="_getTotalPages(totalPages)"></span>\r\n        <div class="oni-pager-textbox-wrapper">\r\n            <input class="oni-pager-textbox" ms-duplex="_currentPage" data-duplex-event="change" ms-keyup="changeCurrentPage">\r\n        </div>\r\n        <span class="oni-pager-text">{{regional.pageText}}</span>\r\n        <button class="oni-pager-button" ms-click="changeCurrentPage" >{{regional.confirmText}}</button>\r\n    </div>\r\n</div>\r\n';});


define('css!pager/avalon.pager',[],function(){});
/**
 * @cnName 分页组件
 * @enName pager
 * @introduce
 *  <p> 分页组件 用于各种列表与表格的下方 。</p>
 */

define('pager/avalon.pager',["avalon",
    "text!./avalon.pager.html",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.pager.css"
], function (avalon, template) {

    var widget = avalon.ui.pager = function (element, data, vmodels) {
        var options = data.pagerOptions
        var pageOptions = options.options
        if (Array.isArray(pageOptions)) {
            options.options = pageOptions.map(function (el) {
                var obj = {}
                switch (typeof el) {
                    case "number":
                    case "string":
                        obj.value = el
                        obj.text = el
                        return obj
                    case "object":
                        return el
                }
            })
        } else {
            options.options = []
        }
        if (vmodels.cb) {
            template = template.replace(/ms-title/g, "ms-attr-title")
        }
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options)
        options._currentPage = options.currentPage
        var vmodel = avalon.define(data.pagerId, function (vm) {
            avalon.mix(vm, options, {
                regional: widget.defaultRegional
            })
            vm.widgetElement = element
            vm.rootElement = {}
            vm.$skipArray = ["showPages", "rootElement", "widgetElement", "template", "ellipseText", "alwaysShowPrev", "alwaysShowNext"]
            //这些属性不被监控
            vm.$init = function (continueScan) {
                var pageHTML = options.template
                element.style.display = "none"
                setTimeout(function () {
                    element.innerHTML = pageHTML
                    vm.rootElement = element.getElementsByTagName("*")[0]
                    element.style.display = "block"
                    if (continueScan) {
                        continueScan()
                    } else {
                        avalon.log("avalon请尽快升到1.3.7+")
                        avalon.scan(element, [vmodel].concat(vmodels))
                        if (typeof options.onInit === "function") {
                            options.onInit.call(element, vmodel, options, vmodels)
                        }
                    }
                }, 100)
            }
            vm.$remove = function () {
                element.innerHTML = element.textContent = ""
            }
            vm.jumpPage = function (event, page) {
                event.preventDefault()
                var enabled = this.className.indexOf("state-disabled") === -1
                if (enabled && page !== vm.currentPage) {
                    switch (page) {
                        case "first":
                            vm.currentPage = 1
                            break
                        case "last":
                            vm.currentPage = vm.totalPages
                            break
                        case "next":
                            vm.currentPage++
                            if (vm.currentPage > vm.totalPages) {
                                vm.currentPage = vm.totalPages
                            }
                            break
                        case "prev":
                            vm.currentPage--
                            if (vm.currentPage < 1) {
                                vm.currentPage = 1
                            }
                            break
                        default:
                            vm.currentPage = page
                            break
                    }
                    vm.onJump.call(element, event, vm)
                    efficientChangePages(vm.pages, getPages(vm))
                }
            }
            vm.$watch("totalItems", function () {
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("perPages", function (a) {
                vm.currentPage = 1
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.$watch("currentPage", function (a) {
                vmodel._currentPage = a
                efficientChangePages(vm.pages, getPages(vm))
            })
            vm.isShowPrev = function () {
                var a = vm.alwaysShowPrev;
                var b = vm.firstPage
                return a || b !== 1
            }
            vm.isShowNext = function () {
                var a = vm.alwaysShowNext
                var b = vm.lastPage
                var c = vm.totalPages
                return a || b !== c
            }

            vm.changeCurrentPage = function (e, value) {
                if (e.type === "keyup") {
                    value = this.value
                    if (e.keyCode !== 13)
                        return
                } else {
                    value = vmodel._currentPage
                }
                value = parseInt(value, 10) || 1
                if (value > vmodel.totalPages || value < 1)
                    return
                //currentPage需要转换为Number类型 fix lb1064@qq.com
                vmodel.currentPage = value
                vmodel.pages = getPages(vmodel)
                vmodel.onJump.call(element, e, vm);
            }
            vm.pages = []
            vm.getPages = getPages

            //设置语言包
            vm.setRegional = function (regional) {
                vmodel.regional = regional
            }
            vm._getTotalPages = function (totalPages) {
                //return {{regional.totalText}}{{totalPages}}{{regional.pagesText}}，{{regional.toText}}{{regional.numberText}}
                var regional = vmodel.regional,
                        html = [regional.totalText, totalPages]

                if (totalPages > 1) {
                    html.push(regional.pagesText)
                } else {
                    html.push(regional.pageText)
                }

                html = html.concat([" ", regional.jumpToText, regional.numberText])

                return html.join("")
            }

            /**
             * @config {Function} 获取页码上的title的函数
             * @param {String|Number} a 当前页码的类型，如first, prev, next, last, 1, 2, 3
             * @param {Number} currentPage 当前页码
             * @param {Number} totalPages 最大页码
             * @returns {String}
             */
            vm.getTitle = function (a, currentPage, totalPages) {

                var regional = vmodel.regional

                switch (a) {
                    case "first":
                        if (currentPage == 1) {
                            return regional.currentText
                        }
                        return regional.jumpToText + " " + regional.firstText
                    case "prev":
                        return regional.jumpToText + " " + regional.prevText
                    case "next":
                        return regional.jumpToText + " " + regional.nextText
                    case "last":
                        if (currentPage == totalPages) {
                            return regional.currentText
                        }
                        return regional.jumpToText + " " + regional.lastText
                    default:
                        if (a === currentPage) {
                            return regional.currentText
                        }
                        return regional.jumpToText + regional.numberText + " " + a + regional.pageText
                }
            }
        })
        vmodel.pages = getPages(vmodel)

        return vmodel
    }
    //vmodel.pages = getPages(vmodel) 会波及一些其他没有改动的元素节点,现在只做个别元素的添加删除操作
    function efficientChangePages(aaa, bbb) {
        var obj = {}
        for (var i = 0, an = aaa.length; i < an; i++) {
            var el = aaa[i]
            obj[el] = {action: "del", el: el}
        }
        for (var i = 0, bn = bbb.length; i < bn; i++) {
            var el = bbb[i]
            if (obj[el]) {
                obj[el] = {action: "retain", el: el}
            } else {
                obj[el] = {action: "add", el: el}
            }
        }
        var scripts = []
        for (var i in obj) {
            scripts.push({
                action: obj[i].action,
                el: obj[i].el
            })
        }
        scripts.sort(function (a, b) {
            return a.el - b.el
        })
        scripts.forEach(function (el, index) {
            el.index = index
        })
        //添加添加
        var reverse = []
        for (var i = 0, el; el = scripts[i++]; ) {
            switch (el.action) {
                case "add":
                    aaa.splice(el.index, 0, el.el)
                    break;
                case "del":
                    reverse.unshift(el)
                    break;
            }
        }
        //再删除
        for (var i = 0, el; el = reverse[i++]; ) {
            aaa.splice(el.index, 1)
        }

    }

    //默认语言包为中文简体
    widget.regional = []
    widget.regional["zh-CN"] = {
        prevText: "上一页",
        nextText: "下一页",
        confirmText: "确定",
        totalText: "共",
        pagesText: "页",
        pageText: "页",
        toText: "到",
        jumpToText: "跳转到",
        currentText: "当前页",
        firstText: "第一页",
        lastText: "最后一页",
        numberText: "第"
    }

    //设置默认语言包
    widget.defaultRegional = widget.regional["zh-CN"]

    widget.defaults = {
        perPages: 10, //@config {Number} 每页包含多少条目
        showPages: 10, //@config {Number} 中间部分一共要显示多少页(如果两边出现省略号,即它们之间的页数) 
        currentPage: 1, //@config {Number} 当前选中的页面 (按照人们日常习惯,是从1开始)，它会被高亮 
        _currentPage: 1, //@config {Number}  跳转台中的输入框显示的数字，它默认与currentPage一致
        totalItems: 200, //@config {Number} 总条目数
        totalPages: 0, //@config {Number} 总页数,通过Math.ceil(vm.totalItems / vm.perPages)求得
        pages: [], //@config {Array} 要显示的页面组成的数字数组，如[1,2,3,4,5,6,7]
        nextText: ">", //@config {String} “下一页”分页按钮上显示的文字 
        prevText: "<", //@config {String} “上一页”分页按钮上显示的文字 
        ellipseText: "…", //@config {String} 省略的页数用什么文字表示 
        firstPage: 0, //@config {Number} 当前可显示的最小页码，不能小于1
        lastPage: 0, //@config {Number} 当前可显示的最大页码，不能大于totalPages
        alwaysShowNext: false, //@config {Boolean} 总是显示向后按钮
        alwaysShowPrev: false, //@config {Boolean} 总是显示向前按钮
        showFirstOmit: false,
        showLastOmit: false,
        showJumper: false, //是否显示输入跳转台
        /*
         * @config {Function} 用于重写模板的函数 
         * @param {String} tmpl
         * @param {Object} opts
         * @returns {String}
         */
        getTemplate: function (tmpl, opts) {
            return tmpl
        },
        options: [], // @config {Array}数字数组或字符串数组或对象数组,但都转换为对象数组,每个对象都应包含text,value两个属性, 用于决定每页有多少页(看avalon.pager.ex3.html) 
        /**
         * @config {Function} 页面跳转时触发的函数,如果当前链接处于不可以点状态(oni-state-disabled),是不会触发的
         * @param {Event} e
         * @param {Object} vm  组件对应的VM
         */
        onJump: function (e, vm) {
        }
    }

    function getPages(vm) {
        var c = vm.currentPage, max = Math.ceil(vm.totalItems / vm.perPages), pages = [], s = vm.showPages,
                left = c, right = c
        //一共有p页，要显示s个页面
        vm.totalPages = max
        if (max <= s) {
            for (var i = 1; i <= max; i++) {
                pages.push(i)
            }
        } else {
            pages.push(c)
            while (true) {
                if (pages.length >= s) {
                    break
                }
                if (left > 1) {//在日常生活是以1开始的
                    pages.unshift(--left)
                }
                if (pages.length >= s) {
                    break
                }
                if (right < max) {
                    pages.push(++right)
                }
            }
        }
        vm.firstPage = pages[0] || 1
        vm.lastPage = pages[pages.length - 1] || 1
        vm.showFirstOmit = vm.firstPage > 2
        vm.showLastOmit = vm.lastPage < max - 1
        return  pages//[0,1,2,3,4,5,6]
    }
    return avalon
})
/**
 * @other
 * <p>pager 组件有一个重要的jumpPage方法，用于决定它的跳转方式。它有两个参数，第一个事件对象，第二个是跳转方式，见源码：</p>
 ```javascript
 vm.jumpPage = function(event, page) {
 event.preventDefault()
 if (page !== vm.currentPage) {
 switch (page) {
 case "first":
 vm.currentPage = 1
 break
 case "last":
 vm.currentPage = vm.totalPages
 break
 case "next":
 vm.currentPage++
 if (vm.currentPage > vm.totalPages) {
 vm.currentPage = vm.totalPages
 }
 break
 case "prev":
 vm.currentPage--
 if (vm.currentPage < 1) {
 vm.currentPage = 1
 }
 break
 default:
 vm.currentPage = page
 break
 }
 vm.onJump.call(element, event, vm)
 efficientChangePages(vm.pages, getPages(vm))
 }
 }
 ```
 */

/**
 *  @links
 [显示跳转台](avalon.pager.ex1.html)
 [指定回调onJump](avalon.pager.ex2.html)
 [改变每页显示的数量](avalon.pager.ex3.html)
 [指定上一页,下一页的文本](avalon.pager.ex4.html)
 [通过左右方向键或滚轮改变页码](avalon.pager.ex5.html)
 [总是显示上一页与下一页按钮](avalon.pager.ex6.html)
 [多语言支持](avalon.pager.ex7.html)
 *
 */
//http://luis-almeida.github.io/jPages/defaults.html
//http://gist.corp.qunar.com/jifeng.yao/gist/demos/pager/pager.html

;
define('avalon.getModel',["avalon"], function(avalon) {
    function getChildVM(expr, vm, strLen) {
        var t = vm, pre, _t;
        for (var i = 0, len = expr.length; i < len; i++) {
            var k = expr[i];
            _t = t.$model || t;
            if (typeof _t[k] !== 'undefined') {
                pre = t;
                t = t[k];
            } else {
                return;
            }
        }
        if (strLen > 1) {
            return pre[k];
        } else {
            return pre;
        }
    }
   // 在一堆VM中，提取某一个VM的符合条件的子VM
   // 比如 vm.aaa.bbb = {} ; 
   // avalon.getModel("aaa.bbb", vmodels) ==> ["bbb", bbbVM, bbbVM所在的祖先VM（它位于vmodels中）]
    avalon.getModel = function(expr, vmodels){
        if (!expr) {
            return null;
        }
        var str = expr.split('.'),
            strLen = str.length,
            last = str[strLen-1];
        if (str.length != 1) {
            str.pop();
        }
        for (var i = 0, len = vmodels.length; i < len; i++) {
            var ancestor = vmodels[i];
            var child = getChildVM(str, ancestor, strLen);
            if (typeof child !== 'undefined' && (child.hasOwnProperty(last) || Object.prototype.hasOwnProperty.call(child, last))) {
                return [last, child, ancestor];
            }
        }
        return null;
    }
    return avalon;
});
define('datepicker/avalon.datepicker.lang',[],function() {
    var HolidayStyle = {
        "元旦节" : {
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_yuandan",
            "holidayText" : "元旦"
        },
        "除夕" : {
            "afterTime": 0,
            "beforeTime": 0,
            "dayIndex": 0,
            "holidayClass" : "c_chuxi",
            "holidayText" : "除夕"
        },
        "春节" : {
            "afterTime": 0,
            "beforeTime": 0,
            "dayIndex": 0,
            "holidayClass" : "c_chunjie",
            "holidayText" : "春节"
        },
        "元宵节" : {
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_yuanxiao",
            "holidayText" : "元宵"
        },
        "清明节" : {
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_qingming",
            "holidayText" : "清明"
        },
        "劳动节" :{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_wuyi",
            "holidayText" : "劳动"
        },
        "端午节":{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_duanwu",
            "holidayText" : "端午"
        },
        "中秋节":{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_zhongqiu",
            "holidayText" : "中秋"
        },
        "国庆节":{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_guoqing",
            "holidayText" : "国庆"
        },
        "圣诞节":{
            "afterTime": 3,
            "beforeTime": 3,
            "dayIndex": 0,
            "holidayClass" : "c_shengdan",
            "holidayText" : "圣诞"
        }
    };
    var HolidayData = {
        "2014-01-01": {
            "holidayName": "元旦节"
        },
        "2014-01-30": {
            "holidayName": "除夕"
        },
        "2014-01-31": {
            "holidayName": "春节"
        },
        "2014-02-01": {
            "holidayName": "正月初二"
        },
        "2014-02-02": {
            "holidayName": "正月初三"
        },
        "2014-02-14": {
            "holidayName": "元宵节"
        },
        "2014-04-05": {
            "holidayName": "清明节"
        },
        "2014-05-01": {
            "holidayName": "劳动节"
        },
        "2014-06-01": {
            "holidayName": "儿童节"
        },
        "2014-06-02": {
            "holidayName": "端午节"
        },
        "2014-09-08": {
            "holidayName": "中秋节"
        },
        "2014-09-10": {
            "holidayName": "教师节"
        },
        "2014-10-01": {
            "holidayName": "国庆节"
        },
        "2014-12-25": {
            "holidayName": "圣诞节"
        },
        "2015-01-01": {
            "holidayName": "元旦节"
        },
        "2015-02-18": {
            "holidayName": "除夕"
        },
        "2015-02-19": {
            "holidayName": "春节"
        },
        "2015-02-20": {
            "holidayName": "正月初二"
        },
        "2015-02-21": {
            "holidayName": "正月初三"
        },
        "2015-03-05": {
            "holidayName": "元宵节"
        },
        "2015-04-05": {
            "holidayName": "清明节"
        },
        "2015-05-01": {
            "holidayName": "劳动节"
        },
        "2015-06-01": {
            "holidayName": "儿童节"
        },
        "2015-06-20": {
            "holidayName": "端午节"
        },
        "2015-09-27": {
            "holidayName": "中秋节"
        },
        "2015-10-01": {
            "holidayName": "国庆节"
        },
        "2015-12-25": {
            "holidayName": "圣诞节"
        }
    };
    for( var x in HolidayData ){
        if( HolidayData.hasOwnProperty(x)){
            var data = HolidayData[x],
                name = data.holidayName;
            if( name && HolidayStyle[ name ] ){
                var style = HolidayStyle[ name ];
                for( var y in style){
                    if( style.hasOwnProperty(y) && !(y in data)){
                        data[y] = style[y];
                    }
                }
            }
        }
    }
    return HolidayData;
});

define('text!datepicker/avalon.datepicker.html',[],function () { return '<div class="oni-datepicker"\r\n     ms-visible="toggle"\r\n     ms-class="oni-datepicker-multiple:numberOfMonths!==1">\r\n    <div class="oni-datepicker-wrapper" ms-css-position="_position" ms-class="{{_getPositionClass(position)}}">\r\n        <div class="oni-datepicker-content">\r\n            <div class="oni-datepicker-label" ms-if="numberOfMonths===1">{{calendarLabel}}</div>\r\n            <i  class="oni-datepicker-prev oni-icon" \r\n                ms-if="numberOfMonths!==1" \r\n                ms-click="_prev(prevMonth, $event)"\r\n                ms-class="oni-datepicker-prev-disabled:!prevMonth" \r\n                style="left:15px;">&#xf047;</i>\r\n            <i  class="oni-datepicker-next oni-icon" \r\n                ms-if="numberOfMonths!==1" \r\n                ms-click="_next(nextMonth, $event)"\r\n                ms-class="oni-datepicker-next-disabled:!nextMonth" \r\n                style="right:15px;">&#xf03e;</i>\r\n            <div class="oni-datepicker-content-content" \r\n                 ms-repeat-calendar="data" \r\n                 ms-visible="_datepickerToggle"\r\n                 ms-css-width=\'calendarWidth\'\r\n                 data-repeat-rendered="dataRendered">\r\n                <div class="oni-datepicker-header" ms-if="numberOfMonths===1">\r\n                    <i class="oni-datepicker-prev oni-icon" \r\n                       ms-click="_prev(prevMonth, $event)"\r\n                       ms-class="oni-datepicker-prev-disabled:!prevMonth">&#xf047;</i>\r\n                    <i class="oni-datepicker-next oni-icon"    \r\n                       ms-click="_next(nextMonth, $event)"\r\n                       ms-class="oni-datepicker-next-disabled:!nextMonth">&#xf03e;</i>\r\n                    <div class="oni-datepicker-title" ms-if="changeMonthAndYear && regional.showMonthAfterYear">\r\n                        <select ms-each="years" data-each-rendered="_afterYearRendered">\r\n                            <option ms-attr-value="el">{{el}}</option>\r\n                        </select>&nbsp;{{regional.yearText}}&nbsp;\r\n                        <select ms-each="months" data-each-rendered="_afterMonthRendered">\r\n                            <option ms-attr-value="{{el}}">{{el}}</option>\r\n                        </select>&nbsp;{{regional.monthText}}\r\n                    </div>\r\n                    <div class="oni-datepicker-title" ms-if="changeMonthAndYear && !regional.showMonthAfterYear">\r\n                        <select ms-each="months" data-each-rendered="_afterMonthRendered">\r\n                            <option ms-attr-value="{{el}}">{{el}}</option>\r\n                        </select>&nbsp;{{regional.monthText}}\r\n                        <select ms-each="years" data-each-rendered="_afterYearRendered">\r\n                            <option ms-attr-value="el">{{el}}</option>\r\n                        </select>&nbsp;{{regional.yearText}}&nbsp;\r\n                    </div>\r\n                    <div class="oni-datepicker-title"\r\n                         ms-click="_selectMonths"\r\n                         ms-if="!changeMonthAndYear">\r\n                        <span ms-hover="oni-state-hover:mobileMonthAndYear" ms-html="_getTitle(calendar.year, calendar.month)"></span>\r\n                    </div> \r\n                </div>\r\n                <div class="oni-datepicker-header" ms-if="numberOfMonths!==1">\r\n                    <div class="oni-datepicker-title">\r\n                        <span ms-hover="oni-state-hover:mobileMonthAndYear" ms-html="_getTitle(calendar.year, calendar.month)"></span>\r\n                    </div> \r\n                </div>\r\n                <table class="oni-datepicker-calendar-week">\r\n                    <thead>\r\n                        <tr>\r\n                            <th ms-repeat="weekNames"\r\n                                ms-class="{{_setWeekClass(el)}}">{{el}}\r\n                            </th>\r\n                        </tr>\r\n                    </thead>\r\n                </table>\r\n                <table class="oni-datepicker-calendar-days" id=\'oni-datepicker-days\'>\r\n                    <tbody>\r\n                        <tr ms-repeat-days="calendar.rows"\r\n                            ms-if-loop="_rowShow(days)">\r\n                            <td class="oni-datepicker-default"\r\n                                ms-repeat-item="days"\r\n                                ms-class="{{_setDayClass($index, $outer.$index, $outer.$outer.$index, item)}}"\r\n                                ms-hover="{{_setHoverClass($index, $outer.$index, $outer.$outer.$index, item)}}"\r\n                                ms-click="_selectDate($index, $outer.$index, $outer.$outer.$index, $event)"\r\n                                ms-html="_dateCellRender($outer.$index, $index, $outer.$outer.$index, item)"\r\n                                ></td>\r\n                        </tr>\r\n                    </tbody>\r\n                </table>\r\n                <div class="oni-datepicker-timer" ms-if="timer">\r\n                    <label>\r\n                        <span>{{regional.timerText}}</span>\r\n                        <b>{{hour|timer}}</b>&nbsp;:\r\n                        <b>{{minute|timer}}</b>\r\n                    </label>\r\n                    <p>\r\n                        <span>{{regional.hourText}}</span>\r\n                        <input ms-widget="slider, $, sliderHourOpts" data-slider-max="23" data-slider-min="0" data-slider-value="hour" data-slider-width="140">\r\n                    </p>\r\n                    <p>\r\n                        <span>{{regional.minuteText}}</span>\r\n                        <input ms-widget="slider, $, sliderMinuteOpts" data-slider-max="59" data-slider-min="0" data-slider-width="140" data-slider-value="minute">\r\n                    </p>\r\n                </div>\r\n                <div class="oni-datepicker-timer oni-helper-clearfix" ms-if="timer">\r\n                    <button type="button" class="oni-btn oni-btn-small" style="float: left" ms-click="_getNow">{{regional.nowText}}</button>\r\n                    <button type="button" class="oni-btn oni-btn-primary oni-btn-small" style="float:right" ms-click="_selectTime">{{regional.confirmText}}</button>\r\n                </div>\r\n                <div class="oni-datepicker-watermark" \r\n                     ms-if="watermark"\r\n                     ms-css-font-size=\'_height\'\r\n                     ms-css-line-height=\'{{_height}}px\'\r\n                     ms-css-width=\'calendarWidth\'\r\n                     ms-css-height=\'_height\'>\r\n                    {{calendar.month+1}}\r\n                </div>\r\n            </div>\r\n            <div class="oni-datepicker-content-content oni-datepicker-month-year" ms-if="mobileMonthAndYear" ms-visible="_monthToggle" ms-css-width=\'calendarWidth\'>\r\n                <table>\r\n                    <thead>\r\n                        <tr class="oni-datepicker-title">\r\n                            <th class="prev" style="visibility: visible;text-align:left">\r\n                                <i class="oni-datepicker-prev oni-icon" \r\n                                   ms-click="_prevYear(mobileYear)"\r\n                                   ms-class="oni-datepicker-prev-disabled:mobileYear===years[0]">&#xf047;</i>\r\n                            </th>\r\n                            <th style="text-align:center" \r\n                                ms-click="_selectYears" \r\n                                ms-hover="oni-state-hover:mobileMonthAndYear">{{mobileYear}}</th>\r\n                            <th class="next" style="visibility: visible;text-align:right">\r\n                                <i class="oni-datepicker-next oni-icon" \r\n                                   ms-click="_nextYear(mobileYear)"\r\n                                   ms-class="oni-datepicker-prev-disabled:mobileYear===years[years.length-1]">&#xf03e;</i>\r\n                            </th>\r\n                        </tr>\r\n                    </thead>\r\n                    <tbody>\r\n                        <tr>\r\n                            <td colspan="3" style="padding:0px">\r\n                                <span ms-repeat-m="months" \r\n                                      ms-class="oni-datepicker-selected: (m-1)===elementMonth && mobileYear===elementYear"\r\n                                      ms-click="_selectDates(m-1)"\r\n                                      ms-hover="oni-datepicker-day-hover">{{regional.monthNamesShort[m - 1]}}</span>\r\n                            </td>\r\n                        </tr>\r\n                    </tbody>\r\n                    <tfoot>\r\n                        <tr>\r\n                            <th colspan="3" class="today" style="display: none;">Today</th>\r\n                        </tr>\r\n                        <tr>\r\n                            <th colspan="3" class="clear" style="display: none;">Clear</th>\r\n                        </tr>\r\n                    </tfoot>\r\n                </table>\r\n            </div>\r\n\r\n            <div class="oni-datepicker-content-content oni-datepicker-month-year" ms-if="mobileMonthAndYear" ms-visible="_yearToggle" ms-css-width=\'calendarWidth\'>\r\n                <table>\r\n                    <thead>\r\n                        <tr class="oni-datepicker-title">\r\n                            <th class="prev" style="visibility: visible;text-align:left">\r\n                                <i class="oni-datepicker-prev oni-icon" \r\n                                   ms-click="_prevYears" \r\n                                   ms-class="oni-datepicker-prev-disabled:_years[0]<=years[0]">&#xf047;</i>\r\n                            </th>\r\n                            <th style="text-align:center" \r\n                                ms-hover="oni-state-hover:mobileMonthAndYear">{{_years[0]}}-{{_years[9]}}\r\n                            </th>\r\n                            <th class="next" style="visibility: visible;text-align:right">\r\n                                <i class="oni-datepicker-next oni-icon" \r\n                                    ms-click="_nextYears"\r\n                                    ms-class="oni-datepicker-next-disabled:_years[_years.length-1]>=years[years.length-1]">&#xf03e;</i>\r\n                            </th>\r\n                        </tr>\r\n                    </thead>\r\n                    <tbody>\r\n                        <tr>\r\n                            <td colspan="3" style="padding:0px">\r\n                                <span class="oni-datepicker-prev-year"\r\n                                      ms-class="{{_setMobileYearClass(_years[0]-1, elementYear, month, elementMonth)}}"\r\n                                      ms-click="_selectMonths($event, _years[0]-1)"\r\n                                      ms-hover="oni-datepicker-day-hover"\r\n                                >{{_years[0]-1}}</span>\r\n                                <span ms-repeat-y="_years" \r\n                                      ms-class="_setMobileYearClass(y, elementYear, month, elementMonth)"\r\n                                      ms-click="_selectMonths($event, y)"\r\n                                      ms-hover="oni-datepicker-day-hover"\r\n                                >{{y}}</span>\r\n                                <span class="oni-datepicker-next-year"\r\n                                      ms-class="{{_setMobileYearClass(_years[9]+1, elementYear, month, elementMonth)}}"\r\n                                      ms-click="_selectMonths($event, _years[9]+1)"\r\n                                      ms-hover="oni-datepicker-day-hover"\r\n                                >{{_years[9]+1}}</span>\r\n                            </td>\r\n                        </tr>\r\n                    </tbody>\r\n                    <tfoot>\r\n                        <tr>\r\n                            <th colspan="3" class="today" style="display: none;">Today</th></tr>\r\n\r\n                            <tr><th colspan="3" class="clear" style="display: none;">Clear</th>\r\n                        </tr>\r\n                    </tfoot>\r\n                </table>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n';});


define('text!dropdown/avalon.dropdown.html',[],function () { return '<div class="oni-dropdown"\r\n     ms-class="oni-state-disabled:!enable"\r\n     ms-class-1="{{titleClass}}"\r\n     ms-css-width="{{width}}"\r\n     ms-class-2="oni-state-focus: focusClass"\r\n     ms-hover="oni-state-hover"\r\n     ms-mouseenter="_titleenter"\r\n     ms-mouseleave="_titleleave"\r\n     ms-keydown="_keydown"\r\n     tabindex="0">\r\n    <div class="oni-dropdown-source">\r\n        <div class="oni-dropdown-input"\r\n             ms-attr-title="title"\r\n             ms-css-width="titleWidth"\r\n             id="title-MS_OPTION_ID">{{label|sanitize|html}}</div>\r\n        <div class="oni-dropdown-icon-wrap">\r\n            <i class="oni-dropdown-icon oni-icon oni-icon-angle-up"\r\n               ms-visible="toggle">&#xf028;</i>\r\n            <i class="oni-dropdown-icon oni-icon oni-icon-angle-down"\r\n               ms-visible="!toggle">&#xf032;</i>\r\n        </div>\r\n    </div>\r\n</div>\r\nMS_OPTION_TEMPLATE\r\n<div class="oni-dropdown"\r\n     ms-class="oni-dropdown-menu:!multiple"\r\n     ms-class-1="{{listClass}}"\r\n     ms-css-width="{{listWidth}}"\r\n     ms-mouseenter="_listenter"\r\n     ms-mouseleave="_listleave"\r\n     ms-visible="toggle||multiple">\r\n    <div class="oni-dropdown-menu-inner"\r\n         ms-css-width="menuWidth"\r\n         ms-css-height="menuHeight"\r\n         ms-widget="scrollbar,scrollbar-MS_OPTION_ID" id="menu-MS_OPTION_ID">\r\n        <div class="oni-scrollbar-scroller"\r\n             id="list-MS_OPTION_ID">\r\n            <div ms-repeat="data" class="oni-dropdown-item"\r\n                 ms-click-12="_select($index, $event)"\r\n                 ms-attr-title="el.title||el.label"\r\n                 ms-visible="el.toggle"\r\n                 ms-hover="oni-state-hover: el.enable"\r\n                 ms-class-1="oni-state-disabled:!el.enable"\r\n                 ms-class-2="oni-state-active:isActive(el, multipleChange)"\r\n                 ms-class-4="oni-dropdown-group:el.group"\r\n                 ms-class-5="oni-dropdown-divider:el.group && !$first"\r\n                 data-repeat-rendered="repeatRendered"\r\n                 >{{el.label|sanitize|html}}</div>\r\n        </div>\r\n    </div>\r\n</div>\r\n';});


define('text!scrollbar/avalon.scrollbar.html',[],function () { return '<div ms-repeat-pos="_position" class="oni-scrollbar oni-helper-reset oni-helper-clearfix oni-widget"\r\n     ms-visible="!disabled"\r\n\t ms-class-100="oni-scrollbar-{{pos}}" \r\n\t ms-class-101="oni-scrollbar-{{size}} oni-scrollbar-{{pos}}-{{size}}" \r\n\t ms-class-102="oni-state-disabled:disabled" \r\n\t ms-mouseenter="_show($event, \'always\', $index)" \r\n\t ms-visible="toggle">\r\n\t<div ms-if="showBarHeader" class="oni-scrollbar-arrow oni-scrollbar-arrow-up" \r\n\t ms-click="_arrClick($event, \'up\', pos, $index)" \r\n\t ms-mousedown="_arrDown($event,\'up\', pos, $index)" \r\n\t ms-class-100="oni-state-disabled:disabled" \r\n\t ms-mouseup="_arrDown($event,\'up\', pos, $index,\'release\')" \r\n\t ms-hover="oni-state-hover oni-scrollbar-arrow-hover"><b class="oni-scrollbar-trangle  oni-scrollbar-trangle-up"></b></div>\r\n\t<div class="oni-scrollbar-draggerpar" ms-click="_barClick($event, pos, $index)">\r\n\t\t<div class="oni-scrollbar-dragger"\r\n\t\tms-attr-data-draggable-axis="pos == \'left\' || pos == \'right\' ? \'y\' : \'x\'" \r\n\t\tms-click="_stopPropagation($event)" \r\n\t\tms-class-100="oni-state-disabled:disabled" \r\n\t\tms-mouseover="_show($event,\'always\',$index)" \r\n\t\tms-mousedown="_draggerDown($event, true)" \r\n\t\tms-mouseup="_draggerDown($event, false)" \r\n\t\tms-mouseout="_draggerDown($event, false)" \r\n\t\tms-hover="oni-state-hover"\r\n\t\t>{{draggerHTML | html}}</div>\r\n\t</div>\r\n\t<div ms-if="showBarHeader" class="oni-scrollbar-arrow oni-scrollbar-arrow-down"\r\n\t ms-click="_arrClick($event, \'down\', pos, $index)"\r\n\t ms-mousedown="_arrDown($event,\'down\', pos, $index)" \r\n\t ms-mouseup="_arrDown($event,\'down\', pos, $index,\'release\')" \r\n\t ms-class-100="oni-state-disabled:disabled" \r\n\t ms-hover="oni-state-hover"><b class="oni-scrollbar-trangle oni-scrollbar-trangle-down"></b></div>\r\n</div>';});

define('draggable/avalon.draggable',["avalon"], function(avalon) {
    var defaults = {
        ghosting: false, //是否影子拖动，动态生成一个元素，拖动此元素，当拖动结束时，让原元素到达此元素的位置上,
        delay: 0,
        axis: "xy",
        started: true,
        start: avalon.noop,
        beforeStart: avalon.noop,
        drag: avalon.noop,
        beforeStop: avalon.noop,
        stop: avalon.noop,
        scrollPlugin: true,
        scrollSensitivity: 20,
        scrollSpeed: 20
    }

    var styleEl = document.getElementById("avalonStyle")
    //拖动时禁止文字被选中，禁止图片被拖动
    var cssText = ".ui-helper-global-drag *{ -webkit-touch-callout: none;" +
            "-khtml-user-select: none;" +
            "-moz-user-select: none;" +
            "-ms-user-select: none;" +
            "user-select: none;}" +
            ".ui-helper-global-drag img{-webkit-user-drag:none; " +
            "pointer-events:none;}"
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }

    var body
    var ua = navigator.userAgent;
    var isAndroid = /Android/i.test(ua);
    var isBlackBerry = /BlackBerry/i.test(ua)
    var isWindowPhone = /IEMobile/i.test(ua)
    var isIOS = /iPhone|iPad|iPod/i.test(ua)
    var isMobile = isAndroid || isBlackBerry || isWindowPhone || isIOS
    if (!isMobile) {
        var dragstart = "mousedown"
        var drag = "mousemove"
        var dragstop = "mouseup"
    } else {
        dragstart = "touchstart"
        drag = "touchmove"
        dragstop = "touchend"
    }

    var draggable = avalon.bindingHandlers.draggable = function(data, vmodels) {
        var args = data.value.match(avalon.rword) || []
        var ID  = args[0] ||  "$"
        var opts = args[1] ||"draggable"
        var model, vmOptions
        if (ID != "$") {
            model = avalon.vmodels[ID]//如果指定了此VM的ID
            if (!model) {
                return
            }
        }
        data.element.removeAttribute("ms-draggable")
        if (!model) {//如果使用$或绑定值为空，那么就默认取最近一个VM，没有拉倒
            model = vmodels.length ? vmodels[0] : null
        }
        var fnObj = model || {}
        if (model && typeof model[opts] === "object") {//如果指定了配置对象，并且有VM
            vmOptions = model[opts]
            if (vmOptions.$model) {
                vmOptions = vmOptions.$model
            }
            fnObj = vmOptions
        }

        var element = data.element
        var $element = avalon(element)
        var options = avalon.mix({}, defaults, vmOptions || {}, data[opts] || {}, avalon.getWidgetData(element, "draggable"));

        //修正drag,stop为函数
        "drag,stop,start,beforeStart,beforeStop".replace(avalon.rword, function(name) {
            var method = options[name]
            if (typeof method === "string") {
                if (typeof fnObj[method] === "function") {
                    options[name] = fnObj[method]

                }
            }
        })
        if (options.axis !== "" && !/^(x|y|xy)$/.test(options.axis)) {
            options.axis = "xy"
        }
        body = document.body //因为到这里时，肯定已经domReady

        $element.bind(dragstart, function(e) {
            var data = avalon.mix({}, options, {
                element: element,
                $element: $element,
                pageX: getPosition(e, "X"), //相对于页面的坐标, 会改动
                pageY: getPosition(e, "Y"), //相对于页面的坐标，会改动
                marginLeft: parseFloat($element.css("marginLeft")) || 0,
                marginTop: parseFloat($element.css("marginTop")) || 0
            })
            data.startPageX = data.pageX//一次拖放只赋值一次
            data.startPageY = data.pageY//一次拖放只赋值一次
            options.axis.replace(/./g, function(a) {
                data["drag" + a.toUpperCase() ] = true
            })
            if (!data.dragX && !data.dragY) {
                data.started = false
            }
            //在处理手柄拖动前做些事情
            if (typeof options.beforeStart === "function") {
                options.beforeStart.call(data.element, e, data)
            }

            if (data.handle && fnObj) {// 实现手柄拖动
                var handle = fnObj[data.handle]
                handle = typeof handle === "function" ? handle : data.handle
                if (typeof handle === "function") {
                    var checked = handle.call(element, e, data)//要求返回一节点
                    if (checked && checked.nodeType === 1) {
                        if (!element.contains(checked)) {
                            return // 不能返回 false，这会阻止文本被选择
                        }
                    } else {
                        return
                    }
                }
            }
            fixUserSelect()
            var position = $element.css("position")

            //如果原元素没有被定位
            if (!/^(?:r|a|f)/.test(position)) {
                element.style.position = "relative";
                element.style.top = "0px"
                element.style.left = "0px"
            }

            if (options.delay && isFinite(options.delay)) {
                data.started = false;
                setTimeout(function() {
                    data.started = true
                }, options.delay)
            }

            var startOffset = $element.offset()
            if (options.ghosting) {
                var clone = element.cloneNode(true)
                avalon(clone).css("opacity", .7).width(element.offsetWidth).height(element.offsetHeight)
                data.clone = clone
                if (position !== "fixed") {
                    clone.style.position = "absolute"
                    clone.style.top = startOffset.top - data.marginTop + "px"
                    clone.style.left = startOffset.left - data.marginLeft + "px"
                }
                body.appendChild(clone)
            }
            var target = avalon(data.clone || data.element)
            //拖动前相对于offsetParent的坐标
            data.startLeft = parseFloat(target.css("left"))
            data.startTop = parseFloat(target.css("top"))

            //拖动后相对于offsetParent的坐标
            //如果是影子拖动，代理元素是绝对定位时，它与原元素的top, left是不一致的，因此当结束拖放时，不能直接将改变量赋给原元素
            data.endLeft = parseFloat($element.css("left")) - data.startLeft
            data.endTop = parseFloat($element.css("top")) - data.startTop

            data.clickX = data.pageX - startOffset.left //鼠标点击的位置与目标元素左上角的距离
            data.clickY = data.pageY - startOffset.top  //鼠标点击的位置与目标元素左上角的距离
            setContainment(options, data)//修正containment
            draggable.dragData = data//决定有东西在拖动
            "start,drag,beforeStop,stop".replace(avalon.rword, function(name) {
                //console.log(options[name])
                draggable[name] = [options[name]]
            })
            draggable.plugin.call("start", e, data)
        })

    }
    var xy2prop = {
        "X": "Left",
        "Y": "Top"
    }
    //插件系统
    draggable.dragData = {}
    draggable.start = []
    draggable.drag = []
    draggable.stop = []
    draggable.beforeStop = []
    draggable.plugin = {
        add: function(name, set) {
            for (var i in set) {
                var fn = set[i]
                if (typeof fn === "function" && Array.isArray(draggable[i])) {
                    fn.isPlugin = true
                    fn.pluginName = name + "Plugin"
                    draggable[i].push(fn)
                }
            }
        },
        call: function(name, e, data) {
            var array = draggable[name]
            if (Array.isArray(array)) {
                array.forEach(function(fn) {
                    //用户回调总会执行，插件要看情况
                    if (typeof fn.pluginName === "undefined" ? true : data[fn.pluginName]) {
                        fn.call(data.element, e, data)
                    }
                })
            }
            if (name === "stop") {
                for (var i in draggable) {
                    array = draggable[i]
                    if (Array.isArray(array)) {
                        array.forEach(function(fn) {
                            if (!fn.isPlugin) {// 用户回调都是一次性的，插件的方法永远放在列队中
                                avalon.Array.remove(array, fn)
                            }
                        })
                    }
                }
            }
        }
    }

    //统一处理拖动的事件
    var lockTime = new Date - 0, minTime = document.querySelector ? 12 : 30
    avalon(document).bind(drag, function(e) {
        var time = new Date - lockTime
        if (time > minTime) {//减少调用次数，防止卡死IE6-8
            lockTime = time
            var data = draggable.dragData
            if (data.started === true) {
                //fix touchmove bug;  
                //IE 在 img 上拖动时默认不能拖动（不触发 mousemove，mouseup 事件，mouseup 后接着触发 mousemove ...）
                //防止 html5 draggable 元素的拖放默认行为 (选中文字拖放)
                e.preventDefault();
                //使用document.selection.empty()来清除选择，会导致捕获失败 
                var element = data.clone || data.element
                setPosition(e, element, data, "X")
                setPosition(e, element, data, "Y")
                draggable.plugin.call("drag", e, data)
            }
        }
    })

    //统一处理拖动结束的事件
    avalon(document).bind(dragstop, function(e) {
        var data = draggable.dragData
        if (data.started === true) {
            restoreUserSelect()
            var element = data.element
            draggable.plugin.call("beforeStop", e, data)
            if (data.dragX) {
                setPosition(e, element, data, "X", true)
            }
            if (data.dragY) {
                setPosition(e, element, data, "Y", true)
            }
            if (data.clone) {
                body.removeChild(data.clone)
            }
            draggable.plugin.call("stop", e, data)
            draggable.dragData = {}
        }
    })


    function getPosition(e, pos) {
        var page = "page" + pos
        return isMobile ? e.changedTouches[0][page] : e[page]
    }

    function setPosition(e, element, data, pos, end) {
        var page = getPosition(e, pos)
        if (data.containment) {
            var min = pos === "X" ? data.containment[0] : data.containment[1]
            var max = pos === "X" ? data.containment[2] : data.containment[3]
            var check = page - (pos === "X" ? data.clickX : data.clickY)
            if (check < min) {
                page += Math.abs(min - check)
            } else if (check > max) {
                page -= Math.abs(max - check)
            }
        }
        data["page" + pos] = page//重设pageX, pageY
        var Prop = xy2prop[pos]
        var prop = Prop.toLowerCase()

        var number = data["start" + Prop] + page - data["startPage" + pos] + (end ? data["end" + Prop] : 0)
        data[prop] = number

        if (data["drag" + pos]) {//保存top, left
            element.style[ prop ] = number + "px"
        }

    }


    var rootElement = document.documentElement
    var fixUserSelect = function() {
        avalon(rootElement).addClass("ui-helper-global-drag")
    }
    var restoreUserSelect = function() {
        avalon(rootElement).removeClass("ui-helper-global-drag")
    }

    if (window.VBArray && !("msUserSelect" in rootElement.style)) {
        var _ieSelectBack;//fix IE6789
        function returnFalse() {
            var e = window.event || {}
            e.returnValue = false
        }
        fixUserSelect = function() {
            _ieSelectBack = body.onselectstart;
            body.onselectstart = returnFalse;
        }
        restoreUserSelect = function() {
            body.onselectstart = _ieSelectBack;
        }
    }

    function setContainment(o, data) {
        if (!o.containment) {
            if (Array.isArray(data.containment)) {
                return
            }
            data.containment = null;
            return;
        }
        var elemWidth = data.$element.width()
        var elemHeight = data.$element.height()
        if (o.containment === "window") {
            var $window = avalon(window)
            //左， 上， 右， 下
            data.containment = [
                $window.scrollLeft(),
                $window.scrollTop(),
                $window.scrollLeft() + $window.width() - data.marginLeft - elemWidth,
                $window.scrollTop() + $window.height() - data.marginTop - elemHeight
            ]
            return;
        }

        if (o.containment === "document") {
            data.containment = [
                0,
                0,
                avalon(document).width() - data.marginLeft,
                avalon(document).height() - data.marginTop
            ]
            return;
        }

        if (Array.isArray(o.containment)) {
            var a = o.containment
            data.containment = [a[0], a[1], a[2] - elemWidth, a[3] - elemHeight]
            return;
        }

        if (o.containment === "parent" || o.containment.charAt(0) === "#") {
            var elem
            if (o.containment === "parent") {
                elem = data.element.parentNode;
            } else {
                elem = document.getElementById(o.containment.slice(1))
            }
            if (elem) {
                var $offset = avalon(elem).offset()
                data.containment = [
                    $offset.left + data.marginLeft, //如果元素设置了marginLeft，设置左边界时需要考虑它 
                    $offset.top + data.marginTop,
                    $offset.left + elem.offsetWidth - data.marginLeft - elemWidth,
                    $offset.top + elem.offsetHeight - data.marginTop - elemHeight
                ]
            }
        }
    }
    return avalon
})
;

define('css!scrollbar/avalon.scrollbar',[],function(){});
/**
 * @cnName 滚动条组件
 * @enName scrollbar
 * @introduce
 *  <p> 自定义滚动条样式，绑定ms-widget="scrollbar"的元素内必须包含一个class="oni-scrollbar-scroller"的视窗元素</p>
 */
define('scrollbar/avalon.scrollbar',["avalon", "text!./avalon.scrollbar.html", "../draggable/avalon.draggable", "css!./avalon.scrollbar.css", "css!../chameleon/oniui-common.css"], function(avalon, template) {

    // get by className, not strict
    function getByClassName(cname, par) {
        var par = par || document.body
        if(par.getElementsByClassName) {
            return par.getElementsByClassName(cname)
        } else {
            var child = par.getElementsByTagName("*"),
                arr = []
            avalon.each(child, function(i, item) {
                var ele = avalon(item)
                if(ele.hasClass(cname)) arr.push(item)
            })
            return arr
        }
    }

    function strToNumber(s) {
        return Math.round(parseFloat(s)) || 0
    }

    // 响应wheel,binded
    var wheelBinded,
        wheelArr = [],
        keyArr = []

    var widget = avalon.ui.scrollbar = function(element, data, vmodels) {
        var options = data.scrollbarOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.scrollbarId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.draggerHeight = vm.draggerWidth = ""
            vm.inFocuse = false
            vm._position = []
            vm.rootElement = element
            vm.viewElement = element
            vm.$skipArray = ["rootElement"]
            vm.dragging = false

            var inited,
                bars = [],
                scroller
            vm.$init = function(continueScan) {
                if(inited) return
                inited = true
                vmodel.widgetElement.style.position = "relative"
                //document body情形需要做一下修正
                vmodel.viewElement = vmodel.widgetElement == document.body ? document.getElementsByTagName(
                    "html")[0] : vmodel.widgetElement
                vmodel.viewElement.style.overflow = vmodel.viewElement.style.overflowX = vmodel.viewElement.style.overflowY = "hidden"
                if(vmodel.widgetElement == document.body) vmodel.widgetElement.style.overflow = vmodel.widgetElement.style.overflowX = vmodel.widgetElement.style.overflowY = "hidden"
                vmodel._position = vmodel.position.split(",")

                var frag = avalon.parseHTML(options.template)
                vmodel.widgetElement.appendChild(frag)
                if (continueScan) {
                    continueScan()
                } else {
                    avalon.log("avalon请尽快升到1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
                var children = vmodel.widgetElement.childNodes
                avalon.each(children, function(i, item) {
                    var ele = avalon(item)
                    if(ele.hasClass("oni-scrollbar") || ele.hasClass("ui-scrollbar")) {
                        bars.push(ele)
                    } else if(ele.hasClass("oni-scrollbar-scroller") || ele.hasClass("ui-scrollbar-scroller")) {
                        scroller = ele
                    }
                })
                // 竖直方向支持滚轮事件
                if(vmodel.position.match(/left|right/g)) {
                    var vs = [],hs = []
                    avalon.each(vmodel._position, function(i, item) {
                        if(item.match(/left|right/g)) {
                            vs.push([i, item])
                        } else {
                            hs.push([i, item])
                        }
                    })

                    function wheelLike(diretion, arr, e, func) {
                        avalon.each(arr, function(i, item) {
                            if(!bars[i].data("oni-scrollbar-needed")) return
                            vmodel._computer(func || function(obj) {
                                return vmodel._clickComputer(obj, diretion)
                            }, item[0], item[1], function(breakOut) {
                                if(!breakOut) e.preventDefault()
                            }, "breakOutCallbackCannotIgnore")
                        })
                    }
                    function myOnWheel(e) {
                        if(vmodel.disabled) return
                        if(vmodel.inFocuse) {
                            wheelLike(e.wheelDelta > 0 ? "up" : "down", vs, e)
                        }
                    }
                    function myKeyDown(e) {
                        if(vmodel.disabled) return
                        var k = e.keyCode
                        if(k > 32 && k < 41 & vmodel.inFocuse) {
                            // 方向按键
                            if(k in {37:1, 39: 1, 38: 1, 40:1}) {
                                wheelLike(k in {37:1, 38:1} ? "up" : "down", k in {38: 1, 40:1} ? vs : hs, e)
                            // end or home
                            // pageup or pagedown
                            } else{
                                var diretion = k in {33: 1, 36: 1} ? "up" : "down"
                                wheelLike(diretion, vs, e, function(obj) {
                                    var _top = scroller[0].scrollTop
                                    // home, pageup
                                    if(k in {33: 1, 36: 1}) {
                                        if(_top) e.preventDefault()
                                    // end, pagedown
                                    } else {
                                        if(_top < obj.scrollerH - obj.viewH) e.preventDefault()
                                    }
                                    // home or end
                                    // end plus 100, easy to trigger breakout
                                    if(k in {36: 1, 35: 1}) {
                                        return {
                                            x: 0,
                                            y: k == 36 ? 0 : obj.draggerparHeight - obj.draggerHeight + 100
                                        }
                                    // pageup or pagedown
                                    // a frame
                                    } else {
                                        // frame 计算方式更新为百分比
                                        var frame = (obj.draggerparHeight - obj.draggerHeight) * obj.viewH / (obj.scrollerH - obj.viewH)
                                        return vmodel._clickComputer(obj, diretion, strToNumber(frame) || 1)
                                    }
                                })
                            }
                        }
                    }
                    // document.body直接如此处理
                    if(vmodel.widgetElement == document.body) {
                        vmodel.inFocuse = true
                        wheelArr.push(myOnWheel)
                        keyArr.push(myKeyDown)
                    } else {
                        avalon.bind(element, "mouseenter", function(e) {
                            vmodel.inFocuse = true
                            wheelArr.push(myOnWheel)
                            keyArr.push(myKeyDown)
                        })
                        avalon.bind(element, "mouseleave", function(e) {
                            vmodel.inFocuse = false
                            for(var i = 0, len = wheelArr.length; i < len; i++) {
                                if(wheelArr[i] === myOnWheel) {
                                    wheelArr.splice(i, 1)
                                    keyArr.splice(i, 1)
                                    break
                                }
                            }
                        })
                    }
                    // 所有组件实例公用一个事件绑定
                    if(!wheelBinded) {
                        wheelBinded = true
                        avalon.bind(document, "mousewheel", function(e) {
                            var cb = wheelArr[wheelArr.length - 1]
                            cb && cb(e)
                        })
                        // keyborad,,,simida
                        // left 37
                        // right 39
                        // top 38
                        // down 40
                        // pageup 33
                        // pagedown 34
                        // home 36
                        // end 35
                        avalon.bind(document, "keydown", function(e) {
                           var cb = keyArr[keyArr.length - 1]
                            cb && cb(e)
                        })
                    }

                }


                avalon.bind(element, "mouseenter", function() {
                    avalon.each(bars, function(i, item) {
                        vmodel._show("e", false, item)
                    })
                })
                avalon.bind(element, "mouseleave", function() {
                    vmodel._hide()
                })

                vmodel.update("init")
            }

            // data-draggable-before-start="beforeStartFn" 
            // data-draggable-start="startFn" 
            // data-draggable-drag="dragFn" 
            // data-draggable-before-stop="beforeStopFn" 
            // data-draggable-stop="stopFn" 
            // data-draggable-containment="parent" 
            vm.$draggableOpts = {
                beforeStart: function() {
                    vmodel.dragging = true
                },
                drag: function(e, data) {
                    var dr = avalon(data.element)
                    vmodel._computer(function(obj) {
                        var a = {
                            x: strToNumber(dr.css("left")) >> 0,
                            y: strToNumber(dr.css("top")) >> 0
                        }
                        // easy to break out
                        if(a.x == obj.draggerparWidth - obj.draggerWidth) a.x += 100
                        if(a.y == obj.draggerparHeight - obj.draggerHeight) a.y += 100
                        return a
                    }, dr.attr("oni-scrollbar-index"), dr.attr("oni-scrollbar-pos"))
                }, 
                handle: function(e, data) {
                    return !vmodel.disabled && this
                },
                containment: "parent"
            }
            vm.$draggableOpts.stop = function(e, data) {
                vmodel.$draggableOpts.drag(e, data)
                vmodel.dragging = false
                avalon(data.element).removeClass("oni-state-active")
            }

            vm.$remove = function() {
                avalon.each(bars, function(i, bar) {
                    bar[0] && bar[0].parentNode && bar[0].parentNode.removeChild(bar[0])
                })
            }

            vm._onScroll = function() {
                if(vmodel.show != "scrolling") return     
                avalon.each(bars, function(i, item) {
                    vmodel._show("e", false, item)
                })
            }
            vm._show = function(e, always, index) {
                if(vmodel.show != "scrolling") return
                e.stopPropagation && e.stopPropagation()
                var item = index.css ? index : bars[index]
                if(item) {
                    clearTimeout(item.data("oni-scrollbar-hidetimer"))
                    item.css("visibility", "visible")
                    item.css("opacity", 1)
                    if(!always) {
                        item.data("oni-scrollbar-hidetimer", setTimeout(function() {
                            item.css("opacity", 0)
                        }, 1000))
                    }
                }
            }
            vm._hide = function(e,index) {
                if(vmodel.show != "scrolling") return
                if(index && bars[index]) {
                    bars[index].css("opacity", 0)
                } else {
                    avalon.each(bars, function(i, item) {
                        item.css("opacity", 0)
                    })
                }
            }
            //@interface getBars()返回所有的滚动条元素，avalon元素对象
            vm.getBars = function() {
                return bars
            }
            //@interface getScroller()返回scroller avalon对象
            vm.getScroller = function() {
                return scroller
            }
            //@interface update()更新滚动条状态，windowresize，内容高度变化等情况下调用，不能带参数
            vm.update = function(ifInit, x, y) {
                if(vmodel.disabled) return
                var ele = avalon(vmodel.viewElement),
                    // 滚动内容宽高
                    viewW,
                    viewH,
                    // 计算滚动条可以占据的宽或者高
                    // barH = strToNumber(ele.css("height")),
                    barH = vmodel.widgetElement === document.body? vmodel.viewElement.clientHeight : strToNumber(ele.css("height")),
                    barW = strToNumber(ele.css("width")),
                    // 滚动视野区宽高，存在滚动视野区宽高和滚动宽高不一致的情况
                    h = vmodel.viewHeightGetter(ele),
                    w = vmodel.viewWidthGetter(ele),
                    p = vmodel.position,
                    barDictionary,
                    barMinus = {},
                    y = y == void 0 ? vmodel.scrollTop : y,
                    x = x == void 0 ? vmodel.scrollLeft : x
                //document body情形需要做一下修正
                if(vmodel.viewElement != vmodel.widgetElement) {
                    p.match(/right|left/g) && avalon(vmodel.widgetElement).css("height", barH)
                }
                // 水平方向内间距
                var hPadding = scroller.width() - scroller.innerWidth(),
                    // 竖直方向内间距
                    vPadding = scroller.height() - scroller.innerHeight()
                scroller.css("height", h + vPadding)
                scroller.css("width", w + hPadding )
                viewW = scroller[0].scrollWidth
                viewH = scroller[0].scrollHeight
                barDictionary = {
                    "top": p.match(/top/g) && viewW > w,
                    "right": p.match(/right/g) && viewH > h,
                    "bottom": p.match(/bottom/g) && viewW > w,
                    "left": p.match(/left/g) && viewH > h
                }
                if(bars.length > 1) {
                    var ps = ["top", "right", "bottom", "left"]
                    for(var i = 0; i < 4; i++) {
                        barMinus[ps[i]] = [(barDictionary[i ? ps[i - 1] : ps[3]] && 1) >> 0, (barDictionary[i < 3 ? ps[i + 1] : ps[0]] && 1) >> 0]
                        if(i > 1) barMinus[ps[i]] = barMinus[ps[i]].reverse()
                    }
                }
                // 根据实际视窗计算，计算更新scroller的宽高
                // 更新视窗
                h = scroller.innerHeight()
                w = scroller.innerWidth()
                avalon.each(vmodel._position, function(i, item) {
                    var bar = bars[i],
                        isVertical = item.match(/left|right/),
                        dragger
                    if(bar) {
                        dragger = avalon(getByClassName("oni-scrollbar-dragger", bar.element)[0])
                    }
                    // 拖动逻辑前移，确保一定是初始化了的
                    if(ifInit && dragger) {
                        dragger.attr("ms-draggable", "$,$draggableOpts")
                        dragger.attr("oni-scrollbar-pos", item)
                        dragger.attr("oni-scrollbar-index", i)
                        avalon.scan(dragger[0], vmodel)
                    }
                    // hidden bar
                    if(!barDictionary[item]) {
                        if(bar) {
                            bar.css("opacity", 0)
                            bar.css("visibility", "hidden")
                            bar.data("oni-scrollbar-needed", false)
                        }
                        return
                    } else {
                        if(bar) {
                            bar.data("oni-scrollbar-needed", true)
                            bar.css("visibility", "visible")
                            if(vmodel.show == "scrolling" || vmodel.show == "never"){
                                bar.css("opacity", 0)
                            } else {
                                bar.css("opacity", 1)
                            }
                        }
                    }
                    if(bar) {
                        var sh = strToNumber(bar.css("height")),
                            sw = strToNumber(bar.css("width")),
                            bh = sh,
                            bw = sw,
                            draggerpar = avalon(getByClassName("oni-scrollbar-draggerpar", bar[0])[0]),
                            headerLength = vmodel.showBarHeader ? 2 : 0
                        // 更新滚动条没有两端的箭头的时候依旧要重新计算相邻两个bar的间隔
                        var draggerParCss = []
                        if(bars.length > 1) {
                            var barCss = [], minus = barMinus[item]
                            if(isVertical) {
                                barCss = [
                                    ["top", minus[0] * bw],
                                    ["height", (barH - bw * (minus[0] + minus[1]))]
                                ]
                                draggerParCss = [
                                    ["top", (headerLength/2) * bw],
                                    ["height", (barH - bw * (minus[0] + minus[1] + headerLength))]
                                ]
                            } else {
                                barCss = [
                                    ["left", minus[0] * bh],
                                    ["width", (barW - bh * (minus[0] + minus[1]))]
                                ]
                                draggerParCss = [
                                    ["left", (headerLength/2) * bh],
                                    ["width", (barW - bh * (headerLength + minus[0] + minus[1]))]
                                ]
                            }
                            avalon.each(barCss, function(index, css) {
                                bar.css.apply(bar, css)
                            })
                            bh = bar.height()
                            bw = bar.width()
                        } else {
                            if(isVertical) {
                                draggerParCss = [
                                    ["top", bw],
                                    ["height", (barH - bw * 2)]
                                ]
                            } else {
                                draggerParCss = [
                                    ["left", bh],
                                    ["width", (barW - bh * 2)]
                                ]
                            }
                        }
                        var ex
                        if(isVertical) {
                            ex = vmodel.show == "always" ? bw : 0
                            scroller.css("width", w + hPadding - ex)
                        } else {
                            ex = vmodel.show == "always" ? bh : 0
                            scroller.css("height", h + vPadding - ex)
                        }
                        avalon.each(draggerParCss, function(index, css) {
                            draggerpar.css.apply(draggerpar, css)
                        })
                        sh = bh - headerLength * bw
                        sw = bw - headerLength * bh
                        // 更新滚动头
                        var draggerCss
                        if(isVertical) {
                            var draggerTop = y,
                                draggerHeight =strToNumber(h * sh / viewH)
                                // 限定一个dragger的最小高度
                                draggerHeight = vmodel.limitRateV * bw > draggerHeight && vmodel.limitRateV * bw || draggerHeight
                                draggerTop = draggerTop < 0 ? 0 : draggerTop
                                draggerTop = draggerTop > viewH - h ? viewH - h : draggerTop
                                //draggerTop = sh * draggerTop / viewH
                                draggerTop = strToNumber((sh - draggerHeight) * draggerTop / (viewH - h))
                                draggerTop = Math.min(sh - draggerHeight, draggerTop)
                            draggerCss = [
                                ["width", "100%"],
                                ["height", draggerHeight],
                                ["top", draggerTop]
                            ]
                            y = y > 0 ? (y > viewH - h + ex ?  viewH - h + ex : y) : 0
                        } else {
                            var draggerLeft = x,
                                draggerWidth = strToNumber(w * sw / viewW)
                                // limit width to limitRateH * bh
                                draggerWidth = vmodel.limitRateH * bh > draggerWidth && vmodel.limitRateH * bh || draggerWidth
                                draggerLeft = draggerLeft < 0 ? 0 : draggerLeft
                                draggerLeft = draggerLeft > viewW - w ? viewW - w : draggerLeft
                                // draggerLeft = sw * draggerLeft / viewW
                                draggerLeft = strToNumber((sw - draggerWidth) * draggerLeft / (viewW - w))
                                draggerLeft = Math.min(sw - draggerWidth, draggerLeft)
                            draggerCss = [
                                ["height", "100%"],
                                ["width", draggerWidth],
                                ["left", draggerLeft]
                            ]
                            x = x > 0 ? (x > viewW - w + ex ? viewW - w + ex : x) : 0
                        }
                        avalon.each(draggerCss, function(index, css) {
                            dragger.css.apply(dragger, css)
                        })
                        if(ifInit) {
                            if(isVertical) {
                                vmodel._scrollTo(void 0, y)
                            } else {
                                vmodel._scrollTo(x, void 0)
                            }
                        }
                        if(vmodel.showBarHeader) {
                            if(y == 0 && isVertical || !isVertical && x == 0) {
                                avalon(getByClassName("oni-scrollbar-arrow-up", bar[0])[0]).addClass("oni-state-disabled")
                            } else {
                                avalon(getByClassName("oni-scrollbar-arrow-up", bar[0])[0]).removeClass("oni-state-disabled")
                            }
                            if(y >= draggerpar.innerHeight() - dragger.innerHeight() && isVertical || !isVertical && x >= draggerpar.innerWidth() - dragger.innerWidth()) {
                               !vmodel.breakOutCallback && avalon(getByClassName("oni-scrollbar-arrow-down", bar[0])[0]).addClass("oni-state-disabled")
                            } else {
                                avalon(getByClassName("oni-scrollbar-arrow-down", bar[0])[0]).removeClass("oni-state-disabled")
                            }
                        }
                    }
                })
            }

            // 点击箭头
            vm._arrClick = function(e, diretion, position, barIndex) {
                if(vmodel.disabled) return
                vmodel._computer(function(obj) {
                    return vmodel._clickComputer(obj, diretion)
                }, barIndex, position)
            }

            vm._clickComputer = function(obj, diretion, step) {
                var step = step || obj.step || 40,
                    l = strToNumber(obj.dragger.css("left")) >> 0,
                    r = strToNumber(obj.dragger.css("top")) >> 0,
                    x = diretion == "down" ? l + step : l - step,
                    y = diretion == "down" ? r + step : r - step
                return {
                    x: x,
                    y: y
                }
            }
            // 长按
            vm._arrDown = function($event, diretion, position, barIndex,ismouseup) {
                if(vmodel.disabled) return
                var se = this,
                    ele = avalon(se)
                clearInterval(ele.data("mousedownTimer"))
                clearTimeout(ele.data("setTimer"))
                var bar = bars[barIndex]
                if(ismouseup || ele.hasClass("oni-state-disabled")) {
                    return ele.removeClass("oni-state-active")
                }
                // 延时开启循环
                ele.data("setTimer", setTimeout(function(){
                    ele.addClass("oni-state-active")
                    ele.data("mousedownTimer", setInterval(function() {
                        return vmodel._computer(function(obj) {
                                return vmodel._clickComputer(obj, diretion)
                            }, barIndex, position ,function(breakOut) {
                                if(!breakOut) return
                                clearInterval(ele.data("mousedownTimer"))
                                clearTimeout(ele.data("setTimer"))
                            })
                    }, 120))
                }, 10))
            }
            // 点击滚动条
            vm._barClick = function(e, position, barIndex) {
                if(vmodel.disabled) return
                var ele = avalon(this)
                if(ele.hasClass("oni-scrollbar-dragger")) return
                vmodel._computer(function(obj) {
                    return {
                        x: Math.ceil(e.pageX - obj.offset.left - obj.draggerWidth / 2),
                        y : Math.ceil(e.pageY - obj.offset.top - obj.draggerHeight / 2)
                    }
                }, barIndex, position)
            }
            // 计算滚动条位置
            vm._computer = function(axisComputer, barIndex, position, callback, breakOutCallbackCannotIgnore) {
                if(vmodel.disabled) return
                var bar = bars[barIndex]
                if(bar && bar.data("oni-scrollbar-needed")) {
                    var obj = {},
                        isVertical = position.match(/left|right/g)
                    obj.dragger = avalon(getByClassName("oni-scrollbar-dragger", bar[0])[0])
                    obj.draggerWidth = strToNumber(obj.dragger.css("width"))
                    obj.draggerHeight = strToNumber(obj.dragger.css("height"))
                    obj.draggerpar = avalon(obj.dragger[0].parentNode)
                    obj.draggerparWidth = strToNumber(obj.draggerpar.css("width"))
                    obj.draggerparHeight = strToNumber(obj.draggerpar.css("height"))
                    obj.offset = obj.draggerpar.offset()
                    obj.up = avalon(getByClassName("oni-scrollbar-arrow-up", bar[0])[0])
                    obj.down = avalon(getByClassName("oni-scrollbar-arrow-down", bar[0])[0])
                    obj.viewer = avalon(vmodel.viewElement)
                    // obj.viewH = vmodel.viewHeightGetter(obj.viewer)
                    // obj.viewW = vmodel.viewWidthGetter(obj.viewer)
                    // 更新的时候要用viewer先计算
                    // 计算的时候直接用scroller作为视窗计算宽高
                    // obj.viewH = vmodel.viewHeightGetter(scroller)
                    // obj.viewW = vmodel.viewWidthGetter(scroller)
                    obj.viewH = scroller.innerHeight()
                    obj.viewW = scroller.innerWidth()
                    obj.scrollerH = scroller[0].scrollHeight
                    obj.scrollerW = scroller[0].scrollWidth
                    obj.step = isVertical ? 40 * (obj.draggerparHeight - obj.draggerHeight) / (obj.scrollerH - obj.viewH) : 40 * (obj.draggerparWidth - obj.draggerWidth) / (obj.scrollerW - obj.viewW)
                    obj.step = strToNumber(obj.step) || 1

                    var xy = axisComputer(obj),
                        breakOut
                        xy.x = strToNumber(xy.x)
                        xy.y = strToNumber(xy.y)

                    if(isVertical) {
                        if(xy.y < 0) {
                            xy.y = 0
                            obj.up.addClass("oni-state-disabled")
                            breakOut = ["v", "up"]
                        } else {
                            obj.up.removeClass("oni-state-disabled")
                        }
                        if(xy.y > obj.draggerparHeight - obj.draggerHeight) {
                            xy.y = obj.draggerparHeight - obj.draggerHeight
                            breakOut = ["v", "down"]
                            obj.down.addClass("oni-state-disabled")
                        } else {
                            obj.down.removeClass("oni-state-disabled")
                        }
                        var c = strToNumber((obj.scrollerH - obj.viewH) * xy.y / (obj.draggerparHeight - obj.draggerHeight)) - vmodel.scrollTop
                        obj.dragger.css("top", xy.y)
                        vmodel._scrollTo(void 0, strToNumber((obj.scrollerH - obj.viewH) * xy.y / (obj.draggerparHeight - obj.draggerHeight)))
                    } else {
                        if(xy.x < 0) {
                            xy.x = 0
                            breakOut = ["h", "up"]
                            obj.up.addClass("oni-state-disabled")
                        } else {
                            obj.up.removeClass("oni-state-disabled")
                        }
                        if(xy.x > obj.draggerparWidth - obj.draggerWidth) {
                            xy.x = obj.draggerparWidth - obj.draggerWidth
                            breakOut = ["h", "down"]
                            // 有溢出检测回调，不disable
                            !vmodel.breakOutCallback && obj.down.addClass("oni-state-disabled")
                        } else {
                            obj.down.removeClass("oni-state-disabled")
                        }
                        obj.dragger.css("left", xy.x)
                        vmodel._scrollTo(strToNumber((obj.scrollerW - obj.viewW) * xy.x / (obj.draggerparWidth - obj.draggerWidth)), void 0)
                    }

                }
                // 回调，溢出检测
                (!vmodel.breakOutCallback || breakOutCallbackCannotIgnore) && callback && callback(breakOut)
                vmodel.breakOutCallback && vmodel.breakOutCallback(breakOut, vmodel, obj)
            }
            vm._scrollTo = function(x, y) {
                if(y != void 0) {
                    scroller[0].scrollTop = y
                    vmodel.scrollTop = scroller[0].scrollTop
                }
                if(x != void 0) {
                    scroller[0].scrollLeft = x
                    vmodel.scrollLeft = scroller[0].scrollLeft
                }
            }

            //@interface scrollTo(x,y) 滚动至 x,y
            vm.scrollTo = function(x, y) {
                vmodel.update(!"ifInit", x, y)
                vm._scrollTo(x, y)
            }

            vm._initWheel = function(e, type) {
                if(type == "enter") {
                    vmodel.inFocuse = true
                } else {
                    vmodel.inFocuse = false
                }
            }
            vm._draggerDown = function(e, isdown) {
                if(vmodel.disabled) return
                var ele = avalon(this)
                if(isdown) {
                    ele.addClass("oni-state-active")
                } else {
                    ele.removeClass("oni-state-active")
                }
            }
            vm._stopPropagation = function(e) {
                e.stopPropagation()
            }
        })
      
        vmodel.$watch("scrollLeft", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, "h", vmodel)
        })
        vmodel.$watch("scrollTop", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, "v", vmodel)
        })

        return vmodel
    }
    widget.defaults = {
        disabled: false, //@config 组件是否被禁用，默认为否
        toggle: true, //@config 组件是否显示，可以通过设置为false来隐藏组件
        position: "right", //@config scrollbar出现的位置,right右侧，bottom下侧，可能同时出现多个方向滚动条
        limitRateV: 1.5, //@config 竖直方向，拖动头最小高度和拖动头宽度比率
        limitRateH: 1.5, //@config 水平方向，拖动头最小宽度和高度的比率
        scrollTop: 0, //@config 竖直方向滚动初始值，负数会被当成0，设置一个极大值等价于将拖动头置于bottom
        scrollLeft: 0, //@config 水平方向滚动初始值，负数会被当成0处理，极大值等价于拖动头置于right
        show: "always", //@config never一直不可见，scrolling滚动和hover时候可见，always一直可见
        showBarHeader: true,//@config 是否显示滚动条两端的上下箭头
        draggerHTML: "", //@config 滚动条拖动头里，注入的html碎片
        breakOutCallback: false, //@config breakOutCallback(["h", "up"], vmodel) 滚动到极限位置的回调，用来实现无线下拉等效果 breakOutCallback(["h", "up"], vmodel) 第一个参数是一个数组，分别是滚动条方向【h水平，v竖直】和超出极限的方向【up是向上或者向左，down是向右或者向下】，第三个参数是一个对象，包含滚动条的元素，宽高等信息
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        viewHeightGetter: function(viewElement) {
            return viewElement.innerHeight()
        }, //@config viewHeightGetter(viewElement) 配置计算视窗高度计函数，默认返回innerHeight
        viewWidthGetter: function(viewElement) {
            return viewElement.innerWidth()
        }, //@config viewWidthGetter(viewElement) 配置计算视窗宽度计函数，默认返回innerWidth
        getTemplate: function(tmpl, opts) {
            return tmpl
        },//@config getTemplate(tpl, opts) 定制修改模板接口
        onScroll: function(newValue, oldValue, diretion, vmodel) {

        },//@config onScroll(newValue, oldValue, diretion, vmodel) 滚动回调,scrollLeft or scrollTop变化的时候触发，参数为newValue, oldValue, diretion, vmodel diretion = h 水平方向，= v 竖直方向
        size: "normal", //@config srollbar size,normal为10px，small为8px，large为14px
        $author: "skipper@123"
    }
});

define('css!dropdown/avalon.dropdown',[],function(){});
//avalon 1.3.6 2014.11.06
/**
 *
 * @cnName 下拉框
 * @enName dropdown
 * @introduce
 *
 <p>因为原生<code>select</code>实在是难用，avalon的dropdown组件在兼容原生<code>select</code>的基础上，对其进行了增强。</p>
 <ul>
 <li>1，支持在标题和下拉菜单项中使用html结构，可以用来信息的自定义显示</li>
 <li>2，同时支持通过html以及配置项两种方式设置组件</li>
 <li>3，通过配置，可以让下拉框自动识别在屏幕中的位置，来调整向上或者向下显示</li>
 </ul>
 */
define('dropdown/avalon.dropdown.js',["avalon",
    "text!./avalon.dropdown.html",
    "../avalon.getModel",
    "../scrollbar/avalon.scrollbar",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.dropdown.css"
], function(avalon, template) {
    var styleReg = /^(\d+).*$/;
    var ie6=!-[1,]&&!window.XMLHttpRequest;
    var widget = avalon.ui.dropdown = function(element, data, vmodels) {
        var $element = avalon(element),
            elemParent = element.parentNode,
            options = data.dropdownOptions,
            hasBuiltinTemplate = true, //标志是否通过model值构建下拉列表
            dataSource,
            dataModel,
            templates, titleTemplate, listTemplate,
            blurHandler,
            scrollHandler,
            resizeHandler,
            keepState = false

        //将元素的属性值copy到options中
        "multiple,size".replace(avalon.rword, function(name) {
            if (hasAttribute(element, name)) {
                options[name] = element[name]
            }
        })
        //将元素的属性值copy到options中
        options.enable = !element.disabled

        //读取template
        templates = options.template = options.getTemplate(template, options)
            .replace(/MS_OPTION_ID/g, data.dropdownId).split("MS_OPTION_TEMPLATE")
        titleTemplate = templates[0]
        listTemplate = templates[1]
        dataSource = options.data.$model || options.data

        //由于element本身存在ms-if或者内部包含ms-repeat等绑定，在抽取数据之前，先对element进行扫描
        element.removeAttribute("ms-duplex");
        avalon.scan(element, vmodels);

        //数据抽取
        dataModel = getDataFromHTML(element)
        hasBuiltinTemplate = !!dataModel.length

        if (dataModel.length === 0) {
            dataModel = getDataFromOption(dataSource);
        }

        options.data = dataModel
        avalon(element).css('display', 'none');

        //转换option
        _buildOptions(options);
        for (var i = 0, n = dataModel.length; i < n; i++) {
            if (dataModel[i].value == options.value) {
                options.activeIndex = i
                options.currentOption = dataModel[i];
                break;
            }
        }
        var titleNode, listNode;
        var vmodel = avalon.define(data.dropdownId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["widgetElement", "duplexName", "menuNode", "dropdownNode", "scrollWidget", "rootElement"];
            if(vm.multiple && vm.$hasDuplex && vm.$skipArray.indexOf("value") === -1) {
                vm.$skipArray.push("value")
            }
            vm.render = function(data) {
                if (data === void 0) {
                    return
                }
                vmodel.data = getDataFromOption(data.$model || data)
                if (vmodel.toggle) {
                    vmodel._styleFix(true)
                }
            }
            vm.widgetElement = element;
            vm.rootElement = {}
            vm.menuWidth = "auto";   //下拉列表框宽度
            vm.menuHeight = vm.height;  //下拉列表框高度
            vm.dataSource = dataSource;    //源节点的数据源，通过dataSource传递的值将完全模拟select
            vm.focusClass =  false
            vm.$init = function(continueScan) {
                //根据multiple的类型初始化组件
                if (vmodel.multiple) {
                    //创建菜单
                    listNode = createListNode();
                    var list = listNode.firstChild;
                    elemParent.insertBefore(listNode, element);
                    list.appendChild(element);
                } else {//如果是单选
                    var title;
                    titleNode = avalon.parseHTML(titleTemplate);
                    title = titleNode.firstChild;
                    elemParent.insertBefore(titleNode, element);
                    title.appendChild(element);
                    titleNode = title;

                    //设置title宽度
                    vmodel.titleWidth = computeTitleWidth();
                    //设置label值
                    setLabelTitle(vmodel.value);

                    //注册blur事件
                    blurHandler = avalon.bind(document.body, "click", function(e) {
                        //判断是否点击发生在dropdown节点内部
                        //如果不在节点内部即发生了blur事件
                        if(titleNode.contains(e.target)) {
                            vmodel._toggle()
                            return
                        } else if(listNode && listNode.contains(e.target)) {
                            return
                        }
                        if (!vmodel.__cursorInList__ && !vmodel.multiple && vmodel.toggle) {
                            vmodel.toggle = false;
                        }
                    })

                    if(vmodel.position) {
                        //监听window的滚动及resize事件，重新定位下拉框的位置
                        scrollHandler = avalon.bind(window, "scroll", _positionListNode)
                        resizeHandler = avalon.bind(window, "resize", _positionListNode)
                    }

                }

                //如果原来的select没有子节点，那么为它添加option与optgroup
                if (!hasBuiltinTemplate) {
                    element.appendChild(getFragmentFromData(dataModel));
                    avalon.each(["multiple", "size"], function(i, attr) {
                        avalon(element).attr(attr, vmodel[attr]);
                    });
                }

                if (!vmodel.multiple) {
                    var duplexName = (element.msData["ms-duplex"] || "").trim(),
                        duplexModel;

                    if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                        duplexModel[1].$watch(duplexModel[0], function(newValue) {
                            vmodel.value = newValue;
                        })
                    }

                    vmodel.$watch("value", function(n, o) {
                        var onChange = avalon.type(vmodel.onChange) === "function" && vmodel.onChange || false
                        if (keepState) {
                            keepState = false
                            return 
                        }
                        function valueStateKeep(stateKeep) {
                            if (stateKeep) {
                                keepState = true
                                vmodel.value = o
                            } else {
                                if (duplexModel) {
                                    duplexModel[1][duplexModel[0]] = n
                                    element.value = n
                                }
                                vmodel.currentOption = setLabelTitle(n);
                            }
                        }
                        if ((onChange && onChange.call(element, n, o, vmodel, valueStateKeep) !== false) || !onChange) {
                            if (duplexModel) {
                                duplexModel[1][duplexModel[0]] = n
                                element.value = n
                            }
                            vmodel.currentOption = setLabelTitle(n);
                        }
                    });
                } else {
                    vmodel.value.$watch("length", function() {
                        vmodel.multipleChange = !vmodel.multipleChange;
                        optionsSync();
                    })
                }

                //同步disabled或者enabled
                var disabledAttr = element.msData["ms-disabled"],
                    disabledModel,
                    enabledAttr = element.msData["ms-enabled"],
                    enabledModel;

                if(disabledAttr && (disabledModel = avalon.getModel(disabledAttr, vmodels))) {
                    disabledModel[1].$watch(disabledModel[0], function(n) {
                        vmodel.enable = !n;
                    });
                    vmodel.enable = !disabledModel[1][disabledModel[0]];
                }

                if(enabledAttr && (enabledModel = avalon.getModel(enabledAttr, vmodels))) {
                    enabledModel[1].$watch(enabledModel[0], function(n) {
                        vmodel.enable = n;
                    })
                    vmodel.enable = enabledModel[1][enabledModel[0]];
                }
                vmodel.enable = !element.disabled;

                //同步readOnly
                var readOnlyAttr = vmodel.readonlyAttr,
                    readOnlyModel;

                if(readOnlyAttr && (readOnlyModel = avalon.getModel(readOnlyAttr, vmodels))) {
                    readOnlyModel[1].$watch(readOnlyModel[0], function(n) {
                        vmodel.readOnly = n;
                    });
                    vmodel.readOnly = readOnlyModel[1][readOnlyModel[0]];
                }

                //获取$source信息
                if(vmodel.$source) {
                    if(avalon.type(vmodel.$source) === "string") {
                        var sourceModel = avalon.getModel(vmodel.$source, vmodels);

                        sourceModel && ( vmodel.$source = sourceModel[1][sourceModel[0]] );

                    } else if(!vmodel.$source.$id) {
                        vmodel.$source = null
                    } else if(vmodel.$source.length > 0) {
                        vmodel._refresh(vmodel.$source.length);
                    }

                    //对data的改变做监听，由于无法检测到对每一项的改变，检测数据项长度的改变
                    vmodel.$source && vmodel.$source.$watch && vmodel.$source.$watch('length', function(n) {
                        vmodel._refresh(n)
                    });
                }
                avalon.scan(element.parentNode, [vmodel].concat(vmodels));
                if(continueScan){
                    continueScan()
                } else{
                    avalon.log("请尽快升到avalon1.3.7+")
                    if (typeof options.onInit === "function") {
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
                vmodel.multiple && optionsSync()
            }

            vm.repeatRendered = function() {
                if(vmodel.multiple) {
                    avalon.vmodels["scrollbar-" + vmodel.$id].update()
                }
            }

            /**
             * @interface 当组件移出DOM树时,系统自动调用的销毁函数
             */
            vm.$remove = function() {
                if (blurHandler) {
                    avalon.unbind(window, "click", blurHandler)
                }
                if(scrollHandler) {
                    avalon.unbind(window, "scroll", scrollHandler)
                }
                if(resizeHandler) {
                    avalon.unbind(window, "resize", resizeHandler)
                }
                vmodel.toggle = false;
                listNode && vmodel.container && vmodel.container.contains(listNode) && vmodel.container.removeChild(listNode);
                avalon.log("dropdown $remove")
            }


            vm._select = function(index, event) {
                var option = vmodel.data[index].$model;
                if (option && option.enable && !option.group) {
                    var oldValue = vmodel.value;
                    //根据multiple区分对待, 多选时可以为空值
                    if (vmodel.multiple) {
                        index = vmodel.value.indexOf(option.value)
                        if (index > -1) {
                            vmodel.value.splice(index, 1)
                        } else {
                            vmodel.value.push(option.value)
                        }

                    } else {
                        vmodel.value = option.value;
                    }
                    // vmodel.currentOption = option;
                    vmodel.toggle = false;
                    if(avalon.type(vmodel.onSelect) === "function") {
                        vmodel.onSelect.call(element, event, vmodel.value, oldValue, vmodel);
                    }
                    vmodel.activeIndex = index
                }
            };
            /**
             *
             * @param len 新数据长度
             * @private
             */
            vm._refresh = function(len) {
                vmodel.data.clear();
                vmodel.label = '';
                vmodel.__cursorInList__ = false
                if (len > 0) {
                    //当data改变时，解锁滚动条
                    vmodel._disabledScrollbar(false);
                    vmodel.data.pushArray(getDataFromOption(vmodel.$source.$model || vmodel.$source));
                    var option
                    //当data改变时，尝试使用之前的value对label和title进行赋值，如果失败，使用data第一项
                    if (!(option = setLabelTitle(vmodel.value))) {
                        vmodel.currentOption = vmodel.data[0].$model;
                        vmodel.activeIndex = 0;
                        setLabelTitle(vmodel.value = vmodel.data[0].value);
                    } else {
                        vmodel.activeIndex = vmodel.data.$model.indexOf(option)
                    }
                    if (vmodel.menuNode) {
                        vmodel._styleFix(true)
                    }
                }
            };


            vm._titleenter = function() {
                if (vmodel.hoverAutoShow) {
                    vmodel._toggle()
                    // vmodel.toggle = true
                }
            };
            vm._titleleave = function() {
                if (vmodel.hoverAutoShow) {
                    vmodel.toggle = false
                }
            };
            
            vm._keydown = function(event) {
                if(vmodel.keyboardEvent === false) {
                    return;
                }

                //如果是单选下拉框，可以通过键盘移动
                if (!vmodel.multiple) {
                    var index = vmodel.activeIndex || 0,
                        oldValue = vmodel.value;

                    //区分上下箭头和回车
                    switch (event.keyCode) {
                        case 9:
                        // tab
                        case 27:
                            // escape
                            event.preventDefault()
                            break;
                        case 13:
                            vmodel._select(index, event)
                            break;
                        case 38:
                        case 63233: //safari 向上
                            event.preventDefault();
                            index = getEnableOption(vmodel.data, index)
                            if(index === null) {
                                return
                            }
                            vmodel.value = vmodel.data[index].value
                            vmodel.activeIndex = index
                            vmodel.scrollTo(index)
                            if(avalon.type(vmodel.onSelect) === "function") {
                                vmodel.onSelect.call(element, event, vmodel.value, oldValue, vmodel);
                            }
                            break;
                        case 40:
                        case 63235: //safari 向下
                            event.preventDefault();
                            index = getEnableOption(vmodel.data, index, true)
                            if(index === null) {
                                return
                            }
                            vmodel.value = vmodel.data[index].value
                            vmodel.activeIndex = index
                            vmodel.scrollTo(index)
                            if(avalon.type(vmodel.onSelect) === "function") {
                                vmodel.onSelect.call(element, event, vmodel.value, oldValue, vmodel);
                            }
                            break
                    }
                }
            }
            //下拉列表的显示依赖toggle值，该函数用来处理下拉列表的初始化，定位
            vm._toggle = function(b) {
                if ((vmodel.data.length ===0 && !vmodel.realTimeData)|| !vmodel.enable || vmodel.readOnly) {
                    vmodel.toggle = false;
                    return;
                }

                //为了防止显示时调整高度造成的抖动，将节点初始化放在改变toggle值之前
                if (!listNode) {//只有单选下拉框才存在显示隐藏的情况
                    var list;
                    listNode = createListNode();
                    list = listNode.firstChild;
                    vmodel.container.appendChild(listNode)
                    listNode = list
                    vm.rootElement = list
                    avalon.scan(list, [vmodel].concat(vmodels))
                    vmodel.menuNode = document.getElementById("menu-" + vmodel.$id)     //下拉列表框内层容器 （包裹滚动条部分的容器）
                    vmodel.dropdownNode = document.getElementById("list-" + vmodel.$id) //下拉列表框内容（有滚动条的部分）
                }

                //如果参数b不为布尔值，对toggle值进行取反
                if (typeof b !== "boolean") {
                    vmodel.toggle = !vmodel.toggle;
                    return;
                }

                if (!b) {
                    avalon.type(vmodel.onHide) === "function" && vmodel.onHide.call(element, listNode, vmodel);
                } else {
                    var firstItemIndex, selectedItemIndex, value = vmodel.value;
                    if (avalon.type(value) !== "array") {
                        value = [value];
                    }

                    //计算activeIndex的值
                    if (vmodel.activeIndex == null) {
                        avalon.each(vmodel.data, function(i, item) {
                            if (firstItemIndex === void 0 && item.enable) {
                                firstItemIndex = i;
                            }
                            if (item.value === value[0]) {
                                selectedItemIndex = i;
                                return false;
                            }
                            return true;
                        });

                        if (!selectedItemIndex) {
                            selectedItemIndex = firstItemIndex;
                        }
                        vmodel.activeIndex = selectedItemIndex || 0;
                    }
                    vmodel.scrollWidget = avalon.vmodels["scrollbar-" + vmodel.$id];
                    vmodel._styleFix();
                    vmodel._position();
                    if(avalon.type(vmodel.onShow) === "function") {
                        vmodel.onShow.call(element, listNode, vmodel);
                    }
                }
            };

            vm.$watch("toggle", function(b) {
                vmodel.focusClass = b
                vmodel._toggle(b);
            });

            vm.toggle = false;

            vm._position = function() {
                var $titleNode = avalon(titleNode);
                //计算浮层当前位置，对其进行定位，默认定位正下方
                //获取title元素的尺寸及位置
                var offset = $titleNode.offset(),
                    outerHeight = $titleNode.outerHeight(true),
                    $listNode = avalon(listNode),
                    $sourceNode = avalon(titleNode.firstChild),
                    listHeight = $listNode.height(),
                    $window = avalon(window),
                    css = {},
                    offsetParent = listNode.offsetParent,
                    $offsetParent = avalon(offsetParent);

                while ($sourceNode.element && $sourceNode.element.nodeType != 1) {
                    $sourceNode = avalon($sourceNode.element.nextSibling);
                }

                //计算浮层的位置
                if (options.position && offset.top + outerHeight + listHeight > $window.scrollTop() + $window.height() && offset.top - listHeight > $window.scrollTop()) {
                    css.top = offset.top - listHeight;
                } else {
                    css.top = offset.top + outerHeight - $sourceNode.css("borderBottomWidth").replace(styleReg, "$1");
                }

                if(offsetParent && (offsetParent.tagName !== "BODY" && offsetParent.tagName !== "HTML")) {
                    //修正由于边框带来的重叠样式
                    css.top = css.top  - $offsetParent.offset().top + listNode.offsetParent.scrollTop;
                    css.left = offset.left - $offsetParent.offset().left + listNode.offsetParent.scrollLeft;
                } else {
                    //修正由于边框带来的重叠样式
                    css.left = offset.left;
                }

                //显示浮层
                $listNode.css(css);
            }
            //是否当前鼠标在list区域
            vm.__cursorInList__ = false

            //单选下拉框在失去焦点时会收起
            vm._listenter = function() {
                vmodel.__cursorInList__ = true
                if (vmodel.hoverAutoShow) {
                    vmodel.toggle = true
                }
            }

            vm._listleave = function() {
                vmodel.__cursorInList__ = false
                if (vmodel.hoverAutoShow) {
                    vmodel.toggle = false
                }
            };
            vm._blur = function() {
                if (!vmodel.__cursorInList__ && !vmodel.multiple && vmodel.toggle) {
                    vmodel.toggle = false;
                }
            }

            /**
             * @interface
             * @param newValue 设置控件的值，需要注意的是dropdown设置了multiple属性之后，值是数组，未设置multiple属性的时候，可以接受字符串，数字，布尔值；未设置该值时，效果是返回当前控件的值
             * @returns vmodel.value 控件当前的值
             */
            vm.val = function(newValue) {
                if (typeof newValue !== "undefined") {
                    if (avalon.type(newValue) !== "array") {
                        newValue = [newValue];
                    }
                    vmodel.value = newValue;
                }
                return vmodel.value;
            }

            vm.isActive = function(el) {
                var value = el.value, enable = el.enable, group = el.group;
                if (vmodel.multiple) {
                    return vmodel.value.indexOf(value) > -1 && enable && !group;
                } else {
                    return vmodel.value === value && enable && !group;
                }
            }

            //当下拉列表中的项目发生改变时，调用该函数修正显示，顺序是修正下拉框高宽 --> 滚动条更新显示 --> 定位下拉框
            vm._styleFix = function(resetHeight) {
                var MAX_HEIGHT = options.height || 200,
                    $menu = avalon(vmodel.menuNode),
                    height = '' 

                if (resetHeight) {
                    vmodel.menuHeight = ''
                    avalon(vmodel.dropdownNode).css({ 'height': '' });
                }
                
                height = vmodel.dropdownNode.scrollHeight
                vmodel.menuWidth = !ie6 ? vmodel.listWidth - $menu.css("borderLeftWidth").replace(styleReg, "$1") - $menu.css("borderRightWidth").replace(styleReg, "$1") : vmodel.listWidth;
                if (height > MAX_HEIGHT) {
                    vmodel._disabledScrollbar(false);
                    height = MAX_HEIGHT;
                    avalon(vmodel.dropdownNode).css({
                        "width": vmodel.menuWidth - vmodel.scrollWidget.getBars()[0].width()
                    });
                } else {
                    vmodel._disabledScrollbar(true);
                    avalon(vmodel.dropdownNode).css({
                        "width": vmodel.menuWidth
                    })
                }
                vmodel.menuHeight = height;
                vmodel.updateScrollbar();
                vmodel.scrollTo(vmodel.activeIndex);
            };

            //利用scrollbar的样式改变修正父节点的样式
            vm.updateScrollbar = function() {
                vmodel.scrollWidget.update();
            }

            //通过当前的activeIndex，更新scrollbar的滚动位置
            vm.scrollTo = function(activeIndex) {

                if(!vmodel.dropdownNode) return;
                //计算是否需要滚动
                var nodes = siblings(vmodel.dropdownNode.firstChild),
                    $activeNode = avalon(nodes[activeIndex]),
                    menuHeight = vmodel.menuHeight,
                    nodeTop = nodes.length ? $activeNode.position().top - avalon(nodes[0]).position().top : 0,
                    nodeHeight = nodes.length ? $activeNode.height() : 0,
                    scrollTop = vmodel.dropdownNode.scrollTop

                if(nodeTop > scrollTop + menuHeight - nodeHeight || nodeTop + nodeHeight < scrollTop) {
                    vmodel.scrollWidget.scrollTo(0, nodeTop + nodeHeight - menuHeight)
                }
            }

            //禁用滚动条，当下拉列表的高度小于最大高度时，只显示当前高度，需要对滚动条做禁用
            vm._disabledScrollbar = function(b) {
                vmodel.scrollWidget && (vmodel.scrollWidget.disabled = !!b)
            }

        });

        vmodel.$watch("enable", function(n) {
            if(!n) {
                vmodel.toggle = false;
            }
        });

        vmodel.$watch("readOnly", function(n) {
            if(!!n) {
                vmodel.toggle = false;
            }
        });

        //在multiple模式下同步select的值
        //http://stackoverflow.com/questions/16582901/javascript-jquery-set-values-selection-in-a-multiple-select
        function optionsSync() {
            avalon.each(element.getElementsByTagName("option"), function(i, option) {
                if(vmodel.value.$model.indexOf(option.value) > -1 || vmodel.value.$model.indexOf( parseData(option.value) ) > -1) {
                    try {
                        option.selected = true
                    } catch(e) {
                        avalon(option).attr("selected", "selected");
                    }
                } else {
                    try {
                        option.selected = false
                    } catch(e) {
                        option.removeAttribute("selected")
                    }
                }
            })
        }

        function _buildOptions(opt) {
            //为options添加value与duplexName
            //如果原来的select元素绑定了ms-duplex，那么取得其值作value
            //如果没有，则先从上层VM的配置对象中取，再没有则从内置模板里抽取
            var duplexName = (element.msData["ms-duplex"] || "").trim()
            var duplexModel
            if (duplexName && (duplexModel = avalon.getModel(duplexName, vmodels))) {
                opt.value = duplexModel[1][duplexModel[0]]
                opt.$hasDuplex = true
            } else if (!hasBuiltinTemplate) {
                if (!Array.isArray(opt.value)) {
                    opt.value = [opt.value || ""]
                }
            } else {
                var values = []
                Array.prototype.forEach.call(element.options, function(option) {
                    if (option.selected) {
                        values.push(parseData(option.value))
                    }
                })
                opt.value = values
            }
            if (!opt.multiple) {
                if(Array.isArray(opt.value)) {
                    opt.value = opt.value[0] !== void 0 ? opt.value[0] : ""
                }
                //尝试在当前的data中查找value对应的选项，如果没有，将value设置为data中的option第一项的value
                var option = opt.data.filter(function(item) {
                    return item.value === opt.value  && !item.group
                }),
                    options = opt.data.filter(function(item) {
                        return !item.group
                    })

                if(option.length === 0 && options.length > 0) {
                    opt.value = options[0].value

                    //如果存在duplex，同步该值
                    if(duplexModel) {
                        duplexModel[1][duplexModel[0]] = opt.value
                    }
                }
            }

            //处理data-duplex-changed参数
            var changedCallbackName = $element.attr("data-duplex-changed"),
                changedCallbackModel;    //回调函数
            if (changedCallbackName && (changedCallbackModel = avalon.getModel(changedCallbackName, vmodels))) {
                opt.changedCallback = changedCallbackModel[1][changedCallbackModel[0]]
            }
            opt.duplexName = duplexName

            //处理container
            var docBody = document.body, container = opt.container;

            // container必须是dom tree中某个元素节点对象或者元素的id，默认将dialog添加到body元素
            opt.container = (avalon.type(container) === "object" && container.nodeType === 1 && docBody.contains(container) ? container : document.getElementById(container)) || docBody;
        }

        /**
         * 生成下拉框节点
         * @returns {*}
         */
        function createListNode() {
            return avalon.parseHTML(listTemplate);
        }

        //设置label以及title
        function setLabelTitle(value) {
            var option = vmodel.data.$model.filter(function(item) {
                return item.value === value;
            });

            option = option.length > 0 ? option[0] : null

            if(!option && vmodel.data.length) {
                avalon.log("[log] avalon.dropdown 设置label出错");
            } else if (option) {
                vmodel.label = option.label;
                vmodel.title = option.title || option.label || "";
            }

            return option;
        }

        //计算title的宽度
        function computeTitleWidth() {
            var title = document.getElementById("title-" + vmodel.$id),
                $title = avalon(title);
            return vmodel.width - $title.css("paddingLeft").replace(styleReg, "$1") - $title.css("paddingRight").replace(styleReg, "$1");
        }

        //定位listNode
        function _positionListNode() {
            if(!vmodel.multiple && listNode) {
                vmodel._position();
            }
        }

        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        realTimeData: false,
        container: null, //@config 放置列表的容器
        width: 200, //@config 自定义宽度
        listWidth: 200, //@config 自定义下拉列表的宽度
        titleWidth: 0,  //@config title部分宽度
        height: 200, //@config 下拉列表的高度
        enable: true, //@config 组件是否可用
        readOnly: false, //@config 组件是否只读
        hoverAutoShow: false, //@config 是否开启鼠标移入打开下拉列表鼠标移出关闭下拉列表功能
        readonlyAttr: null, //@config readonly依赖的属性
        currentOption: null,  //@config 组件当前的选项
        data: [], //@config 下拉列表显示的数据模型
        $source: null, //@config 下拉列表的数据源
        textFiled: "text", //@config 模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: "value", //@config 模型数据项中对应value的字段
        value: [], //@config 设置组件的初始值
        label: "", //@config 设置组件的提示文案，可以是一个字符串，也可以是一个对象
        multiple: false, //@config 是否为多选模式
        listClass: "",   //@config 列表添加自定义className来控制样式
        title: "",
        titleClass: "",   //@config title添加自定义className来控制样式
        activeIndex: null,
        size: 1,
        menuNode: null,
        dropdownNode: null,
        scrollWidget: null,
        position: true, //@config 是否自动定位下拉列表
        onSelect: null,  //@config 点击选项时的回调
        onShow: null,    //@config 下拉框展示的回调函数
        onHide: null,    //@config 下拉框隐藏的回调函数
        onChange: null,  //@config value改变时的回调函数
        $hasDuplex: false, 
        multipleChange: false,
        keyboardEvent: true,  //@config 是否支持键盘事件
        /**
         * @config 模板函数,方便用户自定义模板
         * @param str {String} 默认模板
         * @param opts {Object} VM
         * @returns {String} 新模板
         */
        getTemplate: function(str, options) {
            return str
        },
        onInit: avalon.noop     //@config 初始化时执行方法
    };

    //用于将字符串中的值转换成具体值
    function parseData(data) {
        try {
            data = data === "true" ? true :
                data === "false" ? false :
                    data === "null" ? null :
                        +data + "" === data ? +data : data;
        } catch (e) {
        }
        return data
    }

    //根据dataSource构建数据结构
    //从VM的配置对象提取数据源, dataSource为配置项的data数组，但它不能直接使用，需要转换一下
    //它的每一个对象代表option或optGroup，
    //如果是option则包含label, enable, value
    //如果是optGroup则包含label, enable, options(options则包含上面的option)
    //每个对象中的enable如果不是布尔，则默认为true; group与parent则框架自动添加
    function getDataFromOption(data, arr, parent) {
        var ret = arr || []
        parent = parent || null
        for (var i = 0, el; el = data[i++]; ) {
            if (Array.isArray(el.options)) {
                ret.push({
                    label: el.label,
                    value: el.value,
                    enable: ensureBool(el.enable, true),
                    group: true,
                    parent: parent,
                    toggle: true
                })
                getDataFromOption(el.options, ret, el)
            } else {
                if(typeof el === "string") {
                    el = {
                        label: el,
                        value: el,
                        title: el
                    }
                }
                ret.push({
                    label: el.label,
                    value: el.value,
                    title: el.title,
                    enable: ensureBool(parent && parent.enable, true) && ensureBool(el.enable, true),
                    group: false,
                    parent: parent,
                    data: el,           //只有在dataModel的模式下有效
                    toggle: true
                })
            }
        }

        return ret
    }
    function getFragmentFromData(data) {
        var ret = document.createDocumentFragment(), parent, node
        for (var i = 0, el; el = data[i++]; ) {
            if (el.group) {
                node = document.createElement("optgroup")
                node.label = el.label
                node.disabled = !el.enable
                ret.appendChild(node)
                parent = node
            } else {
                node = document.createElement("option")
                node.text = el.label
                node.value = el.value
                node.disabled = !el.enable
                if (el.parent && parent) {
                    parent.appendChild(node)
                } else {
                    ret.appendChild(node)
                }
            }
        }
        return ret
    }

    function ensureBool(value, defaultValue) {
        return typeof value === "boolean" ? value : defaultValue
    }

    //从页面的模板提取数据源, option元素的value会进一步被处理
    //label： option或optgroup元素显示的文本
    //value: 其value值，没有取innerHTML
    //enable: 是否可用
    //group: 对应的元素是否为optgroup
    //parent: 是否位于分组内，是则为对应的对象
    function getDataFromHTML(select, arr, parent) {
        var ret = arr || []
        var elems = select.children
        parent = parent || null
        for (var i = 0, el; el = elems[i++]; ) {
            if (el.nodeType === 1) {//过滤注释节点
                if (el.tagName === "OPTGROUP") {
                    parent = {
                        label: el.label,
                        value: "",
                        enable: !el.disabled,
                        group: true,        //group不能添加ui-state-active
                        parent: false,
                        toggle: true
                    }
                    ret.push(parent)
                    getDataFromHTML(el, ret, parent)
                } else if (el.tagName === "OPTION") {
                    ret.push({
                        label: el.label.trim()||el.text.trim()||el.value.trim(), //IE9-10有BUG，没有进行trim操作
                        title: el.title.trim(),
                        value: parseData(el.value.trim()||el.text.trim()),
                        enable: ensureBool(parent && parent.enable, true) && !el.disabled,
                        group: false,
                        parent: parent,
                        toggle: true
                    })
                }
            }
        }
        return ret
    }

    /**
     * 在用户使用键盘上下箭头选择选项时，需要跳过被禁用的项，即向上或者向下找到非禁用项
     * @param data 用来选择的数据项
     * @param index 当前index
     * @param direction {Boolean} 方向，true为下，false为上，默认为上
     * @return ret 使用的项在数组中的下标
     */
    function getEnableOption(data, index, direction) {
        var size = data.size(),
            left = [],
            right = [],
            dataItem = {},
            i,
            ret

        //将data用index分成两段
        //当向上选择时，选择从左段的队尾到右段的队头
        //当向下选择时，选择从右端的对头到左段的队尾
        for(i = 0; i < index; i ++) {
            dataItem = data[i]
            if(dataItem.enable && !dataItem.group && dataItem.toggle) {
                left.push(i)
            }
        }
        for(i = index + 1; i < size; i ++) {
            dataItem = data[i]
            if(dataItem.enable && !dataItem.group && dataItem.toggle) {
                right.push(i)
            }
        }
        if(left.length === 0 && right.length === 0) {
            ret = null
        }else if(direction) {
            ret = right.length > 0? right.shift(): left.shift()
        } else {
            ret = left.length > 0? left.pop(): right.pop()
        }

        return ret
    }

    var hasAttribute = document.documentElement.hasAttribute ? function(el, attr) {
        return el.hasAttribute(attr)
    } : function(el, attr) {//IE67
        var outer = el.outerHTML, part = outer.slice(0, outer.search(/\/?['"]?>(?![^<]*<['"])/));
        return new RegExp("\\s" + attr + "\\b", "i").test(part);
    }
    return avalon;

    /**
     * 获取元素节点的所有兄弟节点
     * @param n
     * @returns {Array}
     */
    function siblings( n) {
        var r = [];

        for ( ; n; n = n.nextSibling ) {
            if ( n.nodeType === 1) {
                r.push( n );
            }
        }

        return r;
    }

});

/**
 @links
 
[使用html配置multiple组件](avalon.dropdown.ex16.html)
 [使用html配置multiple组件](avalon.dropdown.ex1.html)
 [使用html配置multiple并使用双工绑定](avalon.dropdown.ex2.html)
 [使用option配置multiple并使用双工绑定](avalon.dropdown.ex3.html)
 [使用html配置dropdown组件](avalon.dropdown.ex4.html)
 [使用html配置dropdown并使用双工绑定](avalon.dropdown.ex5.html)
 [使用option配置dropdown并使用双工绑定](avalon.dropdown.ex6.html)
 [dropdown disabled](avalon.dropdown.ex7.html)
 [dropdown readOnly](avalon.dropdown.ex8.html)
 [options可以使用repeat生成](avalon.dropdown.ex9.html)
 [更改模板，使用button作为触发器](avalon.dropdown.ex10.html)
 [异步渲染组件的选项](avalon.dropdown.ex11.html)
 [联动的dropdown](avalon.dropdown.ex12.html)
 [dropdown状态保持功能](avalon.dropdown.ex13.html)
 [多个dropdown共享状态](avalon.dropdown.ex14.html)
 [鼠标移入移出下拉菜单自动显示隐藏](avalon.dropdown.ex15.html)
 */
;

define('text!slider/avalon.slider.html',[],function () { return '<div class="oni-slider oni-widget oni-corner-all"\r\n     ms-class-1 = "oni-slider-horizontal: orientation===\'horizontal\'"\r\n     ms-class-2 = "oni-slider-vertical: orientation !== \'horizontal\'"\r\n     ms-class-oni-state-disabled="disabled"> \r\n    <div class="oni-slider-range oni-widget-header oni-corner-all" \r\n         ms-class-1 = "oni-slider-range-min:range===\'min\'"\r\n         ms-class-2 = "oni-slider-range-max:range===\'max\'"\r\n         ms-css-MS_OPTION_WIDTHORHEIGHT = "{{range === \'max\' ? 100-percent : percent}}%"\r\n         ms-css-MS_OPTION_LEFTORBOTTOM = "{{ $twohandlebars ? percent0 : \'auto\'}}%"\r\n         ms-if = "range"\r\n         style="width: 100%;">\r\n    </div>\r\n    <b  class="oni-slider-handle  oni-corner-all hander___flag"\r\n        ms-css-MS_OPTION_LEFTORBOTTOM = "{{percent}}%"\r\n        ms-data-axis = "$axis"\r\n        ms-draggable\r\n        data-draggable-start="dragstart" \r\n        data-draggable-stop="dragend" \r\n        data-draggable-drag="drag" \r\n        data-draggable-containment="parent" \r\n        ms-hover="oni-state-hover"\r\n        ms-if = "!$twohandlebars"\r\n        ></b>\r\n    <b  class="oni-slider-handle  oni-corner-all"\r\n        ms-css-MS_OPTION_LEFTORBOTTOM = "{{percent0}}%"\r\n        ms-data-axis = "$axis"\r\n        ms-draggable\r\n        data-draggable-start="dragstart" \r\n        data-draggable-stop="dragend" \r\n        data-draggable-drag="drag" \r\n        data-draggable-containment="parent" \r\n        ms-hover="oni-state-hover"\r\n        ms-if = "$twohandlebars"\r\n        ></b>\r\n    <b  class="oni-slider-handle  oni-corner-all"\r\n        ms-css-MS_OPTION_LEFTORBOTTOM = "{{percent1}}%"\r\n        ms-data-axis = "$axis"\r\n        ms-draggable\r\n        data-draggable-start="dragstart" \r\n        data-draggable-stop="dragend" \r\n        data-draggable-drag="drag" \r\n        data-draggable-containment="parent" \r\n        ms-hover="oni-state-hover"\r\n     \r\n        ms-if = "$twohandlebars"\r\n        ></b>\r\n</div>';});


define('css!slider/avalon.slider',[],function(){});
// avalon 1.3.6
/**
 * 
 * @cnName 滑块
 * @enName slider
 * @introduce
 *    <p>slider组件用来拖动手柄选择数值，可以水平拖动、垂直拖动、设置range使得两边都可以拖动，或者根据设置的步长更新滑块数值</p>
 */
define('slider/avalon.slider.js',["../draggable/avalon.draggable", 
        "text!./avalon.slider.html", 
        "css!../chameleon/oniui-common.css", 
        "css!./avalon.slider.css", 
        "../avalon.getModel"], function(avalon, sourceHTML) {
    /**
     * @global Handlers ： 保存页面上所有滑动手柄
     * @global Index :点中手柄在Handlers中的索引，或滑动手柄在handlers中的索引 
     * @gloabal focusElement: 页面上点中的手柄元素的引用，当按下方向键时，滑动作用域此元素
     **/
    var Handlers = [], Index = 0, FocusElement, template = sourceHTML;
    var widget = avalon.ui["slider"] = function(element, data, vmodels) {

        var $element = avalon(element)
        var options = data.sliderOptions

        var isHorizontal = options.orientation === "horizontal"
        //将整个slider划分为N等分, 比如100, 227
        var valueMin = options.min 
        var valueMax = options.max  
        var oRange = options.range //true min max， 默认为false
        var values = options.values
        var twohandlebars = oRange === true
        var value = Number(options.value) //第几等份
        if (isNaN(value)) {
            var valVM = avalon.getModel(options.value, vmodels);
            if (valVM) {
                value = valVM[1][valVM[0]];
            }
        }
        options.template = options.getTemplate(template, options);
        // 固定最小的一边
        if (oRange === "min" && values) {
            value = values[0]
        } else if (oRange === "max" && values) { // 固定最大的一边
            value = values[1]
        }
        // 如果没有配置value和values,且range是min或者max，重置value
        if (!value && oRange === "min" && !values && value !== 0) {
            value =  valueMin || value;
        } else if (!value && oRange === 'max' && !values && value !== 0) {
            value = valueMax || value;
        }
        if (options.step !== 1 && !/\D/.test(options.step)) {
            value = correctValue(value);
        }
        // 如果滑动块有双手柄，重置values
        if (twohandlebars) {
            if (Array.isArray(values)) {
                values = values.length === 1 ? [values[0], values[0]] : values.concat()
            } else {
                values = [valueMin, valueMax]
            }
        }
        // 修正模板
        var sliderHTML = options.template.replace(/MS_OPTION_WIDTHORHEIGHT/g, isHorizontal? "width": "height").replace(/MS_OPTION_LEFTORBOTTOM/g, isHorizontal? "left" : "bottom");
        // handlers保存滑动块上的手柄，域Handlers进行区分
        var slider = avalon.parseHTML(sliderHTML).firstChild, handlers = []
        element.parentNode.insertBefore(slider, element.nextSibling)
        $element.addClass("oni-helper-hidden-accessible")

        function value2Percent(val) { // 将value值转换为百分比
            if (val < valueMin) {
                val = valueMin
            }
            if (val > valueMax) {
                val = valueMax
            }
            return parseFloat(((val-valueMin) / (valueMax-valueMin) * 100).toFixed(5))
        }
        function percent2Value(percent) {//0~1
            var val = (valueMax-valueMin) * percent +valueMin
            val = correctValue(val);
            return parseFloat(val.toFixed(3))
        }
        function correctValue(val) {
            var step = (options.step > 0) ? options.step : 1
            var stepLength
            try {
                stepLength = step.toString().split(".")[1].length
                }
                catch (e) {
                stepLength = 0
                }
            var m = Math.pow(10, stepLength)
            var valModStep = (val-valueMin) * m % step * m
            var n = (val-valueMin) / step 
            val = (valueMin * m + (valModStep * 2 >= step ? step * m * Math.ceil(n) : step * m * Math.floor(n))) / m
            return val
        }
        var vmodel = avalon.define(data.sliderId, function(vm) {
            avalon.mix(vm, options);
            vm.$skipArray = ["template","rootElement", "widgetElement", "step", "_dragEnd"]
            vm.rootElement = slider
            vm.widgetElement = element
            vm.step = (options.step > 0) ? options.step : 1
            vm.disabled = element.disabled
            vm.percent = twohandlebars ? value2Percent(values[1] - values[0] + valueMin) : value2Percent(value)
            vm.percent0 = twohandlebars ? value2Percent(values[0]) : 0
            vm.percent1 = twohandlebars ? value2Percent(values[1]) : 0
            vm.value = twohandlebars ? values.join() : value
            vm.values = values
            vm.$axis = isHorizontal ? "x" : "y"
            vm.$valueMin = valueMin
            vm.$valueMax = valueMax
            vm.$twohandlebars = twohandlebars
            vm.$percent2Value = percent2Value
            vm.$pixelTotal = 0
            vm._dragEnd = false;
            vm.dragstart = function(event, data) {
                vmodel.$pixelTotal = isHorizontal ? slider.offsetWidth : slider.offsetHeight
                Handlers = handlers  // 很关键，保证点击的手柄始终在Handlers中，之后就可以通过键盘方向键进行操作
                data.started = !vmodel.disabled
                data.dragX = data.dragY = false
                Index = handlers.indexOf(data.element)
                data.$element.addClass("oni-state-active")
                options.onDragStart.call(null, event, data);
            }
            vm.dragend = function(event, data, keyVal) {
                data.$element.removeClass("oni-state-active")
                // dragCaculate(event, data, keyVal)
                options.onDragEnd.call(null, event, data);
                vmodel._dragEnd = false; 
            }
            vm.drag = function(event, data, keyVal) {
                dragCaculate(event, data, keyVal)
                options.onDrag.call(null, vmodel, data);
                vmodel._dragEnd = true;
            }
            vm.$init = function() {
                var a = slider.getElementsByTagName("b")
                for (var i = 0, el; el = a[i++]; ) {
                    el.sliderModel = vmodel
                    if (!twohandlebars && avalon(el).hasClass("hander___flag")) {
                        handlers.push(el);
                        avalon(el).removeClass("hander___flag")
                        break;
                    } else if ( twohandlebars && !avalon(el).hasClass("hander___flag")) {
                        handlers.push(el);
                    } 
                }
                avalon(element).css({display: "none", height:0, width: 0, padding: 0})
                avalon(slider).css("width", vmodel.width)
                avalon.scan(slider, [vmodel].concat(vmodels))
                if (typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                slider.innerHTML = slider.textContent = ""
                slider.parentNode.removeChild(slider);
            }
        })
        vmodel.$watch("value", function(val) {
            val = correctValue(Number(val) || 0);
            if (!val || val < Number(vmodel.min)) {
                val = 0;
            } else if (val > Number(vmodel.max)) {
                val = vmodel.max;
            }
            vmodel.value = val;
            vmodel.percent = value2Percent(val)
            if (!vmodel._dragEnd) {
                options.onDragEnd.call(null, data);
            }
        })
        function dragCaculate(event, data, keyVal) {
            if (isFinite(keyVal)) {
                var val = keyVal
            } else {
                var prop = isHorizontal ? "left" : "top"
                var pixelMouse = data[prop] + parseFloat(data.$element.css("border-top-width"))
                //如果是垂直时,往上拖,值就越大
                var percent = (pixelMouse / vmodel.$pixelTotal) //求出当前handler在slider的位置
                if (!isHorizontal) { // 垂直滑块，往上拖动时pixelMouse变小，下面才是真正的percent，所以需要调整percent
                    percent = Math.abs(1 - percent)
                }
                if (percent > 0.999) {
                    percent = 1
                }
                if (percent < 0.001) {
                    percent = 0
                }
                val = percent2Value(percent)
            }
            if (twohandlebars) { //水平时，小的0在左边，大的1在右边，垂直时，小的0在下边，大的1在上边
                if (Index === 0) { 
                    var check = vmodel.values[1]
                    if (val > check) {
                        val = check
                    }
                } else {
                    check = vmodel.values[0]
                    if (val < check) {
                        val = check
                    }
                }
                vmodel.values[Index] = val
                vmodel["percent" + Index] = value2Percent(val)
                vmodel.value = vmodel.values.join()
                vmodel.percent = value2Percent(vmodel.values[1] - vmodel.values[0] + valueMin)
            } else {
                vmodel.value = val
                vmodel.percent = value2Percent(val)
            }
        }
        return vmodel
    }
    widget.defaults = {
        max: 100, //@config 组件的最大值
        min: 0, //@config 组件的最小值
        width: -1,
        orientation: "horizontal", //@config 组件是水平拖动还是垂直拖动，垂直是“vertical”
        /**
         * @config 滑块是否显示滑动范围，配置值可以是true、min、max
            <p>true: 显示滑动范围</p>
            <p>min: 滑块值最小的一端固定</p>
            <p>max: 滑块值最大的一端固定</p>
         */
        range: false,
        step: 1, //@config 滑块滑动的步值
        value: 0, //@config 滑块的当前值，当range为true时，value是滑块范围表示的两个值，以“,”分隔
        values: null, //@config 当range为true时，values数组需要有两个值，表示滑块范围
        disabled: false, //@config 是否禁用滑块, 设为true时滑块禁用
        /**
         * @config {Function} 滑动开始的回调
         * @param event {Object} 事件对象
         * @param data {Object} 滑动的数据信息
         */
        onDragStart: avalon.noop,
        /**
         * @config {Function} 滑动时的回调
         * @param vmodel {Object} 组件对应的Vmodel
         * @param data {Object} 滑动的数据信息
         */
        onDrag: avalon.noop,
        /**
         * @config {Function} 滑动结束时的回调
         * @param data {Object} 滑动的数据信息
         */
        onDragEnd: avalon.noop,
        getTemplate: function(str, options) {
            return str;
        }
    }
    avalon(document).bind("click", function(e) { // 当点击slider之外的区域取消选中状态
        e.stopPropagation();
        var el = e.target
        var Index = Handlers.indexOf(el)
        if (Index !== -1) {
            if (FocusElement) {
                FocusElement.removeClass("oni-state-focus");
            }
            FocusElement = avalon(el).addClass("oni-state-focus")
        } else if (FocusElement) {
            FocusElement.removeClass("oni-state-focus")
            FocusElement = null
        }
   })
    avalon(document).bind("keydown", function(e) { // 当选中某个手柄之后通过键盘上的方向键控制手柄的slider
        // e.preventDefault();
        if (FocusElement) {
            var vmodel = FocusElement[0].sliderModel
            var percent = Handlers.length == 1 ? vmodel.percent : vmodel["percent" + Index]
            var val = vmodel.$percent2Value(percent / 100), keyVal
            switch (e.which) {
                case 34 : // pageDown
                case 39:  // right
                case 38:  // down
                    keyVal = Math.min(val + 1, vmodel.$valueMax)
                    break;
                case 33: // pageUp
                case 37: // left
                case 40: // up
                    keyVal = Math.max(val - 1, vmodel.$valueMin)
                    break
                case 36: // home
                    keyVal = vmodel.$valueMin
                    break
                case 35: // end
                    keyVal = vmodel.$valueMax
                    break
            }
            if (isFinite(keyVal)) {
                vmodel.drag(e, {}, keyVal)
            }
        }
    })
    return avalon
})
/**
 @links
 [slider组件使用概览](avalon.slider.ex.html)
 [基本的slider组件，配置有dragstart、drag、dragend回调](avalon.slider.ex1.html)
 [切换禁用slider组件](avalon.slider.ex2.html)
 [配置slider组件max、min、value值](avalon.slider.ex3.html)
 [配置slider的range为true、min、max实现不同的slider效果](avalon.slider.ex4.html)
 [配置slider的步长step](avalon.slider.ex5.html)
 [配置orientation选项使得slider为垂直拖动块](avalon.slider.ex6.html)
 [利用slider组件滚动图片](avalon.slider.ex7.html)
 */
;

define('css!datepicker/avalon.datepicker',[],function(){});
// avalon 1.3.6
/**
 * 
 * @cnName 日期选择器
 * @enName datepicker
 * @introduce
 *    <p>datepicker组件方便快速创建功能齐备的日历组件，通过不同的配置日历可以满足显示多个月份、通过prev、next切换月份、或者通过下拉选择框切换日历的年份、月份，当然也可以手动输入日期，日历组件也会根据输入域中的日期值高亮显示对应日期等等各种需求</p>
 */
define('datepicker/avalon.datepicker',["../avalon.getModel", 
        "./avalon.datepicker.lang",
        "text!./avalon.datepicker.html", 
        "../dropdown/avalon.dropdown.js",
        "../slider/avalon.slider.js",
        "css!../chameleon/oniui-common.css",
        "css!./avalon.datepicker.css"], function(avalon, holidayDate, sourceHTML) {
    var calendarTemplate = sourceHTML,
        HOLIDAYS,
        ONE_DAY = 24 * 60 * 60 * 1000,
        firstYear = 1901,
        lastYear = 2050;

    var widget = avalon.ui.datepicker = function(element, data, vmodels) {
        var options = data.datepickerOptions,
            msDuplexName = element.msData["ms-duplex"],
            duplexVM = msDuplexName && avalon.getModel(msDuplexName, vmodels), 
            parseDate = options.parseDate,
            formatDate = options.formatDate,
            minDate = options.minDate, 
            maxDate = options.maxDate,
            monthYearChangedBoth = false,
            datepickerData = [],            
            _initValue = "",
            daysWrapper = null,
            years=[],
            minDateVM,
            maxDateVM,
            calendar,
            month, 
            day, 
            year

        calendarTemplate = options.template = options.getTemplate(calendarTemplate, options)
        avalon.scan(element, vmodels)
        options.disabled = element.disabled || options.disabled
        formatDate = formatDate.bind(options) //兼容IE6、7使得formatDate方法中的this指向options
        parseDate = parseDate.bind(options)
        minDate = (minDate !== null) && validateDate(minDate)
        maxDate = (maxDate !== null) && validateDate(maxDate)
        if(options.minDate && !minDate) { // minDate是某个VM的属性名
            minDateVM = avalon.getModel(options.minDate, vmodels)
            minDateVM && (minDate = validateDate(minDateVM[1][minDateVM[0]]))
        }
        minDate = options.minDate = minDate && cleanDate(minDate)
        if(options.maxDate && !maxDate) { // maxDate 是某个VM的属性名，需要进一步解析
            maxDateVM = avalon.getModel(options.maxDate, vmodels)
            maxDateVM && (maxDate = validateDate(maxDateVM[1][maxDateVM[0]]))
        }
        maxDate = options.maxDate = maxDate && cleanDate(maxDate) 
        minDate ? firstYear = minDate.getFullYear() : 0
        maxDate ? lastYear = maxDate.getFullYear() : 0
        if (avalon.type(options.years) === "array") {
            years = options.years    
        } else {
            for (var i = firstYear; i <= lastYear; i++) {
                years.push(i)
            }    
        }
        if (options.mobileMonthAndYear) {
            options.mobileYear = 0
        }
        options.changeMonthAndYear && (options.mobileMonthAndYear = false)
        initValue()

        var vmodel = avalon.define(data.datepickerId, function(vm) {

            //初始化增加语言包设置
            avalon.mix(vm, options, {
                regional: widget.defaultRegional
            })
            vm.$skipArray = ["container", "showDatepickerAlways", "timer", "sliderMinuteOpts",
                "sliderHourOpts", "template", "widgetElement", "rootElement", "dayNames", "allowBlank",
                "months", "years", "numberOfMonths",
                "showOtherMonths", "watermark", "weekNames",
                "stepMonths", "changeMonthAndYear", "startDay", "mobileMonthAndYear",
                "formatErrorTip"    //格式错误提示文案
            ]
            vm._height = 150
            vm.dateError = vm.dateError || ""
            vm.weekNames = []
            vm.tip = vm.tip || ""
            vm.widgetElement = element
            vm.rootElement = {}
            vm.data = []
            vm.prevMonth = -1 //控制prev class是否禁用
            vm.nextMonth = -1 //控制next class是否禁用
            vm.month = month
            vm._month = month + 1
            vm.year = year
            vm.day = day
            vm.years = years
            vm.months = [1,2,3,4,5,6,7,8,9,10,11,12]
            vm._position = "absolute"            
            vm._datepickerToggle = true
            vm._monthToggle = false
            vm._yearToggle = false
            vm._years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
            vm.elementYear = year
            vm.elementMonth = month
            vm._getPositionClass = function(position) {
                var _position = vm._position
                if (_position === 'absolute') {
                    switch(position) {
                        case "rb":
                            return 'oni-datepicker-wrapper-right' 
                        break
                        case "lt":
                            return 'oni-datepicker-wrapper-top' 
                        break
                        case "rt": 
                            return 'oni-datepicker-wrapper-top-right' 
                        break
                        default:
                            return position 
                        break
                    }
                }
            }
            vm._setWeekClass = function(dayName) {
                var dayNames = vmodel.regional.day
                if ((dayNames.indexOf(dayName) % 7 == 0) || (dayNames.indexOf(dayName) % 7 == 6)) {
                    return "oni-datepicker-week-end"
                } else {
                    return ""
                }
            }
            vm._setDayClass = function(index, outerIndex, rowIndex, day) {
                var className = "",
                    dayItem = {}
                if (day === "") {
                    return ""
                }
                dayItem = datepickerData[rowIndex]["rows"][outerIndex][index]
                if (dayItem.weekend) {
                    className += " oni-datepicker-week-end"
                }
                if (!dayItem.month) {
                    className += " oni-datepicker-day-none"
                }
                if (dayItem.selected) {
                    className += " oni-datepicker-selected"
                }
                if (dayItem.dateDisabled) {
                    className += " oni-state-disabled"
                }
                return className.trim()
            }
            vm._setHoverClass = function(index, outerIndex, rowIndex, day) {
                var className = "",
                    dayItem = {}
                if (day === "") {
                    return ""
                }
                dayItem = datepickerData[rowIndex]["rows"][outerIndex][index]
                className = "oni-datepicker-day-hover"
                return className
            }
            vm._setMobileYearClass = function(yearItem, elementYear, monthItem, elementMonth) {
                var className = ""
                if (yearItem === elementYear && monthItem === elementMonth) {
                    className += " oni-datepicker-selected"
                }
                if (vmodel.mobileYearDisabled(yearItem)) {
                    className += " oni-state-disabled"
                }
                return className
            }
            vm._rowShow = function(rowDays) {
                return rowDays[0] !== ""
            }
            vm.sliderMinuteOpts = {
                onInit: function(sliderMinute, options, vmodels) {
                    sliderMinute.$watch("value", function(val) {
                        vmodel.minute = val
                    })
                    vmodel.$watch("minute", function(val) {
                        sliderMinute.value = val
                    })
                }
            }
            vm.sliderHourOpts = {
                onInit: function(sliderHour, options, vmodels) {    
                    sliderHour.$watch("value", function(val) {
                        vmodel.hour = val
                    })
                    vmodel.$watch("hour", function(val) {
                        sliderHour.value = val
                    })
                }
            }
            vm.$yearVmId = vm.$id+"year";
            vm.$monthVmId = vm.$id+"month";
            vm.$yearOpts = {
                width: 60,
                listWidth: 60,
                height: 160,
                position: false,
                listClass: "oni-datepicker-dropdown",
                onSelect: function(e) {
                    e.stopPropagation()
                }
            }
            vm.$monthOpts = {
                width: 45,
                height: 160,
                listWidth: 45,
                position: false,
                listClass: "oni-datepicker-dropdown",
                onSelect: function(e) {
                    e.stopPropagation()
                }
            }
            vm._selectDates = function(month) {
                if (vmodel.mobileMonthAndYear) {
                    vmodel._monthToggle = false
                    vmodel._yearToggle = false
                    vmodel._datepickerToggle = true
                    monthYearChangedBoth = true
                    vmodel.year = vmodel.mobileYear
                    vmodel.month = month
                }
            }
            vm._selectMonths = function(event, year) {
                if (vmodel.mobileMonthAndYear) {
                    if (year) {
                        if (!vmodel.mobileYearDisabled(year)) {
                            vmodel.mobileYear = year
                        } else {
                            return 
                        }
                    } else {
                        vmodel.mobileYear = vmodel.year
                    }
                    vmodel._monthToggle = true
                    vmodel._yearToggle = false
                    vmodel._datepickerToggle = false
                } 
            }
            vm._selectYears = function() {
                if (vmodel.mobileMonthAndYear) {
                    vmodel._monthToggle = false
                    vmodel._yearToggle = true
                    vmodel._datepickerToggle = false
                }
            }
            vm.getInitTime = function(timeDate) {
                var date = formatDate(timeDate),
                    time = timeDate.toTimeString(),
                    now = time.substr(0, time.lastIndexOf(":"));
                vmodel.hour = timeDate.getHours()
                vmodel.minute = timeDate.getMinutes()
                return date + ' ' + now
            }
            vm._dateCellRender = function(outerIndex, index, rowIndex, date) {
                var dateCellRender = vmodel.dateCellRender
                if (dateCellRender && (typeof dateCellRender === 'function')) {
                    var dayItem = datepickerData[rowIndex]["rows"][outerIndex][index]
                    if (date === "") {
                        return date
                    }
                    return dateCellRender(date, vmodel, dayItem)
                }
                return date
            }
            vm._getNow = function() {
                var date = new Date(),
                    time = date.toTimeString(),
                    now = time.substr(0, time.lastIndexOf(":"));
                vmodel.hour = date.getHours()
                vmodel.minute = date.getMinutes()
                return now
            }
            vm._selectTime = function(event) {
                var timeFilter = avalon.filters.timer,
                    hour = timeFilter(vmodel.hour),
                    minute = timeFilter(vmodel.minute),
                    time = hour + ":" + minute,
                    _date = formatDate(parseDate(element.value));
                event.stopPropagation()
                element.value = _date + " " + time
                if (!vmodel.showDatepickerAlways) {
                    vmodel.toggle = false
                }
                if (options.onSelectTime && avalon.type(options.onSelectTime) === "function") {
                    options.onSelectTime.call(vmodel, vmodel)
                }
            }
            vm._selectYearMonth = function(event) {
                event.stopPropagation();
            }
            // 点击prev按钮切换到当前月的上个月，如当前月存在minDate则prev按钮点击无效
            vm._prev = function(prevFlag, event) {
                if(!prevFlag) {
                    return false
                }
                toggleMonth("prev")
                event.stopPropagation()
            }
            // 点击next按钮切换到当前月的下一个月，如果当前月存在maxDate则next按钮点击无效
            vm._next = function(nextFlag, event) {
                if(!nextFlag) {
                    return false
                }
                toggleMonth("next")
                event.stopPropagation()
            }
            vm._prevYear = function(year) {
                if (year === vmodel.years[0]) {
                    return
                }
                vmodel.mobileYear = vmodel.mobileYear - 1 
            }
            vm._nextYear = function(year) {
                if (year === vmodel.years[vmodel.years.length-1]) {
                    return
                }
                vmodel.mobileYear = vmodel.mobileYear + 1
            }
            vm._prevYears = function() { 
                if (vmodel._years[0] <= vmodel.years[0]) {
                    return
                }
                updateMobileYears(vmodel._years[0] - 1)
            }
            vm._nextYears = function() {
                var _years = vmodel._years,
                    years = vmodel.years;
                if (_years[_years.length-1] >= years[years.length-1]) {
                    return
                }
                updateMobileYears(_years[9] + 1)
            }
            vm.mobileYearDisabled = function(year) {
                var years = vmodel.years
                if (year < years[0] || year > years[years.length-1]) {
                    return true
                } else {
                    return false
                }
            }
            vm.getRawValue = function() {
                return element.value
            }
            vm.getDate =  function() {
                var value = vmodel.getRawValue()
                return parseDate(value)
            }
            // 年份选择器渲染ok之后为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterYearRendered = function() {
                this.setAttribute("ms-widget", ["dropdown", vm.$yearVmId, "$yearOpts"].join(","))
                this.setAttribute("ms-duplex", "year")
                avalon.scan(this, vmodel)
            }
            // 月份选择器渲染ok之为其绑定dropdown组件并扫描渲染出dropdown
            vm._afterMonthRendered = function() {
                this.setAttribute("ms-widget", ["dropdown", vm.$monthVmId, "$monthOpts"].join(","))
                this.setAttribute("ms-duplex", "_month")
                avalon.scan(this, vmodel)
            }
            // 选择日期
            vm._selectDate = function(index, outerIndex, rowIndex, event) {
                var timerFilter = avalon.filters.timer,
                    _oldMonth = vmodel.month,
                    _oldYear = vmodel.year,
                    dayItem = datepickerData[rowIndex]["rows"][outerIndex][index],
                    year = dayItem.year,
                    month = dayItem.month,
                    day = +dayItem.day,
                    dateDisabled = dayItem.dateDisabled
                event.stopPropagation()
                event.preventDefault()
                if (month !== false && !dateDisabled && !vmodel.showDatepickerAlways) {
                    var _date = new Date(year, month, day),
                        date = formatDate(_date),
                        calendarWrapper = options.type ==="range" ? element["data-calenderwrapper"] : null
                    
                    vmodel.tip = getDateTip(cleanDate(_date)).text
                    vmodel.dateError = "#cccccc"
                    if (!calendarWrapper && !vmodel.timer) {
                        element.value = date
                        vmodel.toggle = false
                    } else { // range datepicker时需要切换选中日期项的类名
                        if (vmodel.timer) {
                            date = date + " " + timerFilter(vmodel.hour) + ":" + timerFilter(vmodel.minute)
                        }
                        element.value = date
                    }

                    if (month === _oldMonth && year === _oldYear && vmodel.day == day) {
                        vmodel.$fire("day", day)
                    } else {
                        vmodel.day = day
                    }
                    if (month !== _oldMonth && year !== _oldYear) {
                        monthYearChangedBoth = true
                        vmodel.year = year
                        vmodel.month = month
                    } else if (month !== _oldMonth) {
                        vmodel.month = month
                    } else if (year !== _oldYear) {
                        vmodel.year = year
                    }
                }
                if (!vmodel.showDatepickerAlways && !duplexVM) {
                    if (typeof vmodel.onSelect === "string") {
                        avalon.log("onSelect 回调必须是个function！")
                        return
                    }
                    vmodel.onSelect.call(null, date, vmodel, avalon(element).data())
                }
            }

            //设置语言包
            vm.setRegional = function(regional) {
                vmodel.regional = regional
            }
            vm.dataRendered = function() {
                if (!daysWrapper) {
                    daysWrapper = document.getElementById('oni-datepicker-days')
                    daysWrapper && (daysWrapper.id = '')
                }
            }
            vm.$init = function(continueScan) {
                var elementPar = element.parentNode,
                    initDate = null

                calendar = avalon.parseHTML(calendarTemplate).firstChild
                elementPar.insertBefore(calendar, element)
                elementPar.insertBefore(element, calendar)
                avalon(element).attr("ms-css-width", "width")
                vmodel.weekNames = calendarHeader()

                if (element.tagName === "INPUT" && vmodel.type !== "range") {
                    var div = document.createElement("div")
                    div.className = "oni-datepicker-input-wrapper"
                    div.setAttribute("ms-class", "oni-datepicker-active:toggle")
                    div.setAttribute("ms-css-border-color", "dateError")
                    div.setAttribute("ms-hover", "oni-state-hover")
                    elementPar.insertBefore(div,element)
                    div.appendChild(element)
                    if (vmodel.showTip) {
                        var tip = avalon.parseHTML("<div class='oni-datepicker-tip'>{{tip}}<i class='oni-icon oni-icon-calendar-o'>&#xf088;</i></div>")
                        div.appendChild(tip)
                    } else {
                        element.style.paddingRight = "0px"
                    }
                    div.appendChild(calendar)
                }
                if (vmodel.timer) {
                    vmodel.width = 100
                    var time = validateTime(_initValue)
                    if (_initValue && time) {
                        _initValue = vmodel.getInitTime(time)
                    }
                }
                element.value = _initValue
                if (initDate = parseDate(_initValue)) {
                    vmodel.tip = getDateTip(cleanDate(initDate)).text
                }
                element.disabled = vmodel.disabled

                if (vmodel.showDatepickerAlways) {
                    element.style.display = "none"
                    vmodel.toggle = true
                    vmodel._position = "relative"
                    div.style.borderWidth = 0
                } else {
                    bindEvents(calendar, div)
                }
                
                if (options.type === "range") {
                    div = element["data-calenderwrapper"]
                    vmodel._position = "static"
                } else {
                    avalon.scan(div, [vmodel])
                }
                vm.rootElement = div
                avalon.scan(calendar, [vmodel].concat(vmodels))
                setTimeout(function() {
                    calendarDays(vmodel.month, vmodel.year)
                }, 10)

                if (typeof options.onInit === "function" ){
                    //vmodels是不包括vmodel的
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm._getTitle = function(year, month) {
                return vmodel.regional.titleFormat.call(vmodel.regional, year, month)
            }
            vm.$remove = function() {
                var elementPar = element.parentNode,
                    eleParPar = elementPar.parentNode,
                    calendarPar = calendar.parentNode

                calendar.innerHTML = calendar.textContent = ""
                calendarPar.removeChild(calendar)
                eleParPar.removeChild(elementPar)
            }
        })
        getDateTip = getDateTip.bind(vmodel)
        vmodel.$watch("toggle", function(val) {
            var dateFormat = element.value,
                date = parseDate(dateFormat),
                elementYear = date && date.getFullYear(),
                elementMonth = date && date.getMonth()
            if (val) {
                vmodel.elementMonth = elementMonth || -1
                vmodel.elementYear = elementYear || -1
                if (daysWrapper) {
                    vmodel._height = avalon(daysWrapper).height()
                    daysWrapper = null
                }
            } else {
                if (vmodel.year != elementYear && vmodel.month != elementMonth) {
                    if (!date) {
                        monthYearChangedBoth = true
                        var today = new Date,
                            yearToday = today.getFullYear(),
                            monthToday = today.getMonth()

                        if (vmodel.year == yearToday && vmodel.month == monthToday) {
                            setCalendarDays(vmodel.month, vmodel.year, vmodel.day)
                        } else if (vmodel.year == yearToday) {
                            vmodel.month = monthToday
                        } else if (vmodel.month == monthToday) {
                            vmodel.year = yearToday
                        } else {
                            monthYearChangedBoth = true
                            vmodel.year = yearToday
                            vmodel.month = monthToday
                        }
                    } else {
                        monthYearChangedBoth = true
                        vmodel.year = elementYear
                        vmodel.month = elementMonth
                    }
                } else if (vmodel.year != elementYear) {
                    vmodel.year = elementYear
                } else if (vmodel.month != elementMonth) {
                    vmodel.month = elementMonth
                }

                // 防止Month, Year下拉框的浮层不被关闭。
                avalon.vmodels[vmodel.$yearVmId] && (avalon.vmodels[vmodel.$yearVmId].toggle = false);
                avalon.vmodels[vmodel.$monthVmId] && (avalon.vmodels[vmodel.$monthVmId].toggle = false);

                vmodel.onClose(new Date(vmodel.year,vmodel.month,vmodel.day), vmodel)
            }
        })
        vmodel.$watch("year", function(year) {
            if (vmodel.mobileMonthAndYear) {
                updateMobileYears(year)
            }
            if (!monthYearChangedBoth) {
                setCalendarDays(vmodel.month, year, vmodel.day)
            } else {
                monthYearChangedBoth = false
            }
            vmodel.onChangeMonthYear(year, vmodel.month+1, vmodel)
        })
        if (vmodel.changeMonthAndYear) {
            vmodel.$watch("_month", function(month) {
                vmodel.month = month - 1
            }) 
        }
        vmodel.$watch("month", function(month) {
            vmodel._month = month + 1
            setCalendarDays(month, vmodel.year, vmodel.day)
            vmodel.onChangeMonthYear(vmodel.year, month, vmodel)
        })
        vmodel.$watch("day", function(newDay, oldDay) {
            var data = datepickerData,
                month = vmodel.month,
                year = vmodel.year,
                exitLoop = false,
                dateYear,
                dateMonth, 
                dateDay

            for (var i = 0, len = data.length; i < len; i++) {
                var dataItem = data[i]

                if (dataItem.year == year && dataItem.month == month) {
                    var dataRows = dataItem.rows

                    for (var j = 0, jLen = dataRows.length; j < jLen; j++) {
                        var dataRow = dataRows[j]

                        for (var k = 0, kLen = dataRow.length; k < kLen; k++) {
                            var dayItem = dataRow[k],
                                date = dayItem.day

                            if (date == newDay && dayItem.month == month && dayItem.year == year) {
                                dayItem.selected = true
                                vmodel.data[i]["rows"][j].set(k, "").set(k, dayItem._day)
                            } else if (dayItem.selected) {
                                dayItem.selected = false
                                vmodel.data[i]["rows"][j].set(k, "").set(k, dayItem._day)
                            }
                        }
                    }
                } else {

                    for (var j = 0, jLen = dataRows.length; j < jLen; j++) {
                        var dataRow = dataRows[j]

                        for (var k = 0, kLen = dataRow.length; k < kLen; k++) {
                            var dateItem = dataRow[k]

                            if (dayItem.selected) {
                                dayItem.selected = false
                                vmodel.data[i]["rows"][j].set(k, "").set(k, dayItem._day)
                                exitLoop = true
                                break;
                            }
                        }
                        if (exitLoop) {
                            break;
                        }
                    }
                }
                if (exitLoop) {
                    break;
                }
            }
        })
        // 这里的处理使得设置外部disabled或者组件VM的disabled同步
        vmodel.$watch("disabled", function(val) {
            element.disabled = val
        })
        vmodel.$watch("minDate", function(val) {
            var minDate = validateDate(val)
            if (minDate) {
                vmodel.minDate = cleanDate(minDate)
            } else {
                vmodel.minDate = ""
            }
            setCalendarDays(vmodel.month, vmodel.year, vmodel.day)

        })
        vmodel.$watch("maxDate", function(val) {
            var maxDate = validateDate(val)
            if (maxDate) {
                vmodel.maxDate = cleanDate(maxDate)    
            } else {
                vmodel.maxDate = ""
            }
            setCalendarDays(vmodel.month, vmodel.year, vmodel.day)

        })
        duplexVM && duplexVM[1].$watch(duplexVM[0], function (val) {
            var currentYear,
                currentMonth,
                date

            if (date = parseDate(val)) {
                currentYear = date.getFullYear()
                currentMonth = date.getMonth()
                vmodel.day = date.getDate()
                if (currentMonth !== vmodel.month && currentYear !== vmodel.year) {
                    monthYearChangedBoth = true
                    vmodel.year = currentYear
                    vmodel.month = currentMonth
                } else if (currentYear !== vmodel.year) {
                    vmodel.year = currentYear
                } else if (currentMonth !== vmodel.month) {
                    vmodel.month = currentMonth
                }
                vmodel.dateError = '#cccccc'
                vmodel.tip = getDateTip(cleanDate(date)).text
                if (typeof vmodel.onSelect === "string") {
                    avalon.log("onSelect 回调必须是个function！")
                    return
                }
                vmodel.onSelect.call(null, date, vmodel, avalon(element).data())
            } else {
                if (!vmodel.allowBlank) {
                    vmodel.tip = vmodel.formatErrorTip;
                    vmodel.dateError = '#ff8888';
                } else {
                    vmodel.tip = ""
                }
            }
        })
        minDateVM && minDateVM[1].$watch(minDateVM[0], function(val) {
            vmodel.minDate = val
        })
        maxDateVM && maxDateVM[1].$watch(maxDateVM[0], function(val) {
            vmodel.maxDate = val;
        })
        function initValue() {
            var value = element.value,
                _date = parseDate(value),
                today = cleanDate(new Date()),
                _initDate = _date,
                dateDisabled = false;

            if (value && !_date) {
                options.tip = options.formatErrorTip
                options.dateError = "#ff8888"
                _initDate = today
            }
            if (options.allowBlank) {
                if (!value){
                    options.tip = ""
                    _initDate = today
                } else if (_date) {
                    dateDisabled = isDateDisabled(_date, options)
                }
            } else {
                if (!value) {
                    value = formatDate(today)
                    options.tip = getDateTip(today).text  
                    _initDate = today  
                    dateDisabled = isDateDisabled(today, options)
                } else if (_date) {
                    dateDisabled = isDateDisabled(_date, options)
                }
            }
            if (dateDisabled) {
                _initDate = options.minDate || options.maxDate
                value = formatDate(_initDate)
            } 

            year = _initDate.getFullYear()
            month =  _initDate.getMonth()
            day = _initDate.getDate()
            _initValue = value
        }
        function updateMobileYears(year) { //todo--- 看能不能把数组的赋值，变成set的方式
            var years = vmodel._years,
                _year3 = (year + "").substr(0, 3),
                newYears = [];
            if (!~years.indexOf(year)) {
                for (var i = 0; i <= 9; i++) {
                    newYears.push(Number(_year3+i))
                }
                vmodel._years = newYears
            } 
        }
        // 根据minDate和maxDate的设置判断给定的日期是否不可选
        function isDateDisabled(date, vmodel) {
            var time = date.getTime(),
                minDate = vmodel.minDate,
                maxDate = vmodel.maxDate;
            if(minDate && time < minDate.getTime()){
                return true;
            } else if(maxDate && time > maxDate.getTime()) {
                return true;
            }
            return false;
        }
        //todo-- 看看事件绑定这块可否优化
        // 初始化时绑定各种回调
        function bindEvents(calendar, tipContainer) {
            // focus Input元素时显示日历组件
            avalon.bind(element, "focus", function(e) {
                vmodel.toggle = true;
            })
            // 切换日期年月或者点击input输入域时不隐藏组件，选择日期或者点击文档的其他地方则隐藏日历组件
            avalon.bind(document, "click", function(e) {
                var target = e.target;
                if(options.type==="range") {
                    return ;
                }
                if(!calendar.contains(target) && !tipContainer.contains(target) && vmodel.toggle && !vmodel.timer) {
                    vmodel.toggle = false;
                    return ;
                } else if(!vmodel.toggle && !vmodel.disabled && tipContainer.contains(target)){
                    vmodel.toggle = true;
                    return ;
                }
            })

            // 处理用户的输入
            avalon.bind(element, "keydown", function(e) {
                var keyCode = e.keyCode,  operate, eChar;
                eChar = e.key;
                if(eChar) {
                    switch(eChar) {
                        case "-": 
                            operate = "-";
                        break;
                        case "/":
                            operate = "/";
                        break;
                    }
                } else {
                    switch(keyCode) {
                        case 189: 
                            operate = "-";
                        break;
                        case 191:
                            operate = "/";
                        break;
                    }
                }
                if(!vmodel.toggle) {
                    vmodel.toggle = true;
                }
                // 37:向左箭头； 39:向右箭头；8:backspace；46:Delete
                if((keyCode<48 || (keyCode>57 && keyCode<96) || keyCode>105) && keyCode !==13 && keyCode!==8 && options.separator !== operate && keyCode !== 27 && keyCode !== 9 && keyCode !== 37 && keyCode!== 39 && keyCode!==46) {
                    e.preventDefault();
                    return false;
                } 
            })
            avalon.bind(element, "keyup", function(e) {
                var value = element.value,
                    year = vmodel.year, 
                    month = vmodel.month, 
                    keyCode = e.keyCode,
                    dateMonth,
                    dateYear,
                    date
                if (keyCode === 37 || keyCode === 39) {
                    return false;
                }
                // 当按下Enter、Tab、Esc时关闭日历
                if (keyCode === 13 || keyCode == 27 || keyCode == 9) {
                    vmodel.toggle = false
                    return false
                }
                if (date = parseDate(value)) {
                    dateMonth = date.getMonth()
                    dateYear = date.getFullYear()
                    vmodel.dateError = "#cccccc"
                    vmodel.tip = getDateTip(cleanDate(date)).text
                    vmodel.day = date.getDate()

                    if (month != dateMonth && year != dateYear) {
                        monthYearChangedBoth = true
                        vmodel.year = dateYear
                        vmodel.month = dateMonth
                    } else if (month != dateMonth) {
                        vmodel.month = dateMonth
                    } else {
                        vmodel.year = dateYear
                    }
                } else {
                    if (vmodel.allowBlank && value == "") {
                        vmodel.tip = ""
                        vmodel.dateError = "#cccccc"
                        return
                    }
                    vmodel.tip = vmodel.formatErrorTip;
                    vmodel.dateError = "#ff8888";
                }
            })
        }
        // 通过prev、next按钮切换月份
        function toggleMonth(operate) {
            var month = vmodel.month, 
                year = vmodel.year,
                stepMonths = vmodel.stepMonths,
                numberOfMonths = vmodel.numberOfMonths,
                firstDayOfNextMonth,
                firstDayMonth = 0,
                firstDayYear = 0

            if (operate === "next") {
                month = month + stepMonths + numberOfMonths -1
            } else {
                month = month - stepMonths - numberOfMonths + 1
            }
            firstDayOfNextMonth = new Date(year, month, 1)
            firstDayMonth = firstDayOfNextMonth.getMonth()
            firstDayYear = firstDayOfNextMonth.getFullYear()
            if (firstDayYear != vmodel.year) {
                monthYearChangedBoth = true
                vmodel.year = firstDayYear
                vmodel.month = firstDayMonth
            } else {
                vmodel.month = firstDayMonth
            }
        }
        // 日历头部的显示名
        function calendarHeader() {
            var weekNames = [],
                startDay = options.startDay;
            for(var j = 0 , w = vmodel.regional.dayNames ; j < 7 ; j++){
                var n = ( j + startDay ) % 7;
                weekNames.push(w[n]);
            }
            return weekNames;
        }
        function calendarDate(cellDate, vmodel, valueDate, dateMonth, dateYear, days, _days, day) {
            var selected = false,
                tip = getDateTip(cellDate),
                _day = tip && tip.cellText || day,
                weekDay = cellDate.getDay(),
                weekend = weekDay % 7 == 0 || weekDay % 7 == 6,
                dateDisabled = isDateDisabled(cellDate, vmodel)
            if (valueDate && valueDate.getDate() === +day && dateMonth===valueDate.getMonth() && dateYear===valueDate.getFullYear()) {
                selected = true
            }    
            days.push({day:day+"",_day: _day+"", month: dateMonth, year: dateYear, weekend: weekend, selected: selected, dateDisabled: dateDisabled})
            _days.push(_day+"")
        }
        // 根据month、year得到要显示的日期数据
        function calendarDays (month, year) {
            var startDay = vmodel.startDay,
                firstDayOfMonth = new Date(year, month , 1),
                cellDate =  new Date(year , month , 1 - ( firstDayOfMonth.getDay() - startDay + 7 ) % 7 ),
                showOtherMonths = vmodel.showOtherMonths,
                valueDate = parseDate(element.value),
                minDate = vmodel.minDate,
                maxDate = vmodel.maxDate,
                prev = minDate ? (year-minDate.getFullYear())*12+month-minDate.getMonth() > 0: true,
                next = maxDate ? (maxDate.getFullYear()-year)*12+maxDate.getMonth()-month > 0: true,
                rows = [],
                _rows = [],
                data = [],
                _data = [],
                days = [],
                _days = [],
                dateYear,
                dateMonth,
                day

            vmodel.prevMonth = prev
            vmodel.nextMonth = next
            
            for (var i = 0, len = vmodel.numberOfMonths; i < len; i++) {
                
                for (var m=0; m<6; m++) {
                    days = []
                    _days = []
                    
                    for (var n = 0; n < 7; n++) {
                        dateMonth = cellDate.getMonth()
                        dateYear = cellDate.getFullYear()
                        day = cellDate.getDate()
                        if (dateYear === year && dateMonth === month) { 
                            calendarDate(cellDate, vmodel, valueDate, dateMonth, dateYear, days, _days, day)
                        } else {
                            if (showOtherMonths && m === 0 && (dateYear < year || dateMonth < month)) {
                                calendarDate(cellDate, vmodel, valueDate, dateMonth, dateYear, days, _days, day)
                            } else {
                                _days.push("")
                                days.push({day:"", month: false, weekend: false, selected:false,dateDisabled: true})
                            }
                        }
                        cellDate = new Date(cellDate.setDate(day+1))
                    } 
                    rows.push(days)
                    _rows.push(_days)
                }
                data.push({
                    year: year,
                    month: month,
                    rows: rows
                })
                _data.push({
                    year: year,
                    month: month, 
                    rows: _rows
                })
                month += 1
                firstDayOfMonth = new Date(year, month, 1)
                year = firstDayOfMonth.getFullYear();
                month = firstDayOfMonth.getMonth();
                cellDate = new Date(year , month , 1 - ( firstDayOfMonth.getDay() - startDay + 7 ) % 7 )
                rows = []
                _rows = []
            }
            datepickerData = data
            vmodel.data = _data
        }
        function setCalendarDate(cellDate, vmodel, valueDate, dateMonth, dateYear, dateDay, day, i, m, n) {
            var selected = false,
                month = valueDate && valueDate.getMonth(),
                year = valueDate && valueDate.getFullYear(),
                tip = getDateTip(cellDate),
                _day = tip && tip.cellText || dateDay, 
                weekDay = cellDate.getDay(),
                weekend = weekDay % 7 == 0 || weekDay % 7 == 6,
                dateDisabled = isDateDisabled(cellDate, vmodel),
                dayItem = datepickerData[i]["rows"][m][n],
                rowItem = vmodel.data[i]["rows"][m]

            _day = _day + ''

            if (dateDay === +day && dateMonth === month && dateYear === year) {
                selected = true
            }    
            if (dayItem._day == _day && (dayItem.selected != selected || dayItem.dateDisabled != dateDisabled)) {
                avalon.mix(dayItem, {month: dateMonth, year: dateYear, selected: selected, dateDisabled: dateDisabled})
                rowItem.set(n, "").set(n, _day)
            } else if (dayItem._day == _day) {
                avalon.mix(dayItem, {month: dateMonth, year: dateYear})
            } else {
                avalon.mix(dayItem, {day:dateDay+"",_day: _day, month: dateMonth, year: dateYear, weekend: weekend, selected: selected, dateDisabled: dateDisabled})
                rowItem.set(n, _day)
            }
        }
        function setCalendarDays(month, year, day) {
            var startDay = vmodel.startDay,
                firstDayOfMonth = new Date(year, month , 1),
                cellDate =  new Date(year , month , 1 - ( firstDayOfMonth.getDay() - startDay + 7 ) % 7 ),
                showOtherMonths = vmodel.showOtherMonths,
                valueDate = parseDate(element.value),
                minDate = vmodel.minDate,
                maxDate = vmodel.maxDate,
                prev = minDate ? (year-minDate.getFullYear())*12+month-minDate.getMonth() > 0: true,
                next = maxDate ? (maxDate.getFullYear()-year)*12+maxDate.getMonth()-month > 0: true,
                dateYear,
                dateMonth,
                dateDay

            vmodel.prevMonth = prev
            vmodel.nextMonth = next
            
            for (var i = 0, len = vmodel.numberOfMonths; i < len; i++) {
                
                vmodel.data[i].year = year
                vmodel.data[i].month = month
                datepickerData[i].year = year
                datepickerData[i].month = month
                for (var m=0; m<6; m++) {

                    for (var n = 0; n < 7; n++) {
                        dateMonth = cellDate.getMonth()
                        dateYear = cellDate.getFullYear()
                        dateDay = cellDate.getDate()
                        if (dateYear === year && dateMonth === month) { 
                            setCalendarDate(cellDate, vmodel, valueDate, dateMonth, dateYear, dateDay, day, i, m, n)
                        } else {
                            if (showOtherMonths && m === 0 && (dateYear < year || dateMonth < month)) {
                                setCalendarDate(cellDate, vmodel, valueDate,dateMonth, dateYear, dateDay, day, i, m, n)
                            } else {
                                vmodel.data[i]["rows"][m].set(n, "")
                                avalon.mix(datepickerData[i]["rows"][m][n], {day:"",_day: "", month: false, weekend: false, selected:false,dateDisabled: true})
                            }
                        }
                        cellDate = new Date(cellDate.setDate(dateDay+1))
                    } 
                }
                month += 1
                firstDayOfMonth = new Date(year, month, 1)
                year = firstDayOfMonth.getFullYear()
                month = firstDayOfMonth.getMonth()
                cellDate = new Date(year, month, 1 - (firstDayOfMonth.getDay() - startDay + 7) % 7)
            }

        }
        // 检验date
        function validateDate(date) {
            if (typeof date == "string") {
                return parseDate(date)
            } else {
                return date;
            }
        }
        // 检验time
        function validateTime(date) {
            if (typeof date == "string") {
                var theDate = parseDate(date),
                    timeReg = /\s[0-2]?[0-9]:[0-5]?[0-9]/,
                    _time = date.match(timeReg)
                if (theDate && _time && _time.length) {
                    var time = _time[0].split(':'),
                        hour = +time[0],
                        minute = +time[1]
                    theDate = new Date(theDate.getFullYear(), theDate.getMonth(), theDate.getDate(), hour, minute)
                }
                return theDate
            } else {
                return date;
            }
        }
        return vmodel
    }

    widget.regional = []
    widget.regional["zh-CN"] = {
        holidayDate: initHoliday(holidayDate),
        dayNames: ['日', '一', '二', '三', '四', '五', '六'],  //该变量被注册到了vm中，同时在方法中使用
        weekDayNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        monthNames: ['一月','二月','三月','四月','五月','六月',
            '七月','八月','九月','十月','十一月','十二月'],
        monthNamesShort: ['一月','二月','三月','四月','五月','六月',
            '七月','八月','九月','十月','十一月','十二月'],
        closeText: "Done",
        prevText: "前",
        prevDayText: "昨天",
        nextText: "后",
        nextDayText: "明天",
        dayAfterTomorrow: "后天",
        currentDayText: "今天",
        currentDayFullText: "今天",
        showMonthAfterYear: true,
        titleFormat: function(year, month) {
            return year + "年" + " " + this.monthNames[month]
        },
        dayText: "天",
        weekText: "周",
        yearText: "年",
        monthText: "月",
        timerText: "时间",
        hourText: "时",
        minuteText: "分",
        nowText: "现在",
        confirmText: "确定"
    }

    //设置默认语言包
    widget.defaultRegional = widget.regional["zh-CN"]

    widget.version = 1.0
    widget.defaults = {
        calendarWidth: 196, //@config 设置日历展示宽度
        startDay: 1, //@config 设置每一周的第一天是哪天，0代表Sunday，1代表Monday，依次类推, 默认从周一开始
        minute: 0, //@config 设置time的默认minute
        hour: 0, //@config 设置time的hour
        width: 90, //@config 设置日历框宽度
        showTip: true, //@config 是否显示节日提示
        disabled: false, //@config 是否禁用日历组件
        changeMonthAndYear: false, //@config 是否可以通过下拉框选择月份或者年份
        mobileMonthAndYear: false, //@config PC端可以通过设置changeMonthAndYear为true使用dropdown的形式选择年份或者月份，但是移动端只能通过设置mobileMonthAndYear为true来选择月份、年份
        showOtherMonths: false, //@config 是否显示非当前月的日期
        numberOfMonths: 1, //@config 一次显示的日历月份数, 默认一次显示一个
        allowBlank : false, //@config 是否允许日历框为空
        minDate : null, //@config 最小的可选日期，可以配置为Date对象，也可以是yyyy-mm-dd格式的字符串，或者当分隔符是“/”时，可以是yyyy/mm/dd格式的字符串
        maxDate : null, //@config 最大的可选日期，可以配置为Date对象，也可以是yyyy-mm-dd格式的字符串，或者当分隔符是“/”时，可以是yyyy/mm/dd格式的字符串
        stepMonths : 1, //@config 当点击next、prev链接时应该跳过几个月份, 默认一个月份
        toggle: false, //@config 设置日历的显示或者隐藏，false隐藏，true显示
        separator: "-", //@config 日期格式的分隔符,默认“-”，可以配置为"/"，而且默认日期格式必须是yyyy-mm-dd
        calendarLabel: "选择日期", //@config 日历组件的说明label
        /**
         * @config {Function} 当month或者year更新时调用的回调
         * @param year {Number} 当前日期的year
         * @param month {Number} 当前日期的month(0-11)
         * @param vmodel {Number} 日历组件对应vmodel
         */
        onChangeMonthYear: avalon.noop, 
        /**
         * @config {Function} 格式化输出日期单元格内容
         * @param date {Date} 当前的日期
         * @param vmodel {Vmodel} 日历组件对应vmodel
         * @param dateItem {Object} 对应的包含日期相关信息的对象
         */
        dateCellRender: false,
        watermark: true, //@config 是否显示水印文字
        zIndex: -1, //@config设置日历的z-index
        showDatepickerAlways: false, //@config是否总是显示datepicker
        timer: false, //@config 是否在组件中可选择时间
        position: '', //@config 设置datepicker的显示位置，可以为"rb"、"lt"、"rt"或者自定义的class,默认""
        /**
         * @config {Function} 选中日期后的回调
         * @param date {String} 当前选中的日期
         * @param vmodel {Object} 当前日期组件对应的Vmodel
         * @param data {Object} 绑定组件的元素的data属性组成的集合
         */
        onSelect: avalon.noop, 
        /**
         * @config {Function} 日历关闭的回调
         * @param date {Object} 当前日期
         * @param vmodel {Object} 当前日期组件对应的Vmodel
         */
        onClose: avalon.noop,
        /**
         * @config {Function} 在设置了timer为true时，选择日期、时间后的回调
         * @param vmodel {Object} 当前日期组件对应的Vmodel
         */
        onSelectTime: avalon.noop,
        /**
         * @config {Function} 将符合日期格式要求的字符串解析为date对象并返回，不符合格式的字符串返回null,用户可以根据自己需要自行配置解析过程
         * @param str {String} 要解析的日期字符串
         * @returns {Date} Date格式的日期
         */
        parseDate: parseDate,
        /**
         * @config {Function} 将日期对象转换为符合要求的日期字符串
         * @param date {Date} 要格式化的日期对象
         * @returns {String} 格式化后的日期
         */
        formatDate: function(date){
            if (avalon.type(date) !== "date") {
                avalon.log("the type of " + date + "must be Date")
                return ""
            }
            var separator = this.separator,
                year = date.getFullYear(),
                month = date.getMonth(),
                day = date.getDate();
            return year + separator + this.formatNum(month + 1 , 2) + separator + this.formatNum(day , 2);
        },
        // 格式化month和day，使得其始终为两位数，比如2为02,1为01
        formatNum: function(n, length){
            n = String(n);
            for( var i = 0 , len = length - n.length ; i < len ; i++)
                n = "0" + n;
            return n;
        },
        widgetElement: "", // accordion容器
        formatErrorTip: "格式错误",
        getTemplate: function(str, options) {
            return str;
        }
    }
    avalon.filters.timer = function(str) {
        var num = +str;
        if (num >= 0 && num <=9) {
            str = "0" + str;
        }
        return str;
    }
    function cleanDate( date ){
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }
    // 获取节日信息并设置相应显示，提供中文语言包对于节日的支持
    function initHoliday( data ){
        var _table = {},
            _data = [];
        for( var k in data ){
            var v = data[ k ],
                _date = parseDate( k );

            if( _date ){
                v.date = _date;
                _data.push( v );
            }
        }
        _data.sort( function( a , b ){
            return ( a.dayIndex || 0 ) - ( b.dayIndex || 0 );
        });
        for( var k = 0 , len = _data.length ; k < len ; k++ ){
            var v = _data[k],
                _date = v.date,
                beforeTime = v.beforeTime || 0,
                afterTime = v.afterTime || 0;
            _date.setDate( _date.getDate() - beforeTime - 1 );
            for( var i = -v.beforeTime ; i < afterTime + 1 ; i++ ){
                _date.setDate( _date.getDate() + 1 );
                _table[ _date.getTime() ] =  {
                    text : v['holidayName'] + ( i < 0 ? '前' + -i + '天' : i > 0 ? '后' + i + '天' : ""),
                    cellClass : i === 0 && v['holidayClass'] || "",
                    cellText : i === 0 && v['holidayText'] || ""
                };
            }
        }
        return _table;
    }

    function parseDate(str){
        if (!str) {
            return null
        }
        if (avalon.type(str) === "date") return str
        var separator = this.separator || "-";
        var reg = "^(\\d{4})" + separator+ "(\\d{1,2})"+ separator+"(\\d{1,2})[\\s\\w\\W]*$";
        reg = new RegExp(reg);
        var x = str.match(reg);
        return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
    }

    // 解析传入日期，如果是节日或者节日前三天和后三天只能，会相应的显示节日前几天信息，如果是今天就显示今天，其他情况显示日期对应的是周几
    function getDateTip(curDate) {
        if(!curDate)
            return;

        //如果没有传递语言设置，使用默认的语言包
        var regional
        if(this.$id && this.regional) {
            regional = this.regional
        } else {
            regional = widget.defaultRegional
        }

        var holidays = regional.holidayDate || {}
        var now = (cleanDate(new Date())).getTime(),
            curTime = curDate.getTime(),
            dayNames = regional.dayNames;
        if(now == curTime) {
            return {
                    text : regional.currentDayFullText,
                    cellClass : 'c_today',
                    cellText : regional.currentDayText
                };
        } else if(now == curTime - ONE_DAY) {
            return {
                    text : regional.nextDayText,
                    cellClass : ""
                };
        } else if(now == curTime - ONE_DAY * 2) {
            return {
                    text : regional.dayAfterTomorrow ,
                    cellClass : ""
                };
        }
        var tip = holidays && holidays[curDate.getTime()];
        if(!tip) {
            return {text: regional.weekDayNames[curDate.getDay()]};
        } else {
            return tip;
        }
    };
    return avalon
})
/**
 @links
 [默认配置的日历框、allowBlank为true时的不同](avalon.datepicker.ex1.html)
 [配置日历周一-周日的对应的显示名、使日历的每一周从周日开始、通过下拉选框切换选择日历显示年份、月份](avalon.datepicker.ex2.html)
 [显示非当前月日期、通过prev、next每次切换3个月、一次显示多个月份](avalon.datepicker.ex3.html)
 [设置日期可选的最小日期、最大日期、以及初始值异常的显示情况](avalon.datepicker.ex4.html)
 [设置toggle切换日历显示与隐藏、calendarLabel配置日历顶部说明文字](avalon.datepicker.ex5.html)
 [ms-duplex初始化日期、allowBlank为false or true时组件对不同初始值的处理方式](avalon.datepicker.ex6.html)
 [组件选择日期后的change回调、关闭时的onClose回调、切换月份、年份的onChangeMonthYear回调](avalon.datepicker.ex7.html)
 [自定义parseDate、formatDate方法正确解析和显示日期](avalon.datepicker.ex8.html)
 [切换日历组件的禁用与否，以及手动输入日期的结果](avalon.datepicker.ex9.html)
 [移动端日期、年份选择](avalon.datepicker.ex10.html)
 [具有时间选择功能的datepicker](avalon.datepicker.ex11.html)
 [带格式化输出配置的datepicker](avalon.datepicker.ex12.html)
 [多语言支持](avalon.datepicker.ex13.html)
 [datepicker的验证](avalon.datepicker.ex14.html)
 [datepicker显示位置的设置](avalon.datepicker.ex15.html)
 [datepicker宽度、格式自定义](avalon.datepicker.ex16.html)
 */
;

require([
    "avalon",
    "domReady!",
    "./tab/avalon.tab",
    "./pager/avalon.pager",
    "./datepicker/avalon.datepicker"
], function (avalon) {
    avalon.log("domReady完成1")
    var vm = avalon.define({$id: "demo",
        //切换卡相关的配置
        tab: {
            onActivate: function (e) {
                avalon.log("user define cc activate callback")
            }
            , onClickActive: function (e, model) {
                alert('u click a active tab')
            }
            , autoSwitch: 1200
            , active: 1
            , tabs: [{
                    title: "水果2",
                    name: "fruit",
                    removable: false,
                    href: "http://news.163.com/"
                },
                {
                    title: "服装2",
                    name: "cloth"
                },
                {
                    title: "水果<i>非国产经典品牌</i>十分流弊"
                    , name: "tool"
                },
                {
                    title: "电器2"
                    , name: "tool"
                },
                {
                    title: "动物2"
                    , name: "animal"
                    , disabled: true
                }
            ]
            , tabpanels: [
                {content: "line 1 - <a href=\"#\" ms-click=\"add(peaple)\">点击我添加一个tab!</a>"},
                {content: "avalon.tab.ajax.html", contentType: "ajax"},
                {content: "line 2 - <a href=\"#\" ms-click=\"enable(4)\">点击我激活动物tab!</a>"},
                {content: 'line 3 -  <a href="#" ms-click="add(peaple2)">点击我添加一个不能删除的tab! </a>'},
                {content: "line 4"}
            ]
        },
        peaple: {
            title: "人类"
            , content: "我是来搞笑的"
        },
        peaple2: {
            title: "人类"
            , removable: false
            , content: "我是来搞笑的"
        },
        $skipArray: ["tab"]

    })
    avalon.scan(document.body, vm);
    //你们的业务代码
})
;
define("main", function(){});


(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})
('@charset \"UTF-8\";\r\n/*\r\n这是每个都组件都应该引用的部分\r\n*/\r\ndiv.oni-tab {\r\n  border: none; }\r\n\r\n.oni-tab {\r\n  /*dir=v, small size*/\r\n  /*dir=v, normal size*/ }\r\n  .oni-tab-slider {\r\n    position: relative;\r\n    overflow: hidden; }\r\n    .oni-tab-slider-enable {\r\n      width: 10000px; }\r\n    .oni-tab-slider-button {\r\n      text-decoration: none;\r\n      position: absolute;\r\n      right: 0px;\r\n      top: 0px;\r\n      padding: 10px 4px;\r\n      width: 8px;\r\n      font-weight: bold;\r\n      background: #ccc;\r\n      z-index: 10;\r\n      cursor: pointer;\r\n      color: #000; }\r\n      .oni-tab-slider-button-left {\r\n        left: 0; }\r\n  .oni-tab .oni-tab-nav {\r\n    float: left; }\r\n  .oni-tab .oni-tab-nav .oni-state-default {\r\n    float: left;\r\n    display: inline;\r\n    list-style: none;\r\n    text-align: center;\r\n    font-size: 12px;\r\n    padding: 10px 20px;\r\n    position: relative;\r\n    background-color: #f8f8f8;\r\n    cursor: pointer;\r\n    border: 1px solid #d4d4d4;\r\n    border-right-width: 0;\r\n    color: black; }\r\n  .oni-tab .oni-tab-nav .oni-state-default a, .oni-tab .oni-tab-nav .oni-state-default:link, .oni-tab .oni-tab-nav .oni-state-default a:hover {\r\n    color: black;\r\n    text-decoration: none;\r\n    font-size: 12px; }\r\n  .oni-tab .oni-tab-nav .oni-state-hover {\r\n    color: black;\r\n    background: white; }\r\n    .oni-tab .oni-tab-nav .oni-state-hover a {\r\n      color: black; }\r\n    .oni-tab .oni-tab-nav .oni-state-hover a:link {\r\n      color: black; }\r\n    .oni-tab .oni-tab-nav .oni-state-hover .oni-tab-close {\r\n      border-color: white; }\r\n  .oni-tab .oni-tab-nav .oni-state-active {\r\n    border-bottom-color: white;\r\n    background: white;\r\n    color: black; }\r\n    .oni-tab .oni-tab-nav .oni-state-active a {\r\n      color: black; }\r\n    .oni-tab .oni-tab-nav .oni-state-active a:link {\r\n      color: black; }\r\n    .oni-tab .oni-tab-nav .oni-state-active .oni-tab-close {\r\n      border-color: white; }\r\n  .oni-tab .oni-tab-nav .oni-state-disabled {\r\n    color: #999999;\r\n    cursor: default; }\r\n    .oni-tab .oni-tab-nav .oni-state-disabled a {\r\n      color: #999999;\r\n      cursor: default; }\r\n    .oni-tab .oni-tab-nav .oni-state-disabled a:link {\r\n      color: #999999;\r\n      cursor: default; }\r\n  .oni-tab .oni-tab-nav .oni-tab-last {\r\n    border-right-width: 1px; }\r\n  .oni-tab-small .oni-tab-nav .oni-state-default {\r\n    border-right-width: 1px;\r\n    margin-right: -1px;\r\n    z-index: 1;\r\n    padding: 7px 10px; }\r\n  .oni-tab-small .oni-tab-nav .oni-state-active {\r\n    border-color: #3775c0;\r\n    z-index: 10; }\r\n  .oni-tab-vertical .oni-tab-nav .oni-state-default {\r\n    float: none;\r\n    display: block;\r\n    text-align: left;\r\n    border-right-width: 1px;\r\n    border-bottom-width: 0; }\r\n  .oni-tab-vertical .oni-tab-nav .oni-state-active {\r\n    border-right-color: white;\r\n    border-bottom-color: #d4d4d4; }\r\n  .oni-tab-vertical .oni-tab-nav .oni-tab-last {\r\n    border-bottom-width: 1px; }\r\n  .oni-tab-click .oni-state-default {\r\n    cursor: pointer; }\r\n  .oni-tab-removable {\r\n    padding-right: 30px; }\r\n  .oni-tab-nav .oni-tab-item .oni-tab-close {\r\n    position: absolute;\r\n    right: 0px;\r\n    top: 7px;\r\n    padding: 3px;\r\n    height: 12px;\r\n    width: 12px;\r\n    overflow: hidden;\r\n    border: 1px solid #f8f8f8;\r\n    border-right-width: 0;\r\n    color: #666666;\r\n    text-indent: 0;\r\n    line-height: 14px;\r\n    font-family: Helvetica, Arial, sans-serif; }\r\n  .oni-tab .oni-tab-nav .oni-state-active .oni-tab-close-hover {\r\n    background: white;\r\n    border-color: #d4d4d4;\r\n    cursor: pointer; }\r\n  .oni-tab .oni-tab-nav .oni-state-hover .oni-tab-close-hover {\r\n    background: white;\r\n    border-color: #d4d4d4;\r\n    cursor: pointer; }\r\n\r\n/*\r\nchameleon\r\nby 司徒正美 2014.6.28 拉萨开往西宁的火车上\r\n这里放置所有组件都共用的类名，它们根据compass构建\r\n\r\noinui的CSS规范\r\n\r\n不能出现大写,以连字符风格命名 \r\n表示状态的应该用ui-state-*命名 \r\n表示功能的应该用ui-helper-*命名\r\n表示布局的应用用ui-uiname-* 命名, 它的子元素应该全部包在 .oni-uiname这个根类下\r\n如 .oni-grid .oni-grid-tbody{ ... }\r\n如果某一个区域的背景要换肤,能用ui-widget-header或ui-widget-content就尽用\r\n其他细微之后的换肤,使用ui-state-*-?-color实现,或至少包在if(oniui-theme === xxx){}分支内\r\n\r\n\r\n样式规则的出现顺序\r\n1 display float position overflow表示布局的样式\r\n2 width height line-height 表示尺寸的样式\r\n3 margin border padding 表示盒子模型的样式\r\n4 cursor font-size vertical-align text-align user-select outline....装饰用的样式\r\n5 color background 表示换肤的样式(上面的bordrer-color outline-color也可以放到这里)\r\n\r\n\r\nCSSShrink 是一个压缩 CSS 的在线工具。压缩比真高！\r\n\r\nhttp://cssshrink.com/\r\n*/\r\n.oni-helper-hidden {\r\n  display: none; }\r\n\r\n.oni-helper-hidden-accessible {\r\n  border: 0;\r\n  clip: rect(0 0 0 0);\r\n  height: 1px;\r\n  margin: -1px;\r\n  overflow: hidden;\r\n  padding: 0;\r\n  position: absolute;\r\n  width: 1px; }\r\n\r\n.oni-helper-reset {\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  outline: 0;\r\n  line-height: 1.3;\r\n  text-decoration: none;\r\n  font-size: 100%;\r\n  list-style: none; }\r\n\r\n.oni-helper-noselect {\r\n  -webkit-touch-callout: none;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  user-select: none; }\r\n  .oni-helper-noselect img, .oni-helper-noselect a {\r\n    -webkit-user-drag: none;\r\n    pointer-events: none; }\r\n\r\n.oni-helper-clearfix {\r\n  *zoom: 1; }\r\n  .oni-helper-clearfix:after {\r\n    content: \"\\0020\";\r\n    display: block;\r\n    height: 0;\r\n    clear: both;\r\n    overflow: hidden;\r\n    visibility: hidden; }\r\n\r\nhtml .oni-helper-max-index, body .oni-helper-max-index {\r\n  z-index: 1000; }\r\n\r\n@font-face {\r\n  font-family: fontawesome;\r\n  font-style: normal;\r\n  font-weight: normal;\r\n  src: url(\"http://source.qunarzz.com/fonts/oniui/0.0.3/oniui-webfont.eot?v=4.2.0\");\r\n  src: url(\"http://source.qunarzz.com/fonts/oniui/0.0.3/oniui-webfont.eot?#iefix&v=4.2.0\") format(\"embedded-opentype\"), \r\n       url(\"http://source.qunarzz.com/fonts/oniui/0.0.3/oniui-webfont.woff?v=4.2.0\") format(\"woff\"), \r\n       url(\"http://source.qunarzz.com/fonts/oniui/0.0.3/oniui-webfont.ttf?v=4.2.0\") format(\"truetype\"), \r\n       url(\"http://source.qunarzz.com/fonts/oniui/0.0.3/oniui-webfont.svg?v=4.2.0#fontawesomeregular\") format(\"svg\");}\r\n.oni-icon {\r\n  -webkit-touch-callout: none;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  user-select: none;\r\n  cursor: default;\r\n  font-family: fontawesome !important;\r\n  font-size: 14px;\r\n  -moz-osx-font-smoothing: grayscale;\r\n  -webkit-font-smoothing: antialiased;\r\n  font-style: normal;\r\n  font-weight: normal;\r\n  line-height: 18px;\r\n  vertical-align: middle; }\r\n\r\na .oni-icon, .oni-btn .oni-icon {\r\n  cursor: pointer; }\r\n\r\n.oni-state-error {\r\n  border: 1px solid #ff8888; }\r\n\r\n.oni-pager {\r\n  font: normal 12px/1.5 tahoma, arial, \'Hiragino Sans GB\', \'\\5b8b\\4f53\', sans-serif; }\r\n\r\n/*\r\n这是每个都组件都应该引用的部分\r\n*/\r\n.oni-pager {\r\n  display: -moz-inline-stack;\r\n  display: inline-block;\r\n  vertical-align: middle;\r\n  *vertical-align: auto;\r\n  zoom: 1;\r\n  *display: inline;\r\n  vertical-align: middle;\r\n  white-space: nowrap;\r\n  /*!省略掉的页数*/\r\n  /*!页面跳转部分的样式*/\r\n  /*!输入域的容器*/\r\n  /*!输入域*/\r\n  /*!里面的按钮的样式*/\r\n  /*!里面的文本全部包在一个容器内，以便实现居中*/ }\r\n  .oni-pager .oni-pager-items {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    vertical-align: middle; }\r\n  .oni-pager .oni-pager-prev, .oni-pager .oni-pager-next, .oni-pager .oni-pager-item {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    background-color: white;\r\n    color: #333;\r\n    height: 24px;\r\n    line-height: 24px;\r\n    margin-right: 5px;\r\n    border: 1px solid #d4d4d4;\r\n    padding: 0 10px;\r\n    -webkit-border-radius: 2px;\r\n    -moz-border-radius: 2px;\r\n    -ms-border-radius: 2px;\r\n    -o-border-radius: 2px;\r\n    border-radius: 2px;\r\n    cursor: pointer;\r\n    font-size: 12px;\r\n    vertical-align: middle;\r\n    -webkit-touch-callout: none;\r\n    -webkit-user-select: none;\r\n    -moz-user-select: none;\r\n    user-select: none;\r\n    /*!当前页,没有边框*/\r\n    /*!掠过*/\r\n    /*!禁用*/ }\r\n    .oni-pager .oni-pager-prev.oni-state-active, .oni-pager .oni-pager-next.oni-state-active, .oni-pager .oni-pager-item.oni-state-active {\r\n      color: #ff8888;\r\n      border: 0 none;\r\n      padding: 1px 11px;\r\n      cursor: default;\r\n      background: transparent; }\r\n    .oni-pager .oni-pager-prev.oni-state-hover, .oni-pager .oni-pager-next.oni-state-hover, .oni-pager .oni-pager-item.oni-state-hover {\r\n      border-color: #ff8888; }\r\n    .oni-pager .oni-pager-prev.oni-state-disabled, .oni-pager .oni-pager-next.oni-state-disabled, .oni-pager .oni-pager-item.oni-state-disabled {\r\n      border-color: #d9d9d9;\r\n      background-color: whitesmoke;\r\n      color: #999999;\r\n      cursor: default; }\r\n  .oni-pager .oni-pager-omit {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    height: 24px;\r\n    line-height: 24px;\r\n    margin-right: 5px;\r\n    padding: 1px 0;\r\n    vertical-align: middle;\r\n    font-size: 12px;\r\n    -webkit-touch-callout: none;\r\n    -webkit-user-select: none;\r\n    -moz-user-select: none;\r\n    user-select: none;\r\n    cursor: default; }\r\n  .oni-pager .oni-pager-jump {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    vertical-align: middle;\r\n    padding-left: 5px;\r\n    padding-right: 5px;\r\n    vertical-align: middle; }\r\n  .oni-pager .oni-pager-textbox-wrapper {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    width: 26px;\r\n    margin-left: 5px;\r\n    margin-right: 5px;\r\n    padding: 3px 5px;\r\n    vertical-align: middle;\r\n    font-size: 0;\r\n    outline: none;\r\n    background-color: white;\r\n    border: 1px solid #d4d4d4; }\r\n  .oni-pager .oni-pager-textbox {\r\n    display: inline;\r\n    float: left;\r\n    position: relative;\r\n    width: 26px;\r\n    height: 18px;\r\n    line-height: 18px;\r\n    padding: 0;\r\n    border: 0 none;\r\n    font-size: 12px;\r\n    outline: medium none;\r\n    vertical-align: middle;\r\n    text-align: center;\r\n    color: #333333;\r\n    background: #fff; }\r\n  .oni-pager .oni-pager-button {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    overflow: visible;\r\n    _overflow-y: hidden;\r\n    height: 26px;\r\n    margin-left: 5px;\r\n    border-radius: 2px;\r\n    outline: none;\r\n    cursor: pointer;\r\n    font-size: 12px;\r\n    vertical-align: middle;\r\n    padding: 0 10px;\r\n    text-decoration: none;\r\n    border: 1px solid #ccc;\r\n    background-color: #f8f8f8;\r\n    color: #333; }\r\n    .oni-pager .oni-pager-button:hover {\r\n      border-color: #bbb; }\r\n  .oni-pager .oni-pager-text {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    font-size: 12px;\r\n    vertical-align: middle; }\r\n\r\n/*\r\n这是每个都组件都应该引用的部分\r\n*/\r\ndiv.oni-scrollbar {\r\n  position: absolute;\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0; }\r\n\r\n.oni-scrollbar {\r\n  width: 10px;\r\n  height: 100%;\r\n  left: auto;\r\n  right: 0;\r\n  top: 0;\r\n  bottom: auto;\r\n  background: #f8f8f8;\r\n  z-index: 100;\r\n  transition: opacity .5s;\r\n  -webkit-transition: opacity .5s;\r\n  -moz-transition: opacity .5s;\r\n  -o-transition: opacity .5s;\r\n  -ms-transition: opacity .5s; }\r\n  .oni-scrollbar-arrow {\r\n    position: absolute;\r\n    background: #eeeeee;\r\n    top: 0;\r\n    left: 0;\r\n    width: 10px;\r\n    height: 10px; }\r\n    .oni-scrollbar-arrow b {\r\n      width: 0;\r\n      height: 0;\r\n      line-height: 0;\r\n      font-size: 0;\r\n      border-top: 0 none;\r\n      border-right: 4px dashed transparent;\r\n      border-bottom: 4px solid #bcbcbc;\r\n      border-left: 4px dashed transparent;\r\n      position: absolute;\r\n      top: 50%;\r\n      left: 50%;\r\n      margin-top: -2px;\r\n      margin-left: -4px;\r\n      font-size: 0;\r\n      line-height: 0; }\r\n    div .oni-scrollbar-arrow-down {\r\n      top: auto;\r\n      bottom: 0; }\r\n      div .oni-scrollbar-arrow-down b {\r\n        width: 0;\r\n        height: 0;\r\n        line-height: 0;\r\n        font-size: 0;\r\n        border-top: 4px solid #bcbcbc;\r\n        border-right: 4px dashed transparent;\r\n        border-bottom: 0;\r\n        border-left: 4px dashed transparent; }\r\n  .oni-scrollbar .oni-state-hover {\r\n    background: #aaaaaa; }\r\n  .oni-scrollbar .oni-state-active {\r\n    background: #999999; }\r\n  .oni-scrollbar .oni-state-disabled {\r\n    background: #e9e9e9; }\r\n  .oni-scrollbar-left .oni-state-active b.oni-scrollbar-trangle-up, .oni-scrollbar-right .oni-state-active b.oni-scrollbar-trangle-up {\r\n    width: 0;\r\n    height: 0;\r\n    line-height: 0;\r\n    font-size: 0;\r\n    border-top: 0 none;\r\n    border-right: 4px dashed transparent;\r\n    border-bottom: 4px solid white;\r\n    border-left: 4px dashed transparent; }\r\n  .oni-scrollbar-left .oni-state-active b.oni-scrollbar-trangle-down, .oni-scrollbar-right .oni-state-active b.oni-scrollbar-trangle-down {\r\n    width: 0;\r\n    height: 0;\r\n    line-height: 0;\r\n    font-size: 0;\r\n    border-top: 4px solid white;\r\n    border-right: 4px dashed transparent;\r\n    border-bottom: 0;\r\n    border-left: 4px dashed transparent; }\r\n  .oni-scrollbar-top .oni-state-active b.oni-scrollbar-trangle-up, .oni-scrollbar-bottom .oni-state-active b.oni-scrollbar-trangle-up {\r\n    width: 0;\r\n    height: 0;\r\n    line-height: 0;\r\n    font-size: 0;\r\n    border-top: 4px dashed transparent;\r\n    border-right: 4px solid white;\r\n    border-bottom: 4px dashed transparent;\r\n    border-left: 0; }\r\n  .oni-scrollbar-top .oni-state-active b.oni-scrollbar-trangle-down, .oni-scrollbar-bottom .oni-state-active b.oni-scrollbar-trangle-down {\r\n    width: 0;\r\n    height: 0;\r\n    line-height: 0;\r\n    font-size: 0;\r\n    border-top: 4px dashed transparent;\r\n    border-right: 0;\r\n    border-bottom: 4px dashed transparent;\r\n    border-left: 4px solid white; }\r\n  .oni-scrollbar-scroller {\r\n    overflow: hidden; }\r\n  .oni-scrollbar-left {\r\n    left: 0;\r\n    right: auto; }\r\n  .oni-scrollbar-top {\r\n    width: 100%;\r\n    height: 10px;\r\n    left: 0;\r\n    top: 0;\r\n    bottom: auto; }\r\n  .oni-scrollbar-bottom {\r\n    width: 100%;\r\n    height: 10px;\r\n    left: 0;\r\n    top: auto;\r\n    bottom: 0; }\r\n  .oni-scrollbar-draggerpar {\r\n    position: absolute;\r\n    left: 0;\r\n    top: 0;\r\n    width: 100%;\r\n    height: 100%; }\r\n    .oni-scrollbar-draggerpar .oni-scrollbar-dragger {\r\n      position: absolute;\r\n      width: 100%;\r\n      left: 0;\r\n      background: #cccccc; }\r\n    .oni-scrollbar-draggerpar .oni-state-hover {\r\n      background: #999999; }\r\n    .oni-scrollbar-draggerpar .oni-state-active {\r\n      background: #888888; }\r\n    .oni-scrollbar-draggerpar .oni-state-disabled {\r\n      background: #e9e9e9; }\r\n  .oni-scrollbar-top .oni-scrollbar-ragger, .oni-scrollbar-bottom .oni-scrollbar-ragger {\r\n    height: 100%;\r\n    width: auto;\r\n    top: 0; }\r\n  .oni-scrollbar-top .oni-scrollbar-arrow b, .oni-scrollbar-bottom .oni-scrollbar-arrow b {\r\n    width: 0;\r\n    height: 0;\r\n    line-height: 0;\r\n    font-size: 0;\r\n    border-top: 4px dashed transparent;\r\n    border-right: 4px solid #bcbcbc;\r\n    border-bottom: 4px dashed transparent;\r\n    border-left: 0;\r\n    margin-top: -4px;\r\n    margin-left: -2px; }\r\n  .oni-scrollbar-top .oni-scrollbar-arrow-down, .oni-scrollbar-bottom .oni-scrollbar-arrow-down {\r\n    right: 0;\r\n    left: auto; }\r\n    .oni-scrollbar-top .oni-scrollbar-arrow-down b, .oni-scrollbar-bottom .oni-scrollbar-arrow-down b {\r\n      width: 0;\r\n      height: 0;\r\n      line-height: 0;\r\n      font-size: 0;\r\n      border-top: 4px dashed transparent;\r\n      border-right: 0;\r\n      border-bottom: 4px dashed transparent;\r\n      border-left: 4px solid #bcbcbc; }\r\n\r\n.oni-scrollbar-large {\r\n  width: 14px; }\r\n  .oni-scrollbar-large .oni-scrollbar-arrow {\r\n    width: 14px;\r\n    height: 14px; }\r\n  .oni-scrollbar-large .oni-scrollbar-top, .oni-scrollbar-large .oni-scrollbar-bottom {\r\n    height: 14px; }\r\n\r\n.oni-scrollbar-bottom-large {\r\n  height: 14px; }\r\n\r\n.oni-scrollbar-small {\r\n  width: 8px; }\r\n  .oni-scrollbar-small .oni-scrollbar-arrow {\r\n    width: 8px;\r\n    height: 8px; }\r\n\r\n.oni-scrollbar-bottom-small {\r\n  height: 8px; }\r\n\r\n.ui-scrollbar-scroller {\r\n  overflow: hidden; }\r\n\r\n.oni-dropdown {\r\n    font: normal 12px/1.5 tahoma, arial, \'Hiragino Sans GB\', \'\\5b8b\\4f53\', sans-serif; }\r\n\r\n/*\r\n这是每个都组件都应该引用的部分\r\n*/\r\n.oni-dropdown {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    outline: none; }\r\n.oni-dropdown .oni-dropdown-source {\r\n    border: 1px solid #cccccc;\r\n    background-color: white;\r\n    cursor: pointer; }\r\n.oni-dropdown .oni-dropdown-source .oni-dropdown-input {\r\n    display: -moz-inline-stack;\r\n    display: inline-block;\r\n    vertical-align: middle;\r\n    *vertical-align: auto;\r\n    zoom: 1;\r\n    *display: inline;\r\n    white-space: nowrap;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    -ms-text-overflow: ellipsis;\r\n    -o-text-overflow: ellipsis;\r\n    text-overflow: ellipsis;\r\n    overflow: hidden;\r\n    height: 18px;\r\n    padding: 3px 21px 3px 6px;\r\n    word-break: normal;\r\n    word-wrap: normal; }\r\n.oni-dropdown .oni-icon {\r\n    cursor: pointer;\r\n    font-size: 12px;\r\n    vertical-align: baseline; }\r\n.oni-dropdown.oni-state-hover .oni-dropdown-source {\r\n    border-color: #999999; }\r\n.oni-dropdown.oni-state-focus .oni-dropdown-source {\r\n    border-color: #3775c0; }\r\n.oni-dropdown.oni-state-disabled .oni-dropdown-source {\r\n    background-color: whitesmoke;\r\n    border-color: #d9d9d9;\r\n    color: #cccccc;\r\n    cursor: default; }\r\n.oni-dropdown.oni-state-disabled .oni-dropdown-icon {\r\n    cursor: default; }\r\n.oni-dropdown.oni-state-small .oni-dropdown-source {\r\n    border-radius: 2px; }\r\n.oni-dropdown.oni-state-small .oni-dropdown-input {\r\n    padding-top: 1px;\r\n    padding-bottom: 1px; }\r\n.oni-dropdown.oni-state-small .oni-dropdown-icon {\r\n    top: -19px; }\r\n.oni-dropdown.oni-state-error .oni-dropdown-source {\r\n    border-color: #ff8888; }\r\n.oni-dropdown.oni-state-error:hover .oni-dropdown-source {\r\n    border-color: #ff8888; }\r\n.oni-dropdown .oni-dropdown-icon {\r\n    display: none;\r\n    color: #b5b5b5;\r\n    cursor: pointer;\r\n    padding: 0 6px;\r\n    position: absolute;\r\n    right: 0;\r\n    text-align: center;\r\n    top: -21px; }\r\n.oni-dropdown .oni-dropdown-icon-wrap {\r\n    display: block;\r\n    position: relative;\r\n    height: 0; }\r\n.oni-dropdown .oni-dropdown-icon-wrap .oni-icon-angle-down {\r\n    display: block; }\r\n.oni-dropdown .oni-dropdown-icon-wrap .oni-icon-angle-up {\r\n    display: block; }\r\n.oni-dropdown.oni-dropdown-menu {\r\n    display: none;\r\n    left: 0;\r\n    position: absolute;\r\n    top: -1px;\r\n    width: 100%;\r\n    _width: auto !important;\r\n    z-index: 1001; }\r\n.oni-dropdown .oni-dropdown-menu-inner {\r\n    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.1);\r\n    background-color: white;\r\n    border: 1px solid #d4d4d4;\r\n    overflow-y: scroll;\r\n    padding: 3px 0; }\r\n.oni-dropdown .oni-dropdown-item {\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    -ms-text-overflow: ellipsis;\r\n    -o-text-overflow: ellipsis;\r\n    text-overflow: ellipsis;\r\n    -webkit-touch-callout: none;\r\n    -webkit-user-select: none;\r\n    -moz-user-select: none;\r\n    user-select: none;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    *zoom: 1;\r\n    width: 100%;\r\n    padding: 3px 0;\r\n    height: 24px;\r\n    line-height: 24px;\r\n    text-indent: 20px;\r\n    cursor: pointer;\r\n    word-break: normal;\r\n    word-wrap: normal; }\r\n.oni-dropdown .oni-dropdown-item.oni-dropdown-group {\r\n    font-size: 14px;\r\n    font-weight: bold;\r\n    text-indent: 10px; }\r\n.oni-dropdown .oni-dropdown-item.oni-dropdown-divider {\r\n    border-top: 1px solid #f2f2f2; }\r\n.oni-dropdown .oni-dropdown-item.oni-state-disabled {\r\n    border-color: #d9d9d9;\r\n    background-color: whitesmoke;\r\n    color: #999999; }\r\n.oni-dropdown .oni-dropdown-item.oni-state-hover {\r\n    border-color: #f8f8f8;\r\n    background-color: #f8f8f8;\r\n    color: black; }\r\n.oni-dropdown .oni-dropdown-item.oni-state-active {\r\n    border-color: #3775c0;\r\n    background-color: #3775c0;\r\n    color: white; }\r\n.oni-dropdown .oni-dropdown-item.oni-state-active .oni-icon {\r\n    color: white; }\r\n/*\r\n这是每个都组件都应该引用的部分\r\n*/\r\n.oni-slider { position: relative; text-align: left; display: -moz-inline-stack; display: inline-block; vertical-align: middle; *vertical-align: auto; zoom: 1; *display: inline; width: 100%; background: #e6e6e6; }\r\n.oni-slider .oni-helper-hidden-accessible { position: absolute; height: 1px; width: 1px; overflow: hidden; border: 0 none; margin: -1px; padding: 0; clip: rect(0px 0px 0px 0px); }\r\n.oni-slider .oni-corner-all { -webkit-border-radius: 5px; -moz-border-radius: 5px; -ms-border-radius: 5px; -o-border-radius: 5px; border-radius: 5px; }\r\n.oni-slider .oni-slider-handle { position: absolute; display: block; cursor: default; height: 14px; width: 14px; line-height: 0px; z-index: 2; -webkit-border-radius: 7px; -moz-border-radius: 7px; -ms-border-radius: 7px; -o-border-radius: 7px; border-radius: 7px; font-size: 0px; background: #3775c0; }\r\n.oni-slider .oni-slider-handle.oni-state-hover { background: #82aadb; }\r\n.oni-slider .oni-slider-handle.oni-state-active, .oni-slider .oni-slider-handle.oni-state-focus { background: #22dddd; }\r\n.oni-slider .oni-slider-range { position: absolute; display: block; z-index: 1; line-height: 0px; border: 0 none; font-size: 0px; background: #afd9fc; }\r\n.oni-slider.oni-slider-vertical { height: 100px; width: 8px; }\r\n.oni-slider.oni-slider-vertical .oni-slider-handle { left: -3px; margin-bottom: -7px; margin-left: 0; margin-top: -7px; }\r\n.oni-slider.oni-slider-vertical .oni-slider-range { left: 0; width: 100%; }\r\n.oni-slider.oni-slider-vertical .oni-slider-range.oni-slider-range-min { bottom: 0; }\r\n.oni-slider.oni-slider-vertical .oni-slider-range.oni-slider-range-max { top: 0; }\r\n.oni-slider.oni-slider-horizontal { height: 8px; }\r\n.oni-slider.oni-slider-horizontal .oni-slider-handle { margin-left: -7px; top: -3px; }\r\n.oni-slider.oni-slider-horizontal .oni-slider-range { height: 100%; top: 0; }\r\n.oni-slider.oni-slider-horizontal .oni-slider-range.oni-slider-range-min { left: 0; }\r\n.oni-slider.oni-slider-horizontal .oni-slider-range.oni-slider-range-max { right: 0; }\r\n.oni-slider.oni-state-disabled .oni-slider-handle, .oni-slider.oni-state-disabled .oni-slider-range { background: #ccc; }\r\n@charset \"UTF-8\";\r\n/*\r\n这是每个都组件都应该引用的部分\r\n*/\r\n.oni-datepicker {\r\n  position: relative;\r\n  display: block;\r\n  font-size: 0;\r\n  white-space: nowrap;\r\n  color: #333;\r\n  z-index: 10;\r\n  width: auto;\r\n  margin-left: -1px; }\r\n  .oni-datepicker tr, .oni-datepicker td, .oni-datepicker th {\r\n    border: 0; }\r\n  .oni-datepicker .oni-icon {\r\n    text-indent: 0; }\r\n  .oni-datepicker .oni-icon-calendar-o {\r\n    padding: 0 6px;\r\n    vertical-align: top;\r\n    text-indent: 0;\r\n    display: inline; }\r\n  .oni-datepicker .oni-dropdown-source {\r\n    margin-top: -2px;\r\n    *margin-top: 0; }\r\n    .oni-datepicker .oni-dropdown-source .oni-dropdown-input {\r\n      padding: 0 21px 0 6px;\r\n      line-height: 20px;\r\n      height: 20px; }\r\n    .oni-datepicker .oni-dropdown-source .oni-dropdown-icon {\r\n      top: -20px;\r\n      line-height: 20px; }\r\n\r\n.oni-datepicker-wrapper {\r\n  padding: 9px 0 9px 10px;\r\n  border: 1px solid #cccccc;\r\n  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.1);\r\n  position: absolute;\r\n  background: #fff; }\r\n\r\n.oni-datepicker-wrapper-right {\r\n  right: -1px; }\r\n\r\n.oni-datepicker-wrapper-top {\r\n  bottom: 24px; }\r\n\r\n.oni-datepicker-wrapper-top-right {\r\n  bottom: 24px;\r\n  right: -1px; }\r\n\r\n.oni-datepicker-content {\r\n  border: 1px solid #e5e5e5;\r\n  font-size: 12px;\r\n  margin-right: 10px;\r\n  background: #fff; }\r\n\r\n.oni-datepicker-label {\r\n  background-color: #f8f8f8;\r\n  border-bottom: 1px solid #e5e5e5;\r\n  font-weight: 700;\r\n  padding: 7px 0;\r\n  text-align: center; }\r\n\r\n.oni-datepicker-timer {\r\n  border-top: 1px solid #efefef;\r\n  padding: 5px 0; }\r\n  .oni-datepicker-timer .oni-btn {\r\n    height: 26px;\r\n    overflow: visible;\r\n    _overflow-y: hidden;\r\n    padding: 0 10px;\r\n    -webkit-border-radius: 2px;\r\n    -moz-border-radius: 2px;\r\n    -ms-border-radius: 2px;\r\n    -o-border-radius: 2px;\r\n    border-radius: 2px;\r\n    font-size: 12px;\r\n    color: #333333;\r\n    background-color: #f8f8f8;\r\n    border: 1px solid #cccccc;\r\n    cursor: pointer; }\r\n  .oni-datepicker-timer .oni-btn:hover {\r\n    box-shadow: 1px 1px 0 0 rgba(0, 0, 0, 0.1);\r\n    background-color: #f8f8f8;\r\n    border-color: #bbbbbb;\r\n    color: #333333; }\r\n  .oni-datepicker-timer .oni-btn-small {\r\n    height: 22px;\r\n    padding: 0 5px;\r\n    font-size: 12px; }\r\n  .oni-datepicker-timer p, .oni-datepicker-timer label {\r\n    margin: 0; }\r\n    .oni-datepicker-timer p span, .oni-datepicker-timer label span {\r\n      display: -moz-inline-stack;\r\n      display: inline-block;\r\n      vertical-align: middle;\r\n      *vertical-align: auto;\r\n      zoom: 1;\r\n      *display: inline;\r\n      width: 50px; }\r\n\r\n.oni-datepicker-content-content {\r\n  padding: 0 10px;\r\n  position: relative;\r\n  display: -moz-inline-stack;\r\n  display: inline-block;\r\n  vertical-align: middle;\r\n  *vertical-align: auto;\r\n  zoom: 1;\r\n  *display: inline;\r\n  white-space: normal;\r\n  word-break: break-word; }\r\n\r\n.oni-datepicker-watermark {\r\n  position: absolute;\r\n  top: 60px;\r\n  left: 10px;\r\n  background: transparent;\r\n  color: #000;\r\n  _color: #f2f2f2;\r\n  filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=5);\r\n  opacity: 0.05;\r\n  text-align: center; }\r\n\r\n.oni-datepicker-month-year span {\r\n  display: block;\r\n  width: 23%;\r\n  height: 42px;\r\n  line-height: 42px;\r\n  float: left;\r\n  margin: 1%;\r\n  cursor: pointer;\r\n  text-align: center;\r\n  _margin-left: -1px; }\r\n.oni-datepicker-month-year .oni-datepicker-prev, .oni-datepicker-month-year .oni-datepicker-next {\r\n  height: auto;\r\n  line-height: auto;\r\n  position: relative;\r\n  width: auto; }\r\n.oni-datepicker-month-year .oni-datepicker-day-hover {\r\n  background: #dbebff; }\r\n.oni-datepicker-month-year .oni-datepicker-selected {\r\n  background: #3775c0;\r\n  color: #fff; }\r\n.oni-datepicker-month-year .oni-datepicker-prev-year, .oni-datepicker-month-year .oni-datepicker-next-year {\r\n  color: #999999; }\r\n.oni-datepicker-month-year .oni-state-disabled {\r\n  color: #cccccc;\r\n  cursor: default;\r\n  background: transparent; }\r\n\r\n.oni-datepicker-header {\r\n  position: relative;\r\n  height: 30px;\r\n  line-height: 30px; }\r\n\r\n.oni-datepicker .oni-datepicker-prev, .oni-datepicker .oni-datepicker-next {\r\n  color: #3775c0;\r\n  cursor: pointer;\r\n  height: 30px;\r\n  line-height: 30px;\r\n  position: absolute;\r\n  text-align: center;\r\n  width: 20px;\r\n  z-index: 1; }\r\n\r\n.oni-datepicker .oni-datepicker-prev {\r\n  left: 0; }\r\n\r\n.oni-datepicker .oni-datepicker-next {\r\n  right: 0; }\r\n\r\n.oni-datepicker-content-content .oni-datepicker-prev {\r\n  left: 0;\r\n  top: 0; }\r\n\r\n.oni-datepicker-content-content .oni-datepicker-next {\r\n  right: 0;\r\n  top: 0; }\r\n\r\n.oni-datepicker .oni-datepicker-prev-disabled, .oni-datepicker .oni-datepicker-next-disabled {\r\n  color: #cccccc;\r\n  cursor: default; }\r\n\r\n.oni-datepicker-title {\r\n  color: #3775c0;\r\n  font-weight: 700;\r\n  text-align: center; }\r\n  .oni-datepicker-title span.oni-state-hover {\r\n    background: #dbebff;\r\n    padding: 5px 10px; }\r\n\r\n.oni-datepicker-calendar-days {\r\n  height: 150px;\r\n  position: relative;\r\n  z-index: 20; }\r\n\r\n.oni-datepicker-calendar-week, .oni-datepicker-calendar-days {\r\n  border-collapse: collapse;\r\n  margin-bottom: 5px;\r\n  table-layout: fixed;\r\n  width: 100%;\r\n  border-spacing: 0; }\r\n\r\n.oni-datepicker-calendar-week th {\r\n  border-bottom: 1px solid #efefef;\r\n  border-top: 1px solid #efefef;\r\n  padding: 3px 0;\r\n  text-align: center;\r\n  line-height: 18px;\r\n  font-weight: 400;\r\n  font-size: 12px; }\r\n\r\n.oni-datepicker-week-end, .oni-datepicker-calendar-days .oni-datepicker-week-end {\r\n  color: #ff5555; }\r\n\r\n.oni-datepicker-calendar-days td {\r\n  color: #333333;\r\n  cursor: pointer;\r\n  text-align: center;\r\n  line-height: 18px;\r\n  padding: 3px 0;\r\n  background: transparent; }\r\n\r\n.oni-datepicker-default {\r\n  background: #fff; }\r\n\r\n.oni-datepicker-calendar-days .oni-datepicker-day-hover {\r\n  background: #dbebff; }\r\n\r\n.oni-datepicker-today {\r\n  font-family: pmingliu, arial, sans-serif;\r\n  font-size: 11px; }\r\n\r\n@media screen and (-webkit-transform-2d: 1) {\r\n  .oni-datepicker-today {\r\n    /* font-size: 12px; */\r\n    -webkit-transform: scale(0.91667); } }\r\n.oni-datepicker-day-none {\r\n  cursor: auto; }\r\n\r\n.oni-datepicker-calendar-days .oni-datepicker-selected {\r\n  background: #3775c0;\r\n  color: #fff; }\r\n\r\n.oni-datepicker-calendar-days .oni-state-disabled {\r\n  color: #cccccc;\r\n  cursor: default;\r\n  background: transparent; }\r\n\r\n.oni-datepicker-multiple .oni-datepicker-content {\r\n  border-right: 0; }\r\n.oni-datepicker-multiple .oni-datepicker-content-content {\r\n  border-right: 1px solid #e5e5e5; }\r\n\r\n.oni-datepicker-dropdown .oni-dropdown-item {\r\n  color: #333333;\r\n  font-size: 12px;\r\n  padding: 0;\r\n  text-indent: 0;\r\n  text-align: center; }\r\n.oni-datepicker-dropdown .oni-dropdown-item-hover {\r\n  background: #f5f5f5; }\r\n.oni-datepicker-dropdown .oni-dropdown-item-selected {\r\n  background: #3775c0; }\r\n.oni-datepicker-dropdown .oni-dropdown:hover .oni-dropdown-source {\r\n  border-color: #3775c0;\r\n  border-bottom-color: #cccccc; }\r\n\r\n.oni-datepicker-input-wrapper {\r\n  background: #ffffff;\r\n  border: 1px solid #cccccc;\r\n  cursor: pointer;\r\n  color: #333;\r\n  font-size: 12px;\r\n  position: relative;\r\n  display: inline-block;\r\n  *display: inline;\r\n  zoom: 1;\r\n  z-index: 1; }\r\n  .oni-datepicker-input-wrapper input {\r\n    border: 0 none;\r\n    cursor: pointer;\r\n    outline: none;\r\n    padding: 3px 90px 3px 6px;\r\n    width: 90px;\r\n    height: 18px;\r\n    margin: 0;\r\n    font-size: 12px; }\r\n\r\n.oni-datepicker-tip {\r\n  position: absolute;\r\n  top: 3px;\r\n  right: 10px;\r\n  line-height: 18px;\r\n  height: 18px;\r\n  color: #b5b5b5; }\r\n\r\n.oni-datepicker-active {\r\n  border-color: #3775c0; }\r\n\r\n/*# sourceMappingURL=avalon.datepicker.css.map */\r\n');
