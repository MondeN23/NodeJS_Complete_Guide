require('dotenv').config(); // allows us to make use of .env files
// Node imports
const express = require("express");
const path = require("path");

const bodyParser = require("body-parser");

const mongoose = require('mongoose');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// Custom Imports
const errorController = require("./controllers/notFound");
const User = require('./models/user');

const app = express();

// Session storage module setup
const store = new MongoDBStore({
  uri: process.env.MongoDBConnectionString,
  collection: 'sessions'
});

const PORT = process.env.PORT || 3000;

// View engines
app.set("view engine", "ejs");
app.set("views", "views");

// Routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require('./routes/auth');

//We can define our middleware functions below here hence the "next" argument
//Middleware basically is where we funnel our request through a bunch of functions before the response

app.use(bodyParser.urlencoded({ extended: false })); // parsing our request data input
app.use(express.static(path.join(__dirname, "public"))); // setting up our public folder to be referred
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store})); // Enable conneciton to a mongoDb session


// We set up our middleware to handle our session data persisted in the database
app.use((req, res, next) => {
  if(!req.session.user){ // No session is found, prevent the app from breaking
    return next();
  }
  User.findById(req.session.user._id) // Get our session from the db created on the auth -> Post login()
    .then((user) => {      
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

// Routes
// Note that there is some routes that have a prefix so that you dont have to manually add it on the routes file
app.use("/admin", adminRoutes); // we call upon our admin routes so we can use it on our server;
app.use(shopRoutes);
app.use(authRoutes);

// app.use(errorController.get404);
app.use(errorController.get404);

const connectionString =  process.env.MongoDBConnectionString;
mongoose.connect(connectionString).then((result) => {
  User.findOne().then(user => {
    
    if(!user){
      const user = new User({
        name: 'Karabo Maimane',
        email: 'maimane23@hotmail.com',
        cart: {
          items: []
        }
      })
    
      // console.log("🚀 ~ User.findOne ~ user:", user)
      user.save();
    }
  })

  // console.log("🚀 ~ mongoose.connect ~ success")
  console.log("🚀 Server is Live on Port:", PORT);
  
  app.listen(PORT);
}).catch(err => {
  // console.log("🚀 ~ mongoose.connect ~ err:", err)
})
