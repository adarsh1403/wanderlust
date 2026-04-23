const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { getAverageRating } = require("../utils/rating.js");

const baseClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

module.exports.index = async (req, res) => {
  const { category, amenities, q, page = 1 } = req.query;
  let query = {};

  if (category) query.category = category;
  if (amenities) query.amenities = amenities;

  if (q) {
    const safeQ = escapeRegex(q.trim());
    const searchQuery = [
      { title: { $regex: safeQ, $options: "i" } },
      { location: { $regex: safeQ, $options: "i" } },
      { country: { $regex: safeQ, $options: "i" } },
    ];
    const numVal = Number(q.trim());
    if (!isNaN(numVal) && q.trim() !== "") {
      searchQuery.push({ price: { $lte: numVal } });
    }
    query.$or = searchQuery;
  }

  const limit = 12;

  const totalListings = await Listing.countDocuments(query);
  const totalPages = Math.ceil(totalListings / limit);
  const currentPage = Math.min(
    Math.max(parseInt(page) || 1, 1),
    totalPages || 1,
  );
  const skip = (currentPage - 1) * limit;

  const listings = await Listing.find(query)
    .populate("reviews")
    .skip(skip)
    .limit(limit)
    .lean();

  const allListings = listings.map((listing) => ({
    ...listing,
    avgRating: getAverageRating(listing.reviews),
  }));

  res.render("listings/index.ejs", {
    allListings,
    currentPage,
    totalPages,
    q,
    category,
    amenities,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }

  const avgRating = getAverageRating(listing.reviews);
  res.render("listings/show.ejs", { listing, avgRating });
};

module.exports.createListing = async (req, res) => {
  const response = await baseClient
    .forwardGeocode({ query: req.body.listing.location, limit: 1 })
    .send();

  // Guard: if Mapbox returns no results for the given location
  if (!response.body.features || response.body.features.length === 0) {
    req.flash(
      "error",
      "Could not find that location on the map. Please enter a more specific address.",
    );
    return res.redirect("/listings/new");
  }

  const newListing = new Listing({ ...req.body.listing, owner: req.user._id });

  if (req.file) {
    newListing.image = { url: req.file.path, filename: req.file.filename };
  }

  newListing.geometry = response.body.features[0].geometry;
  await newListing.save();

  req.flash("success", "Successfully made a new listing!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.file) {
    listing.image = { url: req.file.path, filename: req.file.filename };
    await listing.save();
  }

  req.flash("success", "Successfully updated the listing!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted the listing!");
  res.redirect("/listings");
};

module.exports.saveListing = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const isSaved = user.savedListings.some((listingId) => listingId.equals(id));

  if (isSaved) {
    user.savedListings.pull(id);
    req.flash("success", "Removed from your wishlist!");
  } else {
    user.savedListings.push(id);
    req.flash("success", "Added to your wishlist!");
  }

  await user.save();
  const referer = req.get("Referer") || "/listings";
  req.session.save(() => {
    // Ensure flash message is saved before redirecting
    res.redirect(referer);
  });
};

module.exports.toggleAvailability = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Cannot find that listing!");
    return res.redirect("/listings");
  }

  listing.isAvailable = !listing.isAvailable;
  await listing.save();

  req.flash(
    "success",
    listing.isAvailable
      ? "Your listing is now visible as Available!"
      : "Your listing is marked as Booked/Not Available.",
  );
  res.redirect(`/listings/${id}`);
};
