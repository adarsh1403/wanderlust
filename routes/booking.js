const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/bookings.js");
const { isLoggedIn, validateBooking } = require("../middleware.js");

// POST /listings/:id/bookings - Create a booking
router.post(
  "/",
  isLoggedIn,
  validateBooking,
  wrapAsync(bookingController.createBooking),
);

// GET /listings/:id/booked-dates - API for calendar
router.get("/booked-dates", wrapAsync(bookingController.getBookedDates));

module.exports = router;
