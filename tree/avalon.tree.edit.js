//@description avalon.ui.tree组件编辑功能扩展，包括增删改节点
define(["avalon", "./avalon.tree", "text!./avalon.tree.edit.html"], function(avalon, tree, edit_html) {
	function g(id) {return document.getElementById(id)}
	avalon.ui.tree.AddExtention(
		["edit"],
		// 注入默认配置
		{	
			edit: {
				enable: true,
				showAddBtn: true,
				showRemoveBtn: true,
				showRenameBtn: true
			},
			callback: {
				beforeRemove: false,
				beforeRename: false,
				beforeAdd: false,
				onRemove: avalon.noop,
				onRename: avalon.noop
			}
		},
		// 给vm新增方法
		function(vm, vmodels) {
			avalon.mix(vm, {
				editDblclick: function(event) {
					event.stopPropagation()
				},
				editFun: function(event, leaf) {
					// event.stopPropagation()
					var beforeFunc = vm.callback.beforeRename, arg = {e: event, vmodel: vm, vmodels: vmodels ,leaf: leaf}
					if(beforeFunc && !beforeFunc(arg)) return
					// edit logic
					avalon(g(leaf.$id)).addClass("edit-focus")
					g("input" + leaf.$id).focus()
				},
				editFocus: function(event, leaf) {
				},
				saveChange: function(event, leaf) {
					leaf.name = this.value
					avalon(g(leaf.$id)).removeClass("edit-focus")
				},
				addFun: function(event, leaf) {
					event.stopPropagation()
					var beforeFunc = vm.callback.beforeAdd, arg = {e: event, vmodel: vm, vmodels: vmodels ,leaf: leaf}
					if(beforeFunc && !beforeFunc(arg)) return
					var newLeaf = vm.createLeaf({name: "未命名节点"}, leaf)
					leaf.isParent = leaf.open = true
					leaf.children.push(newLeaf)
					console.log(leaf)
				},
				removeFun: function(event, leaf) {
					event.stopPropagation()
					var beforeFunc = vm.callback.beforeRemove, arg = {e: event, vmodel: vm, vmodels: vmodels ,leaf: leaf}
					if(beforeFunc && !beforeFunc(arg)) return
					var par = leaf.$parentLeaf || vm
					par.children.remove(leaf)
					vm.$fire("e:remove", arg)
				}
			})
		// 侦听的事件，func操作内进行分发
		}, ["remove", "rename", "add"],  {
		// 添加html钩子
		edit_binding: " ms-hover=\"ui-state-hover\" ",
		edit_html: edit_html
	})
})