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
app.post("/registry", function(req, res) {
    //  console.log("tmpl.html")
    if (req.xhr) {
        res.json({msg: '提交成功'});
    }
});


app.listen(3000);

console.log("3000")