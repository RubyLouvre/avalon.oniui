define(["avalon"], function(avalon) {

    var Promise = function(executor) {
        this._callbacks = [];
        var that = this
        if (typeof this !== 'object')
            throw new TypeError('Promises must be constructed via new')
        if (typeof executor !== 'function')
            throw new TypeError('not a function')
        executor(function(value) {
            that._resolve(value)
        }, function(reason) {
            that._reject(reason)
        })
    }
    var setImmediate = typeof window.setImmediate === "function" ? function(fn) {
        window.setImmediate(fn)
    } : function(fn) {
        window.setTimeout(fn, 0)
    }

    Promise.resolve = function(value) {
        return new Promise(function(resolve) {
            resolve(value);
        });
    };
    Promise.reject = function(reason) {
        return new Promise(function(resolve, reject) {
            reject(reason);
        });
    };
    function transmit(that, value) {
        that._fired = true;
        that._value = value;
        setImmediate(function() {
            that._callbacks.forEach(function(data) {
                that._fire(data.onSuccess, data.onFail);
            })
        })
    }
    Promise.prototype = {
        _state: "pending", //判定当前状态
        _fired: false, //判定是否已经被触发
        _resolve: function(value) {
            if (this._state !== "pending")
                return;
            this._state = "fulfilled"
            var that = this
            if (value instanceof Promise) {
                value._then(function(val) {
                    transmit(that, val)
                }, function(reason) {
                    that._state = "rejected"
                    transmit(that, reason)
                });

            } else if (value && typeof value.then === "function") {
                value.then.call(value, function(val) {
                    transmit(that, val)
                }, function(reason) {
                    that._state = "rejected"
                    transmit(that, reason)
                })
            } else {
                transmit(that, value);
            }
        },
        _reject: function(value) {
            if (this._state !== "pending")
                return;
            this._state = "rejected"
            transmit(this, value)
        },
        _fire: function(onSuccess, onFail) {
            if (this._state === "rejected") {
                if (typeof onFail === "function")
                    onFail(this._value);
                else
                    throw this._value;
            } else {
                if (typeof onSuccess === "function")
                    onSuccess(this._value);
            }
        },
        _then: function(onSuccess, onFail) {
            if (this._fired) {
                var that = this
                setImmediate(function() {
                    that._fire(onSuccess, onFail)
                });
            } else {
                this._callbacks.push({onSuccess: onSuccess, onFail: onFail});
            }
        },
        then: function(onSuccess, onFail) {
            var parent = this
            return new Promise(function(resolve, reject) {
                parent._then(function(value) {
                    if (typeof onSuccess === "function") {
                        try {
                            value = onSuccess(value);
                        } catch (e) {
                            reject(e)
                            return
                        }
                    }
                    resolve(value)
                }, function(value) {
                    if (typeof onFail === "function") {
                        try {
                            value = onFail(value)
                        } catch (e) {
                            reject(e)
                            return
                        }
                        resolve(value)
                    } else {
                        reject(value)
                    }
                });
            });
        },
        "catch": function(onFail) {
            return this.then(null, onFail)
        },
        done: function(onSuccess) {
            return this.then(onSuccess)
        },
        fail: function(onFail) {
            return this.then(null, onFail)
        }
    }

    function some(any, promises) {
        var n = 0, result = [], end
        return new Promise(function(resolve, reject) {
            function loop(promise, index) {
                promise.then(function(ret) {
                    if (!end) {
                        result[index] = ret//保证回调的顺序
                        n++
                        if (any || n >= promises.length) {
                            resolve(any ? ret : result)
                            end = true
                        }
                    }
                }, function(e) {
                    end = true
                    reject(e)
                })
            }
            for (var i = 0, l = promises.length; i < l; i++) {
                loop(promises[i], i)
            }
        })
    }

    Promise.all = function() {
        return some(false, arguments)
    }
    Promise.race = function() {
        return some(true, arguments)
    }
    Promise.isPromise = function(obj) {
        return !!(obj && typeof obj.then === "function")
    }
    var nativePromise = window.Promise
    if (/native code/.test(window.Promise)) {
//        nativePromise.prototype.done = Promise.prototype.done
//        nativePromise.prototype.fail = Promise.prototype.fail
//        nativePromise.isPromise = Promise.isPromise
//        nativePromise.any = nativePromise.race
    } else {
        Promise.any = Promise.race
        window.Promise = Promise
    }
    avalon.mmPromise = Promise
    return avalon
})
//https://github.com/ecomfe/er/blob/master/src/Deferred.js