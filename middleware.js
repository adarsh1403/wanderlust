const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl; // store the original URL the user was trying to access
        req.flash("error", "You must be signed in to do that!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl; // make the redirect URL available in res.locals for access in templates
        delete req.session.redirectUrl; // clear the redirect URL from session after using it
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");
    if (!listing || !listing.owner._id.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that!");
        return res.redirect("/listings/" + id);
    }
    next();
};

module.exports.isAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;

    // Instead of looking in the listing.reviews array, query the Review model!
    const review = await Review.findById(reviewId);

    if (!review || !review.author._id.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that!");
        return res.redirect("/listings/" + id);
    }

    next();
};

// middleware function for validating input fields coming from create and update route
//  it validates req.body.listing with Joi and throws a 400 on bad input.
module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

// middleware function for validating input fields coming from review route
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        // error.details is an array of error objects, each with a message property. We map over this array to extract the messages and join them into a single string separated by commas.
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

// middleware function for validating input fields coming from booking route
module.exports.validateBooking = (req, res, next) => {
    const { bookingSchema } = require("./schema.js");
    const { error } = bookingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};