mmRequest
=========

mmRequest provides solutions for asynchronous HTTP (Ajax) requests. Just like `jQuery.ajax()`.

mmRequest is one of the three pillars of avalon (route, animation, AJAX utils).

Installing
------------

Install with [bower](http://bower.io/):

```
bower install mm-request
```

Document
-------------
mmRequest provides the following methods:

```javascript
/*
 * avalon.ajax requires exactly one parameter(object) that has attributes like url, type, success, dataType,
 * and behaves just like jQuery.ajax.
 */
avalon.ajax(opts)

/*
 * some other shorthands:
 */
avalon.get( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
avalon.post( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
avalon.upload( url, form [,data] [, success(data, textStatus, XHR)] [, dataType])
avalon.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] )
avalon.getScript( url [, success(script, textStatus, jqXHR) ] )

/*
 * some useful util methods:
 */
// Convert an object to a URL query string.
avalon.param(obj)
// Convert a URL query string back to an object.
avalon.unparam(str)
// Convert a set of form elements to a string.
avalon.serialize(element)

```

Demo
----

Install dependencies:

```
cd demo/ && npm install
```

If you are in China unfortunately, try [cnpm](http://cnpmjs.org/).

Start sever:

```
cd ../ && node demo/bin/www
```

If you installed [supervisor](https://github.com/isaacs/node-supervisor), you can use it to start the server.

Now, open your browser and visit `http://127.0.0.1:3000/demo`, you will see the demo. You can configure the port in `demo/bin/www`.

Before you test cross-domain requests, you need to simulate a cross-domain environment. You can clone this repository to another path and start another server with a different port as the back-end server (In this demo, the port of the back-end server is `9000`).

Have fun.:grin:

Contributing
------------

Please develop in `src/` and edit corresponding modules. You can run:

```
cd src/ && node \$\$combo.js
```

to combine them into one file in `public/`.
