define(["avalon"], function(avalon) {
    function testVM( expr , vm ) {
        var t = vm,
            pre;

        for( var i = 0; i < expr.length; i++ ) {

            var k = expr[i];

            if( typeof t[k] !== 'undefined' ) {
                pre = t;
                t = t[k];
            } else {
                return;
            }
        }

        return pre;
    }

    /*
        返回参数
        [
            expr以.分割的最后一位
            expr最后一位的model，结合第一个元素就可以$watch
            匹配expr的vmodel
        ]
    */
    avalon.getModel = function( expr , vmodels ){

        var e = expr.split('.');
        for( var i = 0; i < vmodels.length; i++ ) {
            var vm = vmodels[i];
            var m = testVM( e , vm);

            if( typeof m !== 'undefined' ) return [ e[e.length-1] , m , vm ];
        }
        return null;
    }

    return avalon;
})