mmRequest
=========

One of the three pillars of avalon (route, animation, AJAX utils)

It provides the following methods:

avalon.ajax

  requires exactly one parameter(object) that has attributes like url, type, success, dataType, and behaves just like `jQuery.ajax`.

and some Shorthands:

```javascript
avalon.get( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
avalon.post( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
avalon.upload( url, form [,data] [,success(data, textStatus, XHR)] [, dataType])
avalon.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] )
avalon.getScript( url [, success(script, textStatus, jqXHR) ] )
```

And some useful util methods:

avalon.param(obj)

  Convert an object to a URL query string.

avalon.unparam(str)

  Convert a URL query string back to an object.

Like:

```javascript
    var b = avalon.unparam("a=1&b=2")
      console.log(b) ==> {a: "1", b: "2"}
    var b2 = avalon.unparam("a[]=1&a[]=2&a[]=3&d=false")
      console.log(b2) ==> {a: ["1","2","3"], d: false}
```

avalon.serialize(form)

  Encode a set of form elements as a string.


You can copy the three `avalon.js`, `mmRequest.js` and `mmDeferred.js` scripts to the same folder and write && check this test html file: 

```html

<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script src="avalon.js"></script>
        <!-- You MUST invoke the `require` method provided by avalon (or another AMD loader) to use mmRequest -->
        <script>

            var avalonAjax
            var model = avalon.define("test", function(vm) {
                vm.username = ""
                vm.password = ""
                vm.email = ""
                vm.ajax = function(e) {
                    if (avalonAjax) {
                        avalon.post("/registry", avalon.serialize(this), function(a) {
                            alert(a)
                        }, "text")
                    }
                    e.preventDefault()
                }
            })

            require(["./mmRequest"], function(avalon) {
                avalonAjax = avalon.ajax
                avalon.log(avalonAjax)
            })

        </script>
    </head>
    <body>
        <h3>AJAX Test</h3>
        <ul>
            <li>avalon.ajax</li>
            <li>avalon.post</li>
            <li>avalon.get</li>
            <li>avalon.upload</li>
        </ul>
        <form action="/registry"  ms-controller="test" ms-on-submit="ajax" >
            <div>Username:<input name="username" ms-duplex="username"></div>
            <div>Password:<input name="password" ms-duplex="password"></div>
            <div>Email:<input name="email" ms-duplex="email"></div>
            <button type="submit">Submit</button>
        </form>
    </body>
</html>
```

install with bower:
```
bower install mm-request
```

You wanted to upload something?

```javascript
  avalon.ajax({
    form: formData, // see `https://developer.mozilla.org/zh-CN/docs/Web/Guide/Using_FormData_Objects`
    data: data,     // Additional data that will be attached before `formData` was sent
    type: "post",   // also can be `get`
    url: url,
    success: callback,
    dataType: dataType // the data type you want
 })

  // or using the (shorthand) upload method:
  avalon.upload(url, form, data, callback?, dataType?)
```


-------------------------------------------

avalon的三柱臣之一（ 路由，动画，AJAX）


例子，需要执行npm install命令，安装Express 3.x 和它的依赖，location:3000
如果被墙了,可以使用代理 npm config set registry http://registry.cnpmjs.org 

<img src="https://f.cloud.github.com/assets/190846/2522052/eb28a388-b4b7-11e3-8536-3920de5388c1.jpg"/>



它提供如下方法
<p>avalon.ajax 要求传入一个对象， 对象要有url, type, success, dataType等属性，这与jQuery的设置保持一致
<p>avalon.get( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
<p>avalon.post( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
<p>avalon.upload( url, form [,data] [,success(data, textStatus, XHR)] [, dataType])
<p>avalon.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] )
<p>avalon.getScript( url [, success(script, textStatus, jqXHR) ] )
<p>avalon.param(obj) 将一个对象转换为字符串


<p>avalon.unparam(str) 将一个字符串转换为对象
```javascript
   var b = avalon.unparam("a=1&b=2")
    console.log(b) ==> {a: "1", b: "2"}
    var b2 = avalon.unparam("a[]=1&a[]=2&a[]=3&d=false")
   console.log(b2) ==> {a: ["1","2","3"], d: false}
```
<p>avalon.serialize(form)  将表单元素变字符串

用法与jQuery的同名方法用法完全一样，将avalon.js, mmRequest.js, mmDeferred.js放到同一目录下，然后
```html

<!DOCTYPE html>
<html>
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script src="avalon.js"></script>
        <!--不能直接用script引入mmRequest.js-->
        <script>

            var avalonAjax
            var model = avalon.define("test", function(vm) {
                vm.username = ""
                vm.password = ""
                vm.email = ""
                vm.ajax = function(e) {
                    if (avalonAjax) {
                        avalon.post("/registry", avalon.serialize(this), function(a) {
                            alert(a)
                        }, "text")
                    }
                    e.preventDefault()
                }
            })

            require(["./mmRequest"], function(avalon) {
                avalonAjax = avalon.ajax
                avalon.log(avalonAjax)
            })

        </script>
    </head>
    <body>
        <h3>测试AJAX</h3>
        <ul>
            <li>avalon.ajax</li>
            <li>avalon.post</li>
            <li>avalon.get</li>
            <li>avalon.upload</li>
        </ul>
        <form action="/registry"  ms-controller="test" ms-on-submit="ajax" >
            <div>帐号:<input name="username" ms-duplex="username"></div>
            <div>密码:<input name="password" ms-duplex="password"></div>
            <div>邮箱:<input name="email" ms-duplex="email"></div>
            <button type="submit">提交</button>
        </form>
    </body>
</html>
```
如果想上传东西,可以使用
```javascript
  avalon.ajax({
    form: formData, // 这是一个formData 对象,详看这里 https://developer.mozilla.org/zh-CN/docs/Web/Guide/Using_FormData_Objects
    data: data,     // 附加的内容，它会在传输前添加进 formData 中
    type: "post",   // get也可以
    url: url,
    success: callback,
    dataType: dataType //你想返回什么类型的数据给你
 })

  //或者用upload方法
  avalon.upload(url, form, data, callback?, dataType?)
```
