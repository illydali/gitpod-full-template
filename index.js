const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();

// adding sessions dependencies
const session = require('express-session');
const flash = require('connect-flash');
const FileStore = require('session-file-store')(session);

// adding in csurf
const csrf = require('csurf')

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
app.use(function (req, res, next) {
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
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true
}))

// set up flash messages
app.use(flash())

// display flash messages in the hbs files
app.use(function (req, res, next) {
  res.locals.success_messages = req.flash("success_messages");
  res.locals.error_messages = req.flash("error_messages");
  next();
});

// share the details of the logged in user with all routes -- must be after the sessions 
// middleware
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
})

// enable CSRF
// app.use(csrf());

const csurfInstance = csrf(); // creating a prox of the middleware
app.use(function (req, res, next) {
  // if it is webhook url, then call next() immediately
  if (req.url === '/checkout/process_payment') {
    next();
  } else {
    csurfInstance(req, res, next);
  }

})

// middleware to share the csrf token with all hbs files
app.use(function (req, res, next) {
  // the req.csrfToken() generates a new token
  // and save its to the current session
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
})

// middleware to handle csrf errors
// if a middleware function takes 4 arguments
// the first argument is error
app.use(function (err, req, res, next) {
  if (err && err.code == "EBADCSRFTOKEN") {
    req.flash('error_messages', "The form has expired. Please try again");
    res.redirect('back'); // go back one page
  } else {
    next();
  }
})

// share the details of the logged in user with all routes
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
})

// IMPORT IN THE ROUTES
const landingRoutes = require('./routes/landing.js');
const productRoutes = require('./routes/products.js');
const userRoutes = require('./routes/users.js');
const cloudinaryRoutes = require('./routes/cloudinary.js');
const shoppingCartRoutes = require('./routes/shoppingCart');
const checkoutRoutes = require('./routes/checkout');
const {
  checkIfAuthenticated
} = require('./middlewares')

async function main() {
  app.get('/', function (req, res) {
    res.redirect('/landing');
  })
  app.use('/landing', landingRoutes);
  app.use('/products', productRoutes);
  app.use('/users', userRoutes);
  app.use('/cloudinary', cloudinaryRoutes);
  app.use('/cart', checkIfAuthenticated, shoppingCartRoutes);
  app.use('/checkout', checkoutRoutes)
}

main();

app.listen(3000, () => {
  console.log("Server has started");
});