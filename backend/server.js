import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/db-connection.js";
import userRoute from "./routes/user-route.js";
import roleRoute from "./routes/role-route.js";
import dashboardRoute from "./routes/dashboard-route.js";
import auditRoute from "./routes/audit-route.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/user", userRoute);
app.use("/roles", roleRoute);
app.use("/dashboard", dashboardRoute);
app.use("/audit", auditRoute);

app.get("/", (req, res) => {
  res.send("Flodata RBAC Dashboard API is running");
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    if (process.env.NODE_ENV === "development") {
      console.log(`Server running on port ${PORT}`);
    }
  });
};

startServer();
