// 通过 avalon.mix(true, targetVm, avalon.treeMenu)来将树转化成菜单
define(["./avalon.tree", "css!./tree-menu.css"], function () {
	avalon.treeMenu = {
	    view: {
	        showLine: false, // 不展示树的连接线
	        dblClickExpand: false, // 双击不改变节点的展开状态
	        singlePath: true,// 节点间展开状态互斥
	        showIcon: function(leaf) {
	            if(leaf.level < 1) return true
	        },
	        showSwitch: function(leaf) {
	            if(leaf.level > 0) return true
	        }
	    },
	    callback: {
	        // 改写click事件
	        beforeClick: function(e) {
	            var leaf = e.leaf,
	                vmodel = e.vm
	            e.e && e.e.preventDefault()
	            if(!leaf.isParent) return
	            vmodel.expand(leaf, false)
	        }
	    },
	    // 插入关闭展开按钮
	    getTemplate: function(tpl, options, name) {
	        if(name === "nodes") return tpl.replace("<li", "<li ms-class=\"oni-leaf-selected:hasClassSelect(leaf)\" ")
	        if(!name) return tpl + '<a href="#" class="oni-menu-tree-swicth" ms-click="toggleMenuTree($event, widgetElement, $guid)" ms-class="oni-menu-tree-swicth-off:!toggle"></a>'
	        return tpl
	    },
	    toggleMenuTree: function(event, widgetElement, $guid) {
	        event && event.preventDefault && event.preventDefault()
	        var ele = avalon(widgetElement)
	        if(ele.hasClass("oni-menu-tree-hidden")) {
	            ele.removeClass("oni-menu-tree-hidden")
	            ele.removeClass("oni-state-hover")
	        } else {
	            ele.addClass("oni-menu-tree-hidden")
	        }
	    },
	    onInit: function(vmodel) {
	        var ele = avalon(this)
	        ele.bind("mouseenter", function(e) {
	            if(ele.hasClass("oni-menu-tree-hidden")) ele.addClass("oni-state-hover")
	        })
	        ele.bind("mouseleave", function(e) {
	            ele.removeClass("oni-state-hover")
	        })
	    }
	}
})