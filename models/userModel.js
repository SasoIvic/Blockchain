var mongoose = require("mongoose");
var bcrypt = require('bcrypt');

let userSchema = mongoose.Schema({
    "name":{ "type":"String", "required":true },
    "password":{ "type":"String", "required":true },
    "privateKey":{ "type":"String", "required":true },
    "publicKey":{ "type":"String", "required":true },
    "ipAddress":{ "type":"String", "required":true },
    "port":{ "type":"Number", "required":true },
    "money":{ "type":"Number", "required":true },
    "items":{ "type":"Array" },
    "offersArr":{ "type":"Array" },
});

//authenticate input against database
userSchema.statics.authenticate = function (name, password, callback) {
    User.findOne({ name: name })
      .exec(function (err, user) {
        if (err) {
          return callback(err)
        } else if (!user) {
          var err = new Error('User not found.');
          err.status = 401;
          return callback(err);
        }
        bcrypt.compare(password, user.password, function (err, result) {
          if (result === true) {
            return callback(null, user);
          } else {
            return callback();
          }
        })
      });
  }
  
  //hashing a password before saving it to the database
  userSchema.pre('save', function (next) {
    var user = this;
      bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      })
  });

var User = mongoose.model('User', userSchema);
module.exports = User;