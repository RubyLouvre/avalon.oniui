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
        var urlAnchor = document.createElement("a");
        // Support: IE8-11+
        // IE throws exception if url is malformed, e.g. http://example.com:80x/
        try {
            urlAnchor.href = opts.url;
            urlAnchor.href = urlAnchor.href;
            opts.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
                    urlAnchor.protocol + "//" + urlAnchor.host;
        } catch (e) {
            opts.crossDomain = true;
        }
    }
    opts.hasContent = !rnoContent.test(opts.type)  //是否为post请求
    if (!opts.hasContent) {
        if (querystring) { //如果为GET请求,则参数依附于url上
            opts.url += (rquery.test(opts.url) ? "&" : "?") + querystring;
        }
        if (opts.cache === false) { //添加时间截
            opts.url += (rquery.test(opts.url) ? "&" : "?") + "_time=" + (new Date - 0)
        }
    }
    return opts;
}
