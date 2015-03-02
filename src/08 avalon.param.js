avalon.param = function( a ) {
    var prefix,
        s = [],
        add = function( key, value ) {
            value = ( value == null ? "" : value );
            s[ s.length ] = encode( key ) + "=" + encode( value );
        };

    if (Array.isArray(a) || !avalon.isPlainObject(a)) {
        avalon.each(a, function(subKey, subVal) {
            add(subKey, subVal);
        });
    } else {
        for (prefix in a) {
            paramInner(prefix, a[prefix], add);
        }
    }

    // Return the resulting serialization
    return s.join( "&" ).replace( r20, "+" );
}

//function isDate(a) {
//    return Object.prototype.toString.call(a) === "[object Date]"
//}
//function isValidParamValue(val) {
//    var t = typeof val; // 值只能为 null, undefined, number, string, boolean
//    return val == null || (t !== 'object' && t !== 'function')
//}
function paramInner( prefix, obj, add ) {
    var name;
    if (Array.isArray( obj ) ) {
        // Serialize array item.
        avalon.each( obj, function( i, v ) {
            paramInner( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, add );
        });
    } else if (avalon.isPlainObject(obj)) {
        // Serialize object item.
        for ( name in obj ) {
            paramInner( prefix + "[" + name + "]", obj[ name ], add);
        }
    } else {
        // Serialize scalar item.
        add( prefix, obj );
    }
}
