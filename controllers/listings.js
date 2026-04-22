const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const baseClient = mbxGeocoding({ accessToken: mapBoxToken });
const { getAverageRating } = require("../utils/rating.js");

module.exports.index = async (req, res) => {
  const { category, q } = req.query;
  let query = {};
  if (category) {
    query.category = category;
  }
  if (q) {
    let searchQuery = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
    ];

    let numVal = Number(q.trim());
    if (!isNaN(numVal) && q.trim() !== "") {
      searchQuery.push({ price: { $lte: numVal } });
    }

    query.$or = searchQuery;
  }
  const listings = await Listing.find(query).populate("reviews").lean();

  // 2. Loop through the results and calculate the average
  const allListings = listings.map((listing) => {
    return {
      ...listing,
      avgRating: getAverageRating(listing.reviews),
    };
  });

  // 3. Render as normal (the UI will now have access to listing.avgRating)
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
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
  let response = await baseClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  const newListing = new Listing({ ...req.body.listing, owner: req.user._id });
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }
  newListing.geometry = response.body.features[0].geometry;
  const savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "Successfully made a new listing!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }
  req.flash("success", "Successfully updated the listing!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Successfully deleted the listing!");
  res.redirect("/listings");
};

module.exports.saveListing = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  // Check if the listing is already saved
  // We use .includes() but convert ObjectIds to strings for safe comparison
  const isSaved = user.savedListings.some((listingId) => listingId.equals(id));

  if (isSaved) {
    // If saved, remove it using Mongoose's .pull() array method
    user.savedListings.pull(id);
    req.flash("success", "Removed from your wishlist!");
  } else {
    // If not saved, add it
    user.savedListings.push(id);
    req.flash("success", "Added to your wishlist!");
  }

  await user.save();

  // Redirect back to exactly where the user clicked the button (index or show page)
  const redirectUrl = req.get("Referrer") || "/listings/" + id;
  res.redirect(redirectUrl);
};

module.exports.toggleAvailability = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  // Flip the boolean value
  listing.isAvailable = !listing.isAvailable;
  await listing.save();

  // Provide dynamic feedback based on the new state
  if (listing.isAvailable) {
    req.flash("success", "Your listing is now visible as Available!");
  } else {
    req.flash("success", "Your listing is marked as Booked/Not Available.");
  }
  res.redirect(`/listings/${id}`);
};
