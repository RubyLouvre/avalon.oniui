define(["mmRouter/mmState", 
		"mmRouter/ppt/model/ppt", 
		"mmRequest/mmRequest", 
		"loading/avalon.loading", 
		"mmRouter/ppt/highlight.pack", 
		"mmRouter/ppt/markdown.min"], function () {
	avalon.state("ppt", {
		url: "/:pageNumber",
		controller: "ppt",
		views: {
			"": {
				templateUrl: "ppt/views/tpl.html"
			}
		},
		onChange: function(pageNumber) {
			if(pageNumber === "") return avalon.router.redirect("/1")
			var done = this.async(),
				ppt = avalon.vmodels.ppt
			if(ppt._curentPage != pageNumber) ppt._curentPage = pageNumber
			avalon.get("ppt/views/ppts/" + ppt.getHTML(pageNumber) + ".html", {pageNumber: pageNumber}, function(res) {
				ppt.content = markdown.toHTML(res)
				setTimeout(function() {
					done()
				}, pageNumber > 1 ? 0 : mmState.prevState ? 0 : 2000)
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
        unload: function() {
        	avalon.vmodels.ppt.content = ""
        },
        // 显示加载效果
        begin: function() {
        	if(avalon.vmodels.$loading) avalon.vmodels.$loading.toggle = true
        },
    	// 隐藏loading效果
        onload: function() {
        	if(avalon.vmodels.$loading) avalon.vmodels.$loading.toggle = false
        	avalon.vmodels.ppt.curentPage = avalon.vmodels.ppt._curentPage
        	// 语法高亮
        	// only in modern browser
        	if(document.querySelectorAll) {
        		avalon.each(document.querySelectorAll(".oni-mmRouter-enter"), function(i, node) {
        			var $node = avalon(node)
        			if($node.hasClass("oni-mmRouter-leave")) return
		        	var h2 = node.getElementsByTagName("h2")[0] || node.getElementsByTagName("h1")[0]
		        	if(h2) document.title = h2.innerHTML
        			avalon.each(node.querySelectorAll("code"), function(i, code) {
        				if(code.textContent.match(/<[^>]+>/g)) {
        					code.className = "lang-html"
        				} else {
        					// code.className = "lang-javascript"
        				}
        				hljs.highlightBlock(code)
        			})
        		})
        	}
        }
	})
	avalon.router.errorback = function() {
		// avalon.router.redirect("/1")
	}
	avalon.history.start({
	    hashPrefix: "",
	    fireAnchor: false
	})
})