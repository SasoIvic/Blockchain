var mongoose = require("mongoose");

let transactionSchema = mongoose.Schema({
    //"server_me":{ "type":"String", "required":true },
    "user_me":{ "type":"String", "required":true },
   
    "user_other":{ "type":"String", "required":true },
    //"server_other":{ "type":"String", "required":true },

    "timestamp":{ "type":"Date", "default": Date.now, "required":true }, 
    "value":{"type":"Number"},

    "item_me":{ "type":"Array" },
    "item_other":{ "type":"Array" },
});

var Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;