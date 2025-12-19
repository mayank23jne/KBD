const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

// CREATE ORDER API
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // INR to paise
      currency: 'INR',
      payment_capture: 1
    });

    res.json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
