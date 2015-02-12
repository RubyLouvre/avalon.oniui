avalon.get()
=========

**Description:** Load data from the server using a HTTP GET request.

avalon.get( url [, data ] [, success ] [, dataType ] )
-----------------------

**url**

Type: String

A string containing the URL to which the request is sent.

---

**data**

Type: PlainObject or String

A plain object or string that is sent to the server with the request.

---

**success**

Type: Function( PlainObject data, String textStatus, msXHR msXHR )

A callback function that is executed if the request succeeds.

---

**dataType**

Type: String

The type of data expected from the server. Default: Intelligent Guess (xml, json, script, or html).

<br />

This is a shorthand Ajax function, which is equivalent to:

```javascript
avalon.ajax({
    url: url,
    data: data,
    success: success,
    dataType: dataType
});
```
