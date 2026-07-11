const express = require("express");

const router = express.Router();

const {
  createOrder,
  getOrderById
} = require("../controllers/orderController");

router.post("/orders", createOrder);

router.get("/orders/:id", getOrderById);

module.exports = router;