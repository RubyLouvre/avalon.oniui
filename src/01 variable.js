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
            script.text = code;
            head.appendChild(script).parentNode.removeChild(script)
        } else {
            indirect(code)
        }
    }
}
