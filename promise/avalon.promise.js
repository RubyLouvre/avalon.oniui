define(["avalon"], function(avalon) {

    var Promise = function(executor) {
        this._callbacks = [];
        var that = this
        executor(function(value) {
            that._resolve(value)
        }, function(reason) {
            that._reject(reason)
        })
    };
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

    Promise.prototype = {
        // Private properties and methods:
        _state: "pending",
        _fired: false,
        _release: function(onSuccess, onFail) {
            if (this._failed) {
                if (typeof onFail === 'function')
                    onFail(this._value);
                else
                    throw this._value;
            } else {
                if (typeof onSuccess === 'function')
                    onSuccess(this._value);
            }
        },
        _resolve: function(value) {
            if (this._state != "pending")
                return;
            this._state = "fulfilled";
            if (value instanceof Promise) {
                var that = this
                value.done(function(val) {
                    that._fire(val)
                }, function(reason) {
                    that._state = "rejected";
                    that._fire(reason);
                });
            } else {
                this._fire(value);
            }
        },
        _reject: function(value) {
            if (this._state != "pending")
                return;
            this._state = "rejected";
            this._fire(value);
        },
        _fire: function(value) {
            this._fired = true;
            this._value = value;
            var that = this
            Promose.nextTick(function() {
                that._callbacks.forEach(function(data) {
                    that._release(data.onSuccess, data.onFail);
                })
            })
        },
        done: function(onSuccess, onFail) {
            if (this._fired) {
                var that = this
                setTimeout(function() {
                    that._release(onSuccess, onFail)
                }, 0);
            } else {
                this._callbacks.push({onSuccess: onSuccess, onFail: onFail});
            }
        },
        then: function(onSuccess, onFail) {
            var parent = this;

            return new Promise(function(resolve, reject) {
                parent.done(function(value) {
                    if (typeof onSuccess === 'function') {
                        try {
                            value = onSuccess(value);
                        } catch (e) {
                            reject(e);
                            return;
                        }
                    }
                    resolve(value);
                }, function(value) {
                    if (typeof onFail === 'function') {
                        try {
                            value = onFail(value);
                        } catch (e) {
                            reject(e);
                            return;
                        }
                        resolve(value);
                    } else {
                        reject(value);
                    }
                });
            });
        },
        catch : function(onFail) {
            return this.then(null, onFail);
        }
    };

    Promise.isPromise = function(obj) {
        return !!(obj && typeof obj.then === "function");
    };

    function some(any, promises) {
        var n = 0, result = [], end
        return new Promise(function(resolve, reject) {
            function loop(promise, index) {
                promise.then(function(ret) {
                    if (!end) {
                        result[index] = ret//保证回调的顺序
                        n++;
                        if (any || n >= promises.length) {
                            resolve(any ? ret : result);
                            end = true
                        }
                    }
                }, function(e) {
                    end = true
                    reject(e);
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
    Promise.any = Promise.race = function() {
        return some(true, arguments)
    }
    Promise.nextTick = function(fn) {
        setTimeout(fn, 0)
    }
    window.Promise = Object.prototype.toString.call(window.Promise) === "[object Promise]" ? window.Promise : Promise
    return avalon
})