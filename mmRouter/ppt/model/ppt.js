define([], function() {
	var ppt = avalon.define("ppt", function(vm) {
		vm.curentPage = 1
		vm.totalPage = 20
		vm.content = ""

		vm.$skipArray = ["content"]

		vm.next = function() {
			if(vm.curentPage + 1 <= vm.totalPage) vm.curentPage++
		}
		vm.prev = function() {
			if(vm.curentPage - 1 > 0) vm.curentPage--
		}
	})
	ppt.$watch("curentPage", function(now) {
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
})