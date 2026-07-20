const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
    console.log("Database:", mongoose.connection.name);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;