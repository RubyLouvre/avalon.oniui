// 状态机
define([], function() {
    function copy(target, source) {
        for(var i in source) {
            target[i] = source[i]
        }
    }
    function StateMachine(options) {
        copy(this, options || {})
        if(!this._promise || !this._promise.all) this.error("必须配置_promise未一个有效的Promise解决方案")
    }
    StateMachine.prototype = {
        error: function(msg) {
            throw new Error(msg)
        },
        _promise: typeof Promise != "undefined" ? Promise : null,
        getPromise: function(fn) {
            return new this._promise(fn)
        },
        promiseAll: function(promises) {
            return this._promise.all(promises)
        },
        // 计算从一个状态到另外一个状态所经历状态
        pathComputer: function(from, to) {

        }
    };
    return function(options) {
        return new StateMachine(options)
    }
}); 