avalon.getScript()
=============

**Description:** Load a JavaScript file from the server using a GET HTTP request, then execute it.

avalon.getScript( url [, success ] )
-----------------------

**url**

Type: String

A string containing the URL to which the request is sent.

---

**success**

Type: Function( String script, String textStatus, msXHR msXHR )

A callback function that is executed if the request succeeds.



<br />

This is a shorthand Ajax function, which is equivalent to:

```javascript
avalon.ajax({
    url: url,
    dataType: 'script',
    success: success
});
```
