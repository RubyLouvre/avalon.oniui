({
  
    baseUrl: "./", //找到main.js文件的目录
    paths: {
        avalon: "./avalon.shim",
        text: "./combo/text", //由于分居两个目录，因此路径都需要处理一下
        css: "./combo/css",
        "css-builder": "./combo/css-builder",
        "normalize": "./combo/normalize",
        domReady: "./combo/domReady",
    },

    //optimize: "none",//如果要调试就不压缩
    name: "main", //如果从哪一个文件开始合并
    out: "./main-built.js" //确定要生成的文件路径及名字
})
