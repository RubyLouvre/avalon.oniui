function parseXML(data, xml, tmp) {
    var xml;
    if (!data || typeof data !== "string") {
        return null
    }
    // Support: IE9
    try {
        xml = (new DOMParser()).parseFromString(data, "text/xml")
    } catch (e) {
        xml = undefined
    }

    if (!xml || xml.getElementsByTagName("parsererror").length) {
        avalon.error("Invalid XML: " + data)
    }
    return xml
}

