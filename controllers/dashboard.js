const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.renderTrips = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ checkIn: 1 });
  res.render("bookings/trips.ejs", { bookings });
};

module.exports.renderReservations = async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).select("_id");
  const listingIds = listings.map((l) => l._id);

  const reservations = await Booking.find({ listing: { $in: listingIds } })
    .populate("listing")
    .populate("guest")
    .sort({ checkIn: 1 });

  res.render("bookings/reservations.ejs", { reservations });
};
