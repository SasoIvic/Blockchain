var express = require("express");
var router = express.Router();
var transactionController = require('../controllers/transactionController.js');

router.get("/makeTransactions", transactionController.showMakeTransactions);

router.post("/addTransaction", transactionController.addTransaction);
router.post("/buy_Market", transactionController.addTransactionBuyInMarket);
router.post("/buy_Private", transactionController.addTransactionBuyPrivate);
router.post("/acceptOffer", transactionController.addTransactionTrade);

router.post("/trade", transactionController.tradeOffer);
router.post("/receiveTradeOffers", transactionController.receiveTradeOffers);

router.post("/getBroadcastedTransaction", transactionController.getBroadcastedTransaction);




module.exports=router;