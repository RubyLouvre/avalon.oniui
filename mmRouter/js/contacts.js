define([], function () {
    var lastId
    var vmodel = avalon.define({
        $id: "contacts",
        // $skipArray: ["contact", "item"],
        edit: function() {
            avalon.router.go("contacts.detail.item.edit")
        },
        done: function() {
            avalon.router.go("contacts.detail.item",null, {confirmed: true})
        },
        goToRandom: function() {
            var contacts = vmodel.contacts
            var id = NaN
            while (true) {
                var index = Math.floor(Math.random() * contacts.length)
                id = contacts[index].id
                if (id !== lastId)//确保不重复
                    break
            }
            lastId = id
            avalon.router.go("contacts.detail", {contactId: id})
        },
        contacts: [],
        id: NaN,
        contact: {
        },
        item: {}
    })
    vmodel.$watch("id", function(a) {
        vmodel.contact = (vmodel.contacts.filter(function(el) {
            return  el.id == a
        }) || [{}])[0]
    })
    return avalon.controller(function($ctrl) {
        $ctrl.$vmodels = [vmodel]
        // 加载数据
        $ctrl.$onEnter = function(param, rs, rj) {
            // var pro = new Promise(function(rs) {
            //     setTimeout(function() {
            //         rs("faild")
            //     }, 1000)
            // })
            // return pro.then(function() {

            // })
            // return "faild" 
            avalon.get("./js/list.json", {}, function(res){
                setTimeout(function() {
                    // 这样写似乎更保险
                    rs(function() {
                        vmodel.contacts = eval("(" + res + ")")
                    })
                }, 10)
            }, "text")
            // here will stop
            return false
        }

        // 初始化
        $ctrl.$onRendered = function() {
        }
    })
})