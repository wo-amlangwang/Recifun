var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var session  = require('express-session');
var randomstring = require("randomstring");
var passport = require('passport');

//personal library
var database = require('./config/dbconfig');


var port = process.env.PORT || 4000;

mongoose.connect(database.url);

var app = express();
require('./config/passport')(passport);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({secret : randomstring.generate(16),  cookie:{maxAge:60000}}));
app.use(passport.initialize());
app.use(passport.session());


require('./app/router')(app,passport);


http.createServer(app).listen(port);

