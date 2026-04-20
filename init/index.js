// script to initialize my databse listing model with fake data for starting 

// requiring mongoose, temproary-data, listing model of my database
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

// defining which database to connect
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


// asynchronous operation after databse is connected 
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

// connecting to database
async function main() {
  await mongoose.connect(MONGO_URL);
}

// function ->  deletes all previous data from my listing model and initialises wih new data
const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((listing) => ({ ...listing, owner: "69e4e6952e44b68cc8b22d47" }));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

// calling the initialisation function
initDB();
