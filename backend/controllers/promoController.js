const PromoCode = require('../models/PromoCode');

exports.validatePromo = async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) {
      return res.status(400).json({ success: false, message: 'Code and amount required' });
    }

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) return res.status(404).json({ success: false, message: 'Invalid promo code' });
    if (!promo.isActive) return res.status(400).json({ success: false, message: 'Promo code is inactive' });
    if (new Date() > promo.expiryDate) return res.status(400).json({ success: false, message: 'Promo code has expired' });
    if (promo.timesUsed >= promo.usageLimit) return res.status(400).json({ success: false, message: 'Promo code limit reached' });
    if (amount < promo.minBookingAmount) return res.status(400).json({ success: false, message: `Minimum booking amount is ₹${promo.minBookingAmount}` });

    let discount = Math.floor((amount * promo.discountPercentage) / 100);
    if (discount > promo.maxDiscount) discount = promo.maxDiscount;

    res.json({ success: true, discount, message: 'Promo code applied successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
