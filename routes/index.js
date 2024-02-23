  var express = require('express');
  var router = express.Router();
  const userModel = require('./users')
  const statusmodel = require('./status')
  var upload = require("./multer")

  var users = require('./users')
  var passport = require('passport')
  var localStrategy = require('passport-local')
  passport.use(new localStrategy(users.authenticate()))

  /* GET home page. */
  router.get('/', function (req, res, next) {
    res.render('index');
  });

  router.get('/chat',isLoggedIn, async (req, res, next) => {
    // console.log(req.user);
    res.render('chat',{user:req.user})
  })


  router.post('/register', (req, res, next) => {
    var newUser = {
      //user data here
      username: req.body.username,
      contact: req.body.contact,
      img:req.body.img
      //user data here
    };
    users
      .register(newUser, req.body.password)
      .then((result) => {
        passport.authenticate('local')(req, res, () => {
          //destination after user register
          res.redirect('/chat');
        });
      })
      .catch((err) => {
        res.send(err);
      });
  });

  router.post(
    '/login',
    passport.authenticate('local', {
      successRedirect: '/chat',
      failureRedirect: '/',
    }),
    (req, res, next) => { }
  );


  router.get('/login', (req, res, next) => {
    res.render('login')
  })
  router.get('/logout',function(req, res, next) {
  req.logout(function(err){
  if (err){
    return next(err);
  }
  res.redirect("/")
  })
  });

  function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
      return next();
    }else{
      res.redirect("/")
    }
  }

  router.post('/upload', upload.single('image'), function(req, res, next) {
    // File upload successful, handle other tasks if needed
    res.json(req.file)
  });


  router.get('/status',isLoggedIn,async function(req, res, next) {
    let user =  await userModel.findOne({username:req.session.passport.user}).populate("status")
    let users =  await userModel.find()
  let status = await statusmodel.find().populate("userid")
 
    // File upload successful, handle other tasks if needed
    res.render("status",{user,status,users})
  });

  router.post('/upload/status', upload.single('file'), async function(req, res, next) {
   let user = await userModel.findOne({username:req.session.passport.user})
    // File upload successful, handle other tasks if needed
    var status = await statusmodel.create({
        img:req.file.filename,
        userid:user._id
     }) 
    user.status.push(status._id)
     await user.save()
   
    res.redirect("/status") 
  });


  
  router.get('/getstatus/:user',isLoggedIn,async function(req, res, next) {
  let user =  await  userModel.findOne({_id:req.params.user}).populate("status")
  console.log(user);
  res.render("viewstatus",{user})
  });

  router.get('/viewimage/:img',isLoggedIn, function(req, res, next) {
    console.log(req.params.img);
    res.render("viewphoto",{img:req.params.img})
    });
  
    
 

  module.exports = router;
