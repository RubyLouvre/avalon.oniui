var head = DOC.getElementsByTagName("head")[0] //HEAD元素
var isLocal = false
try {
    //在IE下如果重置了document.domain，直接访问window.location会抛错，但用document.URL就ok了
    //http://www.cnblogs.com/WuQiang/archive/2012/09/21/2697474.html
    isLocal = rlocalProtocol.test(location.protocol)
} catch (e) {
}

new function() {
    //http://www.cnblogs.com/rubylouvre/archive/2010/04/20/1716486.html
    var s = ["XMLHttpRequest",
        "ActiveXObject('MSXML2.XMLHTTP.6.0')",
        "ActiveXObject('MSXML2.XMLHTTP.3.0')",
        "ActiveXObject('MSXML2.XMLHTTP')",
        "ActiveXObject('Microsoft.XMLHTTP')"
    ]
    s[0] = IE() < 8 && IE() !== 0 && isLocal ? "!" : s[0] //IE下只能使用ActiveXObject
    for (var i = 0, axo; axo = s[i++]; ) {
        try {
            if (eval("new " + axo)) {
                avalon.xhr = new Function("return new " + axo)
                break;
            }
        } catch (e) {
        }
    }
}
var supportCors = "withCredentials" in  avalon.xhr()



