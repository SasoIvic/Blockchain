var userModel = require('../models/userModel.js');
var itemModel = require('../models/itemsModel.js');
var gameProfileModel = require('../models/gameProfileModel.js');
const { generateKeyPair } = require('crypto');
var http = require('http');
const fetch = require("node-fetch");
var os = require('os');
var globalVariables = require('../globalVariables'); 
var jwt = require('jsonwebtoken');
var localStorage = require('local-storage');
var cookieParser = require('cookie-parser');


async function GenerateKeyPair() {
    return new Promise(resolve => {
        var data = [];
        generateKeyPair('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: 'top secret'
            }
        }, (err, publicKey, privateKey) => {
            if (err) {
                return res.status(500).json({
                    message: 'Error when generating key pair',
                    error: err
                });
            }
            else {
                data.push({
                    publicKey:publicKey,
                    privateKey:privateKey
                });
                //console.log(data);
                resolve(data);
            }
        });
    });
}


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

showLogin: function (req, res) { 
    res.render('login');
},
showRegister: function (req, res) { 
    res.render('register');
},
showConnect: function (req, res) {
    res.render('connect');
},
showMyUserList: function (req, res) { 
    res.render('myUserList');
},
showMyOffers: function (req, res) {
    var tokenPromise = verifyToken(req.headers.cookie);
    tokenPromise.then(function(result) {
        var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
        console.log(user.offersArr);
        res.render('myOffers', {
            offers:user.offersArr,
        });

    }, function(err) {
        res.status(302);
    })
},
showMyProfile: function (req, res) {
    
    var tokenPromise = verifyToken(req.headers.cookie);
    tokenPromise.then(function(result) {

        gameProfileModel.findOne({userID:  result._id}, function (err, profile) {

            if (err) {
                return res.status(500).json({ 
                    message: 'Error when getting item.',
                    error: err
                });
            }
            else if(!profile){
                res.render('profile', {
                    user:result,
                    jumps:0,
                    slides:0,
                    hits:0
                });
            }
            else{
                res.render('profile', {
                    user:result,
                    jumps:profile.jumps,
                    slides:profile.slides,
                    hits:profile.hits
                });
            }
        });
    }, function(err) {
        res.status(302);
    })
},
showPlayGame: function (req, res) {
    
    res.render('game');
},


//DODAJ UPORABNIKA
addUser: function (req, res) {
    //pridobi moj ip
    var networkInterfaces = Object.values(os.networkInterfaces())
    .reduce((r,a)=>{
        r = r.concat(a)
        return r;
    }, [])
    .filter(({family, address}) => {
        return family.toLowerCase().indexOf('v4') >= 0 &&
            address !== '127.0.0.1'
    })
    .map(({address}) => address);

    var ipAddresses = networkInterfaces[1];
    console.log(ipAddresses);
    globalVariables.ip = ipAddresses;

    //PRIDOBI PAR KLJUČEV
    var privateK;
    var publicK;
    GenerateKeyPair().then(function(data){
        privateK = data[0].privateKey;
        publicK = data[0].publicKey;

        //SHRANI UPORABNIKA
        var user = new userModel({
            name:req.body.name,
            privateKey:privateK,
            publicKey:publicK,
            ipAddress:ipAddresses,
            port:globalVariables.port,
            money:0,
        });

        //SHRANI VSE PODATKE ZA UPORABNIKA GLOBALNO
        globalVariables.userInfo = user;
        globalVariables.myServersList.push({
            ip:ipAddresses,
            port:globalVariables.port,
            id:user._id,
        });
        //console.log(globalVariables.userInfo)
        console.log("uporabnik shranjen");
    });

    res.render('', {
        userInfo:globalVariables.userInfo,
    });
},

register: function (req, res) {
        var usernam = req.body.username;
        userModel.findOne({name: usernam}, function (err, user) {

        if (err) {
            return res.status(500).json({ 
                message: 'Error when getting item.',
                error: err
            });
        }
        else if(user){
            console.log("User exists");
            return res.redirect('register');
        }
        else{
            console.log("User NOT exists");
            //pridobi moj ip
            var networkInterfaces = Object.values(os.networkInterfaces())
            .reduce((r,a)=>{
                r = r.concat(a)
                return r;
            }, [])
            .filter(({family, address}) => {
                return family.toLowerCase().indexOf('v4') >= 0 &&
                    address !== '127.0.0.1'
            })
            .map(({address}) => address);

            var ipAddresses = networkInterfaces[1];
            console.log(ipAddresses);

            //PRIDOBI PAR KLJUČEV
            var privateK;
            var publicK;
            GenerateKeyPair().then(function(data){
                privateK = data[0].privateKey;
                publicK = data[0].publicKey;

                //SHRANI UPORABNIKA
                var user = new userModel({
                    name:req.body.username,
                    password:req.body.password,
                    privateKey:privateK,
                    publicKey:publicK,
                    ipAddress:"undefined",
                    port:0,
                    money:0,
                });
                
                console.log("uporabnik shranjen  id:" + user._id);
                user.save(function (err, user) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating user',
                            error: err
                        });
                    }
                    //return res.status(201).json(user);
                    return res.redirect('login');
                });
            });
        }
    });
},

userLogin: function (req, res,next) {
    userModel.authenticate(req.body.username, req.body.password, function (error, user) {
    if (error || !user) {
      var err = new Error('Wrong username or password.');
      err.status = 401;
      return next(err);
    } else {
        var networkInterfaces = Object.values(os.networkInterfaces())
        .reduce((r,a)=>{
        r = r.concat(a)
        return r;
        }, [])
        .filter(({family, address}) => {
        return family.toLowerCase().indexOf('v4') >= 0 &&
            address !== '127.0.0.1'
        })
        .map(({address}) => address);

        var ipAddresses = networkInterfaces[1];
        console.log(ipAddresses);

        userModel.findOne({name: req.body.username}, function (err, user) {

            //SHRANI VSE PODATKE ZA UPORABNIKA GLOBALNO
            globalVariables.userInfo = user;
            globalVariables.myUsersList.push({
                user:user
            });

            var obstaja = false;
            for(var i=0; i<globalVariables.myServersList.length; i++){
                if(JSON.stringify(globalVariables.myServersList[i].ip) == JSON.stringify(ipAddresses) && JSON.stringify(globalVariables.myServersList[i].port) == JSON.stringify(globalVariables.port)){
                obstaja = true;
                break;
                }
            }
            if(obstaja == false){
                globalVariables.myServersList.push({
                    ip:ipAddresses,
                    port:globalVariables.port
                });
            }

            //USTVARI IN SHRANI JSON_WEB_TOKEN OD UPORANIKA
            jwt.sign({user: user}, 'secretKey', (err, token) => {
                localStorage.set('myToken', token);
                //localStorage.set('username', user.name);
                //console.log(localStorage.get('myToken'));

            // console.log(token);

                res.cookie('token1',token.substr(0,token.length/2));
                res.cookie('token2',token.substr(token.length/2,token.length));
                res.json({"success":true,"jwt":token});      
            });

            console.log("uporabnik shranjen");

        //return res.redirect('profile');
        });
    }
  })
},

//POVEŽI IN POŠLJI PODATKE TER PREJMI PODATKE V RESPONSE
connect: function (req, res) {
   console.log("==== connect me to user:  ====");
   var IP_otherUser = req.body.IP;
   var port_otherUser = req.body.port;    
   var sendData = req.body.data;
//=====================================================================//
   var naslov = IP_otherUser + ':' + port_otherUser;

   console.log("IP:" + IP_otherUser);
   console.log("PORT: " + port_otherUser);

  //NA DRUGEGA UPORABNIKA POŠLJI PODATKE (mojIp, mojPort, data)
  fetch('http://'+naslov+'/user/responseConnect', {
    method: 'POST',
    body: JSON.stringify({
        IP:globalVariables.myServersList[0].ip,
        port:globalVariables.myServersList[0].port,
        data:sendData
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
  .then(response => response.json()) //TU DOBI VRNJEN RESPONSE
  .then(function (json, err) { 
    if(err){
        res.json({"error":"error geting users"});
    }
    else{
        res.json({"success":true});      
    }
  });
},

//SPREJMI POVEZAVO
responseConnect: function (req, res) {
    console.log("==== response connection:  ====");
    console.log(req.body.IP);
    console.log(req.body.port);

    //SHRANI SI NOVEGA UPORABNIKA ČE ŠE NE OBSTAJA
    var obstaja = false;
    for(var i=0; i<globalVariables.myServersList.length; i++){
        if(globalVariables.myServersList[i].ip == req.body.ip && globalVariables.myServersList[i].port == req.body.port){
            obstaja = true;
        }
    }

    if(obstaja == false){
        globalVariables.myServersList.push({
            ip:req.body.IP,
            port:req.body.port,
        });
    }

    for(var i=0; i<globalVariables.myServersList.length; i++){
        for(var j=0; j<globalVariables.myServersList.length; j++){

            var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;

            fetch('http://'+naslov+'/user/updateUsers', {
                method: 'POST',
                body: JSON.stringify({
                    IP:globalVariables.myServersList[j].ip,
                    port:globalVariables.myServersList[j].port,
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
            .then(response => response.json()) //TU DOBI VRNJEN RESPONSE
            .then(function (json, err) { 
                if(err){
                    console.log("error pri sprejemanju povezave");
                }
            });
        }
    }

    //VRNE SUCCESS
    res.json({"success":"success"});
},

updateUsers: function (req, res) {
    console.log("==== update my users:  ====");
    var obstaja = false;
    for(var i=0; i<globalVariables.myServersList.length; i++){
        console.log(globalVariables.myServersList[i].ip + "==" + req.body.IP + "\n" + globalVariables.myServersList[i].port + "==" + req.body.port);
        if(globalVariables.myServersList[i].ip == req.body.IP && globalVariables.myServersList[i].port == req.body.port){
            obstaja = true;
        }
    }
    if(obstaja == false){
        globalVariables.myServersList.push({
            ip:req.body.IP,
            port:req.body.port,
        });

    }
    res.json({"success":"success"});
},

//DOBI VSE UPORABNIKE S KATERIMI SEM POVEZAN
getUsers: function (req, res) {
    res.render('myUserList', {
        users:globalVariables.myServersList,
    });
},

//DOBI VSE MOJE ITEME
getInventory: function (req, res) {
    var tokenPromise = verifyToken(req.headers.cookie);
    tokenPromise.then(function(result) {
        var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(result.name))[0].user;
        
        var items = user.items;
    
        return res.render('inventory', {
            items:items,
        });

    }, function(err) {
        res.status(302);
    })
},

// -------------------- PLAY GAME ------------------------ //
jump: function (req, res) {
    
    var tokenPromise = verifyToken(req.headers.cookie);
    tokenPromise.then(function(result) {

        var razred;
        var user_id = result._id;
        console.log("USER ID: " + user_id);
        gameProfileModel.findOne({userID:  user_id}, function (err, profile) {
            if (err) {
                return res.status(500).json({ 
                    message: 'Error when getting item.',
                    error: err
                });
            }
            else if(!profile){
    
                //Shrani novega
                var game = new gameProfileModel({
                    userID:user_id,
                    jumps:1,
                    slides:0,
                    hits:0,
                    razred:"Razred_others",
                });
    
                game.save(function (err, game) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating profile',
                            error: err
                        });
                    }
                    return res.render('game');
                });
            }
            else{
                var actions = profile.jumps + profile.slides + profile.hits;
                if(actions>10){
                    if(((profile.slides/actions)*100) > 75){
                        razred = "Razred_slide_75";
                    }
                    else if(((profile.jumps/actions)*100) > 75){
                        razred = "Razred_jump_75";
                    }
                    else if(((profile.hits/actions)*100) > 75){
                        razred = "Razred_hit_75";
                    }
                    else if(((profile.jumps/actions)*100) > 20 && ((profile.jumps/actions)*100) < 35 && ((profile.slides/actions)*100) > 20 && ((profile.slides/actions)*100) && ((profile.hits/actions)*100) > 20 && ((profile.hits/actions)*100)){
                        razred = "Razred_povp";
                    }
                    else{
                        razred = "Razred_others";
                    }
                }
                else{
                    razred = "Razred_others";
                }
                //update najdenega
                profile.jumps++;
                profile.razred = razred;
    
                profile.save(function (err, profile) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating profile',
                            error: err
                        });
                    }
                    return res.render('game');
                });
                
            }
        });
    }, function(err) {
        res.status(302);
    })
},
slide: function (req, res) {
    var tokenPromise = verifyToken(req.headers.cookie);
    tokenPromise.then(function(result) {
        var razred;
        user_id = result._id;
        gameProfileModel.findOne({userID:  user_id}, function (err, profile) {
            if (err) {
                return res.status(500).json({ 
                    message: 'Error when getting item.',
                    error: err
                });
            }
            else if(!profile){
                //Shrani novega
                var game = new gameProfileModel({
                    userID:user_id,
                    jumps:0,
                    slides:1,
                    hits:0,
                    razred:"Razred_others",
                });
    
                game.save(function (err, game) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating profile',
                            error: err
                        });
                    }
                    return res.render('game');
                });
            }
            else{
                var actions = profile.jumps + profile.slides + profile.hits;
                if(actions>10){
                    if(((profile.slides/actions)*100) > 75){
                        razred = "Razred_slide_75";
                    }
                    else if(((profile.jumps/actions)*100) > 75){
                        razred = "Razred_jump_75";
                    }
                    else if(((profile.hits/actions)*100) > 75){
                        razred = "Razred_hit_75";
                    }
                    else if(((profile.jumps/actions)*100) > 20 && ((profile.jumps/actions)*100) < 35 && ((profile.slides/actions)*100) > 20 && ((profile.slides/actions)*100) && ((profile.hits/actions)*100) > 20 && ((profile.hits/actions)*100)){
                        razred = "Razred_povp";
                    }
                    else{
                        razred = "Razred_others";
                    }
                }
                else{
                    razred = "Razred_others";
                }
                //update najdenega
                profile.slides++;
                profile.razred = razred;
    
                profile.save(function (err, profile) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating profile',
                            error: err
                        });
                    }
                    return res.render('game');
                });
                
            }
        }); 
    }, function(err) {
        res.status(302);
    })
},
hit: function (req, res) {
    var tokenPromise = verifyToken(req.headers.cookie);
    tokenPromise.then(function(result) {
        var razred;
    user_id = result._id;
    gameProfileModel.findOne({userID:  user_id}, function (err, profile) {
        if (err) {
            return res.status(500).json({ 
                message: 'Error when getting item.',
                error: err
            });
        }
        else if(!profile){
            //Shrani novega
            var game = new gameProfileModel({
                userID:user_id,
                jumps:0,
                slides:0,
                hits:1,
                razred:"Razred_others",
            });

            game.save(function (err, game) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when creating profile',
                        error: err
                    });
                }
                return res.render('game');
            });
        }
        else{
            var actions = profile.jumps + profile.slides + profile.hits;
            if(actions>10){
                if(((profile.slides/actions)*100) > 75){
                    razred = "Razred_slide_75";
                }
                else if(((profile.jumps/actions)*100) > 75){
                    razred = "Razred_jump_75";
                }
                else if(((profile.hits/actions)*100) > 75){
                    razred = "Razred_hit_75";
                }
                else if(((profile.jumps/actions)*100) > 20 && ((profile.jumps/actions)*100) < 35 && ((profile.slides/actions)*100) > 20 && ((profile.slides/actions)*100) && ((profile.hits/actions)*100) > 20 && ((profile.hits/actions)*100)){
                    razred = "Razred_povp";
                }
                else{
                    razred = "Razred_others";
                }
            }
            else{
                razred = "Razred_others";
            }
            //update najdenega
            profile.hits++;
            profile.razred = razred;

            profile.save(function (err, profile) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when creating profile',
                        error: err
                    });
                }
                return res.render('game');
            });     
        }
    });

    }, function(err) {
        res.status(302);
    })
},

}
