var express = require("express");
var router = express.Router();
var userController = require('../controllers/userController.js');
var localStorage = require('local-storage');
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');


function verifyToken(req, res, next){
    var cookies = [];
    if(typeof req.headers.cookie !== 'undefined'){
        cookies = req.headers.cookie.split("; ");
        cookies[0] = cookies[0].substr(7,cookies[0].length);
        cookies[1] = cookies[1].substr(7,cookies[1].length);
    }
    if(typeof cookies[0] !== 'undefined' && typeof cookies[1] !== 'undefined'){
        req.token = cookies[0] + cookies[1];
  
        //console.log(req.token);

        jwt.verify(req.token, 'secretKey',(err, authData) => {
            if(err){
                res.render("login");
            }
            else{
                //console.log(authData.user._id);
                next();
            }
        });
    }
    else{
        res.render("login");
    }
}

router.get('/login', userController.showLogin); 
router.get('/register', userController.showRegister); 
router.get('/connect', verifyToken, userController.showConnect);
router.get('/myUserList', verifyToken, userController.getUsers);
router.get('/inventory', verifyToken, userController.getInventory);
router.get('/myOffers', verifyToken, userController.showMyOffers); 
router.get('/profile', verifyToken, userController.showMyProfile);
router.get("/playGame", verifyToken, userController.showPlayGame);

router.post("/addUser", userController.addUser);
router.post("/login", userController.userLogin);
router.post("/register", userController.register);
router.post("/connect", verifyToken, userController.connect);
router.post("/responseConnect", userController.responseConnect);
router.post("/updateUsers", userController.updateUsers);

router.post("/jump", verifyToken, userController.jump);
router.post("/slide", verifyToken, userController.slide);
router.post("/hit", verifyToken, userController.hit);


module.exports=router;