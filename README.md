mmRequest
=========

mmRequest 为异步 HTTP（AJAX）请求提供了解决方案。就像 `jQuery.ajax()` 所做的那样。

mmRequest 是 avalon 三柱臣之一（另外两个是 route 和 animation）。


安装
------------

从 [bower](http://bower.io/) 安装：

```
bower install mm-request
```

文档
-------------

mmRequest 提供了如下方法：

```javascript
/*
 * avalon.ajax 需要传入一个拥有类似 url、type、dataType、type 等属性的对象参数；
 * avalon.ajax 的行为类似于 jQuery.ajax。
 */
avalon.ajax(opts)

/*
 * 其他一些简写方法：
 */
avalon.get( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
avalon.post( url [, data ] [, success(data, textStatus, XHR) ] [, dataType ] )
avalon.upload( url, form [,data] [, success(data, textStatus, XHR)] [, dataType])
avalon.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] )
avalon.getScript( url [, success(script, textStatus, jqXHR) ] )

/*
 * 一些有用的工具类方法：
 */
// 将一个对象转换成一个用于 URL 中传递请求参数的字符串
avalon.param(obj)
// 将一个用于 URL 中传递请求参数的字符串转换成一个对象
avalon.unparam(str)
// 将一个元素中的表单元素编码成字符串
avalon.serialize(element)

```

示例
----

安装依赖：

```
cd demo/ && npm install
```

如果你很幸运地在中国，试试 [cnpm](http://cnpmjs.org/)。

开启服务：

```
cd ../ && node demo/bin/www
```


如果你安装了 [supervisor](https://github.com/isaacs/node-supervisor)，你可以用它来开启服务。

现在，打开你的浏览器访问 `http://127.0.0.1:3000/demo` 这个地址，你将会看到例子。你可以在 `demo/bin/www` 这个文件中配置端口。

在测试跨域请求之前，你需要模拟一个跨域的环境。你可以将这个项目复制到另外的路径并用另一个端口开启服务作为后端服务（这个例子中，后端服务的端口是 `9000`）。

祝你愉快。:grin:

贡献
------------

请在 `src/` 目录下开发并编辑相应的模块。你可以执行以下命令：

```
cd src/ && node \$\$combo.js
```

来将这些模块合并成 `public/` 路径下的文件。
