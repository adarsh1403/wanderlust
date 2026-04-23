require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const dns = require("dns");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const ATLAS_URI = process.env.ATLASDB_URI;
const DB_NAME = process.env.DB_NAME;
const SEED_OWNER_ID = process.env.SEED_OWNER_ID;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

const geocoder = mbxGeocoding({ accessToken: MAPBOX_TOKEN });

async function geocodePlace(location, country) {
  const query = [location, country].filter(Boolean).join(", ");
  const resp = await geocoder.forwardGeocode({ query, limit: 1 }).send();
  const feature = resp.body.features && resp.body.features[0];
  return feature ? feature.geometry : null;
}

async function main() {
  if (!ATLAS_URI) throw new Error("ATLASDB_URI is missing in .env");
  if (!DB_NAME) throw new Error("DB_NAME is missing in .env");
  if (!SEED_OWNER_ID) throw new Error("SEED_OWNER_ID is missing in .env");
  if (!MAPBOX_TOKEN) throw new Error("MAPBOX_TOKEN is missing in .env");
  if (!mongoose.isValidObjectId(SEED_OWNER_ID)) {
    throw new Error("SEED_OWNER_ID is not a valid ObjectId");
  }

  await mongoose.connect(ATLAS_URI, { dbName: DB_NAME });
  console.log(`Connected to Atlas (${DB_NAME})`);

  await Listing.deleteMany({});

  const seedListings = [];
  for (const listing of initData.data) {
    const geometry = await geocodePlace(listing.location, listing.country);
    if (!geometry) {
      console.warn(`Skipping "${listing.title}" (no geocode match)`);
      continue;
    }
    seedListings.push({
      ...listing,
      owner: SEED_OWNER_ID,
      geometry,
    });
  }

  await Listing.insertMany(seedListings, { ordered: true });
  console.log(`Database seeded with ${seedListings.length} listings.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
