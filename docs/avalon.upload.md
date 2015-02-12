avalon.upload()
=============

**Description:** Upload data to the server using a HTTP POST request.

avalon.upload( url, form [, data ] [, success ] [, dataType ] )
-----------------------

**url**

Type: String

A string containing the URL to which the request is sent.

---

**form**

Type: FormData or form Element

A FormData object or a form Element containing the data that is sent to the server with the request.

---

**data**

Type: PlainObject

A plain object that is sent to the server with the request. This data will be attached into FormData before sent.

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
    type: 'post',
    url: url,
    form: formData,
    data: data,
    success: success,
    dataType: dataType
});
```

**Notice:** The value of the `type` option must be `post`.
