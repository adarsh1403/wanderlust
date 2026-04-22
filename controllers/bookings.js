const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, totalPrice } = req.body.booking;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Overlap Query
  const overlappingBookings = await Booking.find({
    listing: id,
    $or: [
      { checkIn: { $lt: checkOutDate, $gte: checkInDate } },
      { checkOut: { $lte: checkOutDate, $gt: checkInDate } },
      { checkIn: { $lte: checkInDate }, checkOut: { $gte: checkOutDate } },
    ],
  });

  if (overlappingBookings.length > 0) {
    req.flash("error", "These dates are already booked!");
    return res.redirect(`/listings/${id}`);
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const newBooking = new Booking({
    listing: id,
    guest: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    totalPrice: totalPrice,
  });

  await newBooking.save();
  req.flash("success", "Booking confirmed!");
  res.redirect("/trips");
};

module.exports.getBookedDates = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({ listing: id });

    const bookedRanges = bookings.map((booking) => {
      return {
        from: booking.checkIn,
        to: booking.checkOut,
      };
    });

    res.json(bookedRanges);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch dates" });
  }
};

module.exports.renderTrips = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ checkIn: 1 });
  res.render("bookings/trips.ejs", { bookings });
};

module.exports.renderReservations = async (req, res) => {
  // Find listings owned by current user
  const listings = await Listing.find({ owner: req.user._id });
  const listingIds = listings.map((listing) => listing._id);

  // Find bookings for those listings
  const reservations = await Booking.find({ listing: { $in: listingIds } })
    .populate("listing")
    .populate("guest")
    .sort({ checkIn: 1 });

  res.render("bookings/reservations.ejs", { reservations });
};
