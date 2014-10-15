(function() {
	var hashchange = 'hashchange',  DOC = document,  documentMode = DOC.documentMode,supportHashChange = ('on' + hashchange in window) && ( documentMode === void 0 || documentMode > 7 );
	function pageModel() {
		return avalon.vmodels["pages"]
	}
	if(supportHashChange) {
		avalon.bind(window, "hashchange", function() {
			pageModel().activeIndex = pageModel().computeActiveIndex()
		})
	}
})();