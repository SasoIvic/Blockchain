var mongoose = require("mongoose");

let itemsSchema = mongoose.Schema({ 
    "name":{ "type":"String", "required":true },
    "timestamp":{ "type":"Date", "default": Date.now, "required":true },
    "numberOfItems":{ "type":"Number", "required":true },
    "type":{ "type":"string", "required":true },
    "price":{ "type":"Number", "required":true },
    "power":{ "type":"Number", "required":true },
    "speed":{ "type":"Number", "required":true },
    "image":{ "type":"String", "required":true },
    "special":{ "type":"Number" },

    "Razred_slide_75":{"type":"Number", "required":true },
    "Razred_jump_75":{"type":"Number", "required":true },
    "Razred_hit_75":{"type":"Number", "required":true },
    "Razred_povp":{"type":"Number", "required":true },
    "Razred_others":{"type":"Number", "required":true },
});

var Items = mongoose.model('Items', itemsSchema);
module.exports = Items;