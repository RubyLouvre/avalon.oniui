//avalon 1.3.6 2014.11.06
/**
 *
 * @cnName 路由器
 * @enName mmRouter
 * @introduce
 *
 <p><a href="avalon.mmRouter.old.doc.html">旧版文档</a><a href="https://github.com/gogoyqj/avalon.oniui/blob/master/mmRouter/README.md">迁移教程</a></p>
 <p>路由器插件，实现类似angular ui-router的功能</p>
<h5>常见问题及解决方案</h5>
<div style="color:red;">
1、TypeError: avalon.require is not a function  --mmState.js
有什么办法，用的是avalon.shim.js - 重写avalon.controller.loader这个函数，参考下边具体的文档说明
</div><br>
<a href="https://github.com/RubyLouvre/mmRouter/issues/71">更多问题</a>
<h5>mmRouter的使用</h5>
1、引入依赖(直接依赖于mmRouter, 总共依赖于avalon, mmRouter, mmHistory)
```javascript
  require(["mmRouter"], function() {
  })
```
2、定义VM
```javascript
    var model = avalon.define('test', function(vm) {
        vm.currPath = ""
        vm.params = {}
        vm.query = {}
        vm.args = "[]"
    })
```
3、定义路由规则
```javascript
 function callback() {
    model.currPath = this.path
    var params = this.params
    if ("time" in params) {
        params.time = avalon.filters.date(params.time, "yyyy年M月dd日")
    }
    model.params = params
    model.query = this.query
    model.args = "[" + [].slice.call(arguments, 0) + "]"

}
avalon.router.get("/aaa/", callback)
avalon.router.get("/bbb", callback)
avalon.router.get("/ccc/:ccc", callback)
avalon.router.get("/ddd/{time:date}/", callback)
avalon.router.get("/eee/{count:\\d{4}}/", callback)
avalon.router.get("/fff", callback)
```
4、启动历史管理器
```javascript
 avalon.history.start({
     basepath: "/avalon"
  })
```
5、开始扫描
```javascript
avalon.scan()
```
6、页面上的链接处理，所有不想跳转不想刷新整面的A标签，都需要以`#!`/或`#/`开头
（这个由历史管理器的`hashPrefix`参数决定，默认是`!`），target属性指向当前页面．
```html
 <ul>
    <li><a href="#!/aaa">aaa</a></li>
    <li><a href="#!/bbb?uu=3445345&were=4324">bbb</a></li>
    <li><a href="#!/ccc/etretr">ccc</a></li>
    <li><a href="#!/ddd/2014-09-19">ddd</a></li>
    <li><a href="#!/eee/2222">eee</a></li>
    <li><a href="#!/fff?a=1&nn=4&dfg=676">fff</a></li>
</ul>
```
mmRouter与mmHistory的API列表<br>
* `avalon.history.start(opts)`， 开始监听URL变化，opts。 enter image description here<br>
* `avalon.history.stop()`， 中止监听URL变化。<br>
* `avalon.router.get(path, callback)`，用于添加路由规则。第一个为路由规则，<br>
如"/aaa", "/bbb/:bbbId","/eee/{eeeId}/ddd/{dddId:[0-9]{6}}" 冒号后的东西或花括号的东西表示为参数，<br>
花括号模式下还可以指定匹配规则。callback为回调函数，框架会将冒号后的或花括中的匹配内容传进来，<br>
此外this对象，包含了path、 params、 query等对象与属性。<br>
 `'/hello/'` - 匹配'/hello/'或'/hello'<br>
 `'/user/:id'` - 匹配 '/user/bob' 或 '/user/1234!!!' 或 '/user/' 但不匹配 '/user' 与 '/user/bob/details'<br>
 `'/user/{id}'` - 同上<br>
 `'/user/{id:[^/]*}'` - 同上<br>
 `'/user/{id:[0-9a-fA-F]{1,8}}'` - 要求ID匹配/[0-9a-fA-F]{1,8}/这个子正则<br>
 `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the<br>
 path into the parameter 'path'.<br>
 `'/files/*path'` - ditto.<br>
```javascript
 avalon.router.get("/ddd/:dddID/",callback)
 avalon.router.get("/ddd/{dddID}/",callback)
 avalon.router.get("/ddd/{dddID:[0-9]{4}}/",callback)
 avalon.router.get("/ddd/{dddID:int}/",callback)
 我们甚至可以在这里添加新的类型，avalon.router.$type.d4 = { pattern: '[0-9]{4}', decode: Number}
 avalon.router.get("/ddd/{dddID:d4}/",callback)
```
* `avalon.router.add(method, path, callback)` ， 添加回调，第一个为请求类型，
如GET，POST，DELETE什么， 第2个为路由规则，第3个为回调函数
* `avalon.router.error(callback)`，如果没有一条路由规则满足此请求，那么就转交此回调处理，
我们可以在里面写跳转到404页面这样的逻辑
* `avalon.router.navigate(path)`，强制触发对应路径的回调
* `avalon.router.setLastPath(path)` ， 这是框架自己调用，保存最近一次跳转的路径
* `avalon.router.getLastPath()` 取得最近一次跳转的路径，比如用户F5强制页面，你在ready回调中执行此方法，
得到path，然后将它放进navigate中就能回到原来的页面了。
<h3>路由器与多个VM的协作（每个VM定义在不同的JS文件中）</h3>
 */