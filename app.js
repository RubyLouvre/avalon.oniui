var express = require('express');
var app = express();
//https://github.com/zeMirco/express-upload-progress
app.use(express.static(__dirname + '/public'));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(app.router);
app.get('/', function(req, res) {
    res.sendfile('index.html');
});
app.post("/post", function(req, res) {
    console.log(req.body)

    if (req.xhr) {
        res.json({msg: '提交成功'});
    }
});
app.get("/get", function(req, res) {
    if (req.xhr) {
        res.send("这是后端返回的数据");
    }
});
app.get("/getjson", function(req, res) {
    console.log(req.xhr)
    if (req.xhr) {
        res.send({"msg": 'json', "channel": "ajax"});
    } else {
        res.jsonp({"msg": 'json', "channel": "jsonp"});
    }

});

app.listen(3000);

console.log("3000")