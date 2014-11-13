define(["avalon"], function() {
    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
// This is a quoted cookie as according to RFC2068, unescape...
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        try {
            return  decodeURIComponent(s.replace(/\+/g, ' '))//处理加号
        } catch (e) {
            return s
        }
    }

    //将两个字符串变成一个cookie字段
    var Cookie = {
        //   Cookie.stringify('foo', 'bar', { httpOnly: true })  => "foo=bar; httpOnly"
        stringify: function(name, val, opts) {
            var pairs = [name + "=" + encodeURIComponent(val)]
            if (isFinite(opts) && typeof opts === "number") {
                pairs.push("Max-Age=" + opts)
            } else {
                opts = opts || {}
                if (opts.maxAge)
                    pairs.push("Max-Age=" + opts.maxAge)
                if (opts.domain)
                    pairs.push("Domain=" + opts.domain)
                if (opts.path)
                    pairs.push("Path=" + opts.path)
                if (opts.expires)
                    pairs.push("Expires=" + opts.expires.toUTCString())
                if (opts.httpOnly)
                    pairs.push("HttpOnly")
                if (opts.secure)
                    pairs.push("Secure")
            }
            return pairs.join("; ")
        },
        forEach: function(callback) {
            var pairs = String(document.cookie).split(/; */)
            pairs.forEach(function(pair) {
                var index = pair.indexOf('=')
                if (index === -1) {
                    return
                }
                var key = pair.substr(0, index).trim()
                var val = pair.substr(++index, pair.length).trim();
                callback(key, parseCookieValue(val))
            })
        },
        get: function(name) {
            var ret
            try {
                Cookie.forEach(function(key, value) {
                    if (key === name) {
                        ret = value
                        throw ""
                    }
                })
            } catch (e) {
            }
            return ret
        },
        getAll: function() {
            var obj = {}
            Cookie.forEach(function(key, value) {
                if (!(key in obj)) {
                    obj[key] = value
                }
            })
            return obj
        },
        set: function(name, val, opts) {
            document.cookie =  Cookie.stringify.apply(0, arguments)
        },
        remove: function(name, opt) {
            opt = opt || {}
            if (!opt.expires) {
                opt.expires = new Date(1970, 0, 1)
            }
            Cookie.set(name, '', opt)
        },
        clear: function() {
            Cookie.forEach(function(key, value) {
                Cookie.remove(key)
            })
        }
    }


    avalon.cookie = Cookie
    return avalon
})
//2012.8.19 (mass Framework) 全新cookie工具类
//2014.7.8 移至avalon.ui