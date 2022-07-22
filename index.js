var express = require("express");
var mongoose = require("mongoose");
var createError = require('http-errors');
var freePort = require("find-free-port");
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var globalVariables = require('./globalVariables');
var cookieSession = require('cookie-session');

var userRouter = require("./routes/userRoute");
var indexRouter = require("./routes/indexRoute");
var transactionRouter =  require("./routes/transactionRoute");
var blockRouter =  require("./routes/blockRoute");
var shopRouter =  require("./routes/shopRoute");

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//GENERIRAJ PORT
function GeneratePort() {
    return new Promise(resolve => {
        freePort(3000, 3100, function(err, freeP){
            if (err) {
                return res.status(500).json({
                    message: 'Error when generating port',
                    error: err
                });
            }
            else {
                resolve(freeP);
            }
        });
    });
}

//ZAZENI SERVER NA GENERIRANEM PORTU
GeneratePort().then(function(freePort){
    port = freePort;
    globalVariables.port = freePort;
    console.log("Start on port: " + globalVariables.port);
    app.listen(port);
});

//POVEZAVA Z BAZO
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://Saso:SaBla_Is_3@cluster0-t6q1d.mongodb.net/BlockChain?retryWrites=true", {
    useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(cookieSession({
    name: 'session',
    keys: "secretKey"
}));


//SEJA
var session = require('express-session');
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false
}));


//set a cookie
/*
app.use(function (req, res, next) {
  //check if client sent cookie
  var cookie = req.cookies.cookieName;
  if (cookie === undefined)  {
    // no: set a new cookie
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
    console.log('cookie created successfully');
  } 
  else
  {
    // yes, cookie was already present 
    console.log('cookie exists', cookie);
  } 
  next(); // <-- important!
});
*/
app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/transaction", transactionRouter);
app.use("/block", blockRouter);
app.use("/shop", shopRouter);


module.exports = app;