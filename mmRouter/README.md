mmRouter
=========================

mmRouter
----------------------------------------

### 简介

路由器，mmRouter负责定义路由规则与对应的回调， 当mmHistory监听到URL变化或历史变化时就会匹配路由规则，触发回调

mmHistroy是负责监听URL地址栏的变化及用户是否已经点击了前进后退按钮

不支持AVALON 2

### 使用说明

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

### API
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

mmState
----------------------------------------

### 简介

mmState是基于mmRouter的增强，之前mmRouter的回调是用户自己处理视图的切换。现在mmState是将当前页面分得更切， 一个页面分N个子页面，子页面又可以有子页面……每个页面相当于一种状态。mmState可以将我们将这些页面的异步加载或数据的异步加载或者业务逻辑的编写,对应vmodel的定义完美的组织起来，并且提供了各种的回调，方便你在某个页面进场前显示loading，进场处淡出loading，两个页面切换间使用动画效果

[依葫芦画瓢](https://github.com/gogoyqj/mmRouter-demo-list)


### 使用说明

mmState的使用
----------------------------------------
1、主文件index.js，引用mmState.js，并定义顶层的vmodel + state，推荐的架构：
```javascript
    require(["mmState"], function() {
        // 定义一个顶层的vmodel，用来放置全局共享数据
        var root = avalon.define("root", function(vm) {
            vm.page = ""
        })

        // 定义一个全局抽象状态，用来渲染通用不会改变的视图，比如header，footer
        avalon.state("root", {
            url: "/",
            abstract: true, // 抽象状态，不会对应到url上
            views: {
                "": {
                    templateUrl: "./script/template/blog.html", // 指定模板地址
                    controllerUrl: "./controller/blog.js" // 指定控制器地址
                }, 
                // 定义一个公用的footer
                "footer@": { 
                    template: function() {
                        return "<div style=\"text-align:center;\">this is footer</div>"
                    } // 指定一个返回字符串的函数来获取模板
                }
            }
        })

        avalon.state.config({
            onError: function() {
                console.log(arguments)
            } // 强烈打开错误配置
        })
    })
```
mmState新增了一个stateUrl，支持将state的url、abstract等必须属性之外的配置写到另外的文件，在进入状态的时候使用avalon.controller.loader去加载，这样既更方便的支持打包，又减小了路由文件的体积
```javascript
    // index.js
    require(["mmState"], function() {
        // 定义一个顶层的vmodel，用来放置全局共享数据
        var root = avalon.define("root", function(vm) {
            vm.page = ""
        })

        // 定义一个全局抽象状态，用来渲染通用不会改变的视图，比如header，footer
        avalon.state("blog", {
            url: "/",
            abstract: true, // 抽象状态，不会对应到url上
            stateUrl: "./blog" // 如果你使用的是webpack进行打包，stateUrl后面不允许出现变量
        })

        // 如果这个项目使用webpack打包，你需要再重写avalon.controller.loader
        // 依赖StateUrlCompilationPlugin.js，你可以在https://github.com/gogoyqj/mmRouter-demo-list/tree/master/webpack/StateUrlCompilationPlugin.js获取
        avalon.controller.loader = function (url, callback) {
            if (url.join) {
                __webpack_require__.e(url[1], function (r) {
                    callback(r(url[0]))
                })
            } else {
                // 修改为更合理的容错
                var msg = url + '没有打包进来'
                window.console && console.log(msg)
                throw Error(msg)
            }
        }

        avalon.state.config({
            onError: function() {
                console.log(arguments)
            } // 强烈打开错误配置
        })
    })

    // blog.js，以下代码是基于webpack打包，因此可直接使用require
    define([], function() {
        return {
            views: {
                "": {
                    template: require("./template/blog.html"), // 指定模板地址
                    controller: require("./controller/blog") // 指定控制器地址
                },
                "footer@": { // 视图名字的语法请仔细查阅文档
                    template: function() {
                        return "<div style=\"text-align:center;\">this is footer</div>"
                    } // 指定一个返回字符串的函数来获取模板
                }
            }
        }    
    })
    // blog.js，requirejs版本
    define(["avalon", "text!./common/blog.html", "./common/blog"], function(avalon, tpl, ctrl) {
        // do something
        return {
            views: {
                "": {
                    template: tpl, // 指定模板地址
                    controller: ctrl // 指定控制器地址
                },
                "footer@": { // 视图名字的语法请仔细查阅文档
                    template: function() {
                        return "<div style=\"text-align:center;\">this is footer</div>"
                    } // 指定一个返回字符串的函数来获取模板
                }
            }
        }    
    })
```

2、在index.js内继续定义state
```javascript
    // 定义一个root的子状态，对应url是 /list/{pageId}，比如/list/1，/list/2
    avalon.state("root.list", {
        url: "/list/{pageId}",
        views: {
            // 定义视图
            "": {
                templateUrl: "./script/template/list.html", // 模板地址
                controllerUrl: "./controller/lists.js", // 控制器地址
                ignoreChange: function(type) {
                    return !!type
                } // url通过{}配置的参数变量发生变化的时候是否通过innerHTML重刷ms-view内的DOM，默认会，如果你做的是翻页这种应用，建议使用例子内的配置，把数据更新到vmodel上即可
            }
        }
    })

    // 全局配置
    avalon.state.config({
        // 强烈打开错误配置
        onError: function() {
            console.log(arguments)
        },
        // 跳转成功
        onLoad: function() {
            root.page = mmState.currentState.stateName.split(".")[1]
        }
    })

    avalon.history.start({})
    avalon.scan()

```
注意，添加状态的顺序，必须先添加aaa, 再添加aaa.bbb，再添加aaa.bbb.ccc，不能先添加aaa.bbb，再添加aaa，即先定义父状态

3、编写控制器./controller/lists.js
```javascript
    define([], function() {
        // 定义所有相关的vmodel
        var blog = avalon.define("blog", function(vm) {
        })

        return avalon.controller(function($ctrl) {
            // 视图渲染后，意思是avalon.scan完成的回调
            $ctrl.$onRendered = function() {
                /*
                    this 指向 ms-view dom 元素 
                */
            }
            // 进入视图时候的回调
            $ctrl.$onEnter = function() {
            }
            // 对应的视图销毁前
            $ctrl.$onBeforeUnload = function() {}
            // 指定一个avalon.scan视图的vmodels，vmodels = $ctrl.$vmodels.concact(DOM树上下文vmodels)
            $ctrl.$vmodels = []
        })
    })

    // 或者
    define([], function() {
        // 定义所有相关的vmodel
        var blog = avalon.define("blog", function(vm) {
            // 对视图调用avalon.scan后出发的回调
            vm.$onRendered = function(obj) {
                /*
                    obj = {
                        template: '',
                        state   : 状态,
                        element : ms-view dom 元素
                    }
                */
            }
            // 进入视图时候的回调
            vm.$onEnter = function(params, resolve, reject) {
                setTimeout(function() {
                    // 写数据
                    ...
                    resolve()
                })
                return false
            }
            // 视图销毁前，return false可以阻止视图被销毁【比如跳转的时候】
            vm.$onBeforeUnload = function() {}
            // 指定一个avalon.scan视图的vmodels，vmodels = $ctrl.$vmodels.concact(DOM树上下文vmodels)
            vm.$vmodels = []
        })
        return vm
    })
```
4、view
index.html
```html
<!DOCTYPE html>
<html>
    <head>
        <title>文章单页应用</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="css/style.css">
    </head>
    <body 
          ms-controller="root">
        <div ms-view="" class="layout"></div>
        <div ms-view="footer"></div>
    </body>
    <script src="script/avalon.js"></script>
    <script>
        require.config({
            baseUrl: "./script"
        });
        require(["./route"], function(route) {
            route && route.init && route.init()
        })
    </script>
</html>
```

blog.html
```html
<div 
     ms-controller="blog" class="blog">
    <div class="header">文章</div>
    <ul class="nav">
        <li
               ms-class="select:page=='list'"><a href="#!//">首页</a></li>
    </ul>
    <!--如果不需要动画，请移除oni-mmRouter-slide-->
    <div ms-view="" class="oni-mmRouter-slide"></div>
</div>
```

list.html
```html
<div 
     ms-controller="lists">
     <ul class="list">
         <li ms-repeat-blog="blogs">{{blog.id}}，{{blog.title}}</li>
     </ul>
     <div class="page">
         <a href="##" 
            ms-visible="currentPage > 0" 
            ms-click="pre($event)">上一页</a>
         <a href="##" 
            ms-visible="currentPage < totalPage" 
            ms-click="next($event)">下一页</a>
     </div>
</div>
```

### API

#### state

##### 定义状态
```javascript
    avalon.state(parentStateName + ".name", options)
```

options字段

* url: String 例如："{id}"

和parentState的url属性连接起来对应浏览器url，例如 root.url = "/", list.url = "list/{pageId}"，匹配的浏览器地址就是"/list/2"这样

* abstract: Bool

是否是抽象状态，比如 "root.list"对应了 "/blog/list"，"root.detail"对应了 "/blog/detail"，这里的 "root"就可以是一个abstract状态，如果并没有"/blog"这个页面

* views: Object 

定义视图，参见view 

* ignoreChange: function (changeType) {}

当mmState.currentState == this时，更新视图的时候调用该函数，return true mmRouter则不会去重写视图和scan，请确保该视图内用到的数据没有放到avalon vmodel $skipArray内，changeType值为"param"，表示params变化，值为"query"，表示query变化

* onBeforeEnter: function () {}

进入状态之前，除去resolve和reject，其他参数与定义state时候url参数内的变量一一对应

* onEnter: function([params1, param2, ]resolve, reject) {} 

进入状态

return false表示有需要等待异步逻辑，这个时候跳转会中断，直到手动调用resolve

* onBeforeExit: function() {}

退出状态之前

* onExit: function(resolve, reject) {}

退出状态，参数同onEnter




#### 定义view

view绑定在state的views属性上，当状态只有一个view时候，也可以直接将template、controller属性挂载到定义state的对象上

##### 定义视图
```javascript

    "viewname@statename": {
        template[""|Url|Provider]: // 模板
        controller[""|Url|Provider]: // 控制器
    }

    // 字符串 + 地址
    "": {
        template: "<div></div>",
        controllerUrl: "a.js"
    }

    // 地址
    "": {
        templateUrl: "a.html",
        controllerUrl: "a.js"
    }

    // 函数 + promise
    "footer": {
        template: function (params) {
            return "<div></div>"
        },
        controllerProvider: function (params) {
            return new Promise(function (rs, rj) {
                define(["a.js"], function ($ctrl) {
                    rs($ctrl)
                })
            })
        }
    }

    // 函数 + promise
    "header": {
        templateProvider: function (params) {
            return new Promise(function (rs, rj) {
                define(["text!a.html"], function (tpl) {
                    rs(tpl)
                })
            })
        },
        controllerProvider: function (params) {
            return new Promise(function (rs, rj) {
                define(["a.js"], function ($ctrl) {
                    rs($ctrl)
                })
            })
        }
    }
    
```

##### 视图命名语法

|语句|说明|
| ------------- | ----------- |
| "" | 指向父状态内views[""]配置的template |
| "viewname" | 指向父状态内views[viewname]配置的template，覆盖其配置 |
| "viewname@" | 指向root状态之内viewname指定的template，覆盖掉其所有父级状态的配置|
| "viewname@statename" | 指向statename状态之内的view，覆盖其配置|
| "@statename" | 指向statename状态内的""view，可以理解为用这个view去覆盖statename状态的""view |

##### 视图controller配置

进入视图

* $ctrl.$onEnter function(params, resolve, reject)

avalon.scan视图之后，函数内this指向ms-view dom元素

* $ctrl.$onRendered function(obj)

退出视图前，return false阻止跳转

* $ctrl.$onBeforeUnload function()

指定一个avalon.scan视图的vmodels，vmodels = $ctrl.$vmodels.concact(DOM树上下文vmodels)

* $ctrl.$vmodels

### SPA及打包例子

+ 具体可以看<https://github.com/gogoyqj/mmRouter-demo-list>例子
+ 获取StateUrlCompilationPlugin插件 for webpack<https://github.com/gogoyqj/mmRouter-demo-list/tree/master/webpack/StateUrlCompilationPlugin.js>

