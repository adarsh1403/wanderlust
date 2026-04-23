if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const helmet = require("./config/helmet.js");
const mongoSanitize = require("express-mongo-sanitize");
const dns = require("dns");

const {
  CATEGORIES,
  AMENITIES,
  CATEGORY_ICONS,
  AMENITY_ICONS,
} = require("./constants.js");

const ExpressError = require("./utils/ExpressError.js");
const createSessionConfig = require("./config/session.js");
const initPassport = require("./config/passport.js");
const { globalLimiter } = require("./config/rateLimiter.js");

const listingRoutes = require("./routes/listing.js");
const reviewRoutes = require("./routes/review.js");
const userRoutes = require("./routes/user.js");
const bookingRoutes = require("./routes/booking.js");
const dashboardRoutes = require("./routes/dashboard.js");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const ATLAS_URI = process.env.ATLASDB_URI;
const DB_NAME = process.env.DB_NAME;
const PORT = process.env.PORT || 8080;

if (!ATLAS_URI) {
  throw new Error("ATLASDB_URI is missing in environment variables");
}

if (!DB_NAME) {
  throw new Error("DB_NAME is missing in environment variables");
}

mongoose
  .connect(ATLAS_URI, { dbName: DB_NAME })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Security middleware
app.use(globalLimiter);

// The error was coming from express-mongo-sanitize trying to write back to req.query on Express 5, where that property is read-only by default. I fixed it in app.js by making req.query a writable own property before the sanitizer runs, so the middleware can keep doing its job without crashing.
app.use((req, _res, next) => {
  const query = req.query;
  Object.defineProperty(req, "query", {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());
app.use(helmet);

// Session & auth
app.use(session(createSessionConfig(ATLAS_URI)));
app.use(flash());
initPassport();
app.use(passport.initialize());
app.use(passport.session());

// Make flash messages and current user available to all templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success") || [];
  res.locals.error = req.flash("error") || [];
  res.locals.currentUser = req.user || null;
  res.locals.CATEGORIES = CATEGORIES;
  res.locals.AMENITIES = AMENITIES;
  res.locals.CATEGORY_ICONS = CATEGORY_ICONS;
  res.locals.AMENITY_ICONS = AMENITY_ICONS;
  next();
});

// Routes
app.get("/", (req, res) => res.redirect("/listings"));
app.use("/listings", listingRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/listings/:id/bookings", bookingRoutes);
app.use("/", userRoutes);
app.use("/", dashboardRoutes);

app.all("/{*splat}", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
