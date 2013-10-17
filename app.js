var express = require('express');
var app = express();
//https://github.com/zeMirco/express-upload-progress
app.use(express.static(__dirname + '/public'));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({
    keepExtensions: true,
    uploadDir: __dirname + '/tmp',
    limit: '2mb'
}));
app.use(app.router);
app.get('/', function(req, res) {
    res.sendfile('index.html');
});
app.get("/tmpl.html", function(req, res) {
    //  console.log("tmpl.html")
    if (req.xhr) {
        res.sendfile('tmpl.html');
    }
});

app.post('/', function(req, res) {
        console.log("upload successfully")
        res.send('upload successfully');
});

app.post("/moredata", function(req, res) {
    console.log("发送数据到前端")
    //  console.log("tmpl.html")
    if (req.xhr) {
        res.json({ccc: "ccc", ddd: "ddd"})
    }
})
app.listen(3000);

console.log("3000")