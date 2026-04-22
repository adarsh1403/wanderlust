const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/bookings.js");
const { isLoggedIn } = require("../middleware.js");

// GET /trips - Guest Dashboard
router.get("/trips", isLoggedIn, wrapAsync(bookingController.renderTrips));

// GET /reservations - Host Dashboard
router.get("/reservations", isLoggedIn, wrapAsync(bookingController.renderReservations));

module.exports = router;
