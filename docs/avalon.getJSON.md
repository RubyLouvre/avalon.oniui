avalon.getJSON()
=============

**Description:** Load JSON-encoded data from the server using a GET HTTP request.

avalon.getJSON( url [, data ] [, success ] )
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



<br />

This is a shorthand Ajax function, which is equivalent to:

```javascript
avalon.ajax({
    dataType: 'json',
    url: url,
    data: data,
    success: success
});
```
