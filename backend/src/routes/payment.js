require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Payment route working");
});

router.post("/create-order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = req.body.amount || 100;
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    });

    res.json(order);
  } catch (err) {
    console.log("RAZORPAY ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;