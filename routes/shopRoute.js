var express = require("express");
var router = express.Router();
var shopController = require('../controllers/shopController.js');

router.get('/', shopController.showShop);

router.post('/addOffer', shopController.addOffer);
router.post('/privateSell', shopController.privateSell);



module.exports=router;