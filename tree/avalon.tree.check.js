//@description avalon.ui.tree组件编辑功能扩展，包括增删改节点
define(["avalon", "./avalon.tree", "text!./avalon.tree.check.html"], function(avalon, tree, check_html) {
	function g(id) {return document.getElementById(id)}
	var undefine = void 0
	// 排除辅助字段
	avalon.ui.tree.leafIgnoreField.push("chkFocus", "chkTotal", "checkedOld")
	avalon.ui.tree.AddExtention(
		["check"],
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
                	chkTotal: "",
                	checkedOld: "checked"
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
				/**
	             * @interface 勾选 或 取消勾选 单个节点
	             * @param {Object} 节点
	             * @param true 表示勾选节点  false 表示取消勾选 的节点数据
	             * @param true 表示按照 setting.check.chkboxType 属性进行父子节点的勾选联动操作 false 表示只修改此节点勾选状态，无任何勾选联动操作
	             * @param true 表示执行此方法时触发 beforeCheck & onCheck 事件回调函数  false 表示执行此方法时不触发事件回调函数
	             */
				checkNode: function(leaf, checked, checkTypeFlag, callbackFlag) {
					if(!vm.checkEnable() || leaf.nocheck || leaf.chkDisabled) return
					vm.excute("checkChange", {
						cancelCallback: !callbackFlag,
						checkTypeFlag: checkTypeFlag
					}, leaf, function(arg) {
						var chk = checked === undefine ? !leaf.checked : !!checked,
							beforeCheck = vm.callback.beforeCheck,
							onCheck = vm.callback.onCheck
						if(callbackFlag && chk && beforeCheck && (beforeCheck(arg) === false) || arg.cancel) return 
						leaf.checked = chk
						callbackFlag && chk && onCheck && onCheck(arg)
						return chk
					})
				},
				/**
	             * @interface 勾选 或 取消勾选 全部节点
	             * @param true 表示勾选全部节点 false 表示全部节点取消勾选
	             * @param {Object} 可以指定一个起始的节点
	             */
				checkAllNodes: function(checked, leaf) {
					if(!vm.checkEnable() && vm.check.chkStyle !== "checkbox") return
					vm.visitor(leaf, function(node) {
						if(!node.nocheck && !node.chkDisabled) {
							node.checked = !!checked
						}
					})
				},
				/**
	             * @interface 获取输入框被勾选 或 未勾选的节点集合
	             * @param true 表示勾选 false 表示未勾选
	             * @param {Object} 可以指定一个起始的节点
	             */
				getCheckedNodes: function(checked, leaf) {
					var checked = checked === undefine ? true : !!checked
					return vm.visitor(leaf, function(node) {
						if(node.chkDisabled || node.nocheck) return
						if(node.checked == checked) return node
					}, checked && vm.check.chkStyle === "radio" && vm.check.radioType === "all" ? function(res) {
						return res && res.length > 0
					} : undefine, [])
				},
				/**
	             * @interface 获取输入框勾选状态被改变的节点集合
	             * @param {Object} 可以指定一个起始的节点
	             * @param 将当前状态更新到原始数据上
	             */
				getChangeCheckedNodes: function(leaf, updateChanges) {
					return vm.visitor(leaf, function(node) {
						if(!!node.checkedOld != !!node.checked) {
							if(updateChanges) node.checkedOld = !!node.checked
							return node
						}
					}, undefine, [])
				},
				/**
	             * @interface 禁用 或 解禁 某个节点的 checkbox / radio [check.enable = true 时有效]
	             * @param {Object} 可以指定一个起始的节点
	             * @param true 表示禁用 checkbox / radio false 表示解禁 checkbox / radio
	             * @param true 表示全部父节点进行同样的操作 false 表示不影响父节点
	             * @param true 表示全部子节点进行同样的操作 false 表示不影响子节点
	             */
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
						if(inheritParent && leaf && leaf.$parentLeaf) {
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
			var onlyOneRadio = vmodel.getCheckedNodes()[0]
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
				if(chkStyle === "radio") {
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
					leaf.halfCheck = false
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
									if(bool && autoCheckTrigger && beforeCheck && (beforeCheck(e) === false)) return
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
									if(bool && autoCheckTrigger && beforeCheck && (beforeCheck(e) === false)) return
								}
								node.checked = bool
								// 勾选父节点，让子节点的半勾选失效
								if(bool) node.halfCheck = false
								!cancelCallback && bool && autoCheckTrigger && onCheck && onCheck(e)
							}, undefine, [])
						}
					}
				}
			})
		})
})