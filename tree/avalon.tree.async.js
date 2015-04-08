//異步插件
define(["avalon", "./avalon.tree", "../mmRequest/mmRequest"], function () {
	var undefine = void 0
	// 排除辅助字段
	avalon.ui.tree.leafIgnoreField.push("zAsync")
	avalon.ui.tree.AddExtention(["async"], {
		data: {
			// 擴展異步標記key
			key: {
				zAsync: "zAsync" // 是否異步加載過
			}
		},
		async: {
			enable: false,
			url: "./avalon.tree.data.php",
			contentType: "application/x-www-form-urlencoded",
			dataType: "json",
			autoParam: [],
			dataFilter: undefine,
			otherParam: {},
			type: "post"
		}
	}, function(vm, vmodels) {
		avalon.mix(vm, {
			/**
			 * @interface 强行异步加载父节点的子节点
			 * @param 指定需要异步加载的父节点 JSON 数据
			 * @param reloadType = "refresh" 表示清空后重新加载 reloadType != "refresh" 时，表示追加子节点处理
			 * @param 设定异步加载后是否自动展开父节点。isSilent = true 时，不展开父节点，其他值或缺省状态都自动展开
			 * @param 異步加載成功之後的回調
			 * @param 默认是async内的dataFilter
			 */
			reAsyncChildNodes: function(leaf, reloadType, isSilent, callback, filter) {
				if(!leaf) return
				vm.asyncChildNodes(leaf, function(res) {
					// 是否清除
					if(reloadType === "refresh") leaf.children.clear()
					// 展开
					if(!isSilent) leaf.open = true
					callback && callback({
						e: undefine,
						leaf: leaf,
						vm: vm,
						vmodels: vmodels
					})
				}, filter)
			},
			asyncChildNodes: function(leaf, callback, filter) {
				if(!leaf) return
				var async = vm.async
					, filter = filter || async.dataFilter,
					okFun = vm.callback.onAsyncSuccess,
					failFun = vm.callback.onAsyncError,
					data = avalon.mix({}, async.otherParam.$model || {})// 拼合otherParam
				// 拼合autoParam
				avalon.each(async.autoParam, function(i, item) {
					var args = item.split("=")
					data[args[1] || args[0]] = leaf[args[0]]
				})
				vm.excute("async", {
				}, leaf, function() {
					var iconSpan = avalon(g("treeIcon" + leaf.$id))
					iconSpan.addClass("ico_loading")
					avalon.ajax(avalon.mix({
						data: data
					},
					async)).done(function(res) {
						callback && callback(res)
						// 是否过滤数据
						vm.addNodes(leaf ,filter ? filter(res): res)
						iconSpan.removeClass("ico_loading")
						okFun && okFun({
							leaf: leaf,
							e: res,
							vm: vmodel,
							vmodels: vmodels
						})
					}).fail(function(res) {
						iconSpan.removeClass("ico_loading")
						failFun && failFun({
							leaf: leaf,
							e: res,
							vm: vmodel,
							vmodels: vmodels
						})
					})
				})
			}
		})
	}, undefine, undefine, function(vmodel, vmodels) {
		// 节点展开时去检测一下是否要异步加载
		vmodel.$watch("e:expand", function(arg) {
			if(!vmodel.async.enable) return
			var leaf = arg.leaf
			if(leaf && !leaf.zAsync) {
				vmodel.asyncChildNodes(leaf, function() {
					leaf.zAsync = true
				})
			}
		})
	})
})