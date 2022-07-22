var mongoose = require("mongoose");

let gameProfileSchema = mongoose.Schema({
    "userID":{ "type":"String", "required":true },

    "jumps":{ "type":"Number", "required":true }, //število skokov
    "slides":{ "type":"Number", "required":true }, //število slidov
    "hits":{ "type":"Number", "required":true }, //število napadov
    
    "razred":{ "type":"String", "default": "Razred_others" }, //razred
});

var GameProfile = mongoose.model('GameProfile', gameProfileSchema);
module.exports = GameProfile;