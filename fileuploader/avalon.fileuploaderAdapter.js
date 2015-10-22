define(["avalon"], function ($$) {
    return {
        log: $$.log,
        extend: $$.mix,
        ajax: function () {
            $$.ajax.apply($$, Array.prototype.slice.call(arguments, 0));
        },
        bindEvent: function (dom, eName, fn, scope) {
            $$(dom).bind(eName, function () {
                scope = scope || window;
                var args = Array.prototype.slice.call(arguments, 0);
                fn.apply(scope, args);
            });
        }
    };
});