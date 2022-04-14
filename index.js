const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();

// adding sessions dependencies
const session = require('express-session');
const flash = require('connect-flash');
const FileStore = require('session-file-store')(session);

// create an instance of express app
let app = express();

// set the view engine
app.set("view engine", "hbs");

// static folder
app.use(express.static("public"));

// setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// enable forms
app.use(
  express.urlencoded({
    extended: false
  })
);

// custom middlewares
app.use(function(req,res,next){
  // declare a variable named
  // date that is available for
  // all hbs file to access
  res.locals.date = Date();

  next(); // forward the request to the next middleware
          // or if there is no middleware,to the intended route function
})

// set up sessions
app.use(session({
  store: new FileStore(),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(flash())

// Register Flash middleware
app.use(function (req, res, next) {
  res.locals.success_messages = req.flash("success_messages");
  res.locals.error_messages = req.flash("error_messages");
  next();
});

// IMPORT IN THE ROUTES
const landingRoutes = require('./routes/landing.js');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users.js')

async function main() {
  app.get('/', function(req,res){
    res.redirect('/landing');
})
  app.use('/landing', landingRoutes);
  app.use('/products', productRoutes);
  app.use('/users', userRoutes)
}

main();

app.listen(3000, () => {
  console.log("Server has started");
});