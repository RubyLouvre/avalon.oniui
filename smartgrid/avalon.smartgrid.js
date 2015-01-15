// avalon 1.3.6
/**
 *
 * @cnName 表格
 * @enName smartgrid
 * @introduce
 *    <p>smartgrid与simplegrid最大的不同是数据的渲染是通过静态模板实现的，当然也可以方便的实现动态更新视图。同时smartgrid实现了grid adapter的所有功能，不过部分使用方式会有些差异，下面会详细说明</p>
 */
define(["avalon",
    "text!./avalon.smartgrid.html",
    "../loading/avalon.loading",
    "../pager/avalon.pager",
    "../dropdown/avalon.dropdown",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.smartgrid.css"
], function(avalon, template) {
    var tempId = new Date() - 0, templateArr = template.split('MS_OPTION_EJS'), gridHeader = templateArr[0],
    // 表格视图结构
        userAgent = (window.navigator.userAgent || '').toLowerCase(), positionAbsolute = userAgent.indexOf('msie 6') !== -1 || userAgent.indexOf('msie 7') !== -1, remptyfn = /^function\s+\w*\s*\([^)]*\)\s*{\s*}$/m, sorting = false,
    // 页面在排序的时候不用更新排序icon的状态为ndb，但如果是重新渲染数据的话重置icon状态为ndb
        callbacksNeedRemove = {};
    template = templateArr[1];
    // 静态模板渲染部分view
    var EJS = avalon.ejs = function (id, data, opts) {
        var el, source;
        if (!EJS.cache[id]) {
            opts = opts || {};
            var doc = opts.doc || document;
            data = data || {};
            if ($.fn) {
                //如果引入jQuery, mass
                el = $(id, doc)[0];
            } else if (doc.querySelectorAll) {
                //如果是IE8+与标准浏览器
                el = doc.querySelectorAll(id)[0];
            } else {
                el = doc.getElementById(id.slice(1));
            }
            if (!el)
                throw 'can not find the target element';
            source = el.innerHTML;
            if (!/script|textarea/i.test(el.tagName)) {
                source = avalon.filters.unescape(source);
            }
            var fn = EJS.compile(source, opts);
            ejs.cache[id] = fn;
        }
        return ejs.cache[id](data);
    };
    //如果第二配置对象指定了tid，则使用它对应的编译模板
    EJS.compile = function (source, opts) {
        opts = opts || {};
        var tid = opts.tid;
        if (typeof tid === 'string' && typeof EJS.cache[tid] == 'function') {
            return EJS.cache[tid];
        }
        var open = opts.open || '<&';
        var close = opts.close || '&>';
        var helperNames = [], helpers = [];
        for (var name in opts) {
            if (opts.hasOwnProperty(name) && typeof opts[name] == 'function') {
                helperNames.push(name);
                helpers.push(opts[name]);
            }
        }
        var flag = true;
        //判定是否位于前定界符的左边
        var codes = [];
        //用于放置源码模板中普通文本片断
        var time = new Date() * 1;
        // 时间截,用于构建codes数组的引用变量
        var prefix = ' ;r += txt' + time + '[';
        //渲染函数输出部分的前面
        var postfix = '];';
        //渲染函数输出部分的后面
        var t = 'return function(data){\'use strict\'; try{var r = \'\',line' + time + ' = 0;';
        //渲染函数的最开始部分
        var rAt = /(^|[^\w\u00c0-\uFFFF_])(@)(?=\w)/g;
        var rstr = /(['"])(?:\\[\s\S]|[^\ \\r\n])*?\1/g;
        // /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/
        var rtrim = /(^-|-$)/g;
        var rmass = /mass/;
        var js = [];
        var pre = 0, cur, code, trim;
        for (var i = 0, n = source.length; i < n;) {
            cur = source.indexOf(flag ? open : close, i);
            if (cur < pre) {
                if (flag) {
                    //取得最末尾的HTML片断
                    t += prefix + codes.length + postfix;
                    code = source.slice(pre + close.length);
                    if (trim) {
                        code = code.trim();
                        trim = false;
                    }
                    codes.push(code);
                } else {
                    throw Error('\u53D1\u751F\u9519\u8BEF\u4E86');
                }
                break;
            }
            code = source.slice(i, cur);
            //截取前后定界符之间的片断
            pre = cur;
            if (flag) {
                //取得HTML片断
                t += prefix + codes.length + postfix;
                if (trim) {
                    code = code.trim();
                    trim = false;
                }
                codes.push(code);
                i = cur + open.length;
            } else {
                //取得javascript罗辑
                js.push(code);
                t += ';line' + time + '=' + js.length + ';';
                switch (code.charAt(0)) {
                    case '=':
                        //直接输出
                        code = code.replace(rtrim, function () {
                            trim = true;
                            return '';
                        });
                        code = code.replace(rAt, '$1data.');
                        if (code.indexOf('|') > 1) {
                            //使用过滤器
                            var arr = [];
                            var str = code.replace(rstr, function (str) {
                                arr.push(str);
                                //先收拾所有字符串字面量
                                return 'mass';
                            }).replace(/\|\|/g, '@');
                            //再收拾所有短路或
                            if (str.indexOf('|') > 1) {
                                var segments = str.split('|');
                                var filtered = segments.shift().replace(/\@/g, '||').replace(rmass, function () {
                                    return arr.shift();
                                });
                                for (var filter; filter = arr.shift();) {
                                    segments = filter.split(':');
                                    name = segments[0];
                                    args = '';
                                    if (segments[1]) {
                                        args = ', ' + segments[1].replace(rmass, function () {
                                            return arr.shift();    //还原
                                        });
                                    }
                                    filtered = 'avalon.filters.' + name + '(' + filtered + args + ')';
                                }
                                code = '=' + filtered;
                            }
                        }
                        t += ' ;r +' + code + ';';
                        break;
                    case '#':
                        //注释,不输出
                        break;
                    case '-':
                    default:
                        //普通逻辑,不输出
                        code = code.replace(rtrim, function () {
                            trim = true;
                            return '';
                        });
                        t += code.replace(rAt, '$1data.');
                        break;
                }
                i = cur + close.length;
            }
            flag = !flag;
        }
        t += ' return r; }catch(e){ avalon.log(e);\navalon.log(js' + time + '[line' + time + '-1]) }}';
        var body = [
            'txt' + time,
            'js' + time,
            'filters'
        ];
        var fn = Function.apply(Function, body.concat(helperNames, t));
        var args = [
            codes,
            js,
            avalon.filters
        ];
        var compiled = fn.apply(this, args.concat(helpers));
        if (typeof tid === 'string') {
            return EJS.cache[tid] = compiled;
        }
        return compiled;
    };
    EJS.cache = {};
    //用于保存编译好的模板函数
    avalon.filters.unescape = function (target) {
        return target.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        //处理转义的中文和实体字符
        return target.replace(/&#([\d]+);/g, function ($0, $1) {
            return String.fromCharCode(parseInt($1, 10));
        });
    };
    var cnt = 0
    function guid() {
        return "smartgridTr" + cnt++
    }
    var countter = 0
    var widget = avalon.ui.smartgrid = function (element, data, vmodels) {
        var options = data.smartgridOptions, $element = avalon(element), pager = options.pager, vmId = data.smartgridId,
            $initRender = true
        perfectColumns(options, element);
        initContainer(options, element);
        options._position = positionAbsolute ? 'absolute' : 'fixed';
        options.loading.onInit = function (vm, options, vmodels) {
            vmodel.loadingVModel = vm;
        };
        options.$pagerConfig = {
            canChangePageSize: true,
            options: [
                10,
                20,
                50,
                100
            ],    //默认[10,20,50,100]
            onInit: function(pagerVM, options, vmodels) {
                vmodel && (vmodel.pager = pagerVM)
            }
        }
        options.pageable = options.pageable !== void 0 ? options.pageable : true;
        if (avalon.type(pager) === 'object') {
            pager.prevText = pager.prevText || '\u4E0A\u4E00\u9875';
            pager.nextText = pager.nextText || '\u4E0B\u4E00\u9875';
            if (options.pageable) {
                pager.getTemplate = typeof pager.getTemplate === 'function' ? pager.getTemplate : function (tmpl, options) {
                    var optionsStr = '';
                    if (Array.isArray(pager.options) && options.canChangePageSize) {
                        optionsStr = '<div class="oni-smartgrid-pager-options"><div class="oni-smartgrid-showinfo">\u6BCF\u9875\u663E\u793A</div><select ms-widget="dropdown" data-dropdown-list-width="50" data-dropdown-width="50" ms-duplex="perPages"><option ms-repeat="options" ms-value="el.value" ms-attr-label="el.value">{{el.text}}</option></select><div class="oni-smartgrid-showinfo">\u6761, {{totalItems}}\u6761\u7ED3\u679C</div></div>';
                    } else {
                        optionsStr = '<div class="oni-smartgrid-pager-options">{{totalItems}}\u6761\u7ED3\u679C</div>';
                    }
                    return tmpl + optionsStr;
                };
            }
            if (pager.onInit && typeof pager.onInit === "function") {
                var onInit = pager.onInit
                pager.onInit = function(pagerVM, options, vmodels) {
                    vmodel && (vmodel.pager = pagerVM)
                    onInit(pagerVM, options, vmodels)
                }
            }
            avalon.mix(options.$pagerConfig, options.pager)
        } else {
            options.pager = {};
        }
        options.pager = null
        //方便用户对原始模板进行修改,提高制定性
        options.template = options.getTemplate(template, options);
        options.$skipArray = [
            '_allEnabledData',
            'template',
            'widgetElement',
            'container',
            '_container',
            '_position',
            'htmlHelper',
            'selectable',
            'loadingVModel',
            'loading',
            'pageable',
            'noResult',
            'sortable',
            'pager',
            'data',// 一定不要去掉啊，去掉了就会出错
            'containerMinWidth',
            '_disabledData',
            '_enabledData',
            '_filterCheckboxData'
        ].concat(options.$skipArray);
        var vmodel = avalon.define(vmId, function (vm) {
            avalon.mix(vm, options);
            vm.widgetElement = element;
            vm._headerTop = 0 + options.affixHeight;
            vm._container = null;
            vm._fixHeaderToggle = false;
            vm._gridWidth = 0;
            vm._pagerShow = false;
            vm._allEnabledData = [];
            vm._disabledData = [];
            vm._enabledData = [];
            vm._filterCheckboxData = [];
            vm.loadingVModel = null;
            vm._dataRender = false
            vm._hiddenAffixHeader = function(column, allChecked) {
                var selectable = vmodel.selectable
                return selectable && selectable.type && column.key=='selected' && !allChecked
            }
            vm.getRawData = function () {
                return vmodel.data;
            };
            vm.getSelected = function () {
                var disabledData = vmodel._disabledData, selectedData = [];
                disabledData.forEach(function (dataItem, index) {
                    if (dataItem.selected) {
                        selectedData.push(dataItem);
                    }
                });
                return selectedData.concat(vmodel._enabledData);
            };
            vm.selectAll = function (b) {
                b = b !== void 0 ? b : true;
                vmodel._selectAll(null, b);
            };
            vm.isSelectAll = function () {
                return vmodel._allSelected;
            };
            //如果当前列可以排序，那么点击标题旁边的icon,将会调用此方法
            vm.sortColumn = function (column, index, event) {
                var target = event.target, $target = avalon(target), sortTrend = '', field = column.key, trend = 0, onColumnSort = vmodel.onColumnSort;
                if (!vmodel.data.length)
                    return;
                if ($target.hasClass('oni-helper-sort-top')) {
                    sortTrend = 'asc';
                } else {
                    sortTrend = 'desc';
                }
                sorting = true;
                sortTrend == 'asc' ? trend = 1 : trend = -1;
                column.sortTrend = sortTrend;
                if (vmodel.sortable.remoteSort && typeof vmodel.remoteSort === 'function' && !remptyfn.test(vmodel.remoteSort)) {
                    vmodel.remoteSort(field, sortTrend, vmodel)    // onColumnSort回调对于远程排序的最好时机是在remoteSort中数据渲染之后自行处理
                    ;
                } else if (typeof column.localSort === 'function' && !remptyfn.test(column.localSort)) {
                    // !isEmptyFn(el.localSort)
                    //如果要在本地排序,并且指定排数函数
                    vmodel.data.sort(function (a, b) {
                        return trend * column.localSort(a, b, field, vmodel.$model) || 0;
                    });
                    vmodel.render();
                    if (avalon.type(onColumnSort) === 'function') {
                        onColumnSort.call(vmodel, sortTrend, field);
                    }
                } else {
                    //否则默认处理
                    if (column.type === 'Number') {
                        vmodel.data.sort(function (a, b) {
                            return trend * (a[field] - b[field]) || 0;
                        });
                    } else {
                        vmodel.data.sort(function (a, b) {
                            return trend * a[field].localeCompare(b[field]);
                        });
                    }
                    vmodel.render();
                    if (avalon.type(onColumnSort) === 'function') {
                        onColumnSort.call(vmodel, sortTrend, field);
                    }
                }
            };
            vm.setColumns = function (columns, b) {
                var columnsOption = vmodel.columns;
                columns = [].concat(columns);
                b = b !== void 0 ? b : true;
                for (var i = 0, len = columnsOption.length; i < len; i++) {
                    var column = columnsOption[i], key = column.$model.key, keyIndex = columns.indexOf(key);
                    if (keyIndex != -1 && !column.isLock) {
                        column.toggle = b;
                    }
                }
            };
            vm.showNoResult = function (text) {
                // 只要数据为空组件会自动showNoResult,考虑到使用习惯保留了showNoResult，不过其实完全可以不用
                vmodel.noResult = text || vmodel.noResult;
                vmodel.data = [];
                vmodel.render();
            };
            vm.showLoading = function () {
                vmodel.loadingVModel.toggle = true;
            };
            vm.hideLoading = function () {
                vmodel.loadingVModel.toggle = false;
            };
            vm._selectAll = function (event, selected) {
                var datas = vmodel.data, trs = vmodel._container.getElementsByTagName('tr'), onSelectAll = vmodel.onSelectAll;
                setTimeout(function () {
                    var val = event ? event.target.checked : selected, enableData = datas.concat();
                    vmodel._allSelected = val;
                    for (var i = 0, len = trs.length; i < len; i++) {
                        var tr = trs[i], 
                            $tr = avalon(tr), 
                            data, 
                            input = tr.cells[0].getElementsByTagName('input')[0], 
                            dataIndex = input && avalon(input).attr('data-index');
                        if (dataIndex !== null && dataIndex !== void 0) {
                            data = datas[dataIndex];
                            if (!data.disable) {
                                data.selected = val;
                                input.checked = val;
                                $tr[val ? 'addClass' : 'removeClass']('oni-smartgrid-selected');
                            }
                        } else {
                            continue;
                        }
                    }
                    if (val) {
                        vmodel._enabledData = vmodel._allEnabledData;
                    } else {
                        vmodel._enabledData = [];
                    }
                    if (avalon.type(onSelectAll) === 'function') {
                        onSelectAll.call(vmodel, datas, val);
                    }
                }, 100);
            };
            vm._toggleColumn = function (toggle, index) {
                if (!vmodel._container)
                    return toggle;
                var trs = vmodel._container.getElementsByTagName('tr'), cell = null;
                for (var i = 0, tr, len = trs.length; i < len; i++) {
                    tr = trs[i];
                    cell = tr.cells[index];
                    if (cell) {
                        if (toggle) {
                            tr.cells[index].style.display = 'table-cell';
                        } else {
                            tr.cells[index].style.display = 'none';
                        }
                    }
                }
                setTimeout(function () {
                    vmodel._setColumnWidth();
                }, 100);
                return toggle;
            };
            vm._setColumnWidth = function (resize) {
                var cells = vmodel._container.getElementsByTagName('tr')[0].cells, columns = vmodel.columns, _columns = columns.$model, $gridContainer = avalon(vmodel.container), containerWidth = $gridContainer.width(), minColumnWidth = getMinColumnWidth(_columns), firstStringColumn = getFirstStringColumn(columns, vmodel);
                if (minColumnWidth > containerWidth && !resize) {
                    $gridContainer.css('width', minColumnWidth);
                    firstStringColumn.width = firstStringColumn.configWidth;
                } else {
                    $gridContainer.css('width', 'auto');
                    firstStringColumn.width = 'auto';
                }
                for (var i = 0, len = cells.length; i < len; i++) {
                    var $cell = avalon(cells[i]), cellWidth = $cell.width(), column = columns[i];
                    column._fixWidth = cellWidth;
                }
                vmodel._gridWidth = containerWidth;
            };
            vm._getTemplate = function (defineDatas, startIndex) {
                var fn, html, id = 'smartgrid_tmp_' + tempId, dt = defineDatas || vmodel.data, _columns = vmodel.columns, columns = _columns.$model, selectableType = vmodel.selectable && vmodel.selectable.type || '', datas = [];
                avalon.each(dt, function(i, item) {
                    if(item.$id && item.$id != "remove") datas.push(item)
                })
                var dataLen = datas.length
                checkRow = selectableType === 'Checkbox';
                if (!EJS[id]) {
                    fn = EJS.compile(options.template, vmodel.htmlHelper);
                    EJS[id] = fn;
                } else {
                    fn = EJS[id];
                }
                for (var i = 0, len = columns.length; i < len; i++) {
                    var column = columns[i], name = column.key;
                    if (!sorting) {
                        //如果sortTrend属性不存在，在IE下直接给它赋值会报错
                        _columns[i].sortTrend && (_columns[i].sortTrend = 'ndb');
                    }
                    for (var j = 0; j < dataLen; j++) {
                        var data = datas[j];
                        data[name] = data[name] !== void 0 ? data[name] : column.defaultValue;
                    }
                }
                html = fn({
                    data: datas,
                    columns: _columns,
                    len: 2,
                    noResult: vmodel.noResult,
                    vmId: vmId,
                    startIndex: startIndex || 0,
                    checkRow: checkRow
                });
                return html;
            };
            vm._getAllCheckboxDisabledStatus = function(allSelected) {
                var disabledCheckboxLen = vmodel._filterCheckboxData.length,
                    disabledData = vmodel._disabledData.length,
                    noneSelectedDataLen = disabledCheckboxLen + disabledData

                if (allSelected) {
                    return noneSelectedDataLen === vmodel.data.length ? true : false
                } else {
                    return false
                }
            };

            /**
             * @interface 增加行，已經渲染的不會再操作
             * @param 新增的行
             */
            vm.addRows = function(data, init) {
                // 防止 addRows([])带来问题
                if((!data || !data.length) && !init) return
                var tableTemplate = "",
                    rows,
                    container = vmodel.container,
                    containerWrapper = container.getElementsByTagName("tbody")[0] || container.getElementsByTagName("table")[0],
                    selectable = vmodel.selectable,
                    len = vmodel.getLen(vmodel.data),
                    arrLen = vmodel.data.length
                if(!containerWrapper) return
                if(len === 0 || init) avalon.clearHTML(containerWrapper)
                vmodel._pagerShow = !len ? false : true;
                // 做数据拷贝
                if(data) {
                    var _data = []
                    avalon.each(data, function(i, item) {
                        _data.push(avalon.mix({}, item))
                        _data[i].$id = guid()
                    })
                    vmodel.data.push.apply(vmodel.data, _data)
                }
                avalon.each(vmodel.data, function(i, item) {
                    item.$id = item.$id || guid()
                })
                tableTemplate = vmodel.addRow(vmodel._getTemplate(data ? vmodel.data.slice(arrLen) : data, data ? arrLen : 0), vmodel.columns.$model, vmodels)
                rows = avalon.parseHTML(tableTemplate)
                containerWrapper.appendChild(rows)
                if (selectable && (selectable.type === 'Checkbox'|| selectable.type === 'Radio')) {
                    var allSelected = isSelectAll(vmodel.data);
                    vmodel._allSelected = allSelected;
                    getSelectedData(vmodel);
                }
                vmodel.showLoading(vmodel.data);
                avalon.nextTick(function () {
                    avalon.scan(vmodel.container, [vmodel].concat(vmodels));
                    vmodel._setColumnWidth();
                    vmodel.hideLoading();
                });
                if (sorting) sorting = false
            }
            vm.getLen = function(arr) {
                var cnt = 0
                for(var i = 0, len = arr.length; i < len; i++) {
                    if(arr[i] && arr[i].$id != "remove") cnt++
                }
                return cnt
            }
            vm.removeRow = function(index, removeData) {
                var data = vmodel.data[index]
                if(!data) return
                var id = data.$id,
                    tr = document.getElementById(id)
                tr && tr.parentNode.removeChild(tr)
                if(removeData === false) {
                    data.$id = "remove"
                } else {
                    vmodel.data.splice(index, 1)
                }
                if(!vmodel.getLen(vmodel.data)) vmodel.render(void 0, true)
            }
            vm.render = function (data, init) {
                if (avalon.type(data) === 'array') {
                    vmodel.data = data;
                } else {
                    init = data;
                }
                init = init === void 0 || init ? true : false
                if (!$initRender) {
                    dataFracte(vmodel);
                    vmodel._dataRender = !vmodel._dataRender
                } else {
                    $initRender = false
                }
                vmodel.addRows(void 0, init)
                if (sorting) {
                    sorting = false;
                } else if (!init) {
                    vmodel.container.scrollIntoView();
                }
            };
            vm.$init = function () {
                var container = vmodel.container, gridFrame = '';
                gridFrame = gridHeader.replace('MS_OPTION_ID', vmodel.$id);
                container.innerHTML = gridFrame;
                dataFracte(vmodel)
                avalon.scan(container, vmodel);
                avalon.nextTick(function () {
                    vmodel._container = container.getElementsByTagName('tbody')[0];
                    vmodel.render(true);
                    bindEvents(vmodel);
                });
                if (vmodel.isAffix) {
                    callbacksNeedRemove.scrollCallback = avalon(window).bind('scroll', function () {
                        var scrollTop = Math.max(document.body.scrollTop, document.documentElement.scrollTop), offsetTop = $element.offset().top, headerHeight = avalon(element.getElementsByTagName('thead')[0]).css('height'), top = scrollTop - offsetTop + vmodel.affixHeight, clientHeight = avalon(window).height(), tableHeight = $element.outerHeight(), _position = vmodel._position;
                        if (tableHeight > clientHeight && scrollTop > offsetTop + headerHeight && offsetTop + tableHeight > scrollTop) {
                            if (_position === 'absolute') {
                                vmodel._headerTop = Math.floor(top);
                            }
                            if (!vmodel.$model._fixHeaderToggle) {
                                vmodel._fixHeaderToggle = true;
                            }
                        } else {
                            if (_position === 'absolute') {
                                vmodel._headerTop = 0;
                            }
                            if (vmodel.$model._fixHeaderToggle) {
                                vmodel._fixHeaderToggle = false;
                            }
                        }
                    });
                }
                element.resizeTimeoutId = 0;
                callbacksNeedRemove.resizeCallback = avalon(window).bind('resize', function () {
                    clearTimeout(element.resizeTimeoutId);
                    var clientWidth = avalon(window).width();
                    if (clientWidth <= vmodel.containerMinWidth) {
                        element.style.width = vmodel.containerMinWidth + 'px';
                    }
                    element.resizeTimeoutId = setTimeout(function () {
                        vmodel._setColumnWidth(true);
                    }, 150);
                });
                if (typeof options.onInit === 'function') {
                    options.onInit.call(element, vmodel, options, vmodels);
                }
            };
            vm.$remove = function () {
                var container = vmodel.container;
                container.innerHTML = container.textContent = '';
                avalon(window).unbind('resize', callbacksNeedRemove.resizeCallback).unbind('scroll', callbacksNeedRemove.scrollCallback);
            };
        });
        return vmodel;
    };
    widget.defaults = {
        container: '',
        // element | id
        data: [],
        columns: [],
        allChecked: true,
        htmlHelper: {},
        noResult: '\u6682\u65F6\u6CA1\u6709\u6570\u636E',
        remoteSort: avalon.noop,
        isAffix: false,
        affixHeight: 0,
        containerMinWidth: 600,
        selectable: false,
        loading: {
            toggle: false,
            modal: true,
            modalBackground: '#000'
        },
        
        sortable: { remoteSort: true },
        addRow: function (tmpl, columns, vmodel) {
            return tmpl;
        },
        getTemplate: function (str, options) {
            return str;
        }
    };
    function initContainer(options, element) {
        var container = options.container;
        if (container) {
            if (typeof container == 'string') {
                container = document.getElementById(container);
            }
            if (!container.nodeType || container.nodeType != 1 || !document.body.contains(container)) {
                container = null;
            }
        }
        container = container || element;
        options.container = container;
    }
    function bindEvents(options) {
        if (!options.selectable)
            return;
        var type = options.selectable.type, container = options._container;
        if (type === 'Checkbox' || type === "Radio") {
            avalon.bind(container, 'click', function (event) {
                var target = event.target, $target = avalon(target), $tr = avalon(target.parentNode.parentNode), datas = options.data, onSelectAll = options.onSelectAll, enabledData = options._enabledData, disabledData = options._disabledData, dataIndex = $target.attr('data-index'),
                    filterCheckboxData = options._filterCheckboxData;
                if (!$target.attr('data-role') || dataIndex === null) {
                    return;
                }
                if ($target.attr('data-role') === 'selected') {
                    var rowData = datas[dataIndex], isSelected = target.checked;
                    if (isSelected) {
                        options.selectable.type === 'Checkbox' ? $tr.addClass('oni-smartgrid-selected') : 0;
                        if(options.selectable.type === 'Radio'){
                            enabledData.splice(0, enabledData.length);
                        }
                        rowData.selected = true;
                        avalon.Array.ensure(enabledData, rowData);
                    } else {
                        $tr.removeClass('oni-smartgrid-selected');
                        rowData.selected = false;
                        avalon.Array.remove(enabledData, rowData);
                    }
                    if (avalon.type(options.onRowSelect) === 'function') {
                        options.onRowSelect.call($tr[0], rowData, isSelected);
                    }
                }
                if (enabledData.length == datas.length - disabledData.length- filterCheckboxData.length) {
                    options._allSelected = true 
                } else {
                    options._allSelected = false  
                }
            });
        }
    }

    function dataFracte(vmodel) {
        var data = vmodel.data, enabledData = vmodel._enabledData = [], disabledData = vmodel._disabledData = [],
            filterCheckboxData = vmodel._filterCheckboxData = []

        for(var i = 0, len = data.length, dataItem; i < len; i++) {
            dataItem = data[i]
            if (dataItem.disable) {
                disabledData.push(dataItem);
                continue
            }
            if (dataItem.checkboxShow == false) {
                filterCheckboxData.push(dataItem)
                continue
            }
            enabledData.push(dataItem);
        }
        vmodel._allEnabledData = enabledData;
    }
    function getSelectedData(vmodel) {
        var datas = vmodel.data, enabledData = vmodel._enabledData = [];
        for (var i = 0, len = datas.length; i < len; i++) {
            var data = datas[i], selected = data.selected;
            if (selected && !data.disable) {
                enabledData.push(data);
            }
        }
    }
    function getFirstStringColumn(columns, vmodel) {
        for (var i = 0, len = columns.length; i < len; i++) {
            var column = columns[i], type = column.type;
            type = type === void 0 ? 'String' : type;
            if (column.toggle && type === 'String') {
                return column;
            }
        }
        if (vmodel.selectable && vmodel.selectable.type) {
            return columns[1];
        } else {
            return columns[0];
        }
    }
    function getMinColumnWidth(columns) {
        var showColumnWidth = 0;
        for (var i = 0, len = columns.length; i < len; i++) {
            var column = columns[i];
            if (column.toggle) {
                showColumnWidth += parseInt(column.configWidth) || 0;
            }
        }
        return showColumnWidth;
    }
    function isSelectAll(datas) {
        var allSelected = true, len = datas.length,
            checkboxFilterAll = 0

        if (!len) {
            allSelected = false;
            return;
        }
        for (var i = 0; i < len; i++) {
            var data = datas[i];
            if (data.selected === void 0) {
                data.selected = false
            }
            if (data.checkboxShow !== false && !data.selected && !data.disable) {
                allSelected = false;
            }
            if (data.checkboxShow === false) {
                checkboxFilterAll++
            }
        }
        if (checkboxFilterAll === len) {
            allSelected = false
        }
        return allSelected;
    }
    function perfectColumns(options, element) {
        var columns = options.columns, selectColumn = {}, parentContainerWidth = avalon(element.parentNode).width(), allColumnWidth = 0, maxWidth = 0, maxWidthColumn = {};
        for (var i = 0, len = columns.length; i < len; i++) {
            var column = columns[i], format = column.format, htmlFunction = '', _columnWidth = column.width, columnWidth = ~~_columnWidth;
            column.align = column.align || 'center';
            if (column.toggle === void 0 || column.isLock) {
                column.toggle = true;
            }
            column.configWidth = columnWidth;
            if (!columnWidth) {
                if (_columnWidth.indexOf('%')) {
                    columnWidth = parentContainerWidth * parseInt(_columnWidth) / 100;
                    column.configWidth = columnWidth;
                } else {
                    columnWidth = 'auto';
                }
            }
            column.width = column._fixWidth = columnWidth;
            allColumnWidth += ~~columnWidth;
            ~~columnWidth > maxWidth ? (maxWidth = columnWidth) && (maxWidthColumn = column) : 0;
            column.customClass = column.customClass || '';
            if (column.sortable) {
                column.sortTrend = 'ndb';
            }
            if (format && !options.htmlHelper[format]) {
                options.htmlHelper[format] = function (vmId, field, index, cellValue, rowData) {
                    avalon.log('\u65B9\u6CD5' + format + '\u672A\u5B9A\u4E49');
                    return cellValue;
                };
            }
            htmlFunction = options.htmlHelper[format];
            if (!htmlFunction) {
                htmlFunction = function (vmId, field, index, cellValue, rowData) {
                    return cellValue;
                };
            }
            column.format = htmlFunction    // EJS模板对于helper的渲染是通过将helper中的方法分别作为compiler的参数存在的，为了在静态模板中可以使用fn()这种方式渲染数据，只好统一将渲染数据的方法保存在format中
            ;
        }
        if (options.selectable) {
            var type = options.selectable.type, selectFormat, allSelected = true;
            if (type === 'Checkbox' || type === 'Radio') {
                selectFormat = function (vmId, field, index, selected, rowData, disable, allSelected) {
                    if (allSelected && type === 'Radio')
                        return;
                    if (rowData.checkboxShow === false) {
                        return ""
                    }
                    return '<input type=\'' + type.toLowerCase() + '\'' + ' ms-disabled=\'_getAllCheckboxDisabledStatus('+ (allSelected ? true : false) + ', _dataRender)\' ' + (selected ? 'checked=\'checked\'' : '') + ' name=\'selected\' ' + (allSelected ? ' ms-click=\'_selectAll\' ms-duplex-radio=\'_allSelected\'' : ' data-index=\'' + index + '\'') + ' data-role=\'selected\'/>';
                };
                allSelected = isSelectAll(options.data) || false;
                options._allSelected = allSelected;
            }
            selectColumn = {
                key: 'selected',
                name: selectFormat(options.$id, 'selected', -1, allSelected, [], null, true),
                width: 25,
                configWidth: 25,
                sortable: false,
                type: options.selectable.type,
                format: selectFormat,
                toggle: true,
                align: 'center',
                customClass: ''
            };
            allColumnWidth += 25;
            selectColumn.width = selectColumn._fixWidth = 25;
            columns.unshift(selectColumn);
        }
        if (allColumnWidth > parentContainerWidth) {
            if (~~maxWidthColumn.width) {
                maxWidthColumn.width = 'auto';
            } else {
                for (i = 0; i < len; i++) {
                    column = columns[i];
                    if (~~column.width) {
                        column.width = 'auto';
                        break;
                    }
                }
            }
        }
        options.columns = columns;
    }
    return avalon;
})
/**
 @links
 [除设置columns和data外都是默认配置的smartgrid](avalon.smartgrid.ex1.html)
 [通过htmlHelper配置数据包装函数集合，定义columns时设置要包装列的format为对应的包装函数](avalon.smartgrid.ex2.html)
 [演示表格吸顶效果，并且取消pager的显示](avalon.smartgrid.ex3.html)
 [表格排序操作](avalon.smartgrid.ex4.html)
 [自定义smartgrid各种事件回调](avalon.smartgrid.ex5.html)
 [供用户调用API](avalon.smartgrid.ex6.html)
 [配置addRow为表格添加新行](avalon.smartgrid.ex7.html)
 */

/**
 * @other
 *  <p>下面附上实现相同展示效果的情况下，smartgrid与simplegrid的渲染情况对比</p>
 <div>
 <h2>smartgrid渲染10条表格数据</h2>
 <img src="smartgrid10.png" style="width:100%"/>
 <h2>simplegrid渲染10条表格数据</h2>
 <img src="simplegrid10.png" style="width:100%"/>
 <h2>smartgrid渲染200条表格数据</h2>
 <img src="smartgrid200.png" style="width:100%"/>
 <h2>simplegrid渲染200条表格数据</h2>
 <img src="simplegrid200.png"style="width:100%"/>
 </div>
 */