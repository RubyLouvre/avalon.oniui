define(["avalon"], function(avalon) {
    return {
        views: {
            "@contacts.detail": {
                templateUrl: "contacts.detail.item.edit.html",
                controller: function($ctrl) {
                    // 视图被关闭时候回调
                    $ctrl.$onBeforeUnload = function() {
                        return confirm("还没有保存呢，确认退出?")
                    }
                }
            },
            "hint@": {
                template: "当前状态是contacts.detail.item.edit"
            }
        }
    }    
})