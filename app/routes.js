// app/routes

var User = require('./models/user.js');
var Recipe = require('./models/recipe.js');
var Step = require('./models/step.js');
var Comment = require('./models/comment.js');

module.exports = function(app, passport) {

	// Home page (with login links) ==========================
	app.get('/', function (req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// Login Page ===========================================
	app.get('/login', function (req, res) {
		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	//process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile', // redirect to the secure profile section
		failureRedirect: '/login', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));

	// Signup page ==========================================
	app.get('/signup', function (req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/profile', // redirect to the secure profile section
		failureRedirect: '/signup', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
 	}));
	
	// profile page =========================================
	app.get('/profile', isLoggedIn, function (req, res) {
		return res.json(req.user);
	});


	// Facebook routes ======================================
	// route for facebook authentication and login
	app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect: '/profile',
		failureRedirect: '/'
	}));


	// Twitter routes =======================================
	app.get('/auth/twitter', passport.authenticate('twitter'));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/profile',
            failureRedirect : '/'
        })
    );

    // Google routes =========================================
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }))
    ;


	// logout ================================================
	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});


	// Authorize (already logged in / connecting other social account)

	// locally connect ==================================================
	app.get('/connect/local', function (req, res) {
		res.render('connect-local.ejs', { message: req.flash('loginMessage') });
	});
	app.post('/connect/local', passport.authenticate('local-login', {
		successRedirect: '/profile', // redirect to the secure profile section
		failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));

	// facebook connect ===============================================
	// send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        })
    ); 

    // twitter connect =======================================
    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
        passport.authorize('twitter', {
        successRedirect : '/profile',
        failureRedirect : '/'
    }));


    // google connect =================================================   
    // send to google to do the authentication
	app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

	// the callback after google has authorized the user
	app.get('/connect/google/callback',
	    passport.authorize('google', {
	        successRedirect : '/profile',
	        failureRedirect : '/'
	    })
    );



	// unlink accounts ======================================

	// local -----------------------------------
    app.get('/unlink/local', function(req, res) {

        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
           res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
           res.redirect('/profile');
        });
    });


	

	// GET /create-recipe
	app.get('/usr/create-recipe', isLoggedIn, function (req, res, next) {
		res.sendfile('views/create-recipe.html');
	});

	// POST /create-recipe/   
	app.post('/usr/create-recipe', isLoggedIn, function (req, res, next) {

		if (req.user) {

			var user = req.user;

			var body = req.body;

			var newRecipe = new Recipe();

			newRecipe.owner = user._id;
			newRecipe.recipeTitle = body.recipeTitle;

			newRecipe.date = new Date();
			newRecipe.numLikes = 0;


			for(var key in req.body) {
				if (key.substring(0,4) === "step") {
					var order = parseInt(key.substring(4));
					var newStep = new Step();
					newStep.order = parseInt(key.substring(4));
					newStepContent = body[key];
					newStep.pciture = body["picture" + order]; 
					newStep.video = body["video" + order];
					newRecipe.steps.push(newStep);
					newStep.save(function(err, newStep) {
						if (err) return console.log(err);
					});
				}
			};

			newRecipe.save(function(err, newRecipe) {
				if (err) return console.log(err);
				user.info.recipes.push(newRecipe);
				user.save(function (err, newUser) {
					if (err) return console.log(err);
					return res.json(newRecipe);
				});
			});
		} else {
			return res.json("Not login");
		}
	});


	// GET /recipes
	app.get('/recipes', function (req, res, next) {
		
		Recipe
			.find()
			.populate('steps')
			.exec(function (err, recipes) {
				if (err) return console.log(err);
				return res.json(recipes);
			});

	});

	// GET /recipe/:id
	app.get('/recipe/:id', function (req, res, next) {
		Recipe.findById({ _id: req.params.id })
		.populate('steps')
		.populate('comments')
		.exec(function (err, recipe) {
			if (err) return next(err);
			return res.json(recipe);
		});
	});

	// GET /usr/:usr/favorite
	app.get('/usr/favorite', isLoggedIn, function (req, res, next) {
		User.find({_id: req.user._id})
		.populate('info.favorite')
		.exec(function(err, favorite) {
			if (err) return next(err);
			return json(favorite);
		});
	});

	// GET /usr/:usr/recipes
	app.get('/usr/recipes', isLoggedIn, function (req, res, next) {
		Recipe.find({owner: req.user._id})
		.populate('recipe')
		.populate('steps')
		.exec(function(err, recipes) {
			if (err) return next(err);
			return res.json(recipes);
		})		
	});

	// GET /usr/:usr/followers
	app.get('/usr/followers', isLoggedIn, function (req, res, next) {

		User.find({_id: req.user._id})
		.populate('info.followers')
		.exec(function(err, user) {
			if (err) return next(err);
			return res.json(user[0].info.followers);
		});
	});

	// GET /usr/following
	app.get('/usr/following', isLoggedIn, function (req, res, next) {
		User.find({_id: req.user._id})
		.populate('info.following')
		.exec(function(err, user) {
			if (err) return next(err);
			return res.json(user[0].info.following);
		});
	});

	// GET /usr/currentUser
	app.get('/usr/currentUser', isLoggedIn,  function (req, res, next) {
		User.find({_id: req.user._id})
		.populate('info.recipes')
		.exec(function(err, doc) {
			if (err) return next(err);
			User.populate(doc, {
				path: 'info.recipes.steps',
				model: 'Step'
			},
			function (err, user) {
				if (err) return next(err);
				return res.json(user);
			});
		});
	});

	// POST /addToFavorite
	app.post('/recipe/:id/addToFavorite', isLoggedIn, function (req, res, next) {

		if (req.user) {
			// find current recipe 
			Recipe.findById({ _id: req.params.id })
			.populate('steps')
			.exec(function (err, recipe) {
				if (err) return next(err);

				var user = req.user;
				recipe.numLikes++;

				// return res.redirect('/recipe/' + req.params.id);
				recipe.save(function (err) {
					if (err) return next(err);
					user.info.favorite.push(recipe);
					user.save(function (err) {
						if (err) return next(err);
						return res.redirect('/recipe/' + req.params.id);
					});
				});		
			});
		}
	});

	// POST /addToFollowing
	app.post('/recipe/:id/addToFollowing', isLoggedIn, function (req, res, next) {

		// find current recipe 
		Recipe.findById({ _id: req.params.id })
		.populate('steps')
		.exec(function (err, recipe) {
			if (err) return next(err);

			var user = req.user;
			user.info.following.push(recipe.owner);



			user.save(function (err) {
				if (err) return next(err);


				User.findById({ _id: recipe.owner })
				.populate('info.recipes')
				.exec(function (req, owner) {
					if (err) return next(err);

					owner.info.followers.push(user._id);

					owner.save(function (err) {
						if (err) return next(err);
						return res.json(owner);
					});
				});
			});

				
				//return res.redirect('/recipe/' + req.params.id);
		});
	});

	// POST recipe/:id/comment
	app.post('/recipe/:id/comment', isLoggedIn, function (req, res, next) {
		var user = req.user;

		var body = req.body;

		var comment = new Comment();
		comment.username = user.info.username;
		comment.commentTitle = body.commentTitle;
		comment.commentContent = body.commentContent;
		comment.data = new Date();
		comment.save(function (err, comment) {
			if (err) return next(err);
			Recipe.findById({_id: req.params.id})
			.exec(function (err, recipe) {
				recipe.comments.push(comment._id);
				recipe.save(function (err, recipe) {
					if (err) return next(err);
					return res.redirect('/recipe/' + req.params.id);
				})
			})

		});
	});

};    

// route middleware to make sure a user is logged in
function isLoggedIn (req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't authenticated, redirect them to the home page
	res.redirect('/');
}