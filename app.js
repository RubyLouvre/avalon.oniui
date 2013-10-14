var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
});
app.get("/tmpl.html", function(req, res) {
    //  console.log("tmpl.html")
    if (req.xhr) {
        res.sendfile('tmpl.html');
    }
})

app.post("/moredata", function(req, res) {
    console.log("dddddddddddddd")
    //  console.log("tmpl.html")
    if (req.xhr) {
        res.json({ ccc: "ccc", ddd: "ddd" })
    }
})
app.listen(3000);
console.log("3000")