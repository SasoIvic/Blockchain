var express = require('express');
var globalVariables = require('../globalVariables');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

module.exports = router;
