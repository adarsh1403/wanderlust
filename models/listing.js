const mongoose = require("mongoose");
const { CATEGORIES, AMENITIES } = require("../constants.js");
const Review = require("./review.js");

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: { url: String, filename: String },
  price: Number,
  location: String,
  country: String,
  category: {
    type: [String],
    enum: CATEGORIES,
  },
  amenities: {
    type: [String],
    enum: AMENITIES,
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  geometry: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  isAvailable: { type: Boolean, default: true },
});

// Cascade-delete reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
