require('dotenv').config();
const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const RazorpayLib = require('razorpay');
const Razorpay = RazorpayLib.default ? RazorpayLib.default : RazorpayLib;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/razorpay/create-order', async (req, res) => {
    // console.log(process.env.RAZORPAY_KEY);
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
    console.log(err,"errerere")
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save donation after successful payment
router.post('/save-donation', async (req, res) => {
    try {
        const { payment_id, name, email, mobile, amount , status } = req.body;

        // Validation
        if (!payment_id) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID is required'
            });
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // Check if payment already exists
        const existingDonation = await Donation.getByPaymentId(payment_id);
        if (existingDonation) {
            return res.status(409).json({
                success: false,
                message: 'Payment already recorded'
            });
        }

        // Save donation
        const result = await Donation.save({
            payment_id,
            name: name || 'Anonymous',
            email: email || null,
            mobile: mobile || null,
            amount: parseFloat(amount),
            status: status
        });

        res.status(200).json({
            success: true,
            message: 'Donation saved successfully',
            data: result
        });

    } catch (error) {
        console.error('Error saving donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save donation',
            error: error.message
        });
    }
});

// Get all donations (admin/public view)
router.get('/donations', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await Donation.getAll(page, limit);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donations',
            error: error.message
        });
    }
});

// Get donation by payment ID
router.get('/donation/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;

        const donation = await Donation.getByPaymentId(paymentId);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: donation
        });

    } catch (error) {
        console.error('Error fetching donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation',
            error: error.message
        });
    }
});

// Get user's donations (by email or mobile)
router.get('/user-donations', async (req, res) => {
    try {
        const { email, mobile } = req.query;

        if (!email && !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Email or mobile is required'
            });
        }

        const donations = await Donation.getByUser(email, mobile);

        res.status(200).json({
            success: true,
            count: donations.length,
            data: donations
        });

    } catch (error) {
        console.error('Error fetching user donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user donations',
            error: error.message
        });
    }
});

// Get donation statistics
router.get('/donation-stats', async (req, res) => {
    try {
        const stats = await Donation.getTotalAmount();

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching donation stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation stats',
            error: error.message
        });
    }
});

// Get recent donations
router.get('/recent-donations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const donations = await Donation.getRecent(limit);

        res.status(200).json({
            success: true,
            count: donations.length,
            data: donations
        });

    } catch (error) {
        console.error('Error fetching recent donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent donations',
            error: error.message
        });
    }
});

// Update donation status (for admin/webhook)
router.patch('/donation/:paymentId/status', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;

        if (!['success', 'failed', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: success, failed, or pending'
            });
        }

        const updated = await Donation.updateStatus(paymentId, status);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Donation status updated successfully'
        });

    } catch (error) {
        console.error('Error updating donation status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update donation status',
            error: error.message
        });
    }
});

// Delete donation (admin only - add authentication middleware)
router.delete('/donation/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Donation.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Donation deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete donation',
            error: error.message
        });
    }
});

module.exports = router;

// ============================================
// In your main server file (app.js or server.js):
// ============================================
/*
const donationRoutes = require('./routes/donationRoutes');
app.use('/', donationRoutes);
*/