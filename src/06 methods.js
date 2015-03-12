//ajax主函数
avalon.ajax = function(opts, promise) {
    if (!opts || !opts.url) {
        avalon.error("参数必须为Object并且拥有url属性")
    }
    opts = ajaxExtend(opts)  //处理用户参数，比如生成querystring, type大写化
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
    var completeFns = []
    promise.options = opts
    promise._reject = _reject
    promise._resolve = _resolve
    var isSync = opts.async === false
    if (isSync) {
        avalon.log("warnning:与jquery1.8一样,async:false这配置已经被废弃")
        promise.async = false
    }
    promise._complete = function(fn) {
        while (fn = completeFns.shift()) {
            fn.apply(promise, arguments)
        }
    }
    promise.always = function(fn) {
        if (typeof fn === "function") {
            completeFns.push(fn)
        }
        return this
    }
    
    function makeFn(fn){
        return typeof fn === "function" ? fn : avalon.noop
    }

    promise.then(function(args) {
        var fn = makeFn(opts.success)
        return fn.apply(promise, args)
    }, function(args) {
        var fn = makeFn(opts.error)
        return fn.apply(promise, args)
    })

    avalon.mix(promise, XHRProperties, XHRMethods)

    var dataType = opts.dataType  //目标返回数据类型
    var transports = avalon.ajaxTransports

    if ((opts.crossDomain && !supportCors || rjsonp.test(opts.url)) && dataType === "json" && opts.type === "GET") {
        dataType = opts.dataType = "jsonp"
    }
    var name = opts.form ? "upload" : dataType
    var transport = transports[name] || transports.xhr
    avalon.mix(promise, transport)  //取得传送器的request, respond, preproccess
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
};
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
    };
})

avalon.getScript = function(url, callback) {
    return avalon.get(url, null, callback, "script")
}
avalon.getJSON = function(url, data, callback) {
    return avalon.get(url, data, callback, "json")
}
avalon.upload = function(url, form, data, callback, dataType) {
    if (typeof data === "function") {
        dataType = callback;
        callback = data;
        data = void 0;
    }
    return avalon.ajax({
        url: url,
        type: "post",
        dataType: dataType,
        form: form,
        data: data,
        success: callback
    });
}