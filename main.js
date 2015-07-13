
require([
    "avalon",
    "domReady!",
    "avalon.tab",
    "avalon.pager",
    "avalon.datepicker",
], function (avalon) {
    avalon.log("domReady完成1")
   var vm = avalon.define({$id: "demo"})
    avalon.scan(document.body, vm);
    //你们的业务代码
})
