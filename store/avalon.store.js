/**
 * @cnName 本地储存组件
 * @enName store
 * @introduce
 *    <p>   IE8+及高级浏览器使用localStorage，旧式IE使用userData。这些方法放于avalon.store对象上。</p>
 *  @updatetime 2011-11-21
 */
define(["avalon", "../json/avalon.json"], function(avalon) {

    var store = {
        //一些接口(空实现)
        disabled: false,
        /*
         *  @interface 添加或设置某一数据
         *  @param name {String} 
         *  @param value {String} 
         */
        set: function(key, value) {
        },
        /*
         *  @interface 获取某一数据
         *  @param name {String} 
         *  @return {String}
         */
        get: function(key) {
        },
        /*
         *  @interface 移除某一数据
         *  @param key {String} 
         */
        remove: function(key) {
        },
        /*
         *  @interface 清空一数据
         */
        clear: function() {
        },
        /*
         *  @interface 遍历所有数据
         *  @param callback {Function} 里面会依次传入key与value
         */
        forEach: function(callback) {
        },
        /*
         *  @interface 得到所有数据，以对象形式返回
         *  @returns {Object}
         */
        getAll: function() {
            var ret = {}
            store.forEach(function(key, val) {
                ret[key] = val
            })
            return ret
        },
        serialize: function(value) {
            return JSON.stringify(value)
        },
        parse: function(value) {
            if (typeof value !== 'string') {
                return void 0
            }
            try {
                return JSON.parse(value)
            }
            catch (e) {
                return value || undefined
            }
        }
    }
    //http://wojodesign.com/full-browser-support-for-localstorage-without-cookies/
    //http://mathiasbynens.be/notes/localstorage-pattern
    var name = "test" + (new Date - 0), localStorageName = "localStorage", storage
    var supportLocalStorage = false;
    try {
        localStorage.setItem(name, "mass");
        localStorage.removeItem(name);
        supportLocalStorage = true;
    } catch (e) {
    }

    if (supportLocalStorage) {
        storage = localStorage;
        avalon.mix(store, {//重写
            set: function(key, val) {
                if (val === void 0) {
                    return store.remove(key)
                }
                storage.setItem(key, store.serialize(val))
                return val
            },
            get: function(key) {
                return store.parse(storage.getItem(key))
            },
            remove: function(key) {
                storage.removeItem(key)
            },
            clear: function() {
                storage.clear()
            },
            forEach: function(callback) {
                for (var i = 0; i < storage.length; i++) {
                    var key = storage.key(i)
                    callback(key, store.get(key))
                }
            }
        })


    } else if (document.documentElement.addBehavior) {
        var storageOwner,
                storageContainer
        //由于＃userData的存储仅适用于特定的路径，
        //我们需要以某种方式关联我们的数据到一个特定的路径。我们选择/favicon.ico作为一个非常安全的目标，
        //因为所有的浏览器都发出这个URL请求，而且这个请求即使是404也不会有危险。
        //我们可以通过一个ActiveXObject(htmlfle)对象的文档来干这事。
        //(参见:http://msdn.microsoft.com/en-us/library/aa752574(v = VS.85). aspx)
        //因为iframe的访问规则允许直接访问和操纵文档中的元素，即使是404。
        //这文档可以用来代替当前文档（这被限制在当前路径）执行＃userData的存储。
        try {
            var scriptTag = 'script'
            storageContainer = new ActiveXObject('htmlfile')
            storageContainer.open()
            storageContainer.write('<' + scriptTag + '>document.w=window</' + scriptTag + '><iframe src="/favicon.ico"></iframe>')
            storageContainer.close()
            storageOwner = storageContainer.w.frames[0].document
            storage = storageOwner.createElement('div')
        } catch (e) {
            storage = document.createElement('div')
            storageOwner = document.body
        }
        function withIEStorage(storeFunction) {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0)
                args.unshift(storage)
                //  http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
                //  http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
                storageOwner.appendChild(storage)
                storage.addBehavior('#default#userData')
                storage.load(localStorageName)
                var result = storeFunction.apply(store, args)
                try {
                    storageOwner.removeChild(storage)
                } catch (e) {
                }
                return result
            }
        }
        // In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
        var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
        function ieKeyFix(key) {
            return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
        }
        avalon.mix(store, {//重写
            set: withIEStorage(function(storage, key, val) {
                key = ieKeyFix(key)
                if (val === void 0) {
                    return store.remove(key)
                }
                storage.setAttribute(key, store.serialize(val))
                storage.save(localStorageName)
                return val
            }),
            get: withIEStorage(function(storage, key) {
                key = ieKeyFix(key)
                return store.parse(storage.getAttribute(key))
            }),
            remove: withIEStorage(function(storage, key) {
                key = ieKeyFix(key)
                storage.removeAttribute(key)
                storage.save(localStorageName)
            }),
            clear: function() {
                store.forEach(function(name) {
                    store.remove(name)
                })
            },
            forEach: withIEStorage(function(storage, callback) {
                var attributes = storage.XMLDocument.documentElement.attributes
                for (var i = 0, attr; attr = attributes[i]; ++i) {
                    callback(attr.name, store.parse(storage.getAttribute(attr.name)))
                }
            })
        })
    }
    try {
        store.set(localStorageName, localStorageName)
        if (store.get(localStorageName) != localStorageName) {
            store.disabled = true
        }
        store.remove(localStorageName);
    } catch (e) {
        store.disabled = true
    }
    avalon.store = store
    return avalon;
})
/*
 * @other
 * 这里提供了一个用cookie实现本地储存的方案 https://developer.mozilla.org/en/DOM/Storage
 其他有用的资料
 <ul>
 <li><a href="http://www.cnblogs.com/NNUF/archive/2012/06/01/2531436.html">http://www.cnblogs.com/NNUF/archive/2012/06/01/2531436.html</a></li>
 <li><a href="http://www.cnblogs.com/zjcn/archive/2012/07/03/2575026.html">http://www.cnblogs.com/zjcn/archive/2012/07/03/2575026.html</a></li>
 <li><a href="http://dev-test.nemikor.com/web-storage/support-test/">http://dev-test.nemikor.com/web-storage/support-test/</a></li>
 <li><a href="http://arty.name/localstorage.html">http://arty.name/localstorage.html</a></li>
 </ul>
 firefox中对file://协议的不支持.
 
 当你在firefox中打开一个本地的html文件的时候,也就是使用file://协议运行一个页面的时候,localStorage是不起作用的.无法设置和获取localStorage.
 其实,本地调试这种方式已经很落后了,至少应该再127.0.0.1的环境中调试吧,这样调试的时候localStorage是工作的,有的人说这是一个firefox的bug.
 但是看到一个解释,我觉得还是挺靠谱的,在file协议中,本来就没有domain的概念,而localStorage是根据domain来生效的.所以从道理上来讲就不应该在file://协议上生效.
 */

/**
 @links
 [例子1](avalon.store.ex1.html)
 */