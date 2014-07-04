/**
  * roleselect组件，
  *
  */
define(["avalon", "text!./avalon.roleselect.html", "text!./avalon.roleselect.data.html", "text!./avalon.roleselect.css", "scrollbar/avalon.scrollbar"], function(avalon, tmpl, dataTpl, css) {

    var cssText = css
    var styleEl = document.getElementById("avalonStyle")
    var template = tmpl
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    var widget = avalon.ui.roleselect = function(element, data, vmodels) {
        var options = data.roleselectOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)
        var dataTmpSelect = [],
            selectTmpSelect = []
        var vmodel = avalon.define(data.roleselectId, function(vm) {
            vm.data = []
            vm.select = []
            vm._select = []
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.$skipArray = ["widgetElement", "template"]

            var inited, id = +(new Date())
            vm.$uid = id
            vm.$init = function() {
                if(inited) return
                inited = true

                var dataTemplate = vmodel.$getTemplate("data"),
                    selectTemplate = vmodel.$getTemplate("select")
                vmodel.template = vmodel.template.replace(/\{\{MS_OPTION_SELECT\}\}/g, selectTemplate).replace(/\{\{MS_OPTION_DATA\}\}/g, dataTemplate).replace(/\{\{MS_OPTION_ID\}\}/g, id)
                element.innerHTML = vmodel.template

                vmodel.$getSelect()
                avalon.scan(element, [vmodel].concat(vmodels))
                // callback after inited
                if(typeof options.onInit === "function" ) {
                    //vmodels是不包括vmodel的 
                    options.onInit.call(element, vmodel, options, vmodels)
                }
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }

            vm.$getTemplate = function(tplName) {
                var sourceTpl = tmpl
                if(tplName === "data") {
                    sourceTpl = dataTpl.replace(/\{\{MS_OPTION_TYPE\}\}/g, "data")
                } else if(tplName === "select") {
                    sourceTpl = dataTpl.replace(/\{\{MS_OPTION_TYPE\}\}/g, "select")
                }

                return vmodel.getTemplate(sourceTpl, options, tplName)
            }
            vm.$itemSelected = function(item, type) {
                for(var i = 0, len = vmodel.select; i < len; i++) {
                    if(vmodel.select[i] == item.value) return true && type == "data"
                }
                return false
            }
            vm.$itemShow = function(item, type) {
                return vmodel.hideSelect && vmodel.$itemSelected(item, type)
            }
            vm.$getSelect = function() {
                vmodel._select = []
                avalon.each(vmodel.select, function(i, item) {
                    avalon.each(vmodel.data, function(si, sitem) {
                        if(item == sitem.value) vmodel._select.push(sitem)
                    })
                    var ele = avalon(document.getElementById("data" + item + vmodel.$uid))
                    // 重置样式
                    ele.removeClass("ui-state-active").addClass("ui-state-disabled")
                    if(vmodel.hideSelect) ele.addClass("ui-helper-hidden")
                })
                // 更新滚动区域
                avalon.vmodels["$left" + vmodel.$uid] && avalon.vmodels["$left" + vmodel.$uid].update()
                avalon.vmodels["$right" + vmodel.$uid] && avalon.vmodels["$right" + vmodel.$uid].update()
            }
            vm.$removeFrom = function(v, isSelected) {
                var tar = isSelected ? selectTmpSelect : dataTmpSelect
                for(var i = 0, len = tar.length; i < len; i++) {
                    if(v == tar[i]) {
                        tar.splice(i, 1)
                        break
                    }
                }
            }
            // 响应点击事件
            vm.$select = function(e, item, type) {
                var ele = avalon(this),
                    data = ele.data()
                if(ele.hasClass("ui-state-disabled")) return
                // 选中区域的点击
                if(type == "select") {
                    if(ele.hasClass("ui-state-active")) {
                        ele.removeClass("ui-state-active")
                        vmodel.$removeFrom(data.value, "fromSelected")
                    } else {
                        ele.addClass("ui-state-active")
                        selectTmpSelect.push(data.value)
                    }
                } else {
                // 待选区域的点击
                    if(ele.hasClass("ui-state-active")) {
                        ele.removeClass("ui-state-active")
                        vmodel.$removeFrom(data.value)
                    } else {
                        ele.addClass("ui-state-active")
                        dataTmpSelect.push(data.value)
                    }
                }
            }
            // 更新状态
            vm.$update = function($event, addOrDelete) {
                var tar = addOrDelete === "delete" ? selectTmpSelect : dataTmpSelect
                if(tar.length == 0) return
                if(addOrDelete === "delete") {
                    for(var i = 0, len = tar.length; i < len; i++) {
                        if(!vmodel.countLimit(vmodel.select, addOrDelete)) {
                            break
                        } else {
                            for(var j = 0, jlen = vmodel.select.length; j < jlen; j++) {
                                if(vmodel.select[j] == tar[i]) {
                                    vmodel.select.splice(j, 1)
                                    break
                                }
                            }
                        }
                    }
                    // free data select
                    avalon.each(dataTmpSelect, function(i, item) {
                        avalon(document.getElementById("data" + item + vmodel.$uid)).removeClass("ui-state-active")
                    })
                } else {
                    for(var i = 0, len = tar.length; i < len; i++) {
                        if(!vmodel.countLimit(vmodel.select, addOrDelete)) {
                            while(i < len) {
                                avalon(document.getElementById("data" + tar[i] + vmodel.$uid)).removeClass("ui-state-active")
                                i++
                            }
                            break
                        } else {
                            vmodel.select.push(tar[i])
                        }
                    }
                }
                selectTmpSelect = []
                dataTmpSelect = []
                vmodel.$getSelect()
            }
            //@method reset 重置
            vm.reset = function() {
                selectTmpSelect = []
                dataTmpSelect = []
                vmodel.select = []
                vmodel.$getSelect()
            }

        })
        // change
        vmodel.select.$watch("length", function(newValue, oldValue) {
            vmodel.change && vmodel.change(newValue, oldValue, vmodel)
        })

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        //@optMethod onInit(vmodel, options, vmodels) 完成初始化之后的回调,call as element's method
        onInit: avalon.noop,
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },//@optMethod getTemplate(tpl, opts) 定制修改模板接口
        hideSelect: false, //@param 是否隐藏以选中的项目，默认不隐藏
        countLimit: function(select) {
            return true
        },//@optMethod countLimit(select) 选择条目限制，必须有return true or false，参数是当前已选中条数和add or delete操作
        change: avalon.noop, //@optMethod change(newValue, oldValue, vmodel) 所选变化的回调
        $author: "skipper@123"
    }
})