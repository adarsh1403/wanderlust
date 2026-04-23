const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const mongoose = require("mongoose");

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.body.booking;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // Prevent owner from booking their own listing
  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing.");
    return res.redirect(`/listings/${id}`);
  }

  // Prevent bookings for listings marked unavailable by owner
  if (listing.isAvailable === false) {
    req.flash("error", "This listing is currently not available for booking.");
    return res.redirect(`/listings/${id}`);
  }

  // Overlap check — three cases cover all possible overlaps
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

  // Compute price server-side — never trust client-submitted price
  const nights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
  );
  const totalPrice = nights * listing.price;

  const newBooking = new Booking({
    listing: id,
    guest: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    totalPrice,
  });

  await newBooking.save();
  req.flash("success", "Booking confirmed!");
  res.redirect("/trips");
};

module.exports.getBookedDates = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid listing ID" });
  }

  try {
    const bookings = await Booking.find({ listing: id });
    const bookedRanges = bookings.map((booking) => ({
      from: booking.checkIn,
      to: booking.checkOut,
    }));
    res.json(bookedRanges);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch dates" });
  }
};
