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
    "../button/avalon.button",
    "css!../chameleon/oniui-common.css",
    "css!./avalon.smartgrid.css",
], function(avalon, template) {
    var regional = {
        confirmText: '确定',
        cancelText: '取消',
        optDefaultText: '默认',
        optAllText: '全部',
        optCustomText: '自定义',
        noDataText: '暂时没有数据',
        loadingText: '数据读取中',
        pagerSizeText: '每页显示',
        pagerUnitText: '条',
        pagerResultText: '条结果'
    }

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
    var cnt = 0;
    function guid() {
        return 'smartgridTr' + cnt++;
    }
    var countter = 0;
    var widget = avalon.ui.smartgrid = function (element, data, vmodels) {
            var options = data.smartgridOptions, $element = avalon(element), pager = options.pager, vmId = data.smartgridId, gridEle, containerWrapper, smartgridHeader, $initRender = true, _dataVM, _data = [];
            options._parentContainer = null;
            options._parentContainerWidth = 0;
            if (typeof options.data === 'number') {
                for (var i = 0, v; v = vmodels[i++];) {
                    if (v._uiName && v._uiName === 'smartgrid') {
                        options.data = v.data[options.data][options.field] || [];
                        break;
                    }
                }
            }
            initContainer(options, element);
            perfectColumns(options, element, vmId);
            options._position = positionAbsolute ? 'absolute' : 'fixed';
            options.$pagerConfig = {
                canChangePageSize: true,
                options: [
                    10,
                    20,
                    50,
                    100
                ],
                //默认[10,20,50,100]
                onInit: function (pagerVM, options, vmodels) {
                    vmodel && (vmodel.pager = pagerVM);
                }
            };
            options.pageable = options.pageable !== void 0 ? options.pageable : true;
            if (avalon.type(pager) === 'object') {
                if (options.pageable) {
                    pager.getTemplate = typeof pager.getTemplate === 'function' ? pager.getTemplate : function (tmpl, options) {
                        var optionsStr = '';
                        if (Array.isArray(pager.options) && options.canChangePageSize) {
                            optionsStr = '<div class="oni-smartgrid-pager-options"><div class="oni-smartgrid-showinfo">'
                                + regional.pagerSizeText
                                + '</div><select ms-widget="dropdown" data-dropdown-list-width="50" data-dropdown-width="50" ms-duplex="perPages">'
                                + '<option ms-repeat="options" ms-value="el.value" ms-attr-label="el.value">{{el.text}}</option></select>'
                                + '<div class="oni-smartgrid-showinfo">' + regional.pagerUnitText + ', {{totalItems}}'
                                + regional.pagerResultText + '</div></div>';
                        } else {
                            optionsStr = '<div class="oni-smartgrid-pager-options">{{totalItems}}\u6761\u7ED3\u679C</div>';
                        }
                        return tmpl + optionsStr;
                    };
                }
                if (pager.onInit && typeof pager.onInit === 'function') {
                    var onInit = pager.onInit;
                    pager.onInit = function (pagerVM, options, vmodels) {
                        vmodel && (vmodel.pager = pagerVM);
                        onInit(pagerVM, options, vmodels);
                    };
                }
                avalon.mix(options.$pagerConfig, pager);
            }
            options.pager = null;
            //方便用户对原始模板进行修改,提高制定性
            options.template = options.getTemplate(template, options);
            options.$skipArray = [
                'smartgrid',
                '_uiName',
                '_allEnabledData',
                'template',
                'widgetElement',
                'container',
                'htmlHelper',
                'selectable',
                'pageable',
                'noResult',
                'sortable',
                'pager',
                'data',
                // 一定不要去掉啊，去掉了就会出错
                '_disabledData',
                '_enabledData',
                '_filterCheckboxData',
                'maxGridWidth',
                'bodyHeight',
                '_parentContainer',
                '_parentContainerWidth'
            ].concat(options.$skipArray);
            var vmodel = avalon.define(vmId, function (vm) {
                    avalon.mix(vm, options);
                    vm.widgetElement = element;
                    vm._headerTop = 0 + options.affixHeight;
                    vm._fixHeaderToggle = false;
                    vm._gridWidth = 'auto';
                    vm._pagerShow = false;
                    vm._allEnabledData = [];
                    vm._disabledData = [];
                    vm._enabledData = [];
                    vm._filterCheckboxData = [];
                    vm._dataRender = false;
                    vm.perPages = void 0;
                    vm.maxGridWidth = 0;
                    vm.$headerElement = null;
                    vm.adjustColumnWidth = function(){return adjustColumnWidth(vmodel)};
                    vm._hiddenAffixHeader = function (column, allChecked) {
                        var selectable = vmodel.selectable;
                        return selectable && selectable.type && column.key == 'selected' && !allChecked;
                    };
                    /**
             * @interface 获取表格数据,当然也可以通过vmodel.data直接获得表格数据
             */
                    vm.getRawData = function () {
                        return vmodel.data;
                    };
                    /**
             * @interface 获取选中表格行的数据集合
             */
                    vm.getSelected = function () {
                        var disabledData = vmodel._disabledData, selectedData = [];
                        disabledData.forEach(function (dataItem, index) {
                            if (dataItem.selected) {
                                selectedData.push(dataItem);
                            }
                        });
                        return selectedData.concat(vmodel._enabledData);
                    };
                    /**
             * @interface {Function} 全选表格，或者全不选
             * @param b {Boolean} true表示全选，false表示全不选，为空时以true对待
             */
                    vm.selectAll = function (b) {
                        b = b !== void 0 ? b : true;
                        vmodel._selectAll(null, b);
                    };
                    /**
             * @interface {Function} 判断表过是否全选
             * @returns {Boolean} true表示全选，false表示全不选
             */
                    vm.isSelectAll = function () {
                        return vmodel._allSelected;
                    };
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
                            vmodel.remoteSort(field, sortTrend, vmodel);
                            // onColumnSort回调对于远程排序的最好时机是在remoteSort中数据渲染之后自行处理
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
                                    try {
                                        return trend * a[field].localeCompare(b[field]);
                                    } catch (e) {
                                        return trend * (a[field] - b[field]) || 0;
                                    }
                                });
                            }
                            vmodel.render();
                            if (avalon.type(onColumnSort) === 'function') {
                                onColumnSort.call(vmodel, sortTrend, field);
                            }
                        }
                    };
                    /**
             * @interface {Function} 设置列的显示或者隐藏
             * @param columns {String|Array} 可以是字符串，也可以是数组，列出要设置的列的key值
             * @param b {Boolean} true为显示列，false为隐藏列，设置了列的isLock属性为ture时始终显示列
             */
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
                        adjustColumnWidth(vmodel);
                    };
                    /**
             * @interface {Function} 调用此方法清空表格数据
             * @param text {String} 无数据情况下的说明文字，默认为“暂时没有数据”
             */
                    vm.showNoResult = function (text) {
                        // 只要数据为空组件会自动showNoResult,考虑到使用习惯保留了showNoResult，不过其实完全可以不用
                        vmodel.noResult = text || vmodel.noResult;
                        vmodel.data = [];
                        vmodel.render();
                    };
                    /**
             * @interface {Function} 显示缓冲提示
             */
                    vm.showLoading = function () {
                        // vmodel.loadingVModel.toggle = true; // TODO
                    };
                    /**
             * @interface {Function} 隐藏缓冲提示
             */
                    vm.hideLoading = function () {
                        // vmodel.loadingVModel.toggle = false; // TODO
                    };
                    /**
             * 响应window.resize以调整宽度为百分比的内容
             */
                    vm._adjustColWidth = function () {
                        var cols = vmodel.columns, parentWidth = avalon(vmodel.container.parentNode).width();
                        for (var i = 0, len = cols.length; i < len; i++) {
                            var col = cols[i];
                            if (String(col.originalWidth).indexOf('%') !== -1) {
                                col.width = Math.floor(parentWidth * parseInt(col.originalWidth, 10) / 100) - 1;
                            }
                        }
                    };
                    vm._selectAll = function (event, selected) {
                        var datas = vmodel.data, rows = containerWrapper.children, onSelectAll = vmodel.onSelectAll, val = event ? event.target.checked : selected, enableData = datas.concat();
                        for (var i = 0, len = rows.length; i < len; i++) {
                            var row = rows[i], $row = avalon(row);
                            if (!$row.hasClass('oni-smartgrid-row')) {
                                continue;
                            }
                            var input = row.children[0].getElementsByTagName('input')[0], dataIndex = input && avalon(input).attr('data-index'), data;
                            if (dataIndex !== null && dataIndex !== void 0) {
                                data = datas[dataIndex];
                                if (!data.disable) {
                                    data.selected = val;
                                    input.checked = val;
                                    $row[val ? 'addClass' : 'removeClass']('oni-smartgrid-selected');
                                }
                            } else {
                                continue;
                            }
                        }
                        if (val) {
                            vmodel._enabledData = vmodel._allEnabledData.concat();
                        } else {
                            vmodel._enabledData = [];
                        }
                        if (avalon.type(onSelectAll) === 'function') {
                            onSelectAll.call(vmodel, datas, val);
                        }
                        setTimeout(function () {
                            vmodel._allSelected = val;
                        }, 100);
                    };
                    vm._toggleColumn = function (toggle, index) {
                        if (!containerWrapper)
                            return toggle;
                        var rows = containerWrapper.children, column = null;
                        for (var i = 0, row, len = rows.length; i < len; i++) {
                            row = rows[i];
                            if (!avalon(row).hasClass('oni-smartgrid-row')) {
                                continue;
                            }
                            column = row.children[index];
                            if (column) {
                                if (toggle) {
                                    column.style.display = 'table-cell';
                                } else {
                                    column.style.display = 'none';
                                }
                            }
                        }
                        return toggle;
                    };
                    vm._setColumnWidth = function (resize) {
                        var parentContainerWidth = avalon(vmodel.container.parentNode).width() - 2, columnsInfo = getMaxWidthColumn(vmodel.columns), showColumnWidth = columnsInfo.showColumnWidth, maxWidthColumn = columnsInfo.maxWidthColumn, maxWidth = maxWidthColumn.configWidth, adjustColumns = [maxWidthColumn], autoWidth = parentContainerWidth - showColumnWidth + maxWidth, rows = Array.prototype.slice.call(containerWrapper.children);
                        if (!autoWidth) {
                            return false;
                        }
                        setColumnWidth(adjustColumns, autoWidth);
                        rows.forEach(function (row, index) {
                            var columns = vmodel.columns.$model, rowColumns = row.children, columnsLen = columns.length;
                            if (rowColumns.length < columnsLen) {
                                return false;
                            }
                            for (var i = 0; i < columnsLen; i++) {
                                rowColumns[i].style.width = columns[i].width + 'px';
                            }
                        });
                    };
                    vm._getTemplate = function (defineDatas, startIndex) {
                        var fn, html, id = 'smartgrid_tmp_' + tempId, dt = defineDatas || vmodel.data, _columns = vmodel.columns, columns = _columns.$model, selectableType = vmodel.selectable && vmodel.selectable.type || '', datas = [];
                        avalon.each(dt, function (i, item) {
                            if (item.$id && item.$id != 'remove')
                                datas.push(item);
                        });
                        var dataLen = datas.length, checkRow = selectableType === 'Checkbox';
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
                    vm._getAllCheckboxDisabledStatus = function (allSelected) {
                        var disabledCheckboxLen = vmodel._filterCheckboxData.length, disabledData = vmodel._disabledData.length, noneSelectedDataLen = disabledCheckboxLen + disabledData;
                        if (allSelected) {
                            return noneSelectedDataLen === vmodel.data.length ? true : false;
                        } else {
                            return false;
                        }
                    };
                    /**
             * @interface 增加行，已經渲染的不會再操作
             * @param data {Array} 新增的行
             * @param init {Boolean} 是否为初始化grid
             * @param noShowLoading {Boolean} 渲染期间是否显示loading
             */
                    vm.addRows = function (data, init, noShowLoading) {
                        // 防止 addRows([])带来问题
                        if ((!data || !data.length) && !init)
                            return;
                        var tableTemplate = '', rows, container = vmodel.container, selectable = vmodel.selectable, len = vmodel.getLen(vmodel.data), arrLen = vmodel.data.length;
                        if (!containerWrapper)
                            return;
                        if (len === 0 || init)
                            avalon.clearHTML(containerWrapper);
                        vmodel._pagerShow = !len ? false : true;
                        // 做数据拷贝
                        if (data) {
                            var _data = [];
                            avalon.each(data, function (i, item) {
                                _data.push(avalon.mix({}, item));
                                _data[i].$id = guid();
                            });
                            vmodel.data.push.apply(vmodel.data, _data);
                        }
                        avalon.each(vmodel.data, function (i, item) {
                            item.$id = item.$id || guid();
                        });
                        tableTemplate = vmodel.addRow(vmodel._getTemplate(data ? vmodel.data.slice(arrLen) : data, data ? arrLen : 0), vmodel.columns.$model, vmodels);
                        rows = avalon.parseHTML(tableTemplate);
                        containerWrapper.appendChild(rows);
                        if (selectable && (selectable.type === 'Checkbox' || selectable.type === 'Radio')) {
                            var allSelected = isSelectAll(vmodel.data);
                            vmodel._allSelected = allSelected;
                            getSelectedData(vmodel);
                        }
                        if (!noShowLoading){
                            vmodel.showLoading(vmodel.data);
                        }
                        avalon.nextTick(function () {
                            avalon.scan(vmodel.container, [vmodel].concat(vmodels));
                            if (!noShowLoading)
                                vmodel.hideLoading();
                        })
                        if (sorting){
                            sorting = false;
                        }
                    };
                    vm.getLen = function (arr) {
                        var cnt = 0;
                        for (var i = 0, len = arr.length; i < len; i++) {
                            if (arr[i] && arr[i].$id != 'remove')
                                cnt++;
                        }
                        return cnt;
                    };
                    vm.removeRow = function (index, removeData) {
                        var data = vmodel.data[index];
                        if (!data)
                            return;
                        var id = data.$id, tr = document.getElementById(id);
                        tr && tr.parentNode.removeChild(tr);
                        if (removeData === false) {
                            data.$id = 'remove';
                        } else {
                            vmodel.data.splice(index, 1);
                        }
                        if (!vmodel.getLen(vmodel.data))
                            vmodel.render(void 0, true);
                    };
                    /**
             * @interface {Function} 用新的数据重新渲染表格视图
             * @param data {Array} 重新渲染表格的数据集合
             * @param init {Boolean} 是否为初始化grid
             * @param noShowLoading {Boolean} 渲染期间是否显示loading
             */
                    vm.render = function (data, init, noShowLoading) {
                        if (avalon.type(data) === 'array') {
                            vmodel.data = data;
                        } else {
                            init = data;
                        }
                        init = init === void 0 || init ? true : false;
                        if (!$initRender) {
                            dataFracte(vmodel);
                            vmodel._dataRender = !vmodel._dataRender;
                        } else {
                            $initRender = false;
                        }
                        if (!vmodel.noHeader && init && vmodel.isAffix && !vmodel.maxGridWidth) {
                            vmodel._gridWidth = avalon(gridEle).innerWidth();
                        }
                        vmodel.addRows(void 0, init, noShowLoading);
                        if (avalon.type(data) === 'array' && data.length) {
                            adjustColumnWidth(vmodel);
                        }
                        if (sorting) {
                            sorting = false;
                        } else if (!init) {
                            vmodel.container.scrollIntoView();
                        }
                        // vm._adjustColWidth();
                    };
                    vm.$init = function () {
                        var container = vmodel.container, gridFrame = '';
                        gridFrame = gridHeader.replace('MS_OPTION_ID', vmodel.$id);
                        container.innerHTML = gridFrame;
                        dataFracte(vmodel);
                        avalon.scan(container, [vmodel].concat(vmodels));
                        gridEle = document.getElementById('oni-smartgrid');
                        containerWrapper = document.getElementById('oni-smartgrid-body');
                        vmodel.$headerElement = smartgridHeader = document.getElementById('oni-smartgrid-header');
                        if (vmodel.maxGridWidth) {
                            var gridMainEle = document.getElementById('oni-smartgrid-main');
                            gridMainEle.style.width = vmodel.maxGridWidth + 'px';

                            vmodel._position = 'relative';
                            gridMainEle.parentNode.style.cssText = '*overflow-x: scroll;_overflow-x: scroll;';
                        }

                        gridEle.id = '';
                        containerWrapper.id = '';
                        smartgridHeader.id = '';
                        document.getElementById('oni-smartgrid-main').id = '';

                        if (!vmodel.bodyHeight) {
                            containerWrapper.parentNode.style.cssText = '*overflow-y:hidden;_overflow-y:hidden;';
                        } else {
                            containerWrapper.parentNode.style.cssText = '*overflow-y:scroll;_overflow-y:scroll;height:' + vmodel.bodyHeight + 'px';
                        }
                        avalon.nextTick(function () {
                            vmodel.render(true);
                            bindEvents(vmodel, container);
                        });
                        if (vmodel.isAffix) {
                            if (!callbacksNeedRemove.scrollCallback) {
                                callbacksNeedRemove.scrollCallback = avalon(window).bind('scroll', function () {
                                    var scrollTop = Math.max(document.body.scrollTop, document.documentElement.scrollTop), offsetTop = $element.offset().top, headerHeight = avalon(smartgridHeader).css('height'), top = scrollTop - offsetTop + vmodel.affixHeight, clientHeight = avalon(window).height(), tableHeight = $element.outerHeight(), _position = vmodel._position;
                                    if (tableHeight > clientHeight && scrollTop > offsetTop + headerHeight && offsetTop + tableHeight > scrollTop) {
                                        if (vmodel._position !== 'fixed') {
                                            vmodel._headerTop = Math.floor(top);
                                        }
                                        if (!vmodel.$model._fixHeaderToggle) {
                                            vmodel._fixHeaderToggle = true;
                                        }
                                    } else {
                                        vmodel._headerTop = 0;
                                        if (vmodel.$model._fixHeaderToggle) {
                                            vmodel._fixHeaderToggle = false;
                                        }
                                    }
                                });
                            }
                        }
                        element.resizeTimeoutId = 0;
                        if (vmodel.colHandlerContainer !== '') {
                            addColHandlerTo(vmodel.colHandlerContainer, vmodel);
                        }
                        if (typeof options.onInit === 'function') {
                            options.onInit.call(element, vmodel, options, vmodels);
                        }
                        setTimeout(function(){
                            adjustColumnWidth(vmodel);
                            setTimeout(function(){
                                avalon(vmodel.widgetElement.children[0]).css({
                                    opacity: 1
                                })
                            }, 100)
                        }, 200)
                        if (window.addEventListener) {
                            window.addEventListener('resize', function () {
                                adjustColumnWidth(vmodel);
                            });
                        } else {
                            window.attachEvent('onresize', function () {
                                adjustColumnWidth(vmodel);
                            });
                        }

                        // show loading
                        var loadingText = document.getElementById('oni-smartgrid-loading-text')

                        avalon(loadingText).css({
                            marginTop: - loadingText.offsetHeight / 2 + 'px',
                            marginLeft: - loadingText.offsetWidth / 2 + 'px',
                            opacity: 1
                        })
                        loadingText.id = '';
                    };
                    vm.$remove = function () {
                        var container = vmodel.container;
                        container.innerHTML = container.textContent = '';
                        avalon(window).unbind('scroll', callbacksNeedRemove.scrollCallback);
                    };
                });
            return vmodel;
        };
    widget.defaults = {
        _uiName: 'smartgrid',
        container: '',
        //@config 设置组件的容器元素，可以是字符串,表示对应元素的id，也可以是元素对象
        pageable: true,
        //@config 表格是否需要分页，默认需要，false不需要
        noHeader: false,
        //@config 是否显示表格头部
        noFooter: false,
        //@config 是否显示表格底部
        data: [],
        //@config 表格数据
        /* @config 表格列信息对象的集合
         * <pre>[{
    key: "name", <span>//列标志 </span>
    name: "姓名", <span>//列名</span>
    sortable: true, <span>//是否可对列排序</span>
    isLock: true, <span>//是否锁死列，设为true会始终显示此列，无论配置如何</span>
    align": "left", <span>//设置列的对齐方式，"left"|"center"|"right"默认为"center"</span>
    defaultValue: "shirly", <span>//列的默认值，当数据中没有为此列设置值时显示此默认值</span>
    customClass: "custom", <span>//设置此列单元格的自定义类</span>
    toggle: false, <span>//是否显示此列，true显示false不显示</span>
    width: 400, <span>//设置列宽，必须是Number</span>
    localSort: function(a, b, f) { <span>//自定义列的本地排序规则</span>
        return a[f].localeCompare(b[f]);
    },
    format: "upperCaseName" <span>//包装列数据的方法，此方法名对应到htmlHelper对象中的方法</span>
}, ...]</pre>
         */
        columns: [],
        colHandlerContainer: '',
        //@config 为列显隐设置按钮指定一个容器，不配置该项则按钮不出现，可传DOM节点或id
        allChecked: true,
        //@config 当设置selectable之后，是否显示表头的全选框，默认显示，false不显示
        htmlHelper: {},
        //@config 包装数据的方法集合,可<a href="avalon.smartgrid.ex2.html">参见实例2</a>的使用
        noResult: regional.noDataText,
        //@config 数据为空时表格的提示信息
        /**
         * @config {Function} 远程排序操作的方法
         * @param field {String} 待排序的列名
         * @param sortTrend {String} 排序规则，"asc"为升序"desc"为降序
         * @param vmodel {Object} smartgrid组件对应的Vmodel
         */
        remoteSort: avalon.noop,
        isAffix: false,
        //@config 表头在表格内容超过可视区高度时是否吸顶，true吸顶，false不吸顶，默认不吸顶
        affixHeight: 0,
        //@config 配置吸顶元素距离窗口顶部的高度
        selectable: false,
        //@config 为表格添加Checkbox或者Radio操作项，格式为<pre>{type: 'Checkbox', width: '25px'}</pre>
        bodyHeight: 0,
        //@config 设置loading缓冲的配置项，具体使用方法参见loading文档
        loadingToggle: false,
        loadingText: regional.loadingText + "...",

        // TODO
        // modal: true,
        // modalBackground: '#fff',
        // modalOpacity: '0.6',

        pager: {},
        //@config 设置pager的配置项，smartgrid组件默认会添加pager，也可以改变表格显示数目，默认可选10、20、50、100条数据，如果不希望显示此选项，可以设置canChangePageSize为false
        //@config 是否进行远程排序，默认true，进行远程排序必须配置远程排序的方法：remoteSort
        sortable: { remoteSort: true },
        /**
         * @config {Function} 为表格添加新行
         * @param tmp {String} 表格的body模板
         * @param columns {Array} 列信息数组
         * @param vmodel {Object} smartgrid组件对应的Vmodel
         * @returns {String} 用户定制后的模板
         */
        addRow: function (tmpl, columns, vmodel) {
            return tmpl;
        },
        getTemplate: function (str, options) {
            return str;
        },
        /**
         * @config {Function} 排序回调
         * @param sortType {String} 排序规则，"asc"为升序"desc"为降序
         * @param field {String} 排序的列名
         */
        onColumnSort: avalon.noop,
        /**
         * @config {Function} 用户选中一行或者取消一行选中状态的回调
         * @param rowData {Object} 被操作行的数据对象
         * @param isSelected {Boolean} 行的选中状态，true选中状态，false非选中状态
         * @param dataIndex {Number} 当前行数据在data中的索引
         */
        onRowSelect: avalon.noop,
        /**
         * @config {Function} 用户全选或全不选的回调
         * @param datas {Array} 表格数据
         * @param isSelectedAll {Boolean} 全选状态，true选中状态，false非选中状态
         */
        onSelectAll: avalon.noop,
        bodyMinHeight: 'auto'
    };
    function adjustColumnWidth(vmodel) {
        var columns = vmodel.columns,
            containerWidth = avalon(vmodel.$headerElement).width(),
            allColumnWidth = 0,
            maxWidth = 0,
            maxWidthColumn = null,
            needResizeColumns = []

        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            if (column.width === 'auto' || column.auto === true) {
                column.auto = true
                needResizeColumns.push(column);
            } else{
                var calculateWidth = 0
                if(typeof column.width === 'string' && column.width.indexOf('%') > -1 || column.percentage){
                    column.percentage = column.percentage || column.width
                    column.width = calculateWidth = containerWidth * parseFloat(column.percentage) / 100
                } else {
                    calculateWidth = column.width
                }

                if(column.toggle){
                    allColumnWidth += calculateWidth

                    if(calculateWidth > maxWidth){
                        maxWidthColumn = column
                    }
                    maxWidth = Math.max(maxWidth, calculateWidth)
                }
            }
        }

        var scrollBarWidthBlank = 30,
            autoWidth = Math.floor(containerWidth - allColumnWidth + maxWidth - scrollBarWidthBlank);
        if (allColumnWidth > containerWidth && needResizeColumns.length === 0) {
            needResizeColumns.push(maxWidthColumn);
            setColumnWidth(needResizeColumns, autoWidth);
        } else {
            if (maxWidth) {
                if (!needResizeColumns.length) {
                    needResizeColumns.push(maxWidthColumn);
                } else {
                    autoWidth = containerWidth - allColumnWidth - scrollBarWidthBlank;
                }
            }
            setColumnWidth(needResizeColumns, autoWidth);
        }
    }
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
    function bindEvents(options, containerWrapper) {
        if (!options.selectable) {
            return;
        }
        var type = options.selectable.type;
        if (type === 'Checkbox' || type === 'Radio') {
            avalon.bind(containerWrapper, 'click', function (event) {
                var target = event.target, $target = avalon(target), $row = avalon(target.parentNode.parentNode.parentNode), datas = options.data, onSelectAll = options.onSelectAll, enabledData = options._enabledData, disabledData = options._disabledData, dataIndex = $target.attr('data-index'), filterCheckboxData = options._filterCheckboxData;
                if (!$target.attr('data-role') || dataIndex === null) {
                    return;
                }
                if ($target.attr('data-role') === 'selected') {
                    var rowData = datas[dataIndex], isSelected = target.checked;
                    if (isSelected) {
                        options.selectable.type === 'Checkbox' ? $row.addClass('oni-smartgrid-selected') : 0;
                        if (options.selectable.type === 'Radio') {
                            enabledData.splice(0, enabledData.length);
                        }
                        rowData.selected = true;
                        avalon.Array.ensure(enabledData, rowData);
                    } else {
                        $row.removeClass('oni-smartgrid-selected');
                        rowData.selected = false;
                        avalon.Array.remove(enabledData, rowData);
                    }
                    if (avalon.type(options.onRowSelect) === 'function') {
                        options.onRowSelect.call($row[0], rowData, isSelected, dataIndex);
                    }
                }
                if (enabledData.length == datas.length - disabledData.length - filterCheckboxData.length) {
                    options._allSelected = true;
                } else {
                    options._allSelected = false;
                }
            });
        }
    }
    function dataFracte(vmodel) {
        var data = vmodel.data, enabledData = vmodel._enabledData = [], disabledData = vmodel._disabledData = [], filterCheckboxData = vmodel._filterCheckboxData = [];
        for (var i = 0, len = data.length, dataItem; i < len; i++) {
            dataItem = data[i];
            if (dataItem.disable) {
                disabledData.push(dataItem);
                continue;
            }
            if (dataItem.checkboxShow == false) {
                filterCheckboxData.push(dataItem);
                continue;
            }
            enabledData.push(dataItem);
        }
        vmodel._allEnabledData = enabledData.concat();
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
    function getMaxWidthColumn(columns, vmodel) {
        var maxWidth = 0, maxWidthColumn = null, showColumnWidth = 0, _columns = columns.$model || columns;
        for (var i = 0, len = _columns.length; i < len; i++) {
            var column = _columns[i], columnWidth = column.width;
            if (column.toggle) {
                columnWidth > maxWidth ? (maxWidth = columnWidth) && (maxWidthColumn = columns[i]) : 0;
                showColumnWidth += columnWidth;
            }
        }
        return {
            maxWidthColumn: maxWidthColumn,
            showColumnWidth: showColumnWidth
        };
    }
    function isSelectAll(datas) {
        var allSelected = true, len = datas.length, checkboxFilterAll = 0;
        if (!len) {
            return false;
        }
        for (var i = 0; i < len; i++) {
            var data = datas[i];
            if (data.selected === void 0) {
                data.selected = false;
            }
            if (data.checkboxShow !== false && !data.selected && !data.disable) {
                allSelected = false;
            }
            if (data.checkboxShow === false) {
                checkboxFilterAll++;
            }
        }
        if (checkboxFilterAll === len) {
            allSelected = false;
        }
        return allSelected;
    }
    function perfectColumns(options, element, vmId) {
        var columns = options.columns, selectColumn = {}, parentContainer = avalon(options.container.parentNode),
            parentContainerWidth = parentContainer.width() - 2

        options._parentContainer = parentContainer;
        options._parentContainerWidth = parentContainerWidth;
        for (var i = 0, len = columns.length; i < len; i++) {
            var column = columns[i], format = column.format, htmlFunction = '', _columnWidth = column.width, columnWidth = ~~_columnWidth;
            column.align = column.align || 'center';
            column.auto = false;
            column.percentage = null;
            column.originalWidth = _columnWidth;
            if (column.toggle === void 0 || column.isLock) {
                column.toggle = true;
            }
            column.configWidth = columnWidth;
            if (!columnWidth && _columnWidth) {
                if (_columnWidth.indexOf('%')) {
                    columnWidth = column.width
                } else {
                    columnWidth = 'auto';
                }
            }
            if (_columnWidth === void 0) {
                columnWidth = 'auto';
            }
            column.width = columnWidth;
            column.customClass = column.customClass || '';
            if (column.sortable) {
                column.sortTrend = 'ndb';
            }
            // 防止某些情形下format被覆盖
            if (avalon.isFunction(format))
                return;
            if (format && !options.htmlHelper[format]) {
                options.htmlHelper[format] = function (vmId, field, index, cellValue, rowData) {
                    avalon.log('\u65B9\u6CD5' + format + '\u672A\u5B9A\u4E49');
                    if (typeof cellValue === 'string') {
                        return avalon.filters.sanitize(cellValue);
                    }
                    return cellValue;
                };
            }
            htmlFunction = options.htmlHelper[format];
            if (!htmlFunction) {
                htmlFunction = function (vmId, field, index, cellValue, rowData) {
                    if (typeof cellValue === 'string') {
                        return avalon.filters.sanitize(cellValue);
                    }
                    return cellValue;
                };
            }
            column.format = htmlFunction;
            // EJS模板对于helper的渲染是通过将helper中的方法分别作为compiler的参数存在的，为了在静态模板中可以使用fn()这种方式渲染数据，只好统一将渲染数据的方法保存在format中
            ;
        }
        if (options.selectable) {
            var type = options.selectable.type, selectFormat, allSelected = true, selectableWidth = options.selectable.width || 25;
            if (typeof selectableWidth === 'string') {
                if (selectableWidth.indexOf('%') !== -1) {
                    selectableWidth = parseInt(selectableWidth, 10) / 100 * parentContainerWidth;
                } else {
                    selectableWidth = parseInt(selectableWidth, 10);
                }
            }
            if (type === 'Checkbox' || type === 'Radio') {
                selectFormat = function (vmId, field, index, selected, rowData, disable, allSelected) {
                    if (allSelected && type === 'Radio')
                        return;
                    if (rowData.checkboxShow === false) {
                        return '';
                    }
                    var disableStr = disable ? ' disabled ' : ' ms-disabled=\'_getAllCheckboxDisabledStatus(' + (allSelected ? true : false) + ', _dataRender)\' ';
                    return '<input type=\'' + type.toLowerCase() + '\'' + disableStr + (selected ? 'checked=\'checked\'' : '') + ' name=\'selected\' ' + (allSelected ? ' ms-on-click=\'_selectAll\' ms-duplex-radio=\'_allSelected\'' : ' data-index=\'' + index + '\'') + ' data-role=\'selected\'/>';
                };
                options._allSelected = false;
            }
            selectColumn = {
                key: 'selected',
                name: selectFormat(options.$id, 'selected', -1, allSelected, [], null, true),
                width: selectableWidth,
                configWidth: selectableWidth,
                originalWidth: options.selectable.width || 25,
                sortable: false,
                type: options.selectable.type,
                format: selectFormat,
                toggle: true,
                align: 'center',
                customClass: '',
                auto: false,
                percentage: null
            };
            columns.unshift(selectColumn);
        }

        options.columns = columns;
    }
    function setColumnWidth(columns, width) {
        var column = null, len = columns.length, columnWidth = width / len;
        for (var i = 0; i < len; i++) {
            column = columns[i];
            column.width = columnWidth - 1;
        }
    }

    return avalon;

    // 添加对列显示/隐藏的控制
    function addColHandlerTo(container, sgVmodel) {
        if (!container) {
            return;
        }
        if (typeof container === 'string') {
            container = document.getElementById(sgVmodel.colHandlerContainer);
        }
        var containerCtrlId = 'colHandler_' + Date.now();
        container.setAttribute('ms-controller', containerCtrlId);
        var handlerWrap = document.createElement('div'), handlerTpl = '';
        handlerTpl += '<div class="oni-smartgrid-handler-toggle"';
        handlerTpl += '     ms-class="oni-smartgrid-handler-toggle-active: handlerWindowVisible"';
        handlerTpl += '     ms-click="toggleHandlerWindow()">';
        handlerTpl += '</div>';
        handlerTpl += '<div class="oni-smartgrid-handler" ms-visible="handlerWindowVisible">';
        handlerTpl += '    <div class="oni-smartgrid-handler-mode">';
        handlerTpl += '        <span class="oni-smartgrid-handler-mode-item"';
        handlerTpl += '              ms-repeat="colHandlerModes"';
        handlerTpl += '              ms-class="oni-smartgrid-handler-mode-active: colHandlerMode === $key"';
        handlerTpl += '              ms-click="changeColHandlerMode($key)">';
        handlerTpl += '            {{$val}}';
        handlerTpl += '        </span>';
        handlerTpl += '    </div>';
        handlerTpl += '    <ul class="oni-smartgrid-handler-list">';
        handlerTpl += '        <li class="oni-smartgrid-handler-list-item" ms-repeat="colHandlerData">';
        handlerTpl += '            <label>';
        handlerTpl += '                <input type="checkbox"';
        handlerTpl += '                       ms-duplex-checked="el.toggle"';
        handlerTpl += '                       ms-attr-disabled="el.isLock"/>';
        handlerTpl += '                <span class="oni-smartgrid-handler-name">{{el.name}}</span>';
        handlerTpl += '            </label>';
        handlerTpl += '        </li>';
        handlerTpl += '    </ul>';
        handlerTpl += '    <div class=\"oni-smartgrid-handler-ope\">';
        handlerTpl += '        <button ms-widget=\"button\" data-button-size=\"small\" data-button-color=\"success\" ';
        handlerTpl += '              ms-click=\"confirmColHandler()\">' + regional.confirmText + '<\/button>';
        handlerTpl += '        <button ms-widget=\"button\" data-button-size=\"small\" ms-click=\"cancelColHandler()\">' + regional.cancelText + '<\/span>';
        handlerTpl += '    <\/div>';
        handlerTpl += '</div>';
        handlerWrap.innerHTML = handlerTpl;
        container.appendChild(handlerWrap);
        avalon.define(containerCtrlId, function (vm) {
            // 列显隐窗口是否可见
            vm.handlerWindowVisible = false;
            vm.toggleHandlerWindow = function () {
                vm.handlerWindowVisible = !vm.handlerWindowVisible;
                if (vm.handlerWindowVisible) {
                    vm.colHandlerMode = 'defaults';
                    vm.changeColHandlerMode('defaults');
                }
            };
            // 控制列显示/隐藏模式
            vm.colHandlerModes = {
                defaults: regional.optDefaultText,
                all: regional.optAllText,
                custom: regional.optCustomText
            };
            vm.colHandlerMode = 'defaults';
            vm.changeColHandlerMode = function (mode) {
                vm.colHandlerMode = mode;
                // 根据显隐模式更新显隐数据
                if (mode === 'defaults') {
                    updateHandlerData(vm.defaultColHandlerData);
                } else if (mode === 'all') {
                    updateHandlerData();
                } else {
                    updateHandlerData(getColumnData());
                }
                function updateHandlerData(dataSource) {
                    var colHandlerData = vm.colHandlerData;
                    for (var i = 0, len = colHandlerData.length; i < len; i++) {
                        if (typeof dataSource === 'object') {
                            colHandlerData[i].toggle = dataSource[i].toggle;
                        } else {
                            colHandlerData[i].toggle = true;
                        }
                    }
                }
            };
            // 维护列显隐数据
            vm.defaultColHandlerData = avalon.mix(true, [], getColumnData());
            vm.colHandlerData = avalon.mix(true, [], getColumnData());
            /**
             * 点击确定时，将列显隐数据应用到表格中
             */
            vm.confirmColHandler = function () {
                var visibleColKeys = [], unVisibleColKeys = [], colHandlerData = vm.colHandlerData;
                for (var i = 0, len = colHandlerData.length; i < len; i++) {
                    if (colHandlerData[i].toggle) {
                        visibleColKeys.push(colHandlerData[i].key);
                    } else {
                        unVisibleColKeys.push(colHandlerData[i].key);
                    }
                }
                sgVmodel.setColumns(visibleColKeys, true);
                sgVmodel.setColumns(unVisibleColKeys, false);
                adjustColumnWidth(sgVmodel);
                vm.handlerWindowVisible = false;
            };
            /**
             * 点击取消，隐藏设置框
             */
            vm.cancelColHandler = function () {
                vm.handlerWindowVisible = false;
            };
        });
        setHandlerLayout();
        /**
         * 设置列显隐处理布局样式
         */
        function setHandlerLayout() {
            avalon(handlerWrap).addClass('oni-smartgrid-handler-wrap');
            // 控制小窗口往哪边出现
            var offsetLeft = getOffsetLeft(handlerWrap), clientWidth = avalon.css(document.body, 'width');
            if (offsetLeft > clientWidth / 2) {
                avalon(handlerWrap).addClass('oni-smartgrid-handler-wrap-right');
            }
            function getOffsetLeft(ele) {
                var left = 0;
                do {
                    left += ele.offsetLeft || 0;
                    ele = ele.offsetParent;
                } while (ele);
                return left;
            }
        }
        /**
         * 获取当前表格中每列的显示/隐藏情况
         */
        function getColumnData() {
            var columnsData = [], columns = sgVmodel.columns;
            for (var i = 0, len = columns.length; i < len; i++) {
                if (columns[i].key === 'selected' && columns[i].name.slice(1, 6) === 'input') {
                    continue;
                }
                columnsData.push({
                    key: columns[i].key,
                    name: columns[i].name,
                    toggle: columns[i].toggle,
                    isLock: columns[i].isLock
                });
            }
            return columnsData;
        }
        avalon.scan();
    }
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
 [通过data的disable属性禁用部分数据](avalon.smartgrid.ex8.html)
 [通过avalon.filters.sanitize(str)来防止xss攻击](avalon.smartgrid.ex9.html)
 [嵌套的表格](avalon.smartgrid.ex10.html)
 [grid会根据columns配置的width自主决定是否显示水平滚动条](avalon.smartgrid.ex11.html)
 [通过设置bodyHeight使得表格体可以垂直滚动](avalon.smartgrid.ex12.html)
 [自定义列的显示/隐藏](avalon.smartgrid.ex13.html)
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
