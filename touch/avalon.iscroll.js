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
define(["./nscroll.js"], function(NScroll) {
    /**
     *
     * avalon.iscroll
     *
     * PS: 仅支持纵向懒加载式滚动
     *
     */
    var DEFAULT_OPT = { // 默认配置
            showLines: 10, // 显示的数量
            lineHeight: 0, // 每行的高度
            getData: avalon.noop //获取数据函数
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

    // 实现 ms-iscroll 指令
    avalon.bindingHandlers.iscroll = function(data, vmodels) {
        var element = data.element, // 绑定的 dom 节点
            args = data.value.match(/[^, ]+/g), // 分析参数，用逗号分割，第一个为配置所对应的参数key（后面的参数以后拓展）
            vm = vmodels[0], // 获取 VM
            options = avalon.mix({}, DEFAULT_OPT, vm.iscroll, element.dataset, args && args[1] ? vm[args[1]] : null), // merge 配置
            id = options.id || (args && args[0] !== '$' && args[0]) || ('iscroll' + setTimeout('1')), // jshint ignore:line
            son = element.children[0], // 儿子节点
            grandSon = element.children[0] && element.children[0].children[0], // 孙子节点
            eachAttr = son && getAttr(son, 'ms-each'), // 儿子节点是否有 ms-each
            repeatAttr = grandSon && getAttr(grandSon, 'ms-repeat'), // 孙子节点是否有 ms-repeat
            scroll; // isroll 对象

        vm.scrolls = vm.scrolls || {}; // 存放 scroll 对象

        element.removeAttribute('ms-iscroll');

        // 判断是否使用 infinite 滚动
        if (eachAttr || repeatAttr) {
            var name, realName, timer, items = []; // 原数组和僵尸数组索引的 Map

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

            realName = name + '$'; // 真实绑定的属性。

            // 监控 数组是否改变
            // 用于数据刷新
            vm.$watch(name, function() {
                var arr = vm[name],
                    newArr = vm[realName],
                    removeIndex = [],
                    i;
                // 判断是否是第一次加载
                if (scroll) {
                    // 取消监听
                    newArr.forEach(function(item) {
                        item.$unwatch();
                    });
                    // 刷新数据
                    for (i = 0; i < options.showLines; i++) {
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
                            })(i)); // jshint ignore:line
                            arr[i].$watch('$all', (function(index) {
                                return function(key, value) {
                                    newArr[index][key] = value;
                                };
                            })(i)); // jshint ignore:line
                        } else {
                            removeIndex.unshift(i);
                        }
                    }
                    removeIndex.forEach(function(i) {
                        newArr.removeAt(i);
                    });
                    items = element.children[0].children;
                    scroll.resetTotal(0, arr.size());
                    scroll.scrollTo(0, 0, 0);
                } else {
                    // 配置数据和属性，创建 iScroll 对象
                    newArr.pushArray(JSON.parse(JSON.stringify(vm.$model[name].slice(0, options.showLines)))); // 初始化僵尸数组的数据
                    items = element.children[0].children;
                    options.lineHeight = options.lineHeight || (items[0] && items[0].offsetHeight);
                    if (!options.lineHeight) {
                        throw 'Can not know line height!';
                    }
                    scroll = vm.scrolls[id] = NScroll(element, {
                        builderNodes: false,
                        row: {
                            height: options.lineHeight,
                            num: options.showLines,
                            total: arr.size()
                        },
                        scrollOpt: options,
                        dataFilter: function(type, el, column, row) {
                            var index = row % options.showLines;
                            if (type === 'add') {
                                scroll.appendNode(items[row % options.showLines], column, row);
                                newArr.set(index, arr[row].$model);
                                newArr[index].$watch('$all', function(key, value) {
                                    arr[row][key] = value;
                                });
                                arr[row].$watch('$all', function(key, value) {
                                    newArr[index][key] = value;
                                });
                                if (arr.size() - 1 == row) {
                                    if (typeof options.getData === 'function') {
                                        options.getData(arr.length);
                                    } else if (typeof options.getData === 'string' && typeof vm[options.getData] === 'function') {
                                        vm[options.getData](arr.length);
                                    } else {
                                        dispatchEvent(element, 'getdata');
                                    }
                                }
                            } else {
                                arr[row].$unwatch();
                                newArr[index].$unwatch();
                            }
                        }
                    }); // 创建 IScroll 对象
                    bindEvents(element, scroll.scroll); // 绑定事件
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
                        scroll.resetTotal(0, vm[name].size(), 0, 1);
                    } else {
                        vm.$fire(name)
                    }
                }, refreshTimeout);
            });

        } else {
            // 普通创建 IScroll
            scroll = vm.scrolls[id] = new (NScroll.iScroll)(element, options);
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

        vm.refreshScroll = function() {
            scroll && scroll.refresh()
        }
    };
})
