const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Reward User for Clicking a Link
router.post("/reward", async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.balance += 0.2; // Add ₹0.2 per visit
    await user.save();
    res.json({ message: "Reward added", balance: user.balance });
});

// Withdraw Earnings
router.post("/withdraw", async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user || user.balance < 10) return res.status(400).json({ message: "Not enough balance" });

    user.balance = 0; // Reset balance after withdrawal
    await user.save();
    res.json({ message: "Withdrawal request sent" });
});

module.exports = router;
