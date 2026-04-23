const { MongoStore } = require("connect-mongo");

const createSessionConfig = (dbUrl) => {
  const store = MongoStore.create({
    mongoUrl: dbUrl,
    // Only update session in DB if it hasn't been touched in 24 hours
    touchAfter: 24 * 60 * 60,
    crypto: { secret: process.env.SECRET },
  });

  store.on("error", (e) => {
    console.error("SESSION STORE ERROR", e);
  });

  return {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Secure cookies only in production (HTTPS)
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  };
};

module.exports = createSessionConfig;
