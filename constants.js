const CATEGORIES = ["Apartments", "Villas", "Cabins", "Beachfront", "Castles", "Unique"];

const AMENITIES = ["WiFi", "Pool", "Hot Tub", "Free Parking", "AC", "Kitchen", "Pet Friendly", "TV", "Washer"];

const CATEGORY_ICONS = {
  Apartments: "fa-building",
  Villas: "fa-house",
  Cabins: "fa-house-chimney-window",
  Beachfront: "fa-umbrella-beach",
  Castles: "fa-fort-awesome",
  Unique: "fa-star",
};

const AMENITY_ICONS = {
  WiFi: "fa-wifi",
  Pool: "fa-person-swimming",
  "Hot Tub": "fa-hot-tub-person",
  "Free Parking": "fa-square-parking",
  AC: "fa-snowflake",
  Kitchen: "fa-kitchen-set",
  "Pet Friendly": "fa-paw",
  TV: "fa-tv",
  Washer: "fa-shirt",
};

module.exports = { CATEGORIES, AMENITIES, CATEGORY_ICONS, AMENITY_ICONS };
