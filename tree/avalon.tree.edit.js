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
		["edit", "data"],
		// 注入默认配置
		{	
			edit: {
				enable: true,
				showAddBtn: true,
				showRemoveBtn: true,
				showRenameBtn: true,
				editNameSelectAll: true,
				removeTitle: function(leaf) {
					return "删除" + leaf.name
				},
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
				beforeAdd: false,
				onRemove: avalon.noop,
				onRename: avalon.noop,
				onAdd: avalon.noop,
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
			avalon.mix(vm, {
				editDblclick: function(event) {
					event.stopPropagation()
				},
				editFun: function(arg) {
					var event = arg.e,
						leaf = arg.leaf
					event.preventDefault()
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
				editFocus: function(arg) {
				},
				saveChange: function(arg) {
					var leaf = arg.leaf
					leaf.name = this.value
					avalon(g(leaf.$id)).removeClass("edit-focus")
					avalon(g("c" +leaf.$id)).removeClass("par-edit-focus")
				},
				addFun: function(arg) {
					var event = arg.e,
						leaf = arg.leaf
					event.preventDefault()
					event.stopPropagation()
					var newLeaf = vm.createLeaf({name: "未命名节点"}, leaf)
					leaf.isParent = leaf.open = true
					leaf.children.push(newLeaf)
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
				}
			})
		// 侦听的事件，func操作内进行分发
		}, ["remove", "rename", "add"],  {
		// 添加html钩子
		edit_binding: " ms-hover=\"ui-state-hover\" ",
		edit_html: edit_html
	})
})