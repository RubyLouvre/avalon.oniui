function parseXML(data, xml, tmp) {
    try {
        var mode = document.documentMode
        if (window.DOMParser && (!mode || mode > 8)) { // Standard
            tmp = new DOMParser()
            xml = tmp.parseFromString(data, "text/xml")
        } else { // IE
            xml = new ActiveXObject("Microsoft.XMLDOM")  //"Microsoft.XMLDOM"
            xml.async = "false";
            xml.loadXML(data)
        }
    } catch (e) {
        xml = void  0
    }
    if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
        avalon.error("Invalid XML: " + data)
    }
    return xml
}
