//合并脚本
var fs = require("fs")
var path = require("path") //不同的操作系统，其 文件目录 分割符是不一样的，不能直接使用 + "/"来实现
var curDir = process.cwd() //当前目录
var otherDir = curDir.replace(/mmRequest([\/\\]src)/, "mmRequest")

var Buffer = require('buffer').Buffer


function comboFiles(files, writer, lastCallback) {

    return function callback() {
        var fileName = files.shift()

        if (!fileName) {
            lastCallback()
            return
        }

        var filePath = path.join(curDir, fileName + ".js")
        var readable = fs.createReadStream(filePath)

        readable.pipe(writer, {end: false})
        readable.on("readable", function() {
            writer.write("\n")
            console.log("add " + filePath)
        })
        readable.on("end", callback)
    }
}

//mmRequest.js 所需要合并的子文件
var compatibleFiles = [
    "00 inter", "01 variable", "02 xhr.old", "03 parseXML", "04 ajaxExtend",
    "05 _methods", "06 methods", "07 avalon.ajaxConverters", "08 avalon.param",
     "09 avalon.unparam", "10 avalon.serialize",//"08 avalon.param.shim",
    "11 avalon.ajaxTransports.old", "12 outer"
]
//avalon.modern.js 所需要合并的子文件
var modernFiles = compatibleFiles.concat()
// modernFiles.splice(modernFiles.indexOf("08 avalon.param.shim"), 1)
modernFiles[modernFiles.indexOf("02 xhr.old")] = "02 xhr.modern"
modernFiles[modernFiles.indexOf("03 parseXML")] = "03 parseXML.modern"
modernFiles[modernFiles.indexOf("11 avalon.ajaxTransports.old")] = "11 avalon.ajaxTransports.modern"


//开始合并mmRequest.js
new function() {
    console.log(path.join(otherDir, 'public/mmRequest.js'))
    var writable = fs.createWriteStream(path.join(otherDir, 'public/mmRequest.js'), {
        encoding: "utf8"
    });
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboCompatibleFiles = comboFiles(compatibleFiles, writable, function() {
        console.log("合并mmRequest.js成功")
    })
    comboCompatibleFiles()
}

//开始合并mmRequest.modern.js
new function() {
    var writable = fs.createWriteStream(path.join(otherDir, 'public/mmRequest.modern.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboModernFiles = comboFiles(modernFiles, writable, function() {
        console.log("合并mmRequest.modern.js成功")
    })
    comboModernFiles()
}

