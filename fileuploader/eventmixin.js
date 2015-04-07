define(["avalon"], function(avalon) {
	var jsDebugger = true;
	var flashDebugger = true;

	var mixEvent = function mixEvent(jsClass) {
		if (jsClass.prototype.__eventmixed) return;
		jsClass.prototype.__eventmixed = true;	// 防止被Mix两次
		jsClass.prototype.attachEvent = function (event, fn, scope) {
			if (!this.listeners) {
				this.listeners = {};
			}
			if (!this.listeners.hasOwnProperty(event)) {
				this.listeners[event] = [];
			}
			this.listeners[event].push({
				scope: scope,
				fn: fn
			});
		}
		jsClass.prototype.fireEvent = function (event) {
			if (!this.listeners) return;
			var listeners = this.listeners;
			var args = Array.prototype.slice.apply(arguments, [1]);
			if (listeners.hasOwnProperty(event)) {
				var eventListeners = listeners[event];
				var excuteResult = true;
				eventListeners.forEach(function(e) {
					var r = e.fn.apply(e.scope, args);
					if (typeof r == 'boolean') excuteResult = excuteResult && r;
				});
				return excuteResult;
			}
		}
		jsClass.prototype.unattachEvent = function (event, fn, scope) {
			if (!this.listeners) return;
			if (this.listeners.hasOwnProperty(event)) {
				var eventListeners = this.listeners[event];
				var detachedList = [];
				eventListeners.forEach(function(e) {
					if (e.scope == scope && e.fn == fn) {
						detachedList.push(e);
					}
				});
				detachedList.forEach(function(e) {
					eventListeners.remove(e);
				});
			}
		}
		jsClass.prototype.log = function () {
			if (this.jsDebuggerOn) avalon.log.apply(avalon, Array.prototype.slice.call(arguments, 0));
		}
		jsClass.prototype.jsDebuggerOn = jsDebugger;
		jsClass.prototype.flashDebuggerOn = jsDebugger;

		if (jsClass.prototype.hasOwnProperty('purge')) {
			var originPurge = jsClass.prototype.purge;
			jsClass.prototype.purge = function () {
				originPurge.call(this);
				delete this.listeners;				
			}
		} else {
			jsClass.prototype.purge = function () {
				delete this.listeners;
			}
		}
	};
	return mixEvent;
});
