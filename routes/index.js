var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var User      = mongoose.model('Users');
var crypto    = require('crypto'), hmac, signature;
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize }   = require('express-validator/filter');
const bodyParser = require('body-parser');
const multer = require('multer');
const Gridfs = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const fs  = require('fs');
var path = require('path');
const fileModel = require('../models/fileSchema');
const { error, Console } = require('console');
const { response } = require('express');
 var http = require('http');
const { GridFSBucket } = require('mongodb');
var flash = require('connect-flash');
var session = require('express-session');
const nodemailer = require('nodemailer');
const { text } = require('body-parser');
const smtpTrans = nodemailer.createTransport({
      host: 'smtp.gmail.com',
    port: 465,
    secure: true,
      auth: {
    user: "nayakleon@gmail.com",
    pass: "rhspxzuilcfwxtdu"
  },
  });
  smtpTrans.verify((res,error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready to Send");
  }
});
// Middleware
router.use(bodyParser.json());
   /* GET home page. */
  router.get('/', function(req, res, next) {
      res.render('index');
   });
  router.get('/table',function(req,res){
    res.render('table');
  });
   
  /* POST user registration page. */
  router.post('/register',[ 
   
    check('full_name','Name cannot be left blank')
    .isLength({ min: 1 }),
   
    check('email')
    .isEmail().withMessage('Please enter a valid email address')
    .trim()
    .normalizeEmail()
    .custom(value => {
        return findUserByEmail(value).then(User => {
          //if user email already exists throw an error
      })
    }),

    check('password')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 chars long')
    .matches(/\d/).withMessage('Password must contain one number')
    .custom((value,{req, loc, path}) => {
      if (value !== req.body.cpassword) {
          // throw error if passwords do not match
          throw new Error("Passwords don't match");
      } else {
          return value;
      }
  }),

  check('gender','Please select gender')
    .isLength({ min: 1 }),

    check('dob','Date of birth cannot be left blank')
    .isLength({ min: 1 }),
    
    check('country','Country cannot be left blank')
    .isLength({ min: 1 }),
    
    check('terms','Please accept our terms and conditions').equals('yes'),

   ], function(req, res, next) {

      const errors = validationResult(req);

    if (!errors.isEmpty()) {     
        
       res.json({status : "error", message : errors.array()});

    } else {

        hmac = crypto.createHmac("sha1", 'auth secret');
        var encpassword = '';

        if(req.body.password){
          hmac.update(req.body.password);
          encpassword = hmac.digest("hex");
        }
        var document = {
            full_name:   req.body.full_name, 
            email:       req.body.email, 
            password:    encpassword, 
            dob:         req.body.dob, 
            country:     req.body.country, 
            gender:      req.body.gender, 
            calorie:     req.body.calorie, 
            salt:        req.body.salt 
          };
        
        var user = new User(document); 
        user.save(function(error){
          console.log(user);
          if(error){ 
            throw error;
          }
          res.json({message : "Data saved successfully.", status : "success"});
       });    
    }
});

function findUserByEmail(email){

  if(email){
      return new Promise((resolve, reject) => {
        User.findOne({ email: email })
          .exec((err, doc) => {
            if (err) return reject(err)
            if (doc) return reject(new Error('This email already exists. Please enter another email.'))
            else return resolve(email)
          })
      })
    }
 }
 
 router.get('/login', function(req, res, next) {
      res.render('login');
   });
router.post('/login', function (req, res, next) {
	console.log(req.body);
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb+srv://darshan:darshannayak007@cluster0.qatqn.mongodb.net/dbusers?retryWrites=true&w=majority";

MongoClient.connect(url, function(err, db) {
  var dbo = db.db("dbusers");
  dbo.collection("users").findOne({email:req.body.email}, function(err, result) {
    if (!result){
      res.redirect('/login');
      res.send("Email not Found!");
    }else{
      hmac = crypto.createHmac("sha1", 'auth secret');
        var encpassword = '';
        hmac.update(req.body.password);
        encpassword = hmac.digest("hex");
        console.log(encpassword);
        console.log(result.password);
    if (encpassword==result.password) {
       res.status(200).send("Success");
        console.log("Success");
    }else{
      res.status(401).send("Wrong email or password");
        console.log("Wrong email or password");
    }
  }
    
  });
});
});


const mongouri = 'mongodb+srv://darshan:darshannayak007@cluster0.qatqn.mongodb.net/uploads?retryWrites=true&w=majority'

const conn = mongoose.createConnection(mongouri,{ useNewUrlParser: true,useUnifiedTopology: true } );

//gridfs variable
let gfs;

conn.once('open', ()=> {
gfs = Grid(conn.db,mongoose.mongo);
gfs.collection('userdocs');
});

//create file storage
const storage = new Gridfs({
url:mongouri,
file:(req,file) =>{
   return new Promise((resolve,reject) =>{
   crypto.randomBytes(16, (err, buf)=>{
  if(err) {
      return reject(err);
  }


  const filename = file.originalname;
  const fileinfo = {
      filename:filename,
      bucketName:'userdocs'
       };
       resolve(fileinfo);
     });
   });
  }
});
const upload = multer({ storage} );

//post file
router.post('/upload', upload.single('file'), (req, res) =>{
res.json({ "file": req.file.originalname.toLowerCase() });
  res.redirect('/admins');
});


router.get('/Download', (req, res) => {
//// let contentType;
  let filename =req.query.file.toString();
  console.log(filename);
  fileModel.findOne({filename: filename}).then((file)=>{
    console.log(filename);
    //contentType = file[contentType];
    //setting response header
    res.set({
     "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename=${filename}`,
      //"Content-Type": `${contentType}`
    });
    var readstream = gfs.createReadStream({ filename: filename });
    //const readstream = storage.openDownloadStreamByName(filename);
    readstream.pipe(res);
  })
});


router.get('/Delete', (req, res) => {
//// let contentType;
  var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(mongouri, function(err, db) {
  if (err) throw err;
  var dbo = db.db("uploads");
  dbo.collection("userdocs.files").deleteOne({filename:req.query.file.toString()}, function(err, obj) {
    if (err) throw err;
    console.log("1 document deleted");
    res.redirect('/admins');
    db.close();
  });
 });
});


//show all files
router.get('/admins', (req, res) => {
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(mongouri, function(err, db) {
  if (err) throw err;
  var dbo = db.db("uploads");
  dbo.collection("userdocs.files").find({}).sort({filename:1}).toArray(function(err, result) {
    if (err) throw err; 
    res.render('admins',{Result:result});
    db.close();
  });
});
});
    //search files by original name
router.get('/search', (req, res) => {
  var filename = req.query.file.toString();
console.log(filename.toLowerCase());
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(mongouri, function(err, db) {
  if (err) throw err;
  var dbo = db.db("uploads");
  console.log(filename.toLowerCase());
  dbo.collection("userdocs.files").find({filename:new RegExp(filename.toLowerCase()) }).sort({filename:1}).toArray(function(err, result) {
    console.log(result);
    if (err) throw err;
    res.render('SearchPage',{Result:result});
    db.close();
  });
});
});

router.post('/Cemail', (req, res) => {

  console.log(req.body.name);
  // Specify what the email will look like
  const mailOpts = {
    from: req.body.email, // This is ignored by Gmail
    to: "nayakleon@gmail.com",
    subject: "Contact Form Submission",
    html: `<p>Name: ${req.body.name}</p>
           <p>Email: ${req.body.email}</p>
           <p>Message: ${req.body.text}</p>`,
  }
  // Attempt to send the email
  res.render('index');
  smtpTrans.sendMail(mailOpts, (error) => {
     if (error) {
       console.log("error");
      res.json({ status: "ERROR" });
    } else {
      console.log("Success");
      res.json({ response: "success" });
    }
  })
})
module.exports = router;
