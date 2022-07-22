var userModel = require('../models/userModel.js');
var itemsModel = require('../models/itemsModel.js');
var offerModel = require('../models/offerModel.js');
var gameProfileModel = require('../models/gameProfileModel.js');
var globalVariables = require('../globalVariables');
var http = require('http');
var sort = require('sort');
var localStorage = require('local-storage');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');


function verifyToken(cookie){
    var cookies = [];
    if(typeof cookie !== 'undefined'){
        cookies = cookie.split("; ");
        cookies[0] = cookies[0].substr(7,cookies[0].length);
        cookies[1] = cookies[1].substr(7,cookies[1].length);
    }
    if(typeof cookies[0] !== 'undefined' && typeof cookies[1] !== 'undefined'){
        var token = cookies[0] + cookies[1];
  
        //console.log(req.token);

        return new Promise(function(resolve, reject){
            jwt.verify(token, 'secretKey',(err, authData) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(authData.user);
                }
            });
        })   
    }
}

module.exports = {

    showShop: function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {
            itemsModel.find().exec(function (err, items) {
                if (err) {
                    return res.status(500).json({ 
                        message: 'Error when getting item.',
                        error: err
                    });
                }
    
                offerModel.find().exec(function (err, offers) {
                    if (err) {
                        return res.status(500).json({ 
                            message: 'Error when getting item.',
                            error: err
                        });
                    }
    
                    gameProfileModel.findOne({userID:  result._id}, function (err, user) {
                        itemsModel.find().sort("-" + user.razred).limit(2).exec(function (err, elements) {
                            if (err) {
                                return res.status(500).json({ 
                                    message: 'Error when getting top 2 items.',
                                    error: err
                                });
                            }
                            console.log(elements);
                            return res.render('shop',{
                                offers:offers,
                                items:items,
                                suggestions:elements,
                            });
                        });
                    });
                });
            });

        }, function(err) {
            res.status(302);
        })
    },

    //USTVARI NOVO PONUDBO
    addOffer: function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {
            var itemID = req.body.itemID;

            console.log(itemID);
            
            var myaddress = globalVariables.myServersList[0].ip + ':' + globalVariables.myServersList[0].port;

            itemsModel.findOne({_id:  itemID}, function (err, item) {
                if (err) {
                    return res.status(500).json({ 
                        message: 'Error when getting item.',
                        error: err
                    });
                }

                console.log("Prodajam " + item.name);

                var offer = new offerModel({
                    naslov:myaddress,
                    user_me:result.name,
                    item_me:item,
                });
                offer.save(function (err, offer) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating offer',
                            error: err
                        });
                    }
                    return res.render('');
                });
            });

        }, function(err) {
            res.status(302);
        })
    },

    //USTVARI PRIVATE SELL OFFER
    privateSell: function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {
            var itemID = req.body.itemID;
            //cena
            var itemPrice = req.body.itemPrice;

            console.log(itemID);
            console.log(itemPrice);
            
            var myaddress = globalVariables.myServersList[0].ip + ':' + globalVariables.myServersList[0].port;

            itemsModel.findOne({_id:  itemID}, function (err, item) {
                if (err) {
                    return res.status(500).json({ 
                        message: 'Error when getting item.',
                        error: err
                    });
                }

                console.log("Prodajam " + item.name + " za ceno: " + itemPrice);

                var offer = new offerModel({
                    naslov:myaddress,
                    user_me:result.name,
                    item_me:item,
                    value:itemPrice,
                });
                offer.save(function (err, offer) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating offer',
                            error: err
                        });
                    }
                    return res.render('');
                });
            });

        }, function(err) {
            res.status(302);
        })
    },
}