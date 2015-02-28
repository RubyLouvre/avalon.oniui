var xhrSuccessStatus = {
    0: 200,
    1223: 204
}
var transports = avalon.ajaxTransports = {
    xhr: {
        //发送请求
        request: function() {
            var self = this;
            var opts = this.options;
            avalon.log("XhrTransport.request.....")
            var transport = this.transport = new avalon.xhr;
            transport.open(opts.type, opts.url, opts.async, opts.username, opts.password)
            if (this.mimeType && transport.overrideMimeType) {
                transport.overrideMimeType(this.mimeType)
            }
            transport.withCredentials = true
            this.requestHeaders["X-Requested-With"] = "XMLHttpRequest";
            for (var i in this.requestHeaders) {
                transport.setRequestHeader(i, this.requestHeaders[i] + "")
            }
            var dataType = this.options.dataType;
            if ("responseType" in transport && /^(blob|arraybuffer|text)$/.test(dataType)) {
                transport.responseType = dataType;
                this.useResponseType = true;
            }
            //必须要支持 FormData 和 file.fileList 的浏览器 才能用 xhr 发送
            //标准规定的 multipart/form-data 发送必须用 utf-8 格式， 记得 ie 会受到 document.charset 的影响
            transport.send(opts.hasContent && (this.formdata || this.querystring) || null)

            transport.onload = transport.onerror = function(e) {
                this.readyState = 4 //IE9+ 
                this.status = e.type === "load" ? 200 : 500
                self.respond()
            }
        },
        //用于获取原始的responseXMLresponseText 修正status statusText
        //第二个参数为1时中止清求
        respond: function(event, forceAbort) {
            var transport = this.transport
            if (!transport) {
                return;
            }
            var completed = transport.readyState === 4
            if (forceAbort || completed) {
                transport.onerror = transport.onload = null
                if (forceAbort) {
                    if (!completed && typeof transport.abort === "function") { // 完成以后 abort 不要调用
                        transport.abort()
                    }
                } else {

                    var text = transport.responseText
                    var statusText = transport.statusText
                    var status = xhrSuccessStatus[status] || transport.status

                    //设置response
                    if (this.useResponseType) {
                        this.response = transport.response
                    }
                    this.responseText = typeof text === "string" ? text : void 0
                    this.responseXML = (transport.responseXML || {}).documentElement
                    this.responseHeadersString = transport.getAllResponseHeaders()
                    this.dispatch(status, statusText)
                }
            }

        }
    },
    jsonp: {
        preproccess: function() {
            var opts = this.options;
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
            var opts = this.options;
            var node = this.transport = DOC.createElement("script")
            avalon.log("ScriptTransport.sending.....")
            if (opts.charset) {
                node.charset = opts.charset
            }
            var self = this
            node.onerror = node.onload = function() {
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
            node.onerror = node.onload = null
            var parent = node.parentNode;
            if (parent) {
                parent.removeChild(node)
            }
            if (!forceAbort) {
                var args;
                if (this.jsonpCallback) {
                    var jsonpCallback = this.jsonpCallback.startsWith('avalon.') ? avalon[this.jsonpCallback.replace(/avalon\./, '')] : window[this.jsonpCallback]
                    args = typeof jsonpCallback === "function" ? [500, "error"] : [200, "success"]
                } else {
                    args = [200, "success"]
                }
                this.dispatch.apply(this, args)
            }
        }
    },
    upload: {
        preproccess: function() {
            var opts = this.options, formdata
            if (typeof opts.form.append === "function") { //简单判断opts.form是否为FormData
                formdata = opts.form;
                opts.contentType = '';
            } else {
                formdata = new FormData(opts.form)  //将二进制什么一下子打包到formdata
            }
            avalon.each(opts.data, function(key, val) {
                formdata.append(key, val)  //添加客外数据
            })
            this.formdata = formdata;
        }
    }
}

avalon.mix(transports.jsonp, transports.script)
avalon.mix(transports.upload, transports.xhr)