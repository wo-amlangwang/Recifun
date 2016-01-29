var LocalStrategy = require('passport-local').Strategy;

var User = require('../app/models/user');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
        done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
  });

  passport.use('local-login', new LocalStrategy({
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true
  },function(req,username,password,done) {
    user.findOne({'local.username' : username},function(err,user) {
      if(err){
        return done(err,false,{'message' : 'database error'});
      }
      if(!user){
        return done(null,false,{'message' : 'wrong username or email'});
      }
      if (!user.validPassword(password)) {
        return done(null,false,{'message' : 'wrong username or email'});
      }
      return done(null,user);

    });
  }));

  passport.use('local-register', new LocalStrategy({
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true
  },function (req,username,password,done) {
    User.findOne({'local.username' : username},function (err,user) {
      if(err) {
        return done(err,false,{'message' : 'database error'});
      }
      if(user) {
        return done(null, false,{'message' : 'user exist'});
      }else {
         var newUser = new User();
         newUser.local.username = username;
         newUser.local.password = newUser.generateHash(password);
         newUser.save(function(err) {
           if(err) {
             throw err;
           }
           return done(null,newUser);
         });
      }
    });
  }));
};
