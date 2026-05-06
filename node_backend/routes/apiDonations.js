const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');

// Generate unique reference
const generateReference = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PAY-';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// 1. Initiate Payment
router.post('/initiate', async (req, res) => {
    try {
        const { donor_name, donor_email, phone, amount, currency, payment_method, message } = req.body;
        
        if (!donor_name || !donor_email || !amount || !currency || !payment_method) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const reference = generateReference();
        const donation_date = new Date().toISOString().split('T')[0];

        const donationData = {
            donor_name: donor_name.trim(),
            donor_email: donor_email.trim(),
            phone: phone ? phone.trim() : null,
            donation_type: 'Cash',
            currency,
            payment_method,
            amount: parseFloat(amount),
            item_description: null,
            message: message ? message.trim() : null,
            donation_date,
            reference,
            status: 'pending'
        };

        const insertId = await Donation.create(donationData);

        return res.status(200).json({
            success: true,
            data: {
                id: insertId,
                reference,
                amount: donationData.amount,
                currency: donationData.currency,
                donor_email: donationData.donor_email
            }
        });

    } catch (err) {
        console.error("Initiate Payment Error:", err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// 2. Process Simulated Webhook / Callback
router.post('/process', async (req, res) => {
    try {
        const { reference, simulatedStatus } = req.body;
        
        if (!reference || !simulatedStatus) {
            return res.status(400).json({ success: false, message: 'Missing reference or status' });
        }

        const donation = await Donation.findByReference(reference);
        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found' });
        }

        if (donation.status === 'successful') {
            return res.status(400).json({ success: false, message: 'Payment already processed' });
        }

        let dbStatus = 'pending';
        let paid_at = null;
        
        if (simulatedStatus === 'success') {
            dbStatus = 'successful';
            // Current datetime in MySQL format using localized or UTC mapping
            paid_at = new Date().toISOString().slice(0, 19).replace('T', ' '); 
        } else if (simulatedStatus === 'fail') {
            dbStatus = 'failed';
        } else if (simulatedStatus === 'awaiting') {
            dbStatus = 'awaiting_confirmation';
        }

        await Donation.updateStatus(reference, dbStatus, paid_at);

        return res.status(200).json({
            success: true,
            message: `Payment status updated to ${dbStatus}`,
            status: dbStatus,
            reference
        });

    } catch (err) {
        console.error("Process Payment Error:", err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
