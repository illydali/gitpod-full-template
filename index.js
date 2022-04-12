const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();

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

const landingRoutes = require('./routes/landing.js');
const productRoutes = require('./routes/products')

async function main() {
  app.get('/', function(req,res){
    res.redirect('/landing');
})
  app.use('/landing', landingRoutes);
  app.use('/products', productRoutes);
}

main();

app.listen(3000, () => {
  console.log("Server has started");
});