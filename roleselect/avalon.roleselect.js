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
            }
            vm.$remove = function() {
                element.innerHTML = element.textContent = ""
            }

            vm.$getTemplate = function(tplName) {
                var sourceTpl = tmpl
                if(tplName === "data") {
                    sourceTpl = dataTpl
                } else if(tplName === "select") {
                    sourceTpl = dataTpl
                }

                return vmodel.getTemplate(sourceTpl, options, tplName)
            }
            vm.$itemSelected = function(item) {
                for(var i = 0, len = vmodel.select; i < len; i++) {
                    if(vmodel.select[i] == item.value) return true && !item.isSelected
                }
                return false
            }
            vm.$getSelect = function() {
                vmodel._select = []
                avalon.each(vmodel.select, function(i, item) {
                    avalon.each(vmodel.data, function(si, sitem) {
                        if(item == sitem.value) vmodel._select.push(avalon.mix({isSelected: 1}, sitem))
                    })
                    var ele = avalon(document.getElementById("data" + item + vmodel.$uid))
                    // 重置样式
                    ele.removeClass("ui-state-active").addClass("ui-state-disabled")
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
            vm.$select = function(e, item) {
                var ele = avalon(this),
                    data = ele.data()
                if(ele.hasClass("ui-state-disabled")) return
                // 选中区域的点击
                if(item.isSelected) {
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
                        for(var j = 0, jlen = vmodel.select.length; j < jlen; j++) {
                            if(vmodel.select[j] == tar[i]) {
                                vmodel.select.splice(j, 1)
                                break
                            }
                        }
                    }
                } else {
                    avalon.each(tar, function(index, item) {
                        vmodel.select.push(item)
                    })
                }
                selectTmpSelect = []
                dataTmpSelect = []
                vmodel.$getSelect()
            }
            //@method apiName(argx) description

        })
        // change
        vmodel.select.$watch("length", function(newValue, oldValue) {
            vmodel.change && vmodel.change(vmodel)
        })

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        getTemplate: function(tmpl, opts, tplName) {
            return tmpl
        },
        change: avalon.noop, //@optMethod change(vmodel) 所选变化的回调
        $author: "skipper@123"
    }
})