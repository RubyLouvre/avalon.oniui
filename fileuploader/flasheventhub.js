define(["avalon"], 
function ($$) {
	var fehContructor = function (flash) {
		this.events = {};
		this.__flash = flash;
	}

	fehContructor.prototype.addEventListener = function (eName, fn, scope) {
		scope = scope || window;
		if (!this.events.hasOwnProperty(eName)) {
			this.events[eName] = {
				listeners: []
			};
		}

		this.events[eName].listeners.push({
			scope: scope,
			fn: fn
		});
	}

	fehContructor.prototype.removeEventListener = function (eName, fn, scope) {
		scope = scope || window;
		if (this.events.hasOwnProperty(eName)) {
			var listeners = this.events[eName].listeners,
				i = 0;

			while (i < listeners.length) {
				if (listeners[i].fn === fn && listeners[i].scope === scope) {
					avalon.Array.removeAt(listeners, i);
				} else {
					i++;
				}
			}

			if (listeners.length == 0) {
				delete this.events[eName];
			}
		}
	}

	fehContructor.prototype.sendFlashMessage = function (name) {
		var args = Array.prototype.slice.call(arguments, 1);
		var fn = this.__flash[name];
		if (fn != null) {
			return fn.apply(this.__flash, args);
		}
		return undefined;
	}

	/**
	 * 异步的触发一个Flash Event。
	 * Flash的EI.call是一个同步函数，setTimeout可以让Flash尽早的从挂起状态中解除。
	 */
	fehContructor.prototype.dispatchEventAsync = function (eName, args, removeEvent) {
		if (this.events.hasOwnProperty(eName)) {
			var listeners = this.events[eName].listeners;
			setTimeout(function() {
				for (var i = 0; i < listeners.length; i++) {
					listeners[i].fn.apply(listeners[i].scope, args);
				}
			}, 1);
			if (removeEvent === true) {
				delete this.events[eName];
			}
		}
		return true;
	}

	// fehContructor.prototype.fire = function (eName, args) {

	// }

	return fehContructor;
});