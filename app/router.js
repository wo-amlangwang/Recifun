module.exports = function(app,passport) {
  app.get('/api/register',function(req,res,next) {
    passport.authenticate('local-register',function(err,user,info) {
      if(err){
        if(req.isAuthenticated()){
          req.logout();
        }
        res.sendStatus(503);
      }
      if(user){
        req.login(user,function(err) {
          if(err){
            res.sendStatus(503);
          }else {
            res.sendStatus(200);
          }
        });
      }else {
        if(req.isAuthenticated()){
          req.logout();
        }
        res.sendStatus(401);
      }
    })(req,res,next);
  });

  app.post('/api/login',function(req,res,next) {
    passport.authenticate('local-login',function(err,user,info) {
      if(err){
        if(req.isAuthenticated()){
          req.logout();
        }
        res.sendStatus(503);
      }
      if(user){
        req.login(user,function(err) {
          if(err){
            res.sendStatus(503);
          }else {
            res.sendStatus(200);
          }
        });
      }else {
        if(req.isAuthenticated()){
          req.logout();
        }
        res.sendStatus(401);
      }
    })(req,res,next);
  });

  app.get('/api/logout',function(req,res,nest) {
    req.logout();
    res.sendStatus(200);
  });

  app.get('/',function(req,res,next) {
    if(req.isAuthenticated()){
      res.send('yes');
    }else {
      res.send('no');
    }
  });
};
