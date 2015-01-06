avalo.ajaxConverters = {//转换器，返回用户想要做的数据
    text: function(text) {
        return text || "";
    },
    xml: function(text, xml) {
        return xml !== void 0 ? xml : parseXML(text)
    },
    html: function(text) {
        return avalon.parseHTML(text)  //一个文档碎片,方便直接插入DOM树
    },
    json: function(text) {
        if (!avalon.parseJSON) {
            avalon.log("avalon.parseJSON不存在,请升级到最新版")
        }
        return avalon.parseJSON(text)
    },
    script: function(text) {
        parseJS(text)
    },
    jsonp: function() {
        var json = avalon[this.jsonpCallback];
        delete avalon[this.jsonpCallback];
        return json;
    }
}
