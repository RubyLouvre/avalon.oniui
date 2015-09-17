//@description avalon.ui.tree组件编辑功能扩展，包括增删改节点
define(["avalon", "./avalon.tree", "text!./avalon.tree.edit.html"], function(avalon, tree, edit_html) {
	function g(id) {return document.getElementById(id)}
	function makeCallback(key) {
		return function(arg) {
			var func = arg.vm.callback[key],
			ele = arg.e ? arg.e.srcElement || arg.e.target : void 0
			func && func.call(ele, arg)
		}
	}
	avalon.ui.tree.AddExtention(
		["edit"],
		// 注入默认配置
		{	
			edit: {
				enable: true,
				showAddBtn: true,
				showRemoveBtn: true,
				showRenameBtn: true,
				editNameSelectAll: true,
				removeTitle: "remove",
				renameTitle:"rename",
				addTitle:"add"
			},
			data: {
				keep: {
					leaf: false,
					parent: false
				}
			},
			callback: {
				beforeRemove: false,
				beforeRename: false,
				beforeNodeCreated: false,
				onRemove: avalon.noop,
				onRename: avalon.noop,
				onNodeCreated: avalon.noop,
				beforeEdit: makeCallback("beforeRename"),
				onBlur: makeCallback("onRename")
			}
		},
		// 给vm新增方法
		function(vm, vmodels) {
			function changeIsParent(leaf) {
				if(!vm.data.keep.parent) {
					leaf.isParent = !!leaf.children.length
				}
			}
			var focusLeaf
			avalon.mix(vm, {
				editDblclick: function(event) {
					event.stopPropagation()
				},
				/**
	             * @interface 设置某节点进入编辑名称状态
	             * @param {Object} {leaf:leaf}指定节点
	             */
				editName: function(arg) {
					var event = arg.e,
						leaf = arg.leaf
					event.preventDefault && event.preventDefault()
					focusLeaf = leaf
					if(avalon(this.parentNode).hasClass("curSelectedNode")) event.stopPropagation()
					// edit logic
					avalon(g(leaf.$id)).addClass("edit-focus")
					avalon(g("c" +leaf.$id)).addClass("par-edit-focus")
					var input = g("input" + leaf.$id)
					if(vm.view.editNameSelectAll) {
						input.select()
					}
					input.focus()
				},
				/**
	             * @interface 取消节点的编辑名称状态，可以恢复原名称，也可以强行赋给新的名称
	             * @param {String} 重新给定的新名称
	             */
				cancelEditName: function(newName) {
					if(focusLeaf) {
						if(newName !== void 0) focusLeaf.name = newName
					}
				},
				saveChange: function(arg) {
					var leaf = arg.leaf
					if(this.value != leaf.name) {
						vm.cancelEditName(this.value)
					} else {
						arg.preventDefault()
					}
					focusLeaf = null
					avalon(g(leaf.$id)).removeClass("edit-focus")
					avalon(g("c" +leaf.$id)).removeClass("par-edit-focus")
				},
				addFun: function(arg) {
					var event = arg.e,
						leaf = arg.leaf
					event.preventDefault()
					event.stopPropagation()
					return vm.addNodes(leaf, avalon.mix({name: "未命名节点"}, arg.newLeaf || {}))
				},
				removeFun: function(arg) {
					var event = arg.e,
						leaf = arg.leaf
					event.preventDefault()
					event.stopPropagation()
					// remove cache
					vm.removeCacheById(leaf.$id)
					var par = leaf.$parentLeaf || vm
					par.children.remove(leaf)
					leaf.$parentLeaf && changeIsParent(leaf.$parentLeaf)
				},
				/**
	             * @interface 删除节点
	             * @param {Object} 节点
	             * @param true 表示执行此方法时触发 beforeRemove & onRemove 事件回调函数  false 表示执行此方法时不触发事件回调函数
	             */
				removeNode: function(leaf, callbackFlag) {
					vm.excute('remove', {
						cancelCallback: !callbackFlag
					}, leaf, 'removeFun')
				},
				/**
	             * @interface 删除子节点 此方法不会触发任何事件回调函数
	             * @param {Object} 节点
	             */
				removeChildNodes: function(parentLeaf) {
					var arr = vm.getNodes(parentLeaf)
					arr && arr.clear && arr.clear()
				}
			})
		// 侦听的事件，func操作内进行分发
		}, ["remove", "rename", "add"],  {
		// 添加html钩子
		edit_binding: " ms-hover=\"oni-state-hover\" ",
		edit_html: edit_html
	}, function(vmodel, vmodels) {
		vmodel.$watch("e:beforeNodeCreated", function(arg) {
			var leaf = arg.leaf
			// 子节点锁定
			if(vmodel.data.keep.leaf && !leaf.isParent) arg.preventDefault()
		})
	})
})