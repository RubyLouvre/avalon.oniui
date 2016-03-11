/*
 * 状态机
 */
;(function (argument) {
    var _slice = Array.prototype.slice
    function StateMachine(options) {
        this.extend(this, options)
        if(!this.Promise) throw new Error("[Promise] is required!!")
        this.activeState = NaN
        this.currentState = NaN
        this.enterChain = []
        this.leaveChain = []
    }

    StateMachine.prototype = {
        _call: function(name) {
            var res = this[name].apply(this, _slice.call(arguments, 1))
            return typeof res === "undefined" ? this : res
        },
        /*
         * 计算出进栈状态
         */
        computeStatesRoute: function(from, to, args) {
            this.leaveChain = from ? [from] : []
            this.enterChain = [to]
            return this
        },
        transition: function(from, to, args) {
            var me = this
            this.computeStatesRoute.apply(this, _slice.call(arguments, 0))
            var promise = this.getPromise(function(rs) {rs()}),
                e = {
                    args: args
                }
            this.each([this.leaveChain, this.enterChain], function(chainKey, chain) {
                var fname = chainKey ? "$enter" : "$leave"
                me.each(chain, function(i, state) {
                    promise = promise.then(function() {
                        return me.getPromise(function(rs, rj) {
                            if(e.aborted) return rj(e.aborted) // 终止
                            state[fname](rs, rj, e)
                        })
                    })
                })
            })
            return promise
        },
        extend: function(target) {
            var sources = _slice.call(arguments, 1)
            this.each(sources, function(i, v) {
                for(var key in v) {
                    target[key] = v[key]
                }
            })
            return this
        },
        each: function(arr, fn) {
            for(var i = 0, len = arr.length; i < len; i++) {
                fn(i, arr[i])
            }
            return this
        },
        Promise: typeof Promise != "undefined" ? Promise : null,
        getPromise: function(fn) {
            return new this.Promise(fn)
        },
        getPromiseAll: function(arr) {
            return this.Promise.all(arr)
        }
    }

    if (typeof define === "function" && define.amd) {
        define([], function() {
            return StateMachine
        })
    } else if(typeof exports != "undefined") {
        exports.StateMachine = StateMachine
    } else {
        (window || global).StateMachine = StateMachine
    }
})();
