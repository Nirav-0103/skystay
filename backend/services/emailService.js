const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS, // Gmail App Password
  },
});

// ─── PDF GENERATION ───────────────────────────────────────────

const generateInvoicePDF = (booking, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fillColor('#0f172a').fontSize(24).text('SkyStay Premium Travel', 50, 50);
      doc.fontSize(10).fillColor('#64748b').text('Premium Hotel & Flight Booking Platform', 50, 80);
      
      doc.fontSize(18).fillColor('#0f172a').text('INVOICE', 450, 50, { align: 'right' });
      doc.fontSize(10).fillColor('#64748b').text(`#${booking.bookingId}`, 450, 75, { align: 'right' });

      doc.moveTo(50, 110).lineTo(550, 110).stroke('#e2e8f0');

      // Details
      doc.fillColor('#94a3b8').fontSize(10).text('BILLED TO', 50, 140);
      doc.fillColor('#0f172a').fontSize(12).text(user.name || 'Valued Guest', 50, 155);
      doc.fillColor('#64748b').fontSize(10).text(user.email, 50, 170);
      doc.text(user.phone || '', 50, 185);

      doc.fillColor('#94a3b8').fontSize(10).text('INVOICE DATE', 450, 140, { align: 'right' });
      doc.fillColor('#0f172a').fontSize(12).text(new Date().toLocaleDateString('en-IN'), 450, 155, { align: 'right' });
      doc.fillColor('#94a3b8').fontSize(10).text('PAYMENT METHOD', 450, 180, { align: 'right' });
      doc.fillColor('#0f172a').fontSize(10).text(booking.paymentMethod?.toUpperCase() || 'N/A', 450, 195, { align: 'right' });

      // Table Header
      doc.rect(50, 240, 500, 30).fill('#f8fafc');
      doc.fillColor('#94a3b8').fontSize(10).text('DESCRIPTION', 60, 250);
      doc.text('QTY/DURATION', 300, 250, { width: 100, align: 'center' });
      doc.text('AMOUNT', 450, 250, { width: 100, align: 'right' });

      // Table Row
      const isHotel = booking.bookingType === 'hotel';
      const description = isHotel ? `${booking.hotel?.name} (${booking.roomType})` : `Flight ${booking.flight?.flightNumber} (${booking.flight?.airline})`;
      const qty = isHotel ? `${booking.nights} Nights` : `${booking.passengers} Pax`;
      const amount = `INR ${booking.totalAmount?.toLocaleString('en-IN')}`;

      doc.fillColor('#0f172a').fontSize(11).text(description, 60, 285);
      doc.fontSize(10).fillColor('#64748b').text(isHotel ? `${booking.hotel?.city} · ${new Date(booking.checkIn).toLocaleDateString('en-IN')} to ${new Date(booking.checkOut).toLocaleDateString('en-IN')}` : `${booking.flight?.from} -> ${booking.flight?.to} · Dep: ${booking.flight?.departureTime}`, 60, 300);
      doc.fillColor('#0f172a').text(qty, 300, 285, { width: 100, align: 'center' });
      doc.text(amount, 450, 285, { width: 100, align: 'right' });

      doc.moveTo(50, 330).lineTo(550, 330).stroke('#f1f5f9');

      // Total
      doc.rect(350, 360, 200, 50).fill('#1a6ef5');
      doc.fillColor('#ffffff').fontSize(12).text('TOTAL AMOUNT', 365, 375);
      doc.fontSize(16).text(amount, 365, 390, { width: 170, align: 'right' });

      // Footer
      doc.fillColor('#94a3b8').fontSize(10).text('Thank you for choosing SkyStay!', 50, 700, { align: 'center', width: 500 });
      doc.text('This is a computer generated invoice and does not require a signature.', 50, 715, { align: 'center', width: 500 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ─── EMAIL TEMPLATES ───────────────────────────────────────────

const bookingConfirmedEmail = (booking, user) => {
  const isHotel = booking.bookingType === 'hotel';
  const name = user.name || 'Valued Guest';

  return {
    subject: `✅ Booking Confirmed! #${booking.bookingId} — SkyStay`,
    html: `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#0d1b2e 0%,#1a3a6e 60%,#1a6ef5 100%);padding:32px 36px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">✈️ SkyStay</div>
        </div>
        <div style="padding:36px;">
          <div style="background:#dcfce7;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <div style="font-weight:800;color:#166534;font-size:18px;">✅ Booking Confirmed!</div>
          </div>
          <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hi <strong>${name}</strong>, your booking is confirmed.</p>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px;">
            <div style="font-weight:700;font-size:13px;color:#94a3b8;margin-bottom:14px;">DETAILS</div>
            ${isHotel ? `Hotel: ${booking.hotel?.name}<br>Room: ${booking.roomType}` : `Flight: ${booking.flight?.flightNumber}<br>Airline: ${booking.flight?.airline}`}
          </div>
          <div style="background:#0f172a;color:white;padding:16px;border-radius:8px;text-align:center;">
            Booking ID: ${booking.bookingId} | Total: ₹${booking.totalAmount?.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </body>
    </html>`
  };
};

const bookingCancelledEmail = (booking, user) => {
  return {
    subject: `❌ Booking Cancelled #${booking.bookingId} — SkyStay`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #ef4444; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 24px;">Booking Cancelled</h2>
      </div>
      <div style="padding: 30px; color: #374151;">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your booking <strong>#${booking.bookingId}</strong> has been successfully cancelled as requested.</p>
        <p>If a refund is applicable per our policy, it will be processed to your original payment method within 5-7 business days.</p>
      </div>
    </div>`
  };
};

const welcomeEmailTemplate = (user) => {
  const name = user.name || 'Traveler';
  return {
    subject: `Welcome to SkyStay Premium, ${name}! ✨`,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #0d1b2e 0%, #1a6ef5 100%); padding: 50px 30px; text-align: center;">
        <div style="font-size: 32px; font-weight: 800; color: white; letter-spacing: -1px;">✈️ SkyStay</div>
        <p style="color: #bfdbfe; font-size: 16px; margin-top: 10px;">The Ultimate Luxury Travel Experience</p>
      </div>
      <div style="background: #ffffff; padding: 40px; text-align: center;">
        <h1 style="color: #0d1b2e; font-size: 24px; font-weight: 800; margin-top: 0;">Hello, ${name}!</h1>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Welcome to the world's most premium flight and hotel booking platform. We are thrilled to have you on board! Explore hand-picked luxury stays and fly faster with SkyStay.
        </p>
        <a href="https://skystay-frontend-dusky.vercel.app/" style="display: inline-block; background: #0d1b2e; color: #ffffff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13,27,46,0.3);">Explore Now</a>
      </div>
    </div>`
  };
};

const forgotPasswordEmailTemplate = (user, resetUrl) => {
  return {
    subject: `Security Alert: Reset Your Password — SkyStay`,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: #0f172a; padding: 24px; text-align: center;">
        <div style="font-size: 24px; font-weight: 800; color: white;">🛡️ SkyStay Security</div>
      </div>
      <div style="background: #ffffff; padding: 40px; text-align: center;">
        <h2 style="color: #0f172a; font-size: 22px; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
          Hi <strong>${user.name}</strong>,<br>We received a request to reset the password associated with your SkyStay account. If you made this request, please click the button below to set a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 30px;">
          If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.
        </p>
      </div>
    </div>`
  };
};

const walletTransactionEmailTemplate = (user, amount, balance) => {
  return {
    subject: `💳 SkyPay Wallet Top-Up Successful! (₹${amount})`,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      <div style="background: #fbbf24; padding: 30px; text-align: center;">
        <div style="font-size: 28px; font-weight: 900; color: #78350f;">SkyPay Wallet</div>
      </div>
      <div style="background: #ffffff; padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
        <h2 style="color: #0f172a; font-size: 24px; margin-top: 0;">Top-Up Successful</h2>
        <p style="color: #475569; font-size: 16px;">
          Hi <strong>${user.name}</strong>, your wallet has been successfully recharged using Razorpay.
        </p>
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px dashed #cbd5e1;">
          <div style="color: #64748b; font-size: 14px; font-weight: 600; margin-bottom: 5px;">AMOUNT ADDED</div>
          <div style="color: #10b981; font-size: 28px; font-weight: 800;">+ ₹${Number(amount).toLocaleString('en-IN')}</div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 14px;">Available Balance: </span>
            <span style="color: #0f172a; font-weight: 700; font-size: 16px;">₹${Number(balance).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>`
  };
};

// ─── SEND FUNCTIONS ────────────────────────────────────────────

exports.sendBookingConfirmed = async (booking, user) => {
  try {
    const { subject, html } = bookingConfirmedEmail(booking, user);
    await transporter.sendMail({ from: `"SkyStay" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
    console.log(`✅ Confirmation email sent → ${user.email}`);
  } catch (err) {
    console.error('❌ Email send failed (confirmed):', err.message);
  }
};

exports.sendBookingCancelled = async (booking, user) => {
  try {
    const { subject, html } = bookingCancelledEmail(booking, user);
    await transporter.sendMail({ from: `"SkyStay" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
    console.log(`✅ Cancellation email sent → ${user.email}`);
  } catch (err) {
    console.error('❌ Email send failed (cancelled):', err.message);
  }
};

exports.sendWelcomeEmail = async (user) => {
  try {
    const { subject, html } = welcomeEmailTemplate(user);
    await transporter.sendMail({ from: `"SkyStay" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
    console.log(`✅ Welcome email sent → ${user.email}`);
  } catch (err) {
    console.error('❌ Welcome email failed:', err.message);
  }
};

exports.sendForgotPasswordEmail = async (user, resetUrl) => {
  try {
    const { subject, html } = forgotPasswordEmailTemplate(user, resetUrl);
    await transporter.sendMail({ from: `"SkyStay Security" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
    console.log(`✅ Reset password email sent → ${user.email}`);
  } catch (err) {
    console.error('❌ Reset password email failed:', err.message);
  }
};

exports.sendBookingInvoice = async (booking, user) => {
  try {
    const { subject, html } = bookingInvoiceEmail(booking, user);
    const pdfBuffer = await generateInvoicePDF(booking, user);

    await transporter.sendMail({
      from: `"SkyStay Finance" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html,
      attachments: [{ filename: `SkyStay_Invoice_${booking.bookingId}.pdf`, content: pdfBuffer }]
    });
    console.log(`✅ Invoice email sent → ${user.email}`);
  } catch (err) {
    console.error('❌ Invoice email failed:', err.message);
  }
};

exports.sendWalletTransactionEmail = async (user, amount, balance) => {
  try {
    const { subject, html } = walletTransactionEmailTemplate(user, amount, balance);
    await transporter.sendMail({ 
      from: `"SkyPay Wallet" <${process.env.EMAIL_USER}>`, 
      to: user.email, 
      subject, 
      html 
    });
    console.log(`✅ Wallet transaction email sent → ${user.email}`);
  } catch (err) {
    console.error('❌ Wallet transaction email failed:', err.message);
  }
};

const bookingInvoiceEmail = (booking, user) => {
  return {
    subject: `🧾 Official Invoice: SkyStay #${booking.bookingId}`,
    html: `
    <div style="font-family: sans-serif; background: #f8fafc; padding: 40px; text-align: center;">
      <h2 style="color: #0f172a;">Your Invoice is Ready</h2>
      <p style="color: #475569;">Hi ${user.name}, thank you for booking with us! Please find your official PDF invoice attached above.</p>
    </div>`
  };
};
