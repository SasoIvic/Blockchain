var express = require("express");
var router = express.Router();
var blockController = require('../controllers/blockController.js');

router.get('/addBlok', blockController.showAddBlok);
router.get('/myBlockchain', blockController.showMyBlockchain); 
router.get('/marketHistory', blockController.showmarketHistory); 

router.post("/addBlock", blockController.addBlock);
//router.post("/stopPlaying", blockController.stopPlaying);
router.post("/broadcastMyBlockchain", blockController.broadcastMyBlockchain);
router.post("/getBroadcastedBlockchain", blockController.getBroadcastedBlockchain); 




module.exports=router;