var rinput = /select|input|button|textarea/i
var rcheckbox = /radio|checkbox/
var rline = /\r?\n/g
function trimLine(val) {
    return val.replace(rline, "\r\n")
}
//表单元素变字符串, form为一个元素节点
avalon.serialize = function(form) {
    var json = {};
    // 不直接转换form.elements，防止以下情况：   <form > <input name="elements"/><input name="test"/></form>
    Array.prototype.filter.call(form.getElementsByTagName("*"), function(el) {
        if (rinput.test(el.nodeName) && el.name && !el.disabled) {
            return  rcheckbox.test(el.type) ? el.checked : true //只处理拥有name并且没有disabled的表单元素
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
    return avalon.param(json, false)  // 名值键值对序列化,数组元素名字前不加 []
}
