if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// require express package
const express = require("express");

// create express application object ( calls the express function that returns an app instance and stores app instance in app)
const app = express();

// require mongoose package
const mongoose = require("mongoose");



// require node.js built-in path module.
// It helps build safe, cross-platform file paths (Windows and Linux/Mac use different separators).
const path = require("path");

// require method-override package for using put/patch/delete request in html forms
const methodOverride = require("method-override");

// require ejs-mate package for easy sub-templating 
const ejsMate = require("ejs-mate");

// define my mongodb database name and url
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// require custom error class 
const ExpressError = require("./utils/ExpressError.js");

// require listing routes
const listingRoutes = require("./routes/listing.js");

// require review routes
const reviewRoutes = require("./routes/review.js");

// require user routes
const userRoutes = require("./routes/user.js");

// require booking and dashboard routes
const bookingRoutes = require("./routes/booking.js");
const dashboardRoutes = require("./routes/dashboard.js");

const session = require("express-session");
const flash = require("connect-flash");

// require passport and passport-local for user authentication
const passport = require("passport");
const LocalStrategy = require("passport-local");

// require user model for authentication
const User = require("./models/user.js");



// connecting to database  in asynchronous manner and defining the afterwork
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

// function to connect to database 
async function main() {
  await mongoose.connect(MONGO_URL);
}

// setting template engine to ejs so that express knows how to process ejs files in res.render()
app.set("view engine", "ejs");

// whenever we render a file express looks for views folder in the directory where server is started. so by this we join views of express to the absolute path which is the current file's directory given by __dirname
// Use the current file’s directory so Express can find views reliably no matter where the app is started.
app.set("views", path.join(__dirname, "views"));

// middleware-> parses req.body when its sent in form-urlencoded format
// It parses HTML form data into req.body, including nested fields like listing[title].
app.use(express.urlencoded({ extended: true }));

// middleware-> take the query string with _method key and uses its value to convert into actual request type.
app.use(methodOverride("_method"));

// app.set("view engine", "ejs") says which template type to use. and app.engine("ejs", ejsMate) says which renderer implementation should process that type.
// registers ejs-mate as the rendering engine for EJS files.
app.engine("ejs", ejsMate);

// middleware-> tells the express to serve static files (css,js,images,etc.) from current directory's public folder.
app.use(express.static(path.join(__dirname, "public")));

// middleware-> sets up session management with a secret key and configuration options.
const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true, // prevents client-side JavaScript from accessing the cookie, enhancing security against XSS attacks.
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // expires in one week (miliseconds)
    maxAge: 1000 * 60 * 60 * 24 * 7, // max age of cookie is one week
  },
};

app.use(session(sessionConfig));
app.use(flash());

// middleware-> initializes Passport and sets up session handling for authentication.
app.use(passport.initialize());
app.use(passport.session());

// configuring passport to use local strategy for authentication and to use the static authenticate method of the user model which is provided by passport-local-mongoose package
passport.use(new LocalStrategy(User.authenticate()));

// serializeUser determines which data of the user object should be stored in the session. The result of the serializeUser method is attached to the session as req.session.passport.user = {id: '...'}.
passport.serializeUser(User.serializeUser());

// deserializeUser is the counterpart of serializeUser. It takes the data that was stored in the session and turns it back into a full user object. This is typically done on every request to retrieve the user from the database based on the ID stored in the session.
passport.deserializeUser(User.deserializeUser());

// root route for app
app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

// middleware-> sets up res.locals variables for flash messages, making them available in all templates.
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user; // makes the authenticated user available as currentUser in all templates
  next();
});

// app.get("/fakeUser", async (req, res) => {
//   const user = new User({
//     email: "fak1e@example.com",
//     username: "fakeUser"
//   });
//   await User.register(user, "chicken");
//   console.log(user);
//   res.send("Fake user created");
// });


// using listing routes for all routes starting with /listings 
app.use("/listings", listingRoutes);

// using review routes for all routes starting with /listings/:id/reviews
app.use("/listings/:id/reviews", reviewRoutes);

// using user routes for all routes starting with /users
app.use("/", userRoutes);

// using booking routes
app.use("/listings/:id/bookings", bookingRoutes);
app.use("/", dashboardRoutes);

// universal (wildcard) route for catching unmatched routes
// *splat -> modern express way of saying match any path
app.all("/{*splat}", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

// middleware-> custom error handling rather than default express error
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// server opened on port 8080 for listening 
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
