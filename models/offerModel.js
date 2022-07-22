var mongoose = require("mongoose");

let offerSchema = mongoose.Schema({
    "user_me":{ "type":"String", "required":true },
    "user_other":{ "type":"String" }, 
    "timestamp":{ "type":"String", "default": Date.now, "required":true }, 
    "value":{"type":"Number"},

    "item_me":{ "type":"Array" },
    "item_other":{ "type":"Array" },
    "naslov":{ "type":"String"},
});

var Offer = mongoose.model('Offer', offerSchema);
module.exports = Offer;