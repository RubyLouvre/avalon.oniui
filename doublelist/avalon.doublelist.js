/**
 * @cnName doublelist组件
 * @enName doublelist
 * @introduce
 *  <p> 以左右列表形式展示实现的复选组件，不支持ms-duplex，请在onChange回调里面处理类似ms-duplex逻辑</p>
 */
define(["avalon", "text!./avalon.doublelist.html", "text!./avalon.doublelist.data.html", "../scrollbar/avalon.scrollbar", "css!./avalon.doublelist.css", "css!../chameleon/oniui-common.css"], function(avalon, template, dataTpl) {

    var widget = avalon.ui.doublelist = function(element, data, vmodels) {
        var options = data.doublelistOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        var vmodel = avalon.define(data.doublelistId, function(vm) {
            vm.data = []//@config 配置左侧待选项列表，数据 [{value: xxx, name: xx}]
            vm.select = []//@config 选中的value list，[value1,value2]，取的是data 里面item的value
            vm._selectData = []
            vm.dataTmpSelect = []
            vm.selectTmpSelect = []
            vm.$changeCBS = []
            avalon.mix(vm, options)
            if(vm.change != avalon.noop && vm.onChange == avalon.noop) {
                vm.onChange = vm.change
            }
            vm.widgetElement = element
            vm.rootElement = ""
            vm.$skipArray = ["widgetElement", "template", "rootElement"]

            var inited, id = +(new Date())
            vm.$uid = id
            vm.$init = function(continueScan) {
                if(inited) return
                inited = true
                var dataTemplate = vmodel._getTemplate("data"),
                    selectTemplate = vmodel._getTemplate("select")
                vmodel.template = vmodel.template.replace(/\{\{MS_OPTION_SELECT\}\}/g, selectTemplate).replace(/\{\{MS_OPTION_DATA\}\}/g, dataTemplate).replace(/\{\{MS_OPTION_ID\}\}/g, id)
                element.innerHTML = vmodel.template
                vmodel.rootElement = element.getElementsByTagName("*")[0]
                vmodel._getSelect()
                if(continueScan){
                    continueScan()
                }else{
                    avalon.log("请尽快升到avalon1.3.7+")
                    avalon.scan(element, [vmodel].concat(vmodels))
                    // callback after inited
                    if(typeof options.onInit === "function" ) {
                        //vmodels是不包括vmodel的
                        options.onInit.call(element, vmodel, options, vmodels)
                    }
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }

            vm._getTemplate = function(tplName) {
                var sourceTpl = template
                if(tplName === "data") {
                    sourceTpl = dataTpl.replace(/\{\{MS_OPTION_TYPE\}\}/g, "data")
                } else if(tplName === "select") {
                    sourceTpl = dataTpl.replace(/\{\{MS_OPTION_TYPE\}\}/g, "select")
                }

                return vmodel.getTemplate(sourceTpl, options, tplName)
            }
            vm._itemSelected = function(item, type) {
                for(var i = 0, len = vmodel.select; i < len; i++) {
                    if(vmodel.select[i] == item.value) return true && type == "data"
                }
                return false
            }
            vm._itemShow = function(item, type) {
                return vmodel.hideSelect && vmodel._itemSelected(item, type)
            }
            vm._getSelect = function() {
                vmodel._selectData = []
                avalon.each(vmodel.select, function(i, item) {
                    avalon.each(vmodel.data, function(si, sitem) {
                        if(item == sitem.value) vmodel._selectData.push(sitem)
                    })
                    var ele = avalon(document.getElementById("data" + item + vmodel.$uid))
                    // 重置样式
                    ele.removeClass("oni-state-active").addClass("oni-state-disabled")
                    if(vmodel.hideSelect) ele.addClass("oni-helper-hidden")
                })
            }
            vm.updateScrollbar = function() {
                // 更新滚动区域
                avalon.vmodels["$left" + vmodel.$uid] && avalon.vmodels["$left" + vmodel.$uid].update()
                avalon.vmodels["$right" + vmodel.$uid] && avalon.vmodels["$right" + vmodel.$uid].update()
            }
            vm._removeFrom = function(v, isSelected) {
                var tar = isSelected ? vmodel.selectTmpSelect : vmodel.dataTmpSelect
                for(var i = 0, len = tar.length; i < len; i++) {
                    if(v == tar[i]) {
                        tar.splice(i, 1)
                        break
                    }
                }
            }
            // 响应点击事件
            vm._select = function(e, item, type, isdblClick) {
                var ele = avalon(this),
                    data = ele.data()
                e.preventDefault()
                if(ele.hasClass("oni-state-disabled")) return
                // 选中区域的点击
                if(type == "select") {
                    if(ele.hasClass("oni-state-active")) {
                        ele.removeClass("oni-state-active")
                        vmodel._removeFrom(data.value, "fromSelected")
                    } else if(!ele.hasClass("oni-state-disabled")){
                        // in case of duplication push
                        for(var i = 0, len = vmodel.selectTmpSelect.length; i < len; i++) {
                            if(vmodel.selectTmpSelect[i] == data.value) return
                        }
                        ele.addClass("oni-state-active")
                        vmodel.selectTmpSelect.push(data.value)
                    }
                    // 双击
                    if(isdblClick) {
                        if(!vmodel.countLimit(vmodel.select, "delete", 1)) return
                        for(var i = 0, len = vmodel.select.length; i < len; i++) {
                            if(vmodel.select[i] == data.value) {
                                vmodel.select.removeAt(i)
                                vmodel._removeFrom(data.value, "fromSelected")
                                vmodel.selectTmpSelect.clear()
                                vmodel._getSelect()
                                return
                            }
                        }
                    }
                } else {
                // 待选区域的点击
                    if(ele.hasClass("oni-state-active")) {
                        ele.removeClass("oni-state-active")
                        vmodel._removeFrom(data.value)
                    } else if(!ele.hasClass("oni-state-disabled")){
                        // in case of duplication push
                        for(var i = 0, len = vmodel.dataTmpSelect.length; i < len; i++) {
                            if(vmodel.dataTmpSelect[i] == data.value) return
                        }
                        ele.addClass("oni-state-active")
                        vmodel.dataTmpSelect.push(data.value)
                    }
                    if(isdblClick) {
                        // 新增，避免重复
                        if(!vmodel.countLimit(vmodel.select, "add", 1)) return
                        for(var i = 0, len = vmodel.select.length; i < len; i++) {
                            if(vmodel.select[i] == data.value) {
                                return
                            }
                        }
                        vmodel.select.push(data.value)
                        vmodel._removeFrom(data.value)
                        vmodel.selectTmpSelect.clear()
                        vmodel._getSelect()
                    }
                }
            }
            // 更新状态
            vm._update = function($event, addOrDelete) {
                var tar = addOrDelete === "delete" ? vmodel.selectTmpSelect : vmodel.dataTmpSelect
                if(tar.length == 0) return
                if(!vmodel.countLimit(vmodel.select, addOrDelete, tar.length)) return
                if(addOrDelete === "delete") {
                    for(var i = 0, len = tar.length; i < len; i++) {
                        for(var j = 0, jlen = vmodel.select.length; j < jlen; j++) {
                            if(vmodel.select[j] == tar[i]) {
                                vmodel.select.splice(j, 1)
                                break
                            }
                        }
                    }
                } else {
                    for(var i = 0, len = tar.length; i < len; i++) {
                        vmodel.select.push(tar[i])
                    }
                }
                vmodel.selectTmpSelect.clear()
                vmodel.dataTmpSelect.clear()
                vmodel._getSelect()
            }
            vm._activeClass = function(item, type) {
                var arr = type === "data" ? vmodel.dataTemplate : vmodel.selectTmpSelect
                for(var i = 0, len = arr.length; i < len; i++) {
                    if(item.value == arr[i]) return true
                }
            }
            //@interface reset(data, select) 重置，用新的data和select渲染，如果!data为真，则不修改左侧list；如果select为空或者空数组，则清空已选，否则将select中的项目置为已选
            vm.reset = function(data, select) {
                if(data) {
                    if(data.length == vmodel.data.length && data != vmodel.data) {
                        vmodel.data.clear()
                        vmodel.data = data
                    }
                    vmodel.data = data
                }
                if(select) {
                    if(select.length == vmodel.select.length && select != vmodel.select) {
                        vm.select.clear()
                    }
                    vm.select = select
                } 
                vmodel.selectTmpSelect.clear()
                vmodel.dataTmpSelect.clear()
                vmodel._getSelect()
            }

        })
        // change
        vmodel.select.$watch("length", function(newValue, oldValue) {
            vmodel.onChange && vmodel.onChange(newValue, oldValue, vmodel)
            avalon.each(vmodel.$changeCBS, function(i, item) {
                item(newValue, oldValue, vmodel)
            })
        })

        return vmodel
    }
    widget.defaults = {
        toggle: true, //@config 组件是否显示，可以通过设置为false来隐藏组件
        hideSelect: false, //@config 是否隐藏以选中的项目，默认不隐藏
        //@config onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@config getTemplate(tpl, opts) 定制修改模板接口
        countLimit: function(select) {
            return true
        },//@config countLimit(select) 选择条目限制，必须有return true or false，参数是当前已选中条数和add or delete操作
        // select:[],//@config 选中的value list，[value1,value2]，取的是data 里面item的value
        // data:[],//@config 配置左侧待选项列表，数据 [{value: xxx, name: xx}]
        // $changeCBS: [],
        change: avalon.noop, //@config change(newValue, oldValue, vmodel) 所选变化的回调，不建议使用，等价于onChange
        onChange: avalon.noop,//@config onChange(newValue, oldValue, vmodel) 所选变化的对调，同change，第一、二个参数分别是数组变化前后的长度
        $author: "skipper@123"
    }
})