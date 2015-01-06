var rinput = /select|input|button|textarea/i
var rcheckbox = /radio|checkbox/
var rCRLF = /\r?\n/g
//表单元素变字符串, form为一个元素节点
avalon.serialize = function(form) {
    var json = {};
    // 不直接转换form.elements，防止以下情况：   <form > <input name="elements"/><input name="test"/></form>
    Array.prototype.filter.call(form.getElementsByTagName("*"), function(el) {
        if (rinput.test(el.nodeName) && el.name && !el.disabled) {
            return  rcheckbox.test(el.type) ? el.checked : true //只处理拥有name并且没有disabled的表单元素
        }
    }).forEach(function(el) {
        var val = avalon(el).val(),
                vs;
        val = Array.isArray(val) ? val : typeof val === "string" ? [val] : [];
        val = val.map(function(v) {
            return v.replace(rCRLF, "\r\n")
        })
        // 全部搞成数组，防止同名
        vs = json[el.name] || (json[el.name] = [])
        vs.push.apply(vs, val)
    })
    return avalon.param(json, false)  // 名值键值对序列化,数组元素名字前不加 []
}
