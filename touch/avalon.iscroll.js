/**
*
* Avalon IScroll 移动套件
*
* verison: @lastest 0.1.0
* GitHub: http://github.com/EdwonLim/avalon.iscroll
* IScorll GitHub: https://github.com/cubiq/iscroll
*
* Mode By Edwon Lim (edwon.lim@gmail.com | http://github.com/EdwonLim/)
*
* 详细说明文档请见 GitHub
*
*/
define(["./iscroll"], function() {
    var DEFAULT_OPT = { // 默认配置
        infiniteElements: null, // 重复加载的元素，最好配选择器，默认为avalon array 所绑定的元素
        mouseWheel: false, // 是否支持鼠标滚轮（提出来方便测试）
        infiniteLimit: 25, // 数量极限（到达极限时，会调用getData方法）
        cacheSize: 25, // 缓存数量
        showLines: 10, // 显示的数量,
        getData: avalon.noop
    },
    // 需要监听的事件
    events = ['beforeScrollStart', 'scrollCancel', 'scrollStart', 'scroll', 'scrollEnd', 'flick', 'zoomStart', 'zoomEnd'],
    // 刷新 Scroll 的间隔
    refreshTimeout = 100;

    // 获取 dom 节点上的相应属性和值
    function getAttr(el, attrName) {
        return ((el.hasAttributes() ? avalon.slice(el.attributes) : []).filter(function(attr) {
            return !attr.name.indexOf(attrName);
        })[0] || {}).name;
    }

    // 触发事件
    function dispatchEvent(el, type, args) {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent(type, true, true);
        avalon.mix(evt, args);
        el.dispatchEvent(evt);
    }

    // 给vmodels绑定事件
    function bindEvents(element, scroll) {
        events.forEach(function(eventName) {
            scroll.on(eventName, function() {
                dispatchEvent(element, eventName.toLowerCase());
            });
        });
    }

    if (IScroll) {
        // 实现 ms-iscroll 指令
        avalon.bindingHandlers.iscroll = function(data, vmodels) {
            var element = data.element, // 绑定的 dom 节点
                args = data.value.match(/[^, ]+/g), // 分析参数，用逗号分割，第一个为配置所对应的参数key（后面的参数以后拓展）
                vm = vmodels[0], // 获取 VM
                options = avalon.mix({}, DEFAULT_OPT, vm.iscroll, element.dataset, args && args[1] ? vm[args[1]] : null), // merge 配置
                id = options.id || (args && args[0]!== '$' && args[0]) || ('iscroll' + setTimeout('1')), // jshint ignore:line
                son = element.children[0], // 儿子节点
                grandSon = element.children[0] && element.children[0].children[0], // 孙子节点
                eachAttr = son && getAttr(son, 'ms-each'), // 儿子节点是否有 ms-each
                repeatAttr = grandSon && getAttr(grandSon, 'ms-repeat'), // 孙子节点是否有 ms-repeat
                scroll; // isroll 对象

            vm.scrolls = vm.scrolls || {}; // 存放 scroll 对象

            element.removeAttribute('ms-iscroll');

            // 判断是否使用 infinite 滚动
            if (eachAttr || repeatAttr) {
                var name, realName, timer,
                listenerLogs = avalon.range(0, options.showLines); // 原数组和僵尸数组索引的 Map

                if (eachAttr) {
                    name = son.getAttribute(eachAttr); // 获取监控的属性名
                    son.setAttribute(eachAttr, name + '$'); // 改为需要的属性名
                } else if (repeatAttr) {
                    name = grandSon.getAttribute(repeatAttr); // 获取监控的属性名
                    grandSon.setAttribute(repeatAttr, name + '$'); // 改为需要的属性名
                }
                if (grandSon) {
                    grandSon.setAttribute('ms-attr-data-index', '$index'); // 增加 index 绑定
                }

                realName = name + '$';  // 真实绑定的属性。

                // 添加配置
                avalon.mix(options, {
                    // infinite 加载回调
                    // 自己判定是否到底部
                    // 不用此参数做分页加载
                    // 但是参数必须是Function，所以复制noop
                    dataset: avalon.noop,
                    // 替换元素内容
                    // el 为需要替换的 dom 元素； data 为要替换的数据
                    // el 上 `data-index` 属性为当前 el 的索引（PS：可以通过 el 计算出所以，但是为了效率，增加 data-index 属性）
                    // data 为要替换的数据，其实是原数组数据的索引 （scroll.updateContent传入的是原数组数据的索引）
                    dataFiller: function(el, data) {
                        var index = el.dataset.index,
                            arr = vm[name], // 原数组
                            newArr = vm[realName], // 僵尸数组
                            prevData = listenerLogs[index], // 获取原来的索引
                            getData;
                        if (prevData !== void 0 && arr[prevData] && arr[prevData].$unwatch) {
                            arr[prevData].$unwatch(); // 取消原来的监听
                        }
                        if (data !== void 0 && newArr[index] && arr[data]) {
                            newArr[index].$unwatch(); // 取消原来的监听
                            newArr.set(index, arr[data]); // 更新僵尸数组的数据
                            // 双向绑定原数组和僵尸数组的数组更改
                            newArr[index].$watch('$all', function(key, value) {
                                arr[data][key] = value;
                            });
                            arr[data].$watch('$all', function(key, value) {
                                newArr[index][key] = value;
                            });
                            // 记录双向绑定的索引
                            listenerLogs[el.dataset.index] = data;

                            // 判断是否是最后一个数据被渲染
                            if (arr.length - 1 == data) {
                                // 回调 getData 方法，获取新数据
                                // 参数 第一个实现在的数组长度（数据数） 第二个是至少取的条数
                                if (typeof options.getData === 'function') {
                                    options.getData(arr.length, options.cacheSize);
                                } else if (typeof options.getData === 'string' && typeof vm[options.getData] === 'function') {
                                    vm[options.getData](arr.length, options.cacheSize);
                                } else {
                                    dispatchEvent(element, 'getdata');
                                }
                            }
                        }
                    }
                });

                // 监控 数组是否改变
                // 用于数据刷新
                vm.$watch(name, function() {
                    var arr = vm[name],
                        newArr = vm[realName],
                        removeIndex = [],
                        i;
                    // 判断是否是第一次加载
                    if (scroll) {
                        // 重新初始化
                        listenerLogs = avalon.range(0, options.showLines);
                        // 取消监听
                        newArr.forEach(function(item) {
                            item.$unwatch();
                        });
                        // 刷新数据
                        for (i = 0; i < options.showLines; i ++) {
                            // 判断元素是否存在
                            if (arr.length > i) {
                                // 更新数据
                                if (newArr[i]) {
                                    newArr.set(i, arr[i].$model);
                                } else {
                                    newArr.push(arr[i].$model);
                                }
                                // 双向监控更新
                                newArr[i].$watch('$all', (function(index) {
                                    return function(key, value) {
                                        arr[index][key] = value;
                                    };
                                })(i));  // jshint ignore:line
                                arr[i].$watch('$all', (function(index) {
                                    return function(key, value) {
                                        newArr[index][key] = value;
                                    };
                                })(i));  // jshint ignore:line
                            } else {
                                removeIndex.unshift(i);
                            }
                        }
                        removeIndex.forEach(function(i) {
                            newArr.removeAt(i);
                        });
                        scroll.options.infiniteLimit = options.infiniteLimit;
                        scroll.scrollTo(0, 0, 0);
                        scroll.refresh();
                    } else {
                        // 配置数据和属性，创建 iScroll 对象
                        options.infiniteElements = options.infiniteElements || son.children; // 循环元素的选择器 或者 NodeList
                        newArr.pushArray(JSON.parse(JSON.stringify(vm.$model[name].slice(0, options.showLines)))); // 初始化僵尸数组的数据

                        scroll = vm.scrolls[id] = new IScroll(element, options); // 创建 IScroll 对象
                        scroll.updateCache(0, avalon.range(0, options.infiniteLimit)); // 给 IScroll 输入数据 (其实是原数组的索引)
                        bindEvents(element, scroll); // 绑定事件
                    }
                });

                // 监控原数组长度改变
                // 用于数据添加
                vm[name].$watch('length', function(value) {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    timer = setTimeout(function() {
                        if (scroll) {
                            scroll.options.infiniteLimit = value;
                            scroll.updateCache(0, avalon.range(0, value));
                            scroll.refresh();
                        }
                    }, refreshTimeout);
                });

            } else {
                // 普通创建 IScroll
                scroll = vm.scrolls[id] = new IScroll(element, options);
                bindEvents(element, scroll);

                vm.$watch('$all', function() {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    timer = setTimeout(function() {
                        if (scroll) {
                            scroll.refresh();
                        }
                    }, refreshTimeout);
                });
            }


            // vmodel 移除时，销毁scroll
            vm.$remove = function() {
                if (scroll) {
                    scroll.destroy();
                    scroll = null;
                }
            };

        };
    }
})
