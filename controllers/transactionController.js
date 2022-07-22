var transactionModel = require('../models/transactionModel.js');
var itemModel = require('../models/itemsModel.js');
var userModel = require('../models/userModel.js');
var offerModel = require('../models/offerModel.js');
var gameProfileModel = require('../models/gameProfileModel.js');
var globalVariables = require('../globalVariables');
var fs = require('fs');
var crypto = require('crypto');
var http = require('http');
const fetch = require("node-fetch"); 
var localStorage = require('local-storage');
var jwt = require('jsonwebtoken');

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

    showMakeTransactions: async function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {
            var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
            res.render('makeTransactions', {
                money:user
            });

        }, function(err) {
            res.status(302);
        })
    },

    //DODAJ TRANSAKCIJO
    addTransaction: function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {
            //ustvari mapo za transakcije
            fs.appendFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', '');

            //dobi userja
            var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;

            var filestr = fs.readFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', 'utf8');
            var transactions = filestr.split(";");
            var currmny = user.money;

            for (var k = 1; k < transactions.length; k++) {
                var parTra = JSON.parse(transactions[k]);
                if(parTra.user_me == user){
                    currmny =  currmny - parTra.value;
                }
            }
            //Preveri ce ima uporabnik dovolj denarja
            if(currmny < req.body.amount){
                console.log("nimas dovolj denarja");
                res.render('makeTransactions', {
                    money:user
                });
            }
            else{
                //SHRANI TRANSAKCIJO
                //var myaddress = globalVariables.userInfo.ipAddress + ':' + globalVariables.userInfo.port;
                //var otherUserAddress = req.body.IP + ':' + req.body.port;
                console.log("==============ADDTRANS============= ..... " + result.name);
                var transaction = new transactionModel({
                    user_me:result.name,
                    user_other:req.body.username,
                    value:req.body.amount
                });
                console.log("transakcija" + transaction);
    
                //TRANSAKCIJE ZAPIŠEMO V DATOTEKO
                fs.appendFile(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port+'transactions.txt', ";"+JSON.stringify(transaction) , function(err, transaction){
                    if(err){
                        console.log("napaka pri zapisu transakcije");
                    }
                    else{
                        console.log("transakcija uspesno zapisana");
                    }
                });
    
                //Še druge obvestim o moji transakciji
                for(var i=0; i<globalVariables.myServersList.length; i++){
    
                    var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;
    
                    fetch('http://'+naslov+'/transaction/getBroadcastedTransaction', {
                        method: 'POST',
                        body: JSON.stringify({
                            transaction: transaction
                        }),
                        headers: {
                            "Content-type": "application/json; charset=UTF-8"
                        }
                    });
                }
    
                var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
                res.render('makeTransactions', {
                    money:user
                });
            }
        }, function(err) {
            res.status(302);
        })
    },

    //ZA STRAVI KUPLJENE V MARKETU
    addTransactionBuyInMarket: function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {

            console.log("Kupujem item v marketu");
            var itemID = req.body.itemID;
            var otherUserAddress = "market";
    
            itemModel.findOne({_id:  itemID}, function (err, item) {
                
                fs.appendFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', '');
                //dobi userja
                var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
                
                var filestr = fs.readFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', 'utf8');
                var transactions = filestr.split(";");
                var currmny = user.money;
    
                for (var k = 1; k < transactions.length; k++) {
                    var parTra = JSON.parse(transactions[k]);
                    if(parTra.user_me == result.name){
                        currmny =  currmny - parTra.value;
                    }
                }
                if(currmny < item.price){
                    console.log("nimas dovolj denarja");
                }
                else{
                    var transaction = new transactionModel({
                        user_me:result.name, 
                        user_other:otherUserAddress,
                        value:item.price,
                        item_other:item,   
                    });
    
                   //console.log(transaction);
    
                    //TRANSAKCIJE ZAPIŠEMO V DATOTEKO
                    fs.appendFile(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port+'transactions.txt', ";"+JSON.stringify(transaction), function(err, transaction){
                        if(err){
                            console.log("napaka pri zapisu transakcije");
                        }
                        else{
                            console.log("transakcija uspesno zapisana");
    
                            //POVECAMO STEVILO KUPLJENIH IZDELKOV ZA UPORABNIKOVO SKUPINO IN SHRANIMO V BAZO
                            //dobi skupino uporabnika
                            //pri itemu ki ga je kupil povečaj število kupljenih izdelkov, pri določeni skupini
                            var mojrazred;
                            gameProfileModel.findOne({userID:  globalVariables.userInfo._id}, function (err, user) {
                                var actions = user.jumps + user.slides + user.hits;
                                if(actions > 10){
                                    if(((user.slides/actions)*100) > 75){
                                        mojrazred = "Razred_slide_75";
                                        item.Razred_slide_75++;
                                    }
                                    else if(((user.jumps/actions)*100) > 75){
                                        mojrazred = "Razred_jump_75";
                                        item.Razred_jump_75++;
                                    }
                                    else if(((user.hits/actions)*100) > 75){
                                        mojrazred = "Razred_hit_75";
                                        item.Razred_hit_75++;
                                    }
                                    else if(((user.jumps/actions)*100) > 20 && ((user.jumps/actions)*100) < 35 && ((user.slides/actions)*100) > 20 && ((user.slides/actions)*100) && ((user.hits/actions)*100) > 20 && ((user.hits/actions)*100)){
                                        mojrazred = "Razred_povp";
                                        item.Razred_povp++;
                                    }
                                }
                                else{
                                    mojrazred = "Razred_others";
                                    item.Razred_others++;
                                }
    
                                globalVariables.mojRazred = mojrazred;
                                console.log("Moj razred: " + globalVariables.mojRazred);
    
                                //Posodobi v bazi
                                item.save(function (err, item) {
                                    if (err) {
                                        console.log("error pri shranjevanju v bazo");
                                    }
                                });
                            });                          
                        }
                    });
    
                    //OSTALE OBVESTIM O TRANSAKCIJI
                    for(var i=0; i<globalVariables.myServersList.length; i++){
                        var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;
    
                        fetch('http://'+naslov+'/transaction/getBroadcastedTransaction', {
                            method: 'POST',
                            body: JSON.stringify({
                                transaction: transaction
                            }),
                            headers: {
                                "Content-type": "application/json; charset=UTF-8"
                            }
                        });
                    }
    
                    var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
                    res.render('makeTransactions', {
                        money:user
                    });
                }
            });

        }, function(err) {
            res.status(302);
        })
    },

    //ZA STRAVI KUPLJENE OD PRIVAT USERJA
    addTransactionBuyPrivate: function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {

            console.log("Kupujem item private");
            var itemID = req.body.itemID;
            var otherUserAddress = req.body.user;
            var price = req.body.cena;
    
            itemModel.findOne({_id: itemID}, function (err, item) {
                
                fs.appendFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', '');
                //dobi userja
                var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
                
                var filestr = fs.readFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', 'utf8');
                var transactions = filestr.split(";");
                var currmny = user.money;
    
                for (var k = 1; k < transactions.length; k++) {
                    var parTra = JSON.parse(transactions[k]);
                    if(parTra.user_me == result.name){
                        currmny =  currmny - parTra.value;
                    }
                }
                if(currmny < price){
                    console.log("nimas dovolj denarja");
                }
                else{
                    var transaction = new transactionModel({
                        user_me:result.name,
                        user_other:otherUserAddress,
                        value:price,
                        //item_me:item,
                        item_other:item,   
                    });
    
                   //console.log(transaction);
    
                    //TRANSAKCIJE ZAPIŠEMO V DATOTEKO
                    fs.appendFile(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port+'transactions.txt', ";"+JSON.stringify(transaction), function(err, transaction){
                        if(err){
                            console.log("napaka pri zapisu transakcije");
                        }
                        else{
                            console.log("transakcija uspesno zapisana");
    
                            //POVECAMO STEVILO KUPLJENIH IZDELKOV ZA UPORABNIKOVO SKUPINO IN SHRANIMO V BAZO
                            //dobi skupino uporabnika
                            //pri itemu ki ga je kupil povečaj število kupljenih izdelkov, pri določeni skupini
                            var mojrazred;
                            gameProfileModel.findOne({userID:  globalVariables.userInfo._id}, function (err, user) {
                                var actions = user.jumps + user.slides + user.hits;
                                if(actions > 10){
                                    if(((user.slides/actions)*100) > 75){
                                        mojrazred = "Razred_slide_75";
                                        item.Razred_slide_75++;
                                    }
                                    else if(((user.jumps/actions)*100) > 75){
                                        mojrazred = "Razred_jump_75";
                                        item.Razred_jump_75++;
                                    }
                                    else if(((user.hits/actions)*100) > 75){
                                        mojrazred = "Razred_hit_75";
                                        item.Razred_hit_75++;
                                    }
                                    else if(((user.jumps/actions)*100) > 20 && ((user.jumps/actions)*100) < 35 && ((user.slides/actions)*100) > 20 && ((user.slides/actions)*100) && ((user.hits/actions)*100) > 20 && ((user.hits/actions)*100)){
                                        mojrazred = "Razred_povp";
                                        item.Razred_povp++;
                                    }
                                }
                                else{
                                    mojrazred = "Razred_others";
                                    item.Razred_others++;
                                }
    
                                globalVariables.mojRazred = mojrazred;
                                console.log("Moj razred: " + globalVariables.mojRazred);
    
                                //Posodobi v bazi
                                item.save(function (err, item) {
                                    if (err) {
                                        console.log("error pri shranjevanju v bazo");
                                    }
                                });
                            });   
                            
                            //ZBRISI PONUDBO IZ BAZE
                            console.log("TIMESTAMP: ..............." + req.body.timestamp);
                            offerModel.findOneAndDelete({timestamp:req.body.timestamp}, function (err, offer) {
                                if (err) {
                                    console.log("error pri brisanju ponudbe iz baze");
                                }
                                console.log("IZBRISANA");
                            });

                        }   
                    });

                    //OSTALE OBVESTIM O TRANSAKCIJI
                    for(var i=0; i<globalVariables.myServersList.length; i++){
                        var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;
    
                        fetch('http://'+naslov+'/transaction/getBroadcastedTransaction', {
                            method: 'POST',
                            body: JSON.stringify({
                                transaction: transaction
                            }),
                            headers: {
                                "Content-type": "application/json; charset=UTF-8"
                            }
                        });
                    }
    
                    var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
                    res.render('makeTransactions', {
                        money:user
                    });
                }
            });

        }, function(err) {
            res.status(302);
        })
    },

    //DODAJ MENJAVO DVEH ITEMOV K TRANSAKCIJAM
    addTransactionTrade: function (req, res) {
        console.log("trade transaction");
        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {
            console.log("trade transaction");

        var itemMe = req.body.itemMe;
        var itemOther = req.body.itemOther; 
        var userMe = req.body.userMe;
        var user_Other = req.body.userOther;

        itemModel.findOne({_id:  itemMe}, function (err, item_me) {
            itemModel.findOne({_id:  itemOther}, function (err, item_other) {

                console.log(userMe);
                console.log(item_me);
                console.log(user_Other);
                console.log(item_other);


                fs.appendFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', '');

                //dobi userja
                var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;

                var filestr = fs.readFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', 'utf8');
                var transactions = filestr.split(";");
    
                if(item_me && item_other) {
                    var transaction = new transactionModel({
                        user_me:userMe,
                        user_other:user_Other,
                        item_me:item_me,
                        item_other:item_other, 
                    });
    
                   console.log(transaction);
    
                    //TRANSAKCIJE ZAPIŠEMO V DATOTEKO
                    fs.appendFile(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port +'transactions.txt', ";"+JSON.stringify(transaction), function(err, transaction){
                        if(err){
                            console.log("napaka pri zapisu transakcije");
                        }
                        else{
                            console.log("transakcija uspesno zapisana");
                        }
                    });


                    //ZBRIŠI PONUDBO IZ ARRAYA PONUDB   offersArr
                    for(var i=0; i<user.offersArr.length; i++){
                        console.log(user.offersArr[0][i].item_me[0][0] + " ............. " + item_me);
                        if(JSON.stringify(user.offersArr[0][i].item_me[0][0]) == JSON.stringify(item_me)){
                            user.offersArr.splice(i, 1);
                            console.log("ponudba zbrisana");
                            i=-1;
                            //break;
                        }
                    }

                    //ZBRISI PONUDBO IZ BAZE
                    offerModel.find().exec( function (err, offer) {
                        if(offer[0].user_me == result.name && JSON.stringify(offer[0].item_me[0][0] == JSON.stringify(item_me))){
                            console.log("brisem ponudbo iz baze");

                            offerModel.findOneAndDelete({_id:offer[0]._id}, function (err, offer) {
                                if (err) {
                                    console.log("error pri brisanju ponudbe iz baze");
                                }
                                console.log("IZBRISANA");
                            });
                        } 
                    });

    
                    //OSTALE OBVESTIM O TRANSAKCIJI
                    for(var i=0; i<globalVariables.myServersList.length; i++){
                        var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;
                        console.log("OBVESCAM O TRANSAKCIJI ... TRADE ...... myUserList =================>>");
                        console.log(naslov);
    
                        fetch('http://'+naslov+'/transaction/getBroadcastedTransaction', {
                            method: 'POST',
                            body: JSON.stringify({
                                transaction: transaction
                            }),
                            headers: {
                                "Content-type": "application/json; charset=UTF-8"
                            }
                        })
                        .then(response => response.json()) //TU DOBI VRNJEN RESPONSE
                        .then(function (json, err) { 
                            if(err){
                                console.log("error at response transaction costroller 294");
                            }
                        });
                        
                    }

                    var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
                    res.render('makeTransactions', {
                        money:user
                    });
                }
            });
        });


        }, function(err) {
            res.status(302);
        })
    },

    //ODDAJ PONUDBO ZA DOLOČENI OFFER
    tradeOffer: function (req, res) { 
        var tokenPromise = verifyToken(req.headers.cookie);
        tokenPromise.then(function(result) {
            //offer
            var itemID = req.body.item;
            var userName = req.body.user;
            var naslov = req.body.naslov;
            //moja ponudba
            var myItemID = req.body.tradeItemID;
            var myName = result.name;

            var timestamp = req.body.timestamp;

            itemModel.findOne({_id:  myItemID}, function (err, myItem) {
                itemModel.findOne({_id:  itemID}, function (err, otherItem) {
                    //console.log("other item ... " + otherItem);
                    //console.log("my item ... " + myItem);

                    //pošlji mojo ponudbo za izbrani offer
                    if(myItem && otherItem){

                        fetch('http://'+naslov+'/transaction/receiveTradeOffers', {
                            method: 'POST',
                            body: JSON.stringify({
                                myName: myName,
                                myItem: myItem,
                                userName: userName,
                                userItem: otherItem,
                                timestamp: timestamp
                            }),
                            headers: {
                                "Content-type": "application/json; charset=UTF-8"
                            }
                        })
                        .then(response => response.json()) //TU DOBI VRNJEN RESPONSE
                        .then(function (json, err) { 
                            if(err){
                                res.json({"error":"error"});
                            }
                            console.log("Success");
                            res.render('');
                        });
                    }
                });
            });     
        }, function(err) {
            res.status(302);
        })
    },

    //SPREJMI PONUDBO ZA MOJ OFFER
    receiveTradeOffers: function (req, res) {
        //Shrani ponudbo v array ponudb
        var offer = new offerModel({
            user_me:req.body.userName,
            user_other:req.body.myName,
            item_me:req.body.userItem,
            item_other:req.body.myItem,
            timestamp:req.body.timestamp
        });

        //najdi uporabnika ki je dobil ponudbo
        var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(req.body.userName))[0].user;
        //dodaj mu ponudbo
        user.offersArr.push(offer);
        
        console.log("Ponudba shranjena v offerArr");

        res.json({"success":"success"});
    },

    //DOBI BROADCASTANE TRANSAKCIJE
    getBroadcastedTransaction: function (req, res) {

            //if(req.body.user_me == globalVariables.myUsersList[u].user.name){
                fs.appendFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', '');

                //Preveri če že ima to transakcijo
                var getT = req.body.transaction;
                var exists = false;
                var filestr = fs.readFileSync(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', 'utf8');
                console.log(filestr);
                var transactions = filestr.split(";");
                for (var k = 1; k < transactions.length; k++) {
                    var parTra = JSON.parse(transactions[k]);

                    if (getT.timestamp == parTra.timestamp) {
                        exists = true;
                        break;
                    }
                }

                if (exists == false) {  //če je nima, jo doda
                    fs.appendFile(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', ";" + JSON.stringify(getT), function (err, transaction) {
                        if (err) {
                            console.log("napaka pri zapisu transakcije");
                        } else {
                            console.log("transakcija uspesno zapisana");
                        }
                    });

                    //transakcijo posreduje naprej drugim s katerimi je povezan
                    for (var i = 1; i < globalVariables.myServersList.length; i++) {

                        var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;
                        console.log(naslov);

                        fetch('http://' + naslov + '/transaction/getBroadcastedTransaction', {
                            method: 'POST',
                            body: JSON.stringify({
                                transaction: getT
                            }),
                            headers: {
                                "Content-type": "application/json; charset=UTF-8"
                            }
                        })
                        .then(response => response.json()) //TU DOBI VRNJEN RESPONSE
                        .then(function (json, err) { 
                            if(err){
                                console.log("error");
                            }
                        });
                    }
                }
            //}
        //VRNE SUCCESS
        res.json({"success":"success"});
    }
}