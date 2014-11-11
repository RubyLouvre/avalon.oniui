//@description avalon.ui.tree组件编辑功能扩展，包括增删改节点
define(["avalon", "./avalon.tree", "text!./avalon.tree.check.html"], function(avalon, tree, check_html) {
	function g(id) {return document.getElementById(id)}
	var replacer = [], type = ["checkbox", "radio"], chkValue = ["false", "true"], chkStatus = ["full", "part", "disable"], v, t, undefine = void 0
	for(var i = 0; i < chkValue.length; i++) {
		v = chkValue[i]
		for(var j = 0; j < chkStatus.length; j++) {
			t = chkStatus[j]
			replacer.push(" ms-class-" + replacer.length + "=\"`type`_" + v + "_" + t + ":checkClass('`type`'," + v + ",'" + t + "',leaf)\" ")
		}
	}
	avalon.ui.tree.AddExtention(
		["check", "data"],
		{
			check: {
				enable: false,
				radioType: "level",
				chkStyle: "checkbox",
				nocheckInherit: false,
				chkDisabledInherit: false,
				autoCheckTrigger: false,
				chkboxType: {
					Y: "ps",
					N: "ps"
				}
			},
			data: {
				key: {
                	checked: "checked",
                	nocheck: "nocheck"
				}
			}
		},
		function(vm, vmodels) {
			avalon.mix(vm, {
				chkFocus: function(arg) {
					
				},
				chkBlur: function(arg) {

				},
				checkClass: function(type, value, status, leaf) {
					var t = vm.getCheckType()
					if(t !== type || (!!leaf.checked) != value || status === "disable" && !leaf.disable) return false
					return true
				},
				getCheckType: function() {
					return vm.check.chkStyle === "radio" ? "radio" : "checkbox"
				},
				checkNode: function(leaf, checked, checkTypeFlag, callbackFlag) {
					vm.excute("check", {
						cancelCallback: !callbackFlag
					}, leaf, function() {
						var chk = checked === undefine ? !leaf.checked : !!checked
						return leaf.checked = chk
					})
				},
				checkAllNodes: function(checked, leaf) {
					if(!vm.check.enable && vm.check.chkStyle !== "checkbox") return
					vm.visitor(leaf, function(node) {
						if(!node.nocheck && !node.disable) {
							node.checked = !!checked
						}
					})
				},
				getCheckedNodes: function(checked, leaf) {
					var checked = checked === undefine ? true : !!checked
					return vm.visitor(leaf, function(node) {
						if(node.disable || node.nocheck) return
						if(node.checked == checked) return node
					}, checked && vm.check.chkStyle === "radio" && vm.check.radioType === "all" ? function(res) {
						return res && res.length > 0
					} : undefine, [])
				},
				getChangeCheckedNodes: function(leaf) {

				}
			})
		}, [], {
			check_html: function(tpl, options) {
				var type = options.check.chkStyle === "radio" ? "radio" : "checkbox", res = []
				avalon.each(replacer, function(i, item) {
					res[i] = item.replace(/`type`/g, type)
				})
				return check_html.replace("__class__", res.join(""))
			}
		}, function(vmodel, vmodels) {
			// 继承check属性
			vmodel.$watch("e:nodeCreated", function(arg) {
				var newLeaf = arg.res,
					vm = arg.vm,
					par = newLeaf.$parentLeaf
				if(!par) return
				if(!(!vm.optionToBoolen(vm.check.enable, newLeaf) || newLeaf.nocheck)) {
					newLeaf.nocheck = vm.check.nocheckInherit && par.nocheck
				}
				if(!(!vm.optionToBoolen(vm.check.enable, newLeaf) || newLeaf.chkDisabled)) {
					newLeaf.chkDisabled = vm.check.chkDisabledInherit && par.chkDisabled
				}
			})
			var onlyOneRadio = vmodel.getCheckedNodes()
			vmodel.$watch("e:check", function(arg) {
				var leaf = arg.leaf,
					vm = arg.vm,
					chk = vm.check,
					chkStyle = chk.chkStyle,
					radioType = chk.radioType

				if(chk.chkStyle === "radio") {
					if(leaf.checked) {
						if(radioType === "all") {
							if(onlyOneRadio) onlyOneRadio.checked = false
							onlyOneRadio = leaf
						} else {
							vm.brotherVisitor(leaf, function(node) {
								if(node === leaf) return
								node.checked = false
							}, function(res) {
								return res.length > 0
							}, [])
						}
					}
				}
				// 关联效果
			})
		})
})