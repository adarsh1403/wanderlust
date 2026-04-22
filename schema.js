// Defines Joi validation schema for listing model data (expects req.body.listing) and exports it for request validation.

const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        category: Joi.array().items(Joi.string().valid("Apartments", "Villas", "Cabins", "Beachfront", "Castles", "Unique")).single(),
        amenities: Joi.array().items(Joi.string().valid("WiFi", "Pool", "Hot Tub", "Free Parking", "AC", "Kitchen", "Pet Friendly", "TV", "Washer")).single()
    }).required(),
});

// Defines Joi validation schema for review model data (expects req.body.review) and exports it for request validation.
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});

// Defines Joi validation schema for booking
module.exports.bookingSchema = Joi.object({
    booking: Joi.object({
        checkIn: Joi.date().required(),
        checkOut: Joi.date().greater(Joi.ref('checkIn')).required(),
        totalPrice: Joi.number().required().min(0)
    }).required()
});