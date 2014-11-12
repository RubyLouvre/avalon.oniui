//@description avalon.ui.tree组件编辑功能扩展，包括增删改节点
define(["avalon", "./avalon.tree", "text!./avalon.tree.check.html"], function(avalon, tree, check_html) {
	function g(id) {return document.getElementById(id)}
	var undefine = void 0
	// 排除辅助字段
	avalon.ui.tree.leafIgnoreField.push("chkFocus", "chkTotal")
	avalon.ui.tree.AddExtention(
		["check", "data", "callback"],
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
			},
			callback: {
				beforeCheck: avalon.noop,
				onCheck: avalon.noop,
				beforeCheckRelated: function(arg) {
					if(arg && arg.vm && arg.vm.check && !arg.vm.check.enable || arg.e && arg.e.expr === false) {
						avalon.log("check is not enable")
						return false
					}
					avalon.log("check is enable")
					return true
				},
				beforeCheckChange: avalon.noop,
				onCheckChange: avalon.noop
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
				checkEnable: function() {
					return !!vm.check.enable
				},
				computeCHKClass: function(leaf) {
					var type = vm.getCheckType()
					return type + "_" + !!leaf.checked + "_" + (leaf.halfCheck ? "part" : leaf.chkDisabled ? "disable" : "full") + (leaf.chkFocus ? "_focus" : "")
				},
				getCheckType: function() {
					return vm.check.chkStyle === "radio" ? "radio" : "checkbox"
				},
				checkNode: function(leaf, checked, checkTypeFlag, callbackFlag) {
					if(!vm.checkEnable() || leaf.chkDisabled) return
					vm.excute("checkChange", {
						cancelCallback: !callbackFlag,
						checkTypeFlag: checkTypeFlag
					}, leaf, function(arg) {
						var chk = checked === undefine ? !leaf.checked : !!checked,
							beforeCheck = vm.callback.beforeCheck,
							onCheck = vm.callback.onCheck
						if(callbackFlag && chk && beforeCheck && beforeCheck(arg) || arg.cancel) return 
						leaf.checked = chk
						callbackFlag && chk && onCheck && onCheck(arg)
						return chk
					})
				},
				checkAllNodes: function(checked, leaf) {
					if(!vm.checkEnable() && vm.check.chkStyle !== "checkbox") return
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
					if(vm.checkEnable()) {
						disabled = !!disabled
						leaf.chkDisabled = disabled
						// 操作子节点
						if(inheritChildren) {
							vm.visitor(leaf, function(node) {
								if(node.nocheck) return	
								node.chkDisabled = disabled
							}, function(res, node) {
								// 终止这个节点，以及其子节点
								return node.nocheck
							}, [])
						}
						// 影响父节点
						if(inheritChildren && leaf && leaf.$parentLeaf) {
							// 向上溯源
							vm.cVisitor(leaf, function(node) {
								var par = node.$parentLeaf
								if(!par) return
								var disabledCount = 0,
									canDisabledCount = 0
								// 计算有多少子节点的disable情况
								vm.brotherVisitor(node, function(node) {
									if(node.nocheck) return
									canDisabledCount++
									if(node.chkDisabled) disabledCount++
								})
								par.chkDisabled = disabledCount >= canDisabledCount
							})
						}
					}
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
			vmodel.$watch("e:checkChange", function(arg) {
				var leaf = arg.leaf,
					vm = arg.vm,
					chk = vm.check
				if(!chk.enable) return
				var	chkStyle = chk.chkStyle,
					radioType = chk.radioType,
					chkboxType = chk.chkboxType,
					autoCheckTrigger = chk.autoCheckTrigger,
					callback = vmodel.callback,
					beforeCheck = callback.beforeCheck,
					onCheck = callback.onCheck,
					cancelCallback = arg.e && arg.e.cancelCallback 
				leaf.halfCheck = false
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
				// only for checkbox
				} else {
					// 关联效果
					var bool = !!leaf.checked
					chkboxType =  bool ? chkboxType.Y : chkboxType.N
					if(chkStyle === "checkbox" && arg.e && arg.e.checkTypeFlag) {
						// 向上关联
						if(chkboxType.indexOf("p") > -1) {
							vmodel.cVisitor(leaf, function(node) {
								var par = node.$parentLeaf
								if(!par) return
								var checkedCount = 0,
									canCheckedCount = 0
								// 计算节点check数目
								vmodel.brotherVisitor(node, function(brother) {
									if(brother.nocheck || brother.chkDisabled) return
									if(brother.checked) checkedCount++
									canCheckedCount++
								}, function(res, brother, par) {
									return par && (par.nocheck || par.chkDisabled)
								})
								var e = {
									e: arg.e,
									srcLeaf: leaf,
									leaf: node,
									vm: vmodel,
			                        vmodels: vmodels,
			                        preventDefault: function() {
			                            this.cancel = true
			                        }
								}
								if(!cancelCallback) {
									if(bool && autoCheckTrigger && beforeCheck && beforeCheck(e)) return
								}
								par.checked = checkedCount > 0
								par.halfCheck = checkedCount <= 0 || checkedCount >= canCheckedCount ? false : true
								!cancelCallback && bool && autoCheckTrigger && onCheck && onCheck(e)
							})
						}
						// 向下关联
						if(chkboxType.indexOf("s") > -1) {
							vmodel.visitor(leaf, function(node) {
								if(node.nocheck || node.chkDisabled) return
								var e = {
									e: arg.e,
									srcLeaf: leaf,
									leaf: node,
									vm: vmodel,
			                        vmodels: vmodels,
			                        preventDefault: function() {
			                            this.cancel = true
			                        }
								}
								if(!cancelCallback) {
									if(bool && autoCheckTrigger && beforeCheck && beforeCheck(e)) return
								}
								node.checked = bool
								!cancelCallback && bool && autoCheckTrigger && onCheck && onCheck(e)
							}, undefine, [])
						}
					}
				}
			})
		})
})