avalon.param = function(json) {
    if (!avalon.isPlainObject(json)) {
        return ""
    }
    var buffer = []
    paramInner(json, "", buffer)
    return buffer.join("&").replace(r20, "+")
}

function isDate(a) {
    return Object.prototype.toString.call(a) === "[object Date]"
}
function isValidParamValue(val) {
    var t = typeof val; // 值只能为 null, undefined, number, string, boolean
    return val == null || (t !== 'object' && t !== 'function')
}
function paramInner(json, prefix, buffer) {
    prefix = prefix || ""
    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            var val = json[key]
            var name = prefix ? prefix + encode("[" + key + "]") : encode(key)
            if (isDate(val)) {
                buffer.push(name + "=" + val.toISOString())
            } else if (isValidParamValue(val)) {//如果是简单数据类型
                buffer.push(name + "=" + encode(val))
            } else if (Array.isArray(val) || avalon.isPlainObject(val)) {
                avalon.each(val, function(subKey, subVal) {
                    if (isValidParamValue(subVal)) {
                        buffer.push(name + encode("[" + subKey + "]") + "=" + encode(subVal))
                    } else if (Array.isArray(val) || avalon.isPlainObject(val)) {
                        paramInner(subVal, name + encode("[" + subKey + "]"), buffer)
                    }
                })
            }
        }
    }
}

