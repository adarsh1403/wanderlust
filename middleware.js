const xss = require("xss");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema, bookingSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be signed in to do that!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
    delete req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");
  if (!listing || !listing.owner._id.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/listings/" + id);
  }
  next();
};

module.exports.isAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review || !review.author._id.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/listings/" + id);
  }
  next();
};

// Sanitize free-text listing fields against XSS before Joi validation
module.exports.sanitizeListing = (req, res, next) => {
  if (req.body.listing) {
    const { title, description, location, country } = req.body.listing;
    if (title) req.body.listing.title = xss(title);
    if (description) req.body.listing.description = xss(description);
    if (location) req.body.listing.location = xss(location);
    if (country) req.body.listing.country = xss(country);
  }
  next();
};

// Sanitize review comment against XSS before Joi validation
module.exports.sanitizeReview = (req, res, next) => {
  if (req.body.review && req.body.review.comment) {
    req.body.review.comment = xss(req.body.review.comment);
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  }
  next();
};

module.exports.validateBooking = (req, res, next) => {
  const { error } = bookingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  }
  next();
};