const express = require("express");
const cors = require("cors");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");

const app= express();

app.use(cors());
app.use(express.json());
app.use("/api", orderRoutes);
app.use("/api", userRoutes);

module.exports= app;