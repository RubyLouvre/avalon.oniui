var express = require('express');
var app = express();
var bodyParser = require('body-parser')
//https://github.com/zeMirco/express-upload-progress
app.use(express.static(__dirname + '/public'));
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.bodyParser());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
//http://scotch.io/tutorials/javascript/learn-to-use-the-new-router-in-expressjs-4
var router = express.Router();
router.get('/', function(req, res) {
    res.sendfile('index.html');
});
app.use('/', router);
router.post("/post", function(req, res) {
    console.log(req.body)

    if (req.xhr) {
        res.json({msg: '提交成功'});
    }
});
router.get("/get", function(req, res) {
    if (req.xhr) {
        res.send("这是后端返回的数据");
    }
});
router.get("/getjson", function(req, res) {
    console.log(req.xhr)
    if (req.xhr) {
        res.send({"msg": 'json', "channel": "ajax"});
    } else {
        res.jsonp({"msg": 'json', "channel": "jsonp"});
    }

});

app.listen(3000);

console.log("3000")