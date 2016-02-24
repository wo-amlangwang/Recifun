// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// load up the user model
var User = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth');

// expose this function to our app using module.exports
module.exports = function (passport) {

	// passport session setup ===============================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialized the user for the session
	passport.serializeUser(function (user, callback) {
		callback(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function (id, callback) {
		User.findById(id, function (err, user) {
			callback(err, user);
		});
	});


	// Local signup ========================================
	// we are using named strategies since we have one for login and one fore signup
	// by default, if there was no name, it would just be called 'local'

	passport.use('local-signup', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true // allow us to pass back the entire request to the callback
	},
	function (req, email, password, callback) {

		// asynchronous
		// User.findOne wont fire unless data is sent back
		process.nextTick(function () {



			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exists
			User.findOne({ 'local.email': email }, function (err, user) {

				// if there are any errors, return the error
				if (err)
					return callback(err);

				// check to see if theres already a user with that email
				if (user) {
					return callback(null, false, req.flash('signupMessage', 'That email is already takem'));
				} else {

					// if there is no user with that email
					// create the user
					var newUser = new User();

					// set the user's local credentials
					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);
				
					// save the user
					newUser.save(function (err) {
						if (err)
							throw err;
						return callback(null, newUser);
					});
				}

			});

		});

	}));


	// Local login ========================================
	// we are using named strategies since we have one for login and one fore signup
	// by default, if there was no name, it would just be called 'local'
	
	passport.use('local-login', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true // allow us to pass back the entire request to the callback
	},
	function (req, email, password, callback) { // callback with email and password from our form


		if (!req.user) {

			// find a user whose email is the same as the forms email
	        // we are checking to see if the user trying to login already exists
	        User.findOne({ 'local.email': email }, function (err, user) {

	        	// if there are any errors, return the error before anything else
	        	if (err) 
	        		return callback(err);

	        	// if no user is found, reutrn the message
	        	if (!user) 
	        		return callback(null, false, req.flash('loginMessage', 'No user found.'));
	        		// req.flash is the way to set flashdata using connect-flash

	        	// if the user is found but the password is wrong
	        	if (!user.validPassword(password))
	        		return callback(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
	        		// create the loginMessage and save it to session as flashdata

	        	// all is well, return successful user
	        	return callback(null, user);
	        });

    	} else {
    		var user = req.user;

    		user.local.email = email;
			user.local.password = user.generateHash(password);

			user.save(function (err) {
	        	if (err) 
	        		throw err;

	        	// if successful, return the new user
	        	return callback(null, user);
            });
    	}

	}));


	// Facebook Login =========================================

	passport.use(new FacebookStrategy({
		// pull in our app id and secret from our auth.js file
		clientID: configAuth.facebookAuth.clientID,
		clientSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL,
		profileFields: ['email', 'displayName', 'photos', 'gender', 'birthday'],
		passReqToCallback: true // allow us to pass in the req from our route ( let us check if a user is logged in or not)
	},

	// facebook will send back the token and profile
	function (req, token, refreshToken, profile, callback) {

		// asynchronous
		process.nextTick(function () {

			if (!req.user) {

				// find the user in the database based on their facebook id
				User.findOne({ 'facebook.id': profile.id }, function (err, user) {

					// if there is an error, stop everything and return that
					// ie an error connecting to the database
					if (err) 
						return callback(err);

					// if the user is found, then log them in
					if (user) {

						// update info every time login
						user.facebook.id = profile.id; // set the users facebook id                   
	                    user.facebook.token = token; // we will save the token that facebook provides to the user                    
	                    user.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
	                    user.facebook.name = profile.displayName;
	                    user.facebook.picture = profile.photos[0].value;
	                    user.facebook.gender = profile.gender;

	                    user.save(function (err) {
	                    	if (err) 
	                    		throw err;

	                    	// if successful, return the new user
	                    	return callback(null, user);
	                    });
						// return callback(null, user); // user found, return that user
					} else {
						// if there is no user found with that facebook id, create them
						var newUser = new User();

						// set all of the facebook information in our user model
						newUser.facebook.id = profile.id; // set the users facebook id                   
	                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
	                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
	                    newUser.facebook.name = profile.displayName;
	                    newUser.facebook.picture = profile.photos[0].value;
	                    newUser.facebook.gender = profile.gender;

	                    // save our user to the database
	                    newUser.save(function (err) {
	                    	if (err) 
	                    		throw err;

	                    	// if successful, return the new user
	                    	return callback(null, newUser);
	                    });
					}

				});

			} else {
				// user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session

                // update the current users facebook credentials
                user.facebook.id = profile.id; // set the users facebook id                   
                user.facebook.token = token; // we will save the token that facebook provides to the user                    
                user.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                user.facebook.name = profile.displayName;
                user.facebook.picture = profile.photos[0].value;
                user.facebook.gender = profile.gender;

                // save the user
                user.save(function(err) {
                    if (err)
                        throw err;
                    return callback(null, user);
                });
			}		

		});
	}));

	// Twitter Login ========================================

	passport.use(new TwitterStrategy({
		// pull in our app id and secret from our auth.js file
		consumerKey: configAuth.twitterAuth.consumerKey,
		consumerSecret: configAuth.twitterAuth.consumerSecret,
		callbackURL     : configAuth.twitterAuth.callbackURL,
		passReqToCallback: true // allow us to pass in the req from our route ( let us check if a user is logged in or not)
	},

	// facebook will send back the token and profile
	function (req, token, tokenSecret, profile, callback) {

		// asynchronous
		process.nextTick(function () {

			if (!req.user) {

				// find the user in the database based on their facebook id
				User.findOne({ 'twitter.id': profile.id }, function (err, user) {

					// if there is an error, stop everything and return that
					// ie an error connecting to the database
					if (err) 
						return callback(err);

					// if the user is found, then log them in
					if (user) {
						// update info every time login
						user.twitter.id          = profile.id;
	                    user.twitter.token       = token;
	                    user.twitter.username    = profile.username;
	                    user.twitter.displayName = profile.displayName;
	                    user.twitter.picture = profile.photos[0].value;


	                    user.save(function (err) {
	                    	if (err) 
	                    		throw err;

	                    	// if successful, return the new user
	                    	return callback(null, user);
	                    });
						// return callback(null, user); // user found, return that user
					} else {
						// if there is no user found with that facebook id, create them
						var newUser = new User();

						// set all of the user data that we need
	                    newUser.twitter.id          = profile.id;
	                    newUser.twitter.token       = token;
	                    newUser.twitter.username    = profile.username;
	                    newUser.twitter.displayName = profile.displayName;
	                    newUser.twitter.picture = profile.photos[0].value;


	                    // save our user to the database
	                    newUser.save(function (err) {
	                    	if (err) 
	                    		throw err;

	                    	// if successful, return the new user
	                    	return callback(null, newUser);
	                    });
					}

				});
			} else {

				// user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session

				// update info every time login
				user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;
                user.twitter.picture = profile.photos[0].value;


                user.save(function (err) {
                	if (err) 
                		throw err;

                	// if successful, return the new user
                	return callback(null, user);
                });
			}
		});
	}));


	// Google Login ==========================================
	passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback: true // allow us to pass in the req from our route ( let us check if a user is logged in or not)
    },
    function (req, token, refreshToken, profile, callback) {
 
        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {

        	if (!req.user) {

	            // try to find the user based on their google id
	            User.findOne({ 'google.id' : profile.id }, function(err, user) {
	                if (err)
	                    return callback(err);

	                if (user) {

	                	user.google.id    = profile.id;
	                    user.google.token = token;
	                    user.google.name  = profile.displayName;
	                    user.google.email = profile.emails[0].value; // pull the first email

	                    user.save(function (err) {
	                    	if (err) 
	                    		throw err;

	                    	// if successful, return the new user
	                    	return callback(null, user);
	                    });

	                    // if a user is found, log them in
	                    // return done(null, user);
	                } else {
	                    // if the user isnt in our database, create a new user
	                    var newUser = new User();

	                    // set all of the relevant information
	                    newUser.google.id    = profile.id;
	                    newUser.google.token = token;
	                    newUser.google.name  = profile.displayName;
	                    newUser.google.email = profile.emails[0].value; // pull the first email

	                    // save the user
	                    newUser.save(function(err) {
	                        if (err)
	                            throw err;
	                        return callback(null, newUser);
	                    });
	                }
	            });
			} else {

				// user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session

				user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = profile.emails[0].value; // pull the first email

                user.save(function (err) {
                	if (err) 
                		throw err;

                	// if successful, return the new user
                	return callback(null, user);
                });

			}
        });

    }));

};