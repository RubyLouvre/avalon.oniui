define(["avalon"], function(avalon) {
    function getChildVM( expr , vm ) {
        var t = vm,   pre;
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
   // 在一堆VM中，提取某一个VM的符合条件的子VM
   // 比如 vm.aaa.bbb = {} ; 
   // avalon.getModel("aaa.bbb", vmodels) ==> ["bbb", bbbVM, bbbVM所在的祖先VM（它位于vmodels中）]
    avalon.getModel = function( expr , vmodels ){
        var str = expr.split('.');
        for( var i = 0; i < vmodels.length; i++ ) {
            var ancestor = vmodels[i];
            var child = getChildVM( str , ancestor);
            if( typeof child !== 'undefined' )
                return [ str[str.length-1] , child , ancestor ];
        }
        return null;
    }

    return avalon;
})