define(["avalon"], function(avalon) {
    function getChildVM(expr, vm) {
        var t = vm, pre, _t;
        for (var i = 0, len = expr.length; i < len; i++) {
            var k = expr[i];
            _t = t.$model || t;
            if (typeof _t[k] !== 'undefined') {
                pre = t;
                t = _t[k];
            } else {
                return;
            }
        }
        return pre;
    }
   // 在一堆VM中，提取某一个VM的符合条件的子VM
   // 比如 vm.aaa.bbb = {} ; 
   // avalon.getModel("aaa.bbb", vmodels) ==> ["bbb", bbbVM, bbbVM所在的祖先VM（它位于vmodels中）]
    avalon.getModel = function(expr, vmodels){
        var str = expr.split('.');
        var last = str[str.length-1];
        if (str.length != 1) {
            str.pop();
        }
        for (var i = 0, len = vmodels.length; i < len; i++) {
            var ancestor = vmodels[i];
            var child = getChildVM(str, ancestor);
            if (typeof child !== 'undefined' && child.hasOwnProperty(last)) {
                return [str[str.length-1], child, ancestor];
            }
        }
        return null;
    }
    return avalon;
})