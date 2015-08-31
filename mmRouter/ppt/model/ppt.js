define([], function() {
	var dict = ["", 1, 2, 3, "mmRouter", "mmHistory", 4, "mmState", 6, 7, 8, 9, "thx"]
	var dict = ["", "home", "work", 2, 3, "mmRouter", "mmHistory", 4, "mmState", 6, 7, 8, 9, "thx", "tree", "tree.thx", "velocity", "velocity.thx", "weAPI", "oniui.tool", "qa"]
	var ppt = avalon.define("ppt", function(vm) {
		vm.dict = dict
		vm.curentPage = vm.firstPage
		vm._curentPage = vm.firstPage
		vm.totalPage = dict.length - 1
		vm.content = ""

		vm.$skipArray = ["content"]

		vm.next = function() {
			if(vm._curentPage + 1 <= vm.totalPage) {
				vm._curentPage++
			}
		}
		vm.prev = function() {
			if(vm._curentPage - 1 > 0) vm._curentPage--
		}
		vm.getHTML = function(pageNumber) {
			return dict[pageNumber] || "qa"
		}
	})
	ppt.$watch("_curentPage", function(now) {
		avalon.router.navigate("/" + now)
	})
	avalon.bind(window, "keyup", function(e) {
		var c = e.keyCode
		// console.log(c)
		// 39, 40 next
		// 37, 38 prev
		if(c in {39: 1, 40: 1}) {
			ppt.next()
		} else if(c in {37: 1, 38: 1}) {
			ppt.prev()
		}

	})
	return ppt
})