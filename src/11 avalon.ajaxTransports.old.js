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
            if (opts.crossDomain) {
                transport.withCredentials = true
            }
            this.requestHeaders["X-Requested-With"] = "XMLHttpRequest"
            for (var i in this.requestHeaders) {
                transport.setRequestHeader(i, this.requestHeaders[i] + "")
            }
            var dataType = this.options.dataType;
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
            try {
                var completed = transport.readyState === 4
                if (forceAbort || completed) {
                    transport.onreadystatechange = avalon.noop
                    if (useOnload) {//IE6下对XHR对象设置onerror属性可能报错
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
                        } catch (e) {
                        }
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
            var self = this;
            node.onerror = node[useOnload ? "onload" : "onreadystatechange"] = function() {
                self.respond()
            };
            node.src = opts.url
            head.insertBefore(node, head.firstChild)
        },
        respond: function(event, forceAbort) {
            var node = this.transport
            if (!node) {
                return
            }
            var execute = /loaded|complete|undefined/i.test(node.readyState)
            if (forceAbort || execute) {
                node.onerror = node.onload = node.onreadystatechange = null
                var parent = node.parentNode;
                if (parent) {
                    parent.removeChild(node)
                }
                if (!forceAbort) {
                    var jsonpCallback = this.jsonpCallback.startsWith('avalon.') ? avalon[this.jsonpCallback.replace(/avalon\./, '')] : window[this.jsonpCallback]
                    var args = typeof jsonpCallback === "function" ? [500, "error"] : [200, "success"]
                    this.dispatch.apply(this, args)
                }
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
    execScript(str, "VBScript");
    avalon.fixAjax = function() {
        avalon.ajaxConverters.arraybuffer = function() {
            var body = this.tranport && this.tranport.responseBody
            if (body) {
                return  new VBArray(BinaryToArray(body)).toArray();
            }
        };
        function createIframe(ID) {
            var iframe = avalon.parseHTML("<iframe " + " id='" + ID + "'" +
                    " name='" + ID + "'" + " style='position:absolute;left:-9999px;top:-9999px;'/>").firstChild;
            return (DOC.body || DOC.documentElement).insertBefore(iframe, null);
        }
        function addDataToForm(form, data) {
            var ret = [],
                    d, isArray, vs, i, e;
            for (d in data) {
                isArray = Array.isArray(data[d]);
                vs = isArray ? data[d] : [data[d]];
                // 数组和原生一样对待，创建多个同名输入域
                for (i = 0; i < vs.length; i++) {
                    e = DOC.createElement("input");
                    e.type = 'hidden';
                    e.name = d;
                    e.value = vs[i];
                    form.appendChild(e);
                    ret.push(e);
                }
            }
            return ret;
        }
        //https://github.com/codenothing/Pure-Javascript-Upload/blob/master/src/upload.js
        avalon.ajaxTransports.upload = {
            request: function() {
                var self = this;
                var opts = this.options;
                var ID = "iframe-upload-" + this.uniqueID;
                var form = opts.form;
                var iframe = this.transport = createIframe(ID);
                //form.enctype的值
                //1:application/x-www-form-urlencoded   在发送前编码所有字符（默认）
                //2:multipart/form-data 不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。
                //3:text/plain  空格转换为 "+" 加号，但不对特殊字符编码。
                var backups = {
                    target: form.target || "",
                    action: form.action || "",
                    enctype: form.enctype,
                    method: form.method
                };
                var fields = opts.data ? addDataToForm(form, opts.data) : [];
                //必须指定method与enctype，要不在FF报错
                //表单包含文件域时，如果缺少 method=POST 以及 enctype=multipart/form-data，
                // 设置target到隐藏iframe，避免整页刷新
                form.target = ID;
                form.action = opts.url;
                form.method = "POST";
                form.enctype = "multipart/form-data";
                avalon.log("iframe transport...");
                this.uploadcallback = avalon.bind(iframe, "load", function(event) {
                    self.respond(event);
                });
                form.submit();
                //还原form的属性
                for (var i in backups) {
                    form[i] = backups[i];
                }
                //移除之前动态添加的节点
                fields.forEach(function(input) {
                    form.removeChild(input);
                });
            },
            respond: function(event) {
                var node = this.transport, child
                // 防止重复调用,成功后 abort
                if (!node) {
                    return;
                }
                if (event && event.type === "load") {
                    var doc = node.contentWindow.document;
                    this.responseXML = doc;
                    if (doc.body) {//如果存在body属性,说明不是返回XML
                        this.responseText = doc.body.innerHTML;
                        //当MIME为'application/javascript' 'text/javascript",浏览器会把内容放到一个PRE标签中
                        if ((child = doc.body.firstChild) && child.nodeName.toUpperCase() === 'PRE' && child.firstChild) {
                            this.responseText = child.firstChild.nodeValue;
                        }
                    }
                    this.dispatch(200, "success");
                }
                this.uploadcallback = avalon.unbind(node, "load", this.uploadcallback);
                delete this.uploadcallback;
                setTimeout(function() {  // Fix busy state in FF3
                    node.parentNode.removeChild(node);
                    avalon.log("iframe.parentNode.removeChild(iframe)");
                });
            }
        };
        delete avalon.fixAjax;
    };
    avalon.fixAjax()
}