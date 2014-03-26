mmRequest
=============

avalon的三柱臣之一（ 路由，动画，AJAX）


例子，需要执行npm install命令，安装Express 3.x 和它的依赖，location:3000
如果被墙了,可以使用代理 npm config set registry http://registry.cnpmjs.org 

<img src="https://f.cloud.github.com/assets/190846/2522052/eb28a388-b4b7-11e3-8536-3920de5388c1.jpg"/>



它提供如下方法
<p>avalon.ajax 要求传入一个对象， 对象要有url, type, success, dataType等属性，这与jQuery的设置保持一致
<p>avlaon.get( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
<p>avlaon.post( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
<p>avlaon.upload( url, form [,data] [,success(data, textStatus, XHR)] [, dataType])
<p>avalon.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] )
<p>avalon.getScript( url [, success(script, textStatus, jqXHR) ] )
<p>avalon.param(obj) 将一个对象转换为字符串
<p>avalon.unparam(str) 将一个字符串转换为对象
<p>avalon.serializ(form)  将表单元素变字符串

用法与jQuery的同名方法用法完全一样，将avalon.js, mmRequest.js, mmDeferred.js放到同一目录下，然后
```html
<script src="avalon.js"></script>
<!--不能直接用script引入mmRequest.js-->
<script >
require(["mmRequest"], function(){
    var form = document.getElementById("formId")
    var str = avalon.serializ(form)
    var data = avalon.unparam(str)
       mmRequest.post(url, data, function(json){
          alert(json)
       }, "json")
    })
</script>

```
