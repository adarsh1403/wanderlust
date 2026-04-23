const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const dashboardController = require("../controllers/dashboard.js");
const { isLoggedIn } = require("../middleware.js");

router.get("/trips", isLoggedIn, wrapAsync(dashboardController.renderTrips));
router.get("/reservations", isLoggedIn, wrapAsync(dashboardController.renderReservations));

module.exports = router;
