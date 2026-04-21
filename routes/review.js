const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { reviewSchema } = require("../schema.js");
const { isLoggedIn, isAuthor, validateReview } = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

// review post route
router
    .route("/")
    .post(isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

//review delete route
router
    .route("/:reviewId")
    .delete(isLoggedIn, isAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;