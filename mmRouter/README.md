mmRouter
=========================

avalon的三柱臣之一（ 路由，动画，AJAX）

[详细文档](http://ued.qunar.com/oniui/mmRouter/avalon.mmRouter.doc.html)

如何从mmState迁移到new-mmState
-----------------------------------
1、新版new-mmState特性
* 通过ms-view binding来实现视图刷新，效率更高、可用性更强
* 调整了状态机模型，去掉累赘的逻辑
* 明确viewname[@statename]语法规则
* 规范接口命名
* 给state新增配置ignoreChange，当mmState.currentState == state时，更新视图的时候调用该函数，return true mmRouter则不会去重写视图和scan，请确保该视图内用到的数据没有放到avalon，用以特定情况下提升性能
* query只参与mmState.currentState是否需要执行onEnter && 刷新视图的逻辑判定，但是在所有state内都是可以通过this.query或者this.getQuery获取
* 弱化state & 全局接口，接口细分，给view对象新增controller系列属性，用以解决模块化开发+工程化
* 新增dom cache功能，进一步提升性能

2、如何迁移
* 引用新的script文件，默认已经切换到新版
```javascript
  require(["mmState"], function() {
  })
```
如果需要继续使用老版的mmRouter
```javascript
  require(["old-mmState"], function() {
  })
```
* 接口修改对应

|旧接口|新接口|说明|
| ------------- | ----------- | ----------- |
|state.onBeforeChange|onBeforeEnter|进入状态之前回调，参数未变化|
|state.async|去掉|去掉这个接口|
|state.onChange|onEnter|进入状态回调，参数调整，参照文档|
|state.onBeforeUnload|onBeforeExit|退出状态之前回调，参数未变化|
|state.onAfterUnload|onExit|退出状态之前回调，参数未变化|
|state.onBeforeLoad|去掉该接口|通过给view对象配置controller替代|
|state.onAfterLoad|去掉该接口|通过给view对象配置controller替代|
|avalon.state.config.beforeUnload|onBeforeUnload|A=>B触发，全局，只跳转前触发一次，用以展示提示信息，规范命名，参数未变|
|avalon.state.config.abort|onAbort|取消跳转，规范命名，参数未变|
|avalon.state.config.unload|onUnload|全局，规范命名，参数未变|
|avalon.state.config.begin|onBegin|开始跳转，规范命名，参数未变|
|avalon.state.config.onload|onLoad|跳转成功，规范命名，参数未变|
|avalon.state.config.onloadError|onError|出错，规范命名，并修改参数参数第一个参数是一个object，object.type表示出错的类型，比如view表示加载出错，object.name则对应出错的view name，第二个参数是对应的state|

* 视图命名

|语句|说明|
| ------------- | ----------- |
| "" | 指向父状态内views[""]配置的template |
| "viewname" | 指向父状态内views[viewname]配置的template，覆盖其配置 |
| "viewname@" | 指向root状态之内viewname指定的template，覆盖掉其所有父级状态的配置|
| "viewname@statename" | 指向statename状态之内的view，覆盖其配置|
| "@statename" | 指向statename状态内的""view，可以理解为用这个view去覆盖statename状态的""view |

3、迁移可能碰到的问题

* 由于视图刷新逻辑的修改，在state的onload事件去获取视图的一些ui组件可能获取不到

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
* `avalon.history.start(opts)`， 开始监听URL变化，opts：
  
  ![router2](http://htmljs.b0.upaiyun.com/uploads/1411112779022-router2.jpg)

* `avalon.history.stop()`， 中止监听URL变化。
* `avalon.router.get(path, callback)`，用于添加路由规则。第一个为路由规则，
  
  如"/aaa", "/bbb/:bbbId","/eee/{eeeId}/ddd/{dddId:[0-9]{6}}" 冒号后的东西或花括号的东西表示为参数，

  花括号模式下还可以指定匹配规则。callback为回调函数，框架会将冒号后的或花括中的匹配内容传进来，

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

### 路由器与多个VM的协作（每个VM定义在不同的JS文件中）
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
注意，第一个状态，__必须指定controller__，controller为顶层VM的`$id`。
注意，添加状态的顺序，必须先添加aaa, 再添加aaa.bbb，再添加aaa.bbb.ccc，不能先添加aaa.bbb，再添加aaa。

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
* views: 对多个[ms-view]容器进行处理,

  每个对象应拥有template, templateUrl, templateProvider, onBeforeLoad, onAfterLoad属性

  template,templateUrl,templateProvider属性必须指定其一,要求返回一个字符串或一个Promise对象

  onBeforeLoad, onAfterLoad是可选

  如果不写views属性,则默认view为"",这四个属性可以直接写在opts对象上

  views的结构为：

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
* onEnter: 当切换为当前状态时调用的回调，this指向状态对象，参数为匹配的参数，我们可以在此方法 定义此模板用到的VM， 或修改VM的属性
* onBeforeLoad: 模板还没有插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
* onAfterLoad: 模板插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
* abstract:  表示它不参与匹配
* parentState: 父状态对象（框架内部生成）


具体可以看<https://rawgit.com/RubyLouvre/mmRouter/master/index2.html>示例页面

