define(["mmRouter/mmState", 
		"mmRouter/ppt/model/ppt", 
		"mmRequest/mmRequest", 
		"loading/avalon.loading"], function () {
	avalon.state("ppt", {
		url: "/:pageNumber",
		controller: "ppt",
		views: {
			"": {
				templateUrl: "ppt/views/tpl.html"
			}
		},
		onChange: function(pageNumber) {
			if(!pageNumber) return avalon.router.redirect("/1")
			var done = this.async()
			if(avalon.vmodels.ppt.curentPage != pageNumber) avalon.vmodels.ppt.curentPage = pageNumber
			avalon.get("ppt/views/ppts/" + pageNumber + ".html", {pageNumber: pageNumber}, function(res) {
				avalon.vmodels.ppt.content = res
				setTimeout(function() {
					done()
				}, pageNumber > 1 ? 0 : 2000)
			}, "text")
		}
	})
	avalon.state.config({
		// 动画效果
		onViewEnter: function(newNode, oldNode) {
            oldNode.style.marginLeft = "-50%"
            mmState.oldNodes.push(oldNode)
            setTimeout(function() {
                oldNode.parentNode && oldNode.parentNode.removeChild(oldNode)
            }, 1000)
        },
        // 显示加载效果
        unload: function() {
        	if(avalon.vmodels.$loading) avalon.vmodels.$loading.toggle = true
        },
    	// 隐藏loading效果
        onload: function() {
        	if(avalon.vmodels.$loading) avalon.vmodels.$loading.toggle = false
        }
	})
	avalon.router.errorback = function() {
		avalon.router.redirect("/1")
	}
	avalon.history.start({
	    hashPrefix: "",
	    fireAnchor: false
	})
})