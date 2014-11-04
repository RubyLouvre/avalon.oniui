//@description avalon.ui.tree组件编辑功能扩展，包括增删改节点
define(["avalon", "./avalon.tree"], function() {
	avalon.ui.tree.AddExtention(
		["edit"],
		// 注入默认配置
		{	
			edit: {

			},
			callback: {
				onRemove: function() {

				},
				onRename: function() {

				}
			}
		},
		// 给vm新增方法
		function(vm, vmodels) {
			avalon.mix(vm, {
				editFun: function(event, leaf) {

				},
				removeFun: function(event, leaf) {
					var par = leaf.parentLeaf || vm
					par.children.remove(leaf)
					vm.$fire("e:remove", {
						e: event,
						leaf: leaf,
						vmodel: vm,
						vmodels: vmodels
					})
				},
				hasEditBtn: function(leaf) {

			    },
			    hasRemoveBtn: function(leaf) {

			    }
			})
		// 侦听的事件，func操作内进行分发
		}, ["remove", "rename", "add"])
})