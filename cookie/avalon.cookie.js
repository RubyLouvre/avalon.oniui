/**
 * @cnName Cookie工具模块
 * @enName cookie
 * @introduce
 *    <p>处理cookie的工具函数集合， 与store模块的接口一致， 即包含get, set, forEach, remove, clear, getAll</p>
 *  @updatetime 2011-11-17
 */

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

    //
    var Cookie = {
        /*
         * @interface 将两个字符串变成一个cookie字段 
         *<pre class="brush:javascript;gutter:false;toolbar:false">
         *    Cookie.stringify('foo', 'bar', { httpOnly: true })  => "foo=bar; httpOnly"
         *</pre>
         *  @param name {String} cookie的名字不能为空
         *  @param val {String} cookie的名字不能为空
         *  @param opts {Undefined|Object|Number} 配置对象，如果为数字则当成maxAge,否则为对象时，里面可以配置maxAge, domain, path, expires, httpOnly, secure
         */
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
        /*
         *  @interface 遍历所有cookie 
         *  @param callback {Function} 里面会依次传入key与value
         */
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
        /*
         *  @interface 获取某一cookie 
         *  @param name {String} 
         *  @return {String}
         */
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
        /*
         *  @interface 获取所有cookie，以对象形式返回
         *  @returns {Object}
         */
        getAll: function() {
            var obj = {}
            Cookie.forEach(function(key, value) {
                if (!(key in obj)) {
                    obj[key] = value
                }
            })
            return obj
        },
        /*
         *  @interface 添加或设置某一cookie
         *  @param name {String} 
         *  @param value {String} 
         *  @return {Undefined|Object|Number}
         */
        set: function(key, val, opts) {
            document.cookie = Cookie.stringify.apply(0, arguments)
        },
        /*
         *  @interface 移除某一cookie
         *  @param name {String} 
         *  @param opt {Object|Undefined} 
         */
        remove: function(key, opt) {
            opt = opt || {}
            if (!opt.expires) {
                opt.expires = new Date(1970, 0, 1)
            }
            Cookie.set(key, '', opt)
        },
        /*
         *  @interface 移除所有cookie
         */
        clear: function() {
            Cookie.forEach(function(key, value) {
                Cookie.remove(key)
            })
        }
    }


    avalon.cookie = Cookie
    return avalon
})
/**
 @links
 [例子1](avalon.cookie.ex1.html)
 */


//2012.8.19 (mass Framework) 全新cookie工具类
//2014.7.8 移至avalon.ui