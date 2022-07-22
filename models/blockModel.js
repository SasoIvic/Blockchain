var mongoose = require("mongoose");

let blockSchema = mongoose.Schema({ 
    "index":{ "type":"Number", "required":true },
    "timestamp":{ "type":"Date", "default": Date.now, "required":true },
    "transakcije":{"type":"Array"},
    "myHash":{ "type":"String", "required":true },
    "prevHash":{ "type":"String", "required":true },
    "nonce":{ "type":"Number","default":0, "required":true },
    "difficulty":{ "type":"Number", "required":true },

});

var Block = mongoose.model('Block', blockSchema);
module.exports = Block;