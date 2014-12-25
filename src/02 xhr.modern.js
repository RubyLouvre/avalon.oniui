var head = DOC.head //HEAD元素
var isLocal = rlocalProtocol.test(location.protocol)
avalon.xhr = function() {
    return new XMLHttpRequest
}
var supportCors = "withCredentials" in  avalon.xhr()   