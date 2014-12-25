//将一个字符串转换为对象
//https://github.com/cowboy/jquery-bbq/blob/master/jquery.ba-bbq.js
avalon.unparam = function(url, query) {
    var json = {};
    if (!url || !avalon.type(url) === "string") {
        return json;
    }
    url = url.replace(/^[^?=]*\?/ig, '').split('#')[0]; //去除网址与hash信息
    //考虑到key中可能有特殊符号如“[].”等，而[]却有是否被编码的可能，所以，牺牲效率以求严谨，就算传了key参数，也是全部解析url。
    var pairs = url.split("&"),
            pair, key, val, i = 0,
            len = pairs.length;
    for (; i < len; ++i) {
        pair = pairs[i].split("=")
        key = decode(pair[0])
        try {
            val = decode(pair[1] || "")
        } catch (e) {
            avalon.log(e + "decodeURIComponent error : " + pair[1], 3)
            val = pair[1] || "";
        }
        key = key.replace(/\[\]$/, "")  //如果参数名以[]结尾，则当作数组
        var item = json[key];
        if (item === void 0) {
            json[key] = val; //第一次
        } else if (Array.isArray(item)) {
            item.push(val)  //第三次或三次以上
        } else {
            json[key] = [item, val]; //第二次,将它转换为数组
        }
    }
    return query ? json[query] : json;
}
