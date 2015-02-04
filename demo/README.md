示例
===

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
