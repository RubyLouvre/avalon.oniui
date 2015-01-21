mmRouter
=========================

avalon的三柱臣之一（ 路由，动画，AJAX）

mmRouter的使用
----------------------------------------
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
mmRouter与mmHistory的API列表
----------------------------------------
* `avalon.history.start(opts)`， 开始监听URL变化，opts。 enter image description here
<div><img src="http://htmljs.b0.upaiyun.com/uploads/1411112779022-router2.jpg"/></div>
* `avalon.history.stop()`， 中止监听URL变化。
* `avalon.router.get(path, callback)`，用于添加路由规则。第一个为路由规则，<br>
如"/aaa", "/bbb/:bbbId","/eee/{eeeId}/ddd/{dddId:[0-9]{6}}" 冒号后的东西或花括号的东西表示为参数，<br>
花括号模式下还可以指定匹配规则。callback为回调函数，框架会将冒号后的或花括中的匹配内容传进来，<br>
此外this对象，包含了path、 params、 query等对象与属性。
```javascript
         `'/hello/'` - 匹配'/hello/'或'/hello'
         `'/user/:id'` - 匹配 '/user/bob' 或 '/user/1234!!!' 或 '/user/' 但不匹配 '/user' 与 '/user/bob/details'
         `'/user/{id}'` - 同上
         `'/user/{id:[^/]*}'` - 同上
         `'/user/{id:[0-9a-fA-F]{1,8}}'` - 要求ID匹配/[0-9a-fA-F]{1,8}/这个子正则
         `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
         path into the parameter 'path'.
         `'/files/*path'` - ditto.
         */
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
[http://rubylouvre.github.io/mvvm/avalon.router.html](http://rubylouvre.github.io/mvvm/avalon.router.html)
<h3>路由器与多个VM的协作（每个VM定义在不同的JS文件中）</h3>
```javascript

//aaa.js
define("aaa", function(){
   return  avalon.define("aaa", function(vm){
        vm.path = "/aaa"
  
   })

})

//bbb.js
define("bbb", function(){
   return avalon.define("bbb", function(vm){
       
 
   })
})

//ccc.js
define("ccc", function(){
    return avalon.define("ccc", function(vm){
     
   })
})

//页面
require(["mmRouter", "aaa", "bbb", "ccc"], function(avalon, av, bv, cv){
    avalon.router.get("/aaa", function(a) {
       av.path = a
    })
    avalon.router.get("/bbb", function(a) {
        bv
    })
    avalon.router.get("/ccc", function(a) {
       cv
    })
   
    avalon.history.start({
    basepath: "/mvvm"
    })
    avalon.router.navigate("/aaa")
    avalon.scan()

})
```
mmState的使用
----------------------------------------
1、引入依赖(直接依赖于mmState, 总共依赖于avalon, mmRouter, mmHistory, mmPromise, mmState)
```javascript
    require(["ready!", "mmState"], function() {

    })
```
2、定义顶层VM， 名字随便叫，但页面上有一个ms-controller，因为 mmState内部有一个getViews方法，通过它得到所有ms-views所在的子孙元素
`getViews("test","contacts.list")` 得到`DIV[avalonctrl="test"] [ms-view]`这样一个CSS表达式，再通过`document.querySelectorAll`
或内部为兼容IE67实现的简单选择器引擎进行元素查找。
```javascript
    require(["ready!", "mmState"], function() {
        //一个顶层VM
         avalon.define({
             $id: "test" /
         })
    })
```
3、定义各种状态，内部会转换为一个路由表，交由mmRouter去处理。
5、开始扫描
```javascript
    avalon.state("home", {
        controller: "test",
        url: "/",
        views: {
            "": {
                template: '<p class="lead">Welcome to the UI-Router Demo</p>' +
                        '<p>Use the menu above to navigate. ' +
                        'Pay attention to the <code>$state</code> and <code>$stateParams</code> values below.</p>' +
                        '<p>Click these links—<a href="#!/contacts/1">Alice</a> or ' +
                        '<a href="#!/contacts/2">Bob</a>—to see a url redirect in action.</p>'
            },
            'hint@': {
                template: "当前状态是home"
            }
        }

    })
```
注意，第一个状态，<b>必须指定controller</b>，controller为顶层VM的`$id`。
注意，添加状态的顺序，必须先添加aaa, 再添加aaa.bbb，再添加aaa.bbb.ccc，不能先添加aaa.bbb，再添加aaa
4、启动历史管理器
```javascript
    avalon.history.start({
        basepath: "/mmRouter"
    })
```
5、开始扫描
```javascript
   avalon.scan()
```
avalon.state的参数与配置项与内部生成属性
-----------------------------------
```javascript
avalon.state(stateName: opts)
```

* stateName： 指定当前状态名
* url:  当前状态对应的路径规则，与祖先状态们组成一个完整的匹配规则
* controller： 指定当前所在的VM的名字（如果是顶级状态对象，必须指定）
* views: 对多个[ms-view]容器进行处理,<br>
    每个对象应拥有template, templateUrl, templateProvider, onBeforeLoad, onAfterLoad属性<br>
    template,templateUrl,templateProvider属性必须指定其一,要求返回一个字符串或一个Promise对象<br>
    onBeforeLoad, onAfterLoad是可选<br>
    如果不写views属性,则默认view为"",这四个属性可以直接写在opts对象上<br>
    views的结构为<br>
```
    {
       "": {template: "xxx", onBeforeLoad: function(){} }
       "aaa": {template: "xxx", onBeforeLoad: function(){} }
       "bbb@": {template: "xxx", onBeforeLoad: function(){} }
    }
    views的每个键名(keyname)的结构为viewname@statename，
        如果名字不存在@，则viewname直接为keyname，statename为opts.stateName
        如果名字存在@, viewname为match[0], statename为match[1]
```
* template: 指定当前模板，也可以为一个函数，传入opts.params作参数
* templateUrl: 指定当前模板的路径，也可以为一个函数，传入opts.params作参数
* templateProvider: 指定当前模板的提供者，它可以是一个Promise，也可以为一个函数，传入opts.params作参数
* onChange: 当切换为当前状态时调用的回调，this指向状态对象，参数为匹配的参数，
          我们可以在此方法 定义此模板用到的VM， 或修改VM的属性
* onBeforeLoad: 模板还没有插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
* onAfterLoad: 模板插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
* abstract:  表示它不参与匹配
* parentState: 父状态对象（框架内部生成）


<p>具体可以看http://localhost:xxx/mmRouter/index2.html 示例页面</p>

