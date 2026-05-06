const router = require('express').Router();
const { sendTestEmail } = require('../utils/email');

router.post('/test-email', async (req, res) => {
    try {
        const result = await sendTestEmail();
        if (result.skipped) {
            return res.status(500).json({
                success: false,
                message: result.reason
            });
        }

        return res.json({
            success: true,
            message: `Test email sent successfully to ${result.to}.`
        });
    } catch (err) {
        console.error('POST /api/test-email failed:', err);
        return res.status(500).json({
            success: false,
            message: `Failed to send test email: ${err.message}`
        });
    }
});

module.exports = router;
