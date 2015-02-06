/**
 *
 * @cnName ajax请求
 * @enName mmRequest
 * @introduce
 <p>avalon AJAX组件</p>
 它提供如下方法
<p>avalon.ajax 要求传入一个对象， 对象要有url, type, success, dataType等属性，这与jQuery的设置保持一致
<p>avlaon.get( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
<p>avlaon.post( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
<p>avlaon.upload( url, form [,data] [,success(data, textStatus, XHR)] [, dataType])
<p>avalon.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] )
<p>avalon.getScript( url [, success() ] )
<p>avalon.param(obj) 将一个对象转换为字符串


<p>avalon.unparam(str) 将一个字符串转换为对象
```javascript
   var b = avalon.unparam("a=1&b=2")
    console.log(b) ==> {a: "1", b: "2"}
    var b2 = avalon.unparam("a[]=1&a[]=2&a[]=3&d=false")
   console.log(b2) ==> {a: ["1","2","3"], d: false}
```
<p>avalon.serializ(form)  将表单元素变字符串

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
    contentType: "multipart/form-data",
    data: formData //这是一个formData 对象,详看这里https://developer.mozilla.org/zh-CN/docs/Web/Guide/Using_FormData_Objects
    type: "post",//get也可以
    url: url,
    success: callback,
    dataType: dataType //你想返回什么类型的数据给你

 })

  //或者用upload方法
  avalon.upload(url, form, data, callback?, dataType?)
```
 */