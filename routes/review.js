const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isAuthor, validateReview, sanitizeReview } = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

router
  .route("/")
  .post(isLoggedIn, sanitizeReview, validateReview, wrapAsync(reviewController.createReview));

router
  .route("/:reviewId")
  .delete(isLoggedIn, isAuthor, wrapAsync(reviewController.destroyReview));

module.exports = router;