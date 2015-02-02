var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.sendfile('demo/views/index.html');
});

/* get */
router.get('/api', function(req, res, next) {
	console.log('--------------get--------------');
	res.send(req.query);
});

/* post */
router.post('/api', function(req, res, next) {
	console.log('--------------post--------------');
	res.send(req.body);
});

/* jsonp */
router.get('/jsonp', function(req, res, next) {
	console.log('--------------jsonp--------------');
	res.jsonp(req.query);
});


module.exports = router;