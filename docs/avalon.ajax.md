avalon.ajax()
=========

**Description:** Perform an asynchronous HTTP (Ajax) request.

avalon.ajax( settings )
-----------------------

**settings**

Type: PlainObject

A set of key/value pairs that configure the Ajax request. `url` is required while other settings are optional.

> **async** (default: `true`)

> Type: Boolean

> By default, all requests are sent asynchronously (i.e. this is set to true by default). If you need synchronous requests, set this option to false. Cross-domain requests and dataType: "jsonp" requests do not support synchronous operation. Note that synchronous requests may temporarily lock the browser, disabling any actions while the request is active.

> ---

> **cache** (default: `true`)

> Type: Boolean

> If set to false, it will force requested pages not to be cached by the browser. Note: Setting cache to false will only work correctly with HEAD and GET requests. It works by appending "_={timestamp}" to the GET parameters. The parameter is not needed for other types of requests, except in IE8 when a POST is made to a URL that has already been requested by a GET.

> ---

> **complete**

> Type: Function( [msXHR](#msXHR) msXHR, String textStatus )

> A function to be called when the request finishes. The function gets passed two arguments: The msXHR object and a string categorizing the status of the request.

> ---

> **contentType** (default: `'application/x-www-form-urlencoded; charset=UTF-8'`)

> Type: Boolean or String

> When sending data to the server, use this content type. Default is "application/x-www-form-urlencoded; charset=UTF-8", which is fine for most cases. If you explicitly pass in a content-type to `avalon.ajax()`, then it is always sent to the server (even if no data is sent). You can pass `false` to tell mmRequest to not set any content type header. **Note:** The W3C XMLHttpRequest specification dictates that the charset is always UTF-8; specifying another charset will not force the browser to change the encoding.

> ---

> **crossDomain** (default: `false for same-domain requests, true for cross-domain requests`)

> Type: Boolean

> If you wish to force a crossDomain request (such as JSONP) on the same domain, set the value of crossDomain to `true`. This allows, for example, server-side redirection to another domain.

> ---

> **data**

> Type: PlainObject or String or Array

> Data to be sent to the server. It is converted to a query string, if not already a string. It's appended to the url for GET-requests. Object must be Key/Value pairs.

> ---

> **dataType** (default: Intelligent Guess (xml, json, script, or html))

> Type: String

> The type of data that you're expecting back from the server. If none is specified, mmRequest will try to infer it based on the MIME type of the response. The available types (and the result passed as the first argument to your success callback) are:

>> "xml": Returns a XML document that can be processed via mmRequest.

>> ---

>> "html": Returns HTML as plain text; included script tags are evaluated when inserted in the DOM.

>> ---

>> "script": Evaluates the response as JavaScript and returns it as plain text. Disables caching by appending a query string parameter, "_=[TIMESTAMP]", to the URL unless the cache option is set to true. Note: This will turn POSTs into GETs for remote-domain requests.

>> ---

>> "json": Evaluates the response as JSON and returns a JavaScript object. The JSON data is parsed in a strict manner; any malformed JSON is rejected and a parse error is thrown. An empty response is also rejected; the server should return a response of null or {} instead. (See json.org for more information on proper JSON formatting.)

>> ---

>> "jsonp": Loads in a JSON block using JSONP. Adds an extra "?callback=?" to the end of your URL to specify the callback. Disables caching by appending a query string parameter, "_=[TIMESTAMP]", to the URL unless the cache option is set to true.

>> ---

>> "text": A plain text string.

> ---

> **error**

> Type: Function( String textStatus, Error errorThrown )

> A function to be called if the request fails. The function receives two arguments: a string describing the type of error that occurred and an optional exception object, if one occurred.

> ---

> **headers** (default: {})

> Type: PlainObject

> An object of additional header key/value pairs to send along with requests using the XMLHttpRequest transport. The header `X-Requested-With: XMLHttpRequest` is always added, but its default `XMLHttpRequest` value can be changed here.

> ---

> **jsonp**

> Type: String

> Override the callback function name in a JSONP request. This value will be used instead of 'callback' in the 'callback=?' part of the query string in the url. So `{jsonp:'onJSONPLoad'}` would result in `'onJSONPLoad=?'` passed to the server.

> ---

> **jsonpCallback**

> Type: String or Function()

>Specify the callback function name for a JSONP request. This value will be used instead of the random name automatically generated by avalon. It is preferable to let avalon generate a unique name as it'll make it easier to manage the requests and provide callbacks and error handling. You may want to specify the callback when you want to enable better browser caching of GET requests.

> ---

> **mimeType**

> Type: String

> A mime type to override the XHR mime type.

> ---

> **password**

> Type: String

> A password to be used with XMLHttpRequest in response to an HTTP access authentication request.

> ---

> **success**

> Type: Function( Anything data, String textStatus, msXHR msXHR )

> A function to be called if the request succeeds. The function gets passed three arguments: The data returned from the server, formatted according to the `dataType` parameter if specified; a string describing the status; and the `msXHR` object.

> ---

> **timeout**

> Type: Number

> Set a timeout (in milliseconds) for the request. The timeout period starts at the point the `avalon.ajax` call is made; if several other requests are in progress and the browser has no connections available, it is possible for a request to time out before it can be sent. Script and JSONP requests cannot be cancelled by a timeout; the script will run even if it arrives after the timeout period.

> ---

> **type** (default: `'GET'`)

> Type: String

> The type of request to make (e.g. "POST", "GET", "PUT"); default is "GET".

> ---

> **url** (default: `The current page`)

> Type: String

> A string containing the URL to which the request is sent.

> ---

> **username**

> Type: String

> A username to be used with XMLHttpRequest in response to an HTTP access authentication request.

<br />

The `avalon.ajax()` function underlies all Ajax requests sent by avalon. It is often unnecessary to directly call this function, as several higher-level alternatives like `avalon.get()` and `avalon.upload()` are available and are easier to use.

The msXHR Object
----------------

The avalon XMLHttpRequest (msXHR) object returned by `avalon.ajax()` is a superset of the browser's native XMLHttpRequest object and the Promise object. For example, it contains `responseText` and `responseXML` properties, as well as a `getResponseHeader()` method. When the transport mechanism is something other than XMLHttpRequest (for example, a script tag for a JSONP request) the `msXHR` object simulates native XHR functionality where possible.

The msXHR objects returned by `avalon.ajax()` implement the Promise interface, giving them all the properties, methods, and behavior of a Promise. These methods take one or more function arguments that are called when the `avalon.ajax()` request terminates. This allows you to assign multiple callbacks on a single request, and even to assign callbacks after the request may have completed. (If the request is already complete, the callback is fired immediately.) Available Promise methods of the msXHR object include:

- msXHR.done(function( data ) {});

    An alternative construct to the success callback option.

- msXHR.fail(function( msXHR ) {});

    An alternative construct to the error callback option.

- msXHR.then(function( data ) {}, function( msXHR ) {});

    Incorporates the functionality of the .done() and .fail() methods, allowing the underlying Promise to be manipulated.

**Notice:** What these promise callbacks return are **pure** promise objects but not msXHR objects.

```javascript
var aa = avalon.ajax({
    url: '/demo/api'
});

console.log(aa.readyState)
// -> 0

var bb = avalon.ajax({
    url: '/demo/api'
}).done(function() {});

console.log(bb.readyState)
// -> undefined

```

Callback Function Queues
------------------------

Option callbacks — `error`, `success` and `complete` options all accept callback functions that are invoked at the appropriate times. `complete` callback function is invoked after `error`
and `success`.

Promise callbacks — `.done()`, `.fail()` and `.then()` — are invoked, in the order they are registered.

Promise callbacks are invoked after option callback.
