var userModel = require('../models/userModel.js');
var blockModel = require('../models/blockModel.js');
var globalVariables = require('../globalVariables');
var transactionModel = require('../models/transactionModel.js');
var fs = require('fs');
var crypto = require('crypto');
var http = require('http');
const fetch = require("node-fetch");
const moment = require('moment'); 
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


//AUTOMATSKI BROADCAST KO DODAS BLOK
function Broadcast (req, res) {
    for(var i=0; i<globalVariables.myServersList.length; i++){

        var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;
        console.log(naslov);
        fetch('http://'+naslov+'/block/getBroadcastedBlockchain', {
            method: 'POST',
            body: JSON.stringify({
                blockchain: globalVariables.blockChain,
                cookie: req.headers.cookie
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => response.json()) //TU DOBI VRNJEN RESPONSE
        .then(function (json) { 
            if(json.result == "tvoj blockchain je daljsi, posodabljam..."){
                console.log(json);
            }
            else{
                //globalVariables.blockChain=req.body.blockchain;
                console.log("posodobil sem blockchain, ker sem imel krajsega"+json.posodobiblockchain);
                globalVariables.blockChain=json.posodobiblockchain;
            }
        })
    }
    return;
}


//RACUNANJE HASHA - sha512
function ComputeHash (data){
    var hash = crypto.createHash('sha512');
    var hashPwd = hash
        .update(data)
        .digest('hex');
   
    //console.log("hash : " + hashPwd);
    return hashPwd;
}

//VRNI ZADNJI BLOK
function getLastBlock()
{
    return globalVariables.blockChain[globalVariables.blockChain.length-1];
}

//SPREMENI TEŽAVNOST RUDARJENJA
function changeDifficulty(lastblock)
{
    //console.log(moment(lastblock.timestamp) + " - " + moment(globalVariables.blockChain[globalVariables.blockChain.length-4].timestamp));

    var diff = moment(lastblock.timestamp) - moment(globalVariables.blockChain[globalVariables.blockChain.length-4].timestamp);
    //console.log(diff); 

    if (diff > 120000) //vec kot 2min
    {
        if(globalVariables.difficulty > 2){
            globalVariables.difficulty = lastblock.difficulty-1;
            console.log("zmanjsujem!");
        }
    }
    else if (diff < 50000) //manj kot 50sec
    {
        globalVariables.difficulty = lastblock.difficulty+1;
        console.log("povecujem!");
    }
}

//RUDARJENJE
function MineBlock(difficulty,block)
{
    while (block.myHash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
        block.nonce++;
        block.myHash = ComputeHash(block.index+Date.now+block.transakcije.toString()+block.nonce+block.prevHash+block.difficulty.toString());
        block.difficulty=difficulty;
    }
}

/*  
//Rudarjenje z igranjem
var playing = false;
var tempblock;
var tmpreq;
var tmpres;
function waitblock(){
    if(playing == true) {
        tempblock.difficulty = globalVariables.difficulty;
        globalVariables.blockChain.push(tempblock);
        console.log("Dodal sem novi blok");
        module.exports.addBlock(tmpreq, tmpres);
    }
    else {
        console.log("Playing set to false.")
    }
}
*/

module.exports = {  

    showAddBlok: function (req, res) {
        res.render('addBlock');
    },
    showMyBlockchain: function (req, res) {
        res.render('myBlockchain', {
            blockChain:globalVariables.blockChain
        });
    },

    showmarketHistory: function (req, res) {
        res.render('marketHistory', {
            blockChain:globalVariables.blockChain
        });
    },

    /*stopPlaying: function (req, res) {
        playing = false;
        res.render('addBlock', {
            mining: true
        });
    },*/

    //DODAJ NOV BLOK V BLOCKCHAIN
    addBlock: async function (req, res) {

        var tokenPromise = verifyToken(req.headers.cookie); 
        tokenPromise.then(async function(result) {

            //ustvari file
            fs.appendFile(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port+'transactions.txt',"",function(err, transaction){
            });
    
            await fs.readFile(globalVariables.myServersList[0].ip+globalVariables.myServersList[0].port + 'transactions.txt', (err, data) => {
                //Doda nagrado tistemu ki je zrudaril blok.
                var transaction = new transactionModel({
                    user_me:'undefined',
                    user_other:result.name,
                    value:100
                });
                
                //vse transakcije
                if(data == undefined){
                    var transactions = (JSON.stringify(transaction)).split(";");
                }
                else{
                    console.log("DATA: ");
                    console.log(data);
                    console.log("TRANSACTION: ");
                    console.log(transaction);
                    var transactions = (JSON.stringify(transaction) + data).split(";");
                }
                //console.log(transactions);
    
                //preveri če je prvi blok
                var prevHash;
                var nonce=0;
                var lastBlock;
                if(globalVariables.blockChain.length == 0){
                    prevHash = 0;
                }
                else{
                    prevHash = globalVariables.blockChain[globalVariables.blockChain.length-1].myHash;
                    lastBlock=getLastBlock();
                    globalVariables.difficulty=lastBlock.difficulty;
                }
    
                //shrani blok
                var block = new blockModel({
                    index:globalVariables.blockChain.length,
                    transakcije:transactions,
                    prevHash:prevHash,
                    nonce:nonce,
                    timestamp:Date.now,
                    difficulty: globalVariables.difficulty,
                    myHash:ComputeHash(globalVariables.blockChain.length+transactions.toString()+prevHash+Date.now+nonce.toString()+ globalVariables.difficulty.toString())
                });
    
                //Rudarjenje z igranjem igre
                /*
                var rnd = Math.random();
                console.log(rnd.toString());
                var timeneeded = Math.floor(Math.sqrt(rnd*100000000));
                tempblock = block;
                tmpreq = req;
                tmpres = res;
                setTimeout(waitblock, timeneeded);
                */
                
                //Proof of work
                MineBlock(globalVariables.difficulty,block);
                if(globalVariables.blockChain.length > 5) {
                    changeDifficulty(getLastBlock());
                }
    
                console.log("nova tezavnost: " + globalVariables.difficulty);
                console.log("dolzina blockChaina: " + globalVariables.blockChain.length);
    
                block.difficulty = globalVariables.difficulty;
    
                globalVariables.blockChain.push(block);
                //console.log("Dodal sem novi blok");
    
                //avtomatsko broadcastaj blok
                Broadcast(req, res);
                res.render('addBlock', {
                    mining:true
                });
            });

        }, function(err) {
            res.status(302);
        })  
    },

    //ČE BROADCASTAŠ ROČNO (s klikom na gumb)
    broadcastMyBlockchain: function (req, res) {
        for(var i=0; i<globalVariables.myServersList.length; i++){

            var naslov = globalVariables.myServersList[i].ip + ':' + globalVariables.myServersList[i].port;

            fetch('http://'+naslov+'/block/getBroadcastedBlockchain', {
                method: 'POST',
                body: JSON.stringify({
                    blockchain: globalVariables.blockChain,
                    cookie: req.headers.cookie

                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
            .then(response => response.json()) //TU DOBI VRNJEN RESPONSE
            .then(function (json) { 
                if(json.result == "tvoj blockchain je daljsi, posodabljam..."){
                    console.log(json);
                }
                else{
                    //globalVariables.blockChain=req.body.blockchain;
                    console.log("posodobil sem blockchain, ker sem imel krajsega"+json.posodobiblockchain);
                    globalVariables.blockChain=json.posodobiblockchain;
                }

                res.render('addBlock');
            })
        }
    },
    //DOBI BROADCAST-AN BC
    getBroadcastedBlockchain: function (req, res) {

        var tokenPromise = verifyToken(req.body.cookie); 
        tokenPromise.then(function(result) {

            var getBC = req.body.blockchain;
            var valjavnost = true;

            //PREVERI BLOCKCHAIN ... VALIDACIJA
            //preveri ce je daljsi kot moj
            if(getBC.length >= globalVariables.blockChain.length){

                //preveri ce je veriga veljavna
                for(var i=0; i<getBC.length-1; i++){
                    if(getBC[i].myHash.toString() != getBC[i+1].prevHash.toString()){ //neveljavna veriga
                        console.log(+getBC[i].myHash+ + "->" + getBC[i+1].prevHash);
                        valjavnost = false;
                    }
                    if(getBC[i].hash == getBC[i+1].prevHash){ //neveljavna veriga
                        console.log("PRAVILNO");
                    }
                }
                if(valjavnost == true){
                    res.json({"result":"tvoj blockchain je daljsi, posodabljam..."});
                    globalVariables.blockChain = getBC; //shrani dobljeni blockchain

                    var items = [];
                    
                    for(var u=0; u<globalVariables.myUsersList.length; u++){
                        console.log(globalVariables.myUsersList[u].user.name + " nastavi denar na 0");
                        globalVariables.myUsersList[u].user.money = 0;
                    }

                    //GRE ČEZ CELOTEN BC IN DOBI TVOJO VSOTO DENARJA
                    for(var u=0; u<globalVariables.myUsersList.length; u++){
                        console.log("---------------- " + globalVariables.myUsersList[u].name + " -----------------");
                        for(var p=0; p<globalVariables.blockChain.length; p++){
                            for(var c=0;c<globalVariables.blockChain[p].transakcije.length; c++){
                                
                                var parTransac = JSON.parse(globalVariables.blockChain[p].transakcije[c]);

                                if(parTransac.user_me == globalVariables.myUsersList[u].user.name){     
                                    console.log("MYUSERNAME: " + globalVariables.myUsersList[u].user.name);

                                    globalVariables.myUsersList[u].user.money = globalVariables.myUsersList[u].user.money - parTransac.value;
                                    
                                    //MARKET ... če nakažemo denar na market (nakup itema)
                                    if(parTransac.user_other == "market"){
                                        items.push(parTransac.item_other[0]);
                                    }
                                    
                                    if(parTransac.value == null){
                                        //TRADE
                                        //dodaj novi item
                                        items.push(parTransac.item_other[0]);
                                        //zbrisi moj stari item

                                        for(var i=0; i<items.length; i++){
                                            console.log("TRADE brisi -> " + items[i][0].timestamp + " .... == ..... " + parTransac.item_me[0][0].timestamp);
                                            if(items[i][0]._id == parTransac.item_me[0][0]._id /*&& items[i][0].timestamp == parTransac.item_me[0][0].timestamp*/){
                                                console.log("BRISEM ITEM");
                                                items.splice(i, 1);
                                                break;
                                            }
                                        }
                                    }

                                    if(parTransac.value != null && parTransac.user_other != "market"){
                                        items.push(parTransac.item_other[0]);
                                        console.log("_Private seller_");
                                    }
                                }
                                else if(parTransac.user_other == globalVariables.myUsersList[u].user.name){ 
                                    console.log('pristavam denar');
                                    console.log(parTransac.user_other + " == " + globalVariables.myUsersList[u].user.name)

                                    console.log(globalVariables.myUsersList[u].user.name);
                    
                                    var user = globalVariables.myUsersList.filter(user => JSON.stringify(user.user.name) == JSON.stringify(globalVariables.myUsersList[u].user.name))[0].user;
                                    user.money = user.money + parTransac.value;
                        
                                    
                                    if(parTransac.user_me !== undefined && parTransac.item_me[0] !== undefined){

                                        //dodaj prejeti item
                                        items.push(parTransac.item_me[0]);
                                        
                                        //brisi moj item
                                        for(var i=0; i<items.length; i++){
                                            console.log("TRADE2 brisi -> " + items[i][0].timestamp + " .... == ..... " + parTransac.item_me[0][0].timestamp);
                                            if(items[i][0]._id == parTransac.item_other[0][0]._id /*&& items[i][0].timestamp == parTransac.item_other[0][0].timestamp*/){
                                                console.log("BRISEM ITEM");
                                                items.splice(i, 1);
                                                break;
                                            }
                                        }
                                    }
                                    console.log();
                                    if(parTransac.user_me !== undefined && parTransac.user_me != "undefined" && parTransac.item_me[0] === undefined){
                                        //brisi moj item
                                        for(var i=0; i<items.length; i++){
                                            console.log("NOw INDEX = " + i);
                                            console.log(""+items[i][0]._id);
                                            console.log(""+parTransac.item_other[0][0]._id);
                                            console.log(""+items[i][0].timestamp);
                                            console.log(""+parTransac.item_other[0][0].timestamp);
                                            if(items[i][0]._id == parTransac.item_other[0][0]._id /*&& items[i][0].timestamp == parTransac.item_other[0][0].timestamp*/){
                                                console.log("BRISEM ITEM");
                                                items.splice(i, 1);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if(items != []){
                            console.log("items: " + items);
                            globalVariables.myUsersList[u].user.items = [];
                            globalVariables.myUsersList[u].user.items = items;
                            items = [];
                        }
                    }

                    //Transakcije so bile dodane v blok, novo zbiranje transakcij
                    for(var u=0; u<globalVariables.myServersList.length; u++){
                        fs.writeFileSync(globalVariables.myServersList[u].ip+globalVariables.myServersList[u].port+'transactions.txt',"");
                    }

                }
                else{
                    res.json({"posodobiblockchain":globalVariables.blockChain}); //vrni mu svojo verigo
                }
            }
            else{
                res.json({"posodobiblockchain":globalVariables.blockChain}); //vrni mu svojo verigo
            }

        }, function(err) {
            res.status(302);
        })
    },

}