import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    if (process.env.NODE_ENV === "development") {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("MongoDB connection error:", err);
    } else {
      console.error("MongoDB connection failed");
    }
    process.exit(1);
  }
};

export default connectDB;
