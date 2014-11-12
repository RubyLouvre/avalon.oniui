//@description avalon.ui.tree组件编辑功能扩展，包括增删改节点
define(["avalon", "./avalon.tree", "text!./avalon.tree.check.html"], function(avalon, tree, check_html) {
	function g(id) {return document.getElementById(id)}
	var undefine = void 0
	// 排除辅助字段
	avalon.ui.tree.leafIgnoreField.push("chkFocus")
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
                	nocheck: "nocheck",
                	chkDisabled: "chkDisabled",
                	halfCheck: "halfCheck",
                	chkFocus: "chkFocus",
                	chkTotal: ""
				}
			}
		},
		function(vm, vmodels) {
			avalon.mix(vm, {
				chkFocus: function(arg) {
					if(arg.leaf) arg.leaf.chkFocus = true
				},
				chkBlur: function(arg) {
					if(arg.leaf) arg.leaf.chkFocus = false
				},
				computeCHKClass: function(leaf) {
					var type = vm.getCheckType()
					return type + "_" + !!leaf.checked + "_" + (leaf.halfCheck ? "part" : "full") + (leaf.chkFocus ? "_focus" : "")
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
						if(!node.nocheck && !node.chkDisabled) {
							node.checked = !!checked
						}
					})
				},
				getCheckedNodes: function(checked, leaf) {
					var checked = checked === undefine ? true : !!checked
					return vm.visitor(leaf, function(node) {
						if(node.chkDisabled || node.nocheck) return
						if(node.checked == checked) return node
					}, checked && vm.check.chkStyle === "radio" && vm.check.radioType === "all" ? function(res) {
						return res && res.length > 0
					} : undefine, [])
				},
				getChangeCheckedNodes: function(leaf) {

				},
				setChkDisabled: function(leaf, disabled, inheritParent, inheritChildren) {

				}
			})
		}, [], {
			check_html: check_html
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