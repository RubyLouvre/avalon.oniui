//=========================================
//  数据交互模块 by 司徒正美
//==========================================
define(["avalon", "../mmPromise/mmPromise"], function(avalon) {
    var global = this || (0, eval)("this")
    var DOC = global.document
    var encode = encodeURIComponent
    var decode = decodeURIComponent

    var rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/
    var rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg
    var rnoContent = /^(?:GET|HEAD)$/
    var rprotocol = /^\/\//
    var rhash = /#.*$/
    var rquery = /\?/
    var rjsonp = /(=)\?(?=&|$)|\?\?/
    var r20 = /%20/g

    var originAnchor = document.createElement("a")
    originAnchor.href = location.href
    //告诉WEB服务器自己接受什么介质类型，*/* 表示任何类型，type/* 表示该类型下的所有子类型，type/sub-type。
    var accepts = {
        xml: "application/xml, text/xml",
        html: "text/html",
        text: "text/plain",
        json: "application/json, text/javascript",
        script: "text/javascript, application/javascript",
        "*": ["*/"] + ["*"] //避免被压缩掉
    }

    function IE() {
        if (window.VBArray) {
            var mode = document.documentMode
            return mode ? mode : window.XMLHttpRequest ? 7 : 6
        } else {
            return 0
        }
    }
    var useOnload = IE() === 0 || IE() > 8

    function parseJS(code) {
        var indirect = eval
        code = code.trim()
        if (code) {
            if (code.indexOf("use strict") === 1) {
                var script = document.createElement("script")
                script.text = code
                head.appendChild(script).parentNode.removeChild(script)
            } else {
                indirect(code)
            }
        }
    }

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0
            return this.lastIndexOf(searchString, position) === position
        }
    }

    var head = DOC.getElementsByTagName("head")[0] //HEAD元素
    var isLocal = false
    try {
        //在IE下如果重置了document.domain，直接访问window.location会抛错，但用document.URL就ok了
        //http://www.cnblogs.com/WuQiang/archive/2012/09/21/2697474.html
        isLocal = rlocalProtocol.test(location.protocol)
    } catch (e) {}

    new function() {
        //http://www.cnblogs.com/rubylouvre/archive/2010/04/20/1716486.html
        var s = ["XMLHttpRequest",
            "ActiveXObject('MSXML2.XMLHTTP.6.0')",
            "ActiveXObject('MSXML2.XMLHTTP.3.0')",
            "ActiveXObject('MSXML2.XMLHTTP')",
            "ActiveXObject('Microsoft.XMLHTTP')"
        ]
        s[0] = IE() < 8 && IE() !== 0 && isLocal ? "!" : s[0] //IE下只能使用ActiveXObject
        for (var i = 0, axo; axo = s[i++];) {
            try {
                if (eval("new " + axo)) {
                    avalon.xhr = new Function("return new " + axo)
                    break
                }
            } catch (e) {}
        }}
    var supportCors = "withCredentials" in avalon.xhr()




    function parseXML(data, xml, tmp) {
        try {
            var mode = document.documentMode
            if (window.DOMParser && (!mode || mode > 8)) { // Standard
                tmp = new DOMParser()
                xml = tmp.parseFromString(data, "text/xml")
            } else { // IE
                xml = new ActiveXObject("Microsoft.XMLDOM") //"Microsoft.XMLDOM"
                xml.async = "false"
                xml.loadXML(data)
            }
        } catch (e) {
            xml = void 0
        }
        if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
            avalon.error("Invalid XML: " + data)
        }
        return xml
    }

    //ajaxExtend是一个非常重要的内部方法，负责将用法参数进行规整化
    //1. data转换为字符串
    //2. type转换为大写
    //3. url正常化，加querystring, 加时间戮
    //4. 判定有没有跨域
    //5. 添加hasContent参数
    var defaults = {
        type: "GET",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        async: true,
        jsonp: "callback"
    }
    function ajaxExtend(opts) {
        opts = avalon.mix({}, defaults, opts)
        opts.type = opts.type.toUpperCase()
        var querystring = typeof opts.data === "string" ? opts.data : avalon.param(opts.data)
        opts.querystring = querystring || ""
        opts.url = opts.url.replace(rhash, "").replace(rprotocol, location.protocol + "//")

        if (typeof opts.crossDomain !== "boolean") { //判定是否跨域
            var urlAnchor = document.createElement("a")
            // Support: IE6-11+
            // IE throws exception if url is malformed, e.g. http://example.com:80x/
            try {
                urlAnchor.href = opts.url
                // in IE7-, get the absolute path
                var absUrl = !"1"[0] ? urlAnchor.getAttribute("href", 4) : urlAnchor.href
                urlAnchor.href = absUrl
                opts.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host
            } catch (e) {
                opts.crossDomain = true
            }
        }
        opts.hasContent = !rnoContent.test(opts.type) //是否为post请求
        if (!opts.hasContent) {
            if (querystring) { //如果为GET请求,则参数依附于url上
                opts.url += (rquery.test(opts.url) ? "&" : "?") + querystring
            }
            if (opts.cache === false) { //添加时间截
                opts.url += (rquery.test(opts.url) ? "&" : "?") + "_time=" + (new Date() - 0)
            }
        }
        return opts
    }
    /**
     * 伪XMLHttpRequest类,用于屏蔽浏览器差异性
     * var ajax = new(self.XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP")
     * ajax.onreadystatechange = function(){
     *   if (ajax.readyState==4 && ajax.status==200){
     *        alert(ajax.responseText)
     *   }
     * }
     * ajax.open("POST", url, true) 
     * ajax.send("key=val&key1=val2") 
     */
    var XHRMethods = {
        setRequestHeader: function(name, value) {
            this.requestHeaders[name] = value
            return this
        },
        getAllResponseHeaders: function() {
            return this.readyState === 4 ? this.responseHeadersString : null
        },
        getResponseHeader: function(name, match) {
            if (this.readyState === 4) {
                while ((match = rheaders.exec(this.responseHeadersString))) {
                    this.responseHeaders[match[1]] = match[2]
                }
                match = this.responseHeaders[name]
            }
            return match === undefined ? null : match
        },
        overrideMimeType: function(type) {
            this.mimeType = type
            return this
        },
        // 中止请求
        abort: function(statusText) {
            statusText = statusText || "abort"
            if (this.transport) {
                this.respond(0, statusText)
            }
            return this
        },
        /**
         * 用于派发success,error,complete等回调
         * http://www.cnblogs.com/rubylouvre/archive/2011/05/18/2049989.html
         * @param {Number} status 状态码
         * @param {String} statusText 对应的扼要描述
         */
        dispatch: function(status, nativeStatusText) {
            var statusText = nativeStatusText
            // 只能执行一次，防止重复执行
            if (!this.transport) { //2:已执行回调
                return
            }
            this.readyState = 4
            var isSuccess = status >= 200 && status < 300 || status === 304
            if (isSuccess) {
                if (status === 204) {
                    statusText = "nocontent"
                } else if (status === 304) {
                    statusText = "notmodified"
                } else {
                    //如果浏览器能直接返回转换好的数据就最好不过,否则需要手动转换
                    if (typeof this.response === "undefined") {
                        var dataType = this.options.dataType || this.options.mimeType
                        if (!dataType && this.responseText || this.responseXML) { //如果没有指定dataType，则根据mimeType或Content-Type进行揣测
                            dataType = this.getResponseHeader("Content-Type") || ""
                            dataType = dataType.match(/json|xml|script|html/) || ["text"]
                            dataType = dataType[0]
                        }
                        var responseText = this.responseText || '',
                            responseXML = this.responseXML || ''
                        try {
                            this.response = avalon.ajaxConverters[dataType].call(this, responseText, responseXML)
                        } catch (e) {
                            isSuccess = false
                            this.error = e
                            statusText = "parsererror"
                        }
                    }
                }
            }
            this.status = status
            this.statusText = statusText + ""
            if (this.timeoutID) {
                clearTimeout(this.timeoutID)
                delete this.timeoutID
            }
            this._transport = this.transport
            // 到这要么成功，调用success, 要么失败，调用 error, 最终都会调用 complete
            if (isSuccess) {
                this._resolve([this.response, statusText, this])
            } else {
                this._reject([this, statusText, this.error])
            }
            delete this.transport
        }
    }
    //ajax主函数
    avalon.ajax = function(opts, promise) {
        if (!opts || !opts.url) {
            avalon.error("参数必须为Object并且拥有url属性")
        }
        opts = ajaxExtend(opts) //处理用户参数，比如生成querystring, type大写化
        //创建一个伪XMLHttpRequest,能处理complete,success,error等多投事件
        var XHRProperties = {
            responseHeadersString: "",
            responseHeaders: {},
            requestHeaders: {},
            querystring: opts.querystring,
            readyState: 0,
            uniqueID: ("" + Math.random()).replace(/0\./, ""),
            status: 0
        }
        var _reject, _resolve
        var promise = new avalon.Promise(function(resolve, reject) {
            _resolve = resolve
            _reject = reject
        })

        promise.options = opts
        promise._reject = _reject
        promise._resolve = _resolve

        var doneList = [],
            failList = []

        Array("done", "fail", "always").forEach(function(method) {
            promise[method] = function(fn) {
                if (typeof fn === "function") {
                    if (method !== "fail")
                        doneList.push(fn)
                    if (method !== "done")
                        failList.push(fn)
                }
                return this
            }
        })

        var isSync = opts.async === false
        if (isSync) {
            avalon.log("warnning:与jquery1.8一样,async:false这配置已经被废弃")
            promise.async = false
        }


        avalon.mix(promise, XHRProperties, XHRMethods)

        promise.then(function(value) {
            value = Array.isArray(value) ? value : value === void 0 ? [] : [value]
            for (var i = 0, fn; fn = doneList[i++];) {
                fn.apply(promise, value)
            }
            return value
        }, function(value) {
            value = Array.isArray(value) ? value : value === void 0 ? [] : [value]
            for (var i = 0, fn; fn = failList[i++];) {
                fn.apply(promise, value)
            }
            return value
        })


        promise.done(opts.success).fail(opts.error).always(opts.complete)

        var dataType = opts.dataType //目标返回数据类型
        var transports = avalon.ajaxTransports

        if ((opts.crossDomain && !supportCors || rjsonp.test(opts.url)) && dataType === "json" && opts.type === "GET") {
            dataType = opts.dataType = "jsonp"
        }
        var name = opts.form ? "upload" : dataType
        var transport = transports[name] || transports.xhr
        avalon.mix(promise, transport) //取得传送器的request, respond, preproccess
        if (promise.preproccess) { //这用于jsonp upload传送器
            dataType = promise.preproccess() || dataType
        }
        //设置首部 1、Content-Type首部
        if (opts.contentType) {
            promise.setRequestHeader("Content-Type", opts.contentType)
        }
        //2.处理Accept首部
        promise.setRequestHeader("Accept", accepts[dataType] ? accepts[dataType] + ", */*; q=0.01" : accepts["*"])
        for (var i in opts.headers) { //3. 处理headers里面的首部
            promise.setRequestHeader(i, opts.headers[i])
        }
        // 4.处理超时
        if (opts.async && opts.timeout > 0) {
            promise.timeoutID = setTimeout(function() {
                promise.abort("timeout")
                promise.dispatch(0, "timeout")
            }, opts.timeout)
        }
        promise.request()
        return promise
    }
    "get,post".replace(avalon.rword, function(method) {
        avalon[method] = function(url, data, callback, type) {
            if (typeof data === "function") {
                type = type || callback
                callback = data
                data = void 0
            }
            return avalon.ajax({
                type: method,
                url: url,
                data: data,
                success: callback,
                dataType: type
            })
        }
    })
    function ok(val) {
        return val
    }
    function ng(e) {
        throw e
    }
    avalon.getScript = function(url, callback) {
        return avalon.get(url, null, callback, "script")
    }
    avalon.getJSON = function(url, data, callback) {
        return avalon.get(url, data, callback, "json")
    }
    avalon.upload = function(url, form, data, callback, dataType) {
        if (typeof data === "function") {
            dataType = callback
            callback = data
            data = void 0
        }
        return avalon.ajax({
            url: url,
            type: "post",
            dataType: dataType,
            form: form,
            data: data,
            success: callback
        })
    }
    avalon.ajaxConverters = { //转换器，返回用户想要做的数据
        text: function(text) {
            // return text || "";
            return text
        },
        xml: function(text, xml) {
            return xml !== void 0 ? xml : parseXML(text)
        },
        html: function(text) {
            return avalon.parseHTML(text) //一个文档碎片,方便直接插入DOM树
        },
        json: function(text) {
            if (!avalon.parseJSON) {
                avalon.log("avalon.parseJSON不存在,请升级到最新版")
            }
            return avalon.parseJSON(text)
        },
        script: function(text) {
            parseJS(text)
            return text
        },
        jsonp: function() {
            var json, callbackName
            if (this.jsonpCallback.startsWith('avalon.')) {
                callbackName = this.jsonpCallback.replace(/avalon\./, '')
                json = avalon[callbackName]
                delete avalon[callbackName]
            } else {
                json = window[this.jsonpCallback]
            }
            return json
        }
    }

    avalon.param = function(a) {
        var prefix,
            s = [],
            add = function(key, value) {
                value = (value == null ? "" : value)
                s[s.length] = encode(key) + "=" + encode(value)
            }

        if (Array.isArray(a) || !avalon.isPlainObject(a)) {
            avalon.each(a, function(subKey, subVal) {
                add(subKey, subVal)
            })
        } else {
            for (prefix in a) {
                paramInner(prefix, a[prefix], add)
            }
        }

        // Return the resulting serialization
        return s.join("&").replace(r20, "+")
    }

    function paramInner(prefix, obj, add) {
        var name
        if (Array.isArray(obj)) {
            // Serialize array item.
            avalon.each(obj, function(i, v) {
                paramInner(prefix + "[" + (typeof v === "object" ? i : "") + "]", v, add)
            })
        } else if (avalon.isPlainObject(obj)) {
            // Serialize object item.
            for (name in obj) {
                paramInner(prefix + "[" + name + "]", obj[name], add)
            }
        } else {
            // Serialize scalar item.
            add(prefix, obj)
        }
    }

    //将一个字符串转换为对象
    avalon.unparam = function(input) {
        var items, temp,
            expBrackets = /\[(.*?)\]/g,
            expVarname = /(.+?)\[/,
            result = {}

        if ((temp = avalon.type(input)) != 'string' || (temp == 'string' && !temp.length))
            return {}
        if (input.indexOf("?") !== -1) {
            input = input.split("?").pop()
        }
        items = decode(input).split('&')

        if (!(temp = items.length) || (temp == 1 && temp === ''))
            return result

        items.forEach(function(item) {
            if (!item.length)
            return
            temp = item.split("=")
            var key = temp.shift(),
                value = temp.join('=').replace(/\+/g, ' '),
                size, link,
                subitems = []

            if (!key.length)
            return

            while ((temp = expBrackets.exec(key)))
            subitems.push(temp[1])

            if (!(size = subitems.length)) {
                result[key] = value
                return
            }
            size--
            temp = expVarname.exec(key)

            if (!temp || !(key = temp[1]) || !key.length)
            return

            if (avalon.type(result[key]) !== 'object')
                result[key] = {}

            link = result[key]

            avalon.each(subitems, function(subindex, subitem) {
                if (!(temp = subitem).length) {
                    temp = 0

                    avalon.each(link, function(num) {
                        if (!isNaN(num) && num >= 0 && (num % 1 === 0) && num >= temp)
                            temp = Number(num) + 1
                    })
                }
                if (subindex == size) {
                    link[temp] = value
                } else if (avalon.type(link[temp]) !== 'object') {
                    link = link[temp] = {}
                } else {
                    link = link[temp]
                }

            })

        })
        return result
    }

    var rinput = /select|input|button|textarea/i
    var rcheckbox = /radio|checkbox/
    var rline = /\r?\n/g
    function trimLine(val) {
        return val.replace(rline, "\r\n")
    }
    //表单元素变字符串, form为一个元素节点
    avalon.serialize = function(form) {
        var json = {}
        // 不直接转换form.elements，防止以下情况：   <form > <input name="elements"/><input name="test"/></form>
        Array.prototype.filter.call(form.getElementsByTagName("*"), function(el) {
            if (rinput.test(el.nodeName) && el.name && !el.disabled) {
                return rcheckbox.test(el.type) ? el.checked : true //只处理拥有name并且没有disabled的表单元素
            }
        }).forEach(function(el) {
            var val = avalon(el).val()
            val = Array.isArray(val) ? val.map(trimLine) : trimLine(val)
            var name = el.name
            if (name in json) {
                if (Array.isArray(val)) {
                    json[name].push(val)
                } else {
                    json[name] = [json[name], val]
                }
            } else {
                json[name] = val
            }
        })
        return avalon.param(json, false) // 名值键值对序列化,数组元素名字前不加 []
    }

    var transports = avalon.ajaxTransports = {
        xhr: {
            //发送请求
            request: function() {
                var self = this
                var opts = this.options
                var transport = this.transport = new avalon.xhr
                transport.open(opts.type, opts.url, opts.async, opts.username, opts.password)
                if (this.mimeType && transport.overrideMimeType) {
                    transport.overrideMimeType(this.mimeType)
                }
                //IE6下，如果transport中没有withCredentials，直接设置会报错
                if (opts.crossDomain && "withCredentials" in transport) {
                    transport.withCredentials = true
                }

                /*
                 * header 中设置 X-Requested-With 用来给后端做标示：
                 * 这是一个 ajax 请求。
                 *
                 * 在 Chrome、Firefox 3.5+ 和 Safari 4+ 下，
                 * 在进行跨域请求时设置自定义 header，会触发 preflighted requests，
                 * 会预先发送 method 为 OPTIONS 的请求。
                 *
                 * 于是，如果跨域，禁用此功能。
                 */
                if (!opts.crossDomain) {
                    this.requestHeaders["X-Requested-With"] = "XMLHttpRequest"
                }

                for (var i in this.requestHeaders) {
                    transport.setRequestHeader(i, this.requestHeaders[i] + "")
                }

                /*
                 * progress
                 */
                if (opts.progressCallback) {
                    // 判断是否 ie6-9
                    var isOldIE = document.all && !window.atob
                    if (!isOldIE) {
                        transport.upload.onprogress = opts.progressCallback
                    }
                }

                var dataType = opts.dataType
                if ("responseType" in transport && /^(blob|arraybuffer|text)$/.test(dataType)) {
                    transport.responseType = dataType
                    this.useResponseType = true
                }
                //必须要支持 FormData 和 file.fileList 的浏览器 才能用 xhr 发送
                //标准规定的 multipart/form-data 发送必须用 utf-8 格式， 记得 ie 会受到 document.charset 的影响
                transport.send(opts.hasContent && (this.formdata || this.querystring) || null)
                //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动发出请求

                if (!opts.async || transport.readyState === 4) {
                    this.respond()
                } else {
                    if (useOnload) { //如果支持onerror, onload新API
                        transport.onload = transport.onerror = function(e) {
                            this.readyState = 4 //IE9+
                            this.status = e.type === "load" ? 200 : 500
                            self.respond()
                        }
                    } else {
                        transport.onreadystatechange = function() {
                            self.respond()
                        }
                    }
                }
            },
            //用于获取原始的responseXMLresponseText 修正status statusText
            //第二个参数为1时中止清求
            respond: function(event, forceAbort) {
                var transport = this.transport
                if (!transport) {
                    return
                }
                // by zilong：避免abort后还继续派发onerror等事件
                if (forceAbort && this.timeoutID) {
                    clearTimeout(this.timeoutID)
                    delete this.timeoutID
                }
                try {
                    var completed = transport.readyState === 4
                    if (forceAbort || completed) {
                        transport.onreadystatechange = avalon.noop
                        if (useOnload) { //IE6下对XHR对象设置onerror属性可能报错
                            transport.onerror = transport.onload = null
                        }
                        if (forceAbort) {
                            if (!completed && typeof transport.abort === "function") { // 完成以后 abort 不要调用
                                transport.abort()
                            }
                        } else {
                            var status = transport.status
                            //设置responseText
                            var text = transport.responseText

                            this.responseText = typeof text === "string" ? text : void 0
                            //设置responseXML
                            try {
                                //当responseXML为[Exception: DOMException]时，
                                //访问它会抛“An attempt was made to use an object that is not, or is no longer, usable”异常
                                var xml = transport.responseXML
                                this.responseXML = xml.documentElement
                            } catch (e) {}
                            //设置response
                            if (this.useResponseType) {
                                this.response = transport.response
                            }
                            //设置responseHeadersString
                            this.responseHeadersString = transport.getAllResponseHeaders()

                            try { //火狐在跨城请求时访问statusText值会抛出异常
                                var statusText = transport.statusText
                            } catch (e) {
                                this.error = e
                                statusText = "firefoxAccessError"
                            }
                            //用于处理特殊情况,如果是一个本地请求,只要我们能获取数据就假当它是成功的
                            if (!status && isLocal && !this.options.crossDomain) {
                                status = this.responseText ? 200 : 404
                            //IE有时会把204当作为1223
                            } else if (status === 1223) {
                                status = 204
                            }
                            this.dispatch(status, statusText)
                        }
                    }
                } catch (err) {
                    // 如果网络问题时访问XHR的属性，在FF会抛异常
                    // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
                    if (!forceAbort) {
                        this.dispatch(500, err)
                    }
                }
            }
        },
        jsonp: {
            preproccess: function() {
                var opts = this.options
                var name = this.jsonpCallback = opts.jsonpCallback || "avalon.jsonp" + setTimeout("1")
                if (rjsonp.test(opts.url)) {
                    opts.url = opts.url.replace(rjsonp, "$1" + name)
                } else {
                    opts.url = opts.url + (rquery.test(opts.url) ? "&" : "?") + opts.jsonp + "=" + name
                }
                //将后台返回的json保存在惰性函数中
                if (name.startsWith('avalon.')) {
                    name = name.replace(/avalon\./, '')
                    avalon[name] = function(json) {
                        avalon[name] = json
                    }
                } else {
                    window[name] = function(json) {
                        window[name] = json
                    }
                }
                return "script"
            }
        },
        script: {
            request: function() {
                var opts = this.options
                var node = this.transport = DOC.createElement("script")
                if (opts.charset) {
                    node.charset = opts.charset
                }
                var self = this
                node.onerror = node[useOnload ? "onload" : "onreadystatechange"] = function() {
                    self.respond()
                }
                node.src = opts.url
                head.insertBefore(node, head.firstChild)
            },
            respond: function(event, forceAbort) {
                var node = this.transport
                if (!node) {
                    return
                }
                // by zilong：避免abort后还继续派发onerror等事件
                if (forceAbort && this.timeoutID) {
                    clearTimeout(this.timeoutID)
                    delete this.timeoutID
                }
                var execute = /loaded|complete|undefined/i.test(node.readyState)
                if (forceAbort || execute) {
                    node.onerror = node.onload = node.onreadystatechange = null
                    var parent = node.parentNode
                    if (parent) {
                        parent.removeChild(node)
                    }
                    if (!forceAbort) {
                        var args
                        if (this.jsonpCallback) {
                            var jsonpCallback = this.jsonpCallback.startsWith('avalon.') ? avalon[this.jsonpCallback.replace(/avalon\./, '')] : window[this.jsonpCallback]
                            args = typeof jsonpCallback === "function" ? [500, "error"] : [200, "success"]
                        } else {
                            args = [200, "success"]
                        }

                        this.dispatch.apply(this, args)
                    }
                }
            }
        },
        upload: {
            preproccess: function() {
                var opts = this.options, formdata
                if (typeof opts.form.append === "function") { //简单判断opts.form是否为FormData
                    formdata = opts.form
                    opts.contentType = ''
                } else {
                    formdata = new FormData(opts.form) //将二进制什么一下子打包到formdata
                }
                avalon.each(opts.data, function(key, val) {
                    formdata.append(key, val) //添加客外数据
                })
                this.formdata = formdata
            }
        }
    }


    avalon.mix(transports.jsonp, transports.script)
    avalon.mix(transports.upload, transports.xhr)

    if (!window.FormData) {
        var str = 'Function BinaryToArray(binary)\r\n\
                 Dim oDic\r\n\
                 Set oDic = CreateObject("scripting.dictionary")\r\n\
                 length = LenB(binary) - 1\r\n\
                 For i = 1 To length\r\n\
                     oDic.add i, AscB(MidB(binary, i, 1))\r\n\
                 Next\r\n\
                 BinaryToArray = oDic.Items\r\n\
              End Function'
        execScript(str, "VBScript")
        avalon.fixAjax = function() {
            avalon.ajaxConverters.arraybuffer = function() {
                var body = this.tranport && this.tranport.responseBody
                if (body) {
                    return new VBArray(BinaryToArray(body)).toArray()
                }
            }
            function createIframe(ID) {
                var iframe = avalon.parseHTML("<iframe " + " id='" + ID + "'" +
                    " name='" + ID + "'" + " style='position:absolute;left:-9999px;top:-9999px;'/>").firstChild
                return (DOC.body || DOC.documentElement).insertBefore(iframe, null)
            }
            function addDataToForm(form, data) {
                var ret = [],
                    d, isArray, vs, i, e
                for (d in data) {
                    isArray = Array.isArray(data[d])
                    vs = isArray ? data[d] : [data[d]]
                    // 数组和原生一样对待，创建多个同名输入域
                    for (i = 0; i < vs.length; i++) {
                        e = DOC.createElement("input")
                        e.type = 'hidden'
                        e.name = d
                        e.value = vs[i]
                        form.appendChild(e)
                        ret.push(e)
                    }
                }
                return ret
            }
            //https://github.com/codenothing/Pure-Javascript-Upload/blob/master/src/upload.js
            avalon.ajaxTransports.upload = {
                request: function() {
                    var self = this
                    var opts = this.options
                    var ID = "iframe-upload-" + this.uniqueID
                    var form = opts.form
                    var iframe = this.transport = createIframe(ID)
                    //form.enctype的值
                    //1:application/x-www-form-urlencoded   在发送前编码所有字符（默认）
                    //2:multipart/form-data 不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。
                    //3:text/plain  空格转换为 "+" 加号，但不对特殊字符编码。
                    var backups = {
                        target: form.target || "",
                        action: form.action || "",
                        enctype: form.enctype,
                        method: form.method
                    }
                    var fields = opts.data ? addDataToForm(form, opts.data) : []
                    //必须指定method与enctype，要不在FF报错
                    //表单包含文件域时，如果缺少 method=POST 以及 enctype=multipart/form-data，
                    // 设置target到隐藏iframe，避免整页刷新
                    form.target = ID
                    form.action = opts.url
                    form.method = "POST"
                    form.enctype = "multipart/form-data"
                    this.uploadcallback = avalon.bind(iframe, "load", function(event) {
                        self.respond(event)
                    })
                    form.submit()
                    //还原form的属性
                    for (var i in backups) {
                        form[i] = backups[i]
                    }
                    //移除之前动态添加的节点
                    fields.forEach(function(input) {
                        form.removeChild(input)
                    })
                },
                respond: function(event) {
                    var node = this.transport, child
                    // 防止重复调用,成功后 abort
                    if (!node) {
                        return
                    }
                    if (event && event.type === "load") {
                        var doc = node.contentWindow.document
                        this.responseXML = doc
                        if (doc.body) { //如果存在body属性,说明不是返回XML
                            this.responseText = doc.body.innerHTML
                            //当MIME为'application/javascript' 'text/javascript",浏览器会把内容放到一个PRE标签中
                            if ((child = doc.body.firstChild) && child.nodeName.toUpperCase() === 'PRE' && child.firstChild) {
                                this.responseText = child.firstChild.nodeValue
                            }
                        }
                        this.dispatch(200, "success")
                    }
                    this.uploadcallback = avalon.unbind(node, "load", this.uploadcallback)
                    delete this.uploadcallback
                    setTimeout(function() { // Fix busy state in FF3
                        node.parentNode.removeChild(node)
                    })
                }
            }
            delete avalon.fixAjax
        }
        avalon.fixAjax()
    }
    return avalon
})
/**
 2011.8.31
 将会传送器的abort方法上传到avalon.XHR.abort去处理
 修复serializeArray的bug
 对XMLHttpRequest.abort进行try...catch
 2012.3.31 v2 大重构,支持XMLHttpRequest Level2
 2013.4.8 v3 大重构 支持二进制上传与下载
 http://www.cnblogs.com/heyuquan/archive/2013/05/13/3076465.html
 2014.12.25  v4 大重构 
 2015.3.2   去掉mmPromise
 2014.3.13  使用加强版mmPromise
 2014.3.17  增加 xhr 的 onprogress 回调
 */
