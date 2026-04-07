const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS, // Gmail App Password
  },
});

// ─── PDF GENERATION ───────────────────────────────────────────

const generateInvoicePDF = (booking, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Generate QR
      const qrData = JSON.stringify({ id: booking.bookingId, user: user.email });
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 100, margin: 1 });

      const isHotel = booking.bookingType === 'hotel';
      
      // Draw Ticket Background
      doc.rect(40, 40, 515, 230).fillAndStroke('#ffffff', '#e2e8f0');
      doc.rect(40, 40, 515, 45).fill('#0f172a'); // top dark header

      doc.fillColor('#ffffff').fontSize(16).text(isHotel ? 'Luxury Hotel Voucher' : 'Premium Boarding Pass', 60, 55);
      doc.fontSize(12).text('SKYSTAY', 480, 58);

      // Details Setup
      const detailY = 110;
      doc.fillColor('#64748b').fontSize(9).text(isHotel ? 'GUEST' : 'PASSENGER', 60, detailY);
      doc.fillColor('#0f172a').fontSize(13).text(user.name?.toUpperCase() || 'VALUED GUEST', 60, detailY + 15);

      if (isHotel) {
        doc.fillColor('#64748b').fontSize(9).text('HOTEL', 60, detailY + 55);
        doc.fillColor('#0f172a').fontSize(11).text(booking.hotel?.name || 'SkyStay Hotel', 60, detailY + 70);

        doc.fillColor('#64748b').fontSize(9).text('CHECK-IN', 280, detailY + 55);
        doc.fillColor('#0f172a').fontSize(11).text(new Date(booking.checkIn).toLocaleDateString('en-IN'), 280, detailY + 70);

        doc.fillColor('#64748b').fontSize(9).text('ROOM TYPE', 60, detailY + 110);
        doc.fillColor('#0f172a').fontSize(11).text(booking.roomType || 'Standard', 60, detailY + 125);

        doc.fillColor('#64748b').fontSize(9).text('BOOKING ID', 280, detailY + 110);
        doc.fillColor('#0f172a').fontSize(13).text(booking.bookingId, 280, detailY + 122);
      } else {
        doc.fillColor('#64748b').fontSize(9).text('FLIGHT', 60, detailY + 55);
        doc.fillColor('#0f172a').fontSize(11).text(`${booking.flight?.airline || 'Airline'} ${booking.flight?.flightNumber || '000'}`, 60, detailY + 70);

        doc.fillColor('#64748b').fontSize(9).text('ROUTE', 280, detailY + 55);
        doc.fillColor('#0f172a').fontSize(11).text(`${booking.flight?.from || 'ORG'} ✈ ${booking.flight?.to || 'DST'}`, 280, detailY + 70);

        doc.fillColor('#64748b').fontSize(9).text('CLASS', 60, detailY + 110);
        doc.fillColor('#0f172a').fontSize(11).text(booking.seatClass || 'Economy', 60, detailY + 125);

        doc.fillColor('#64748b').fontSize(9).text('BOOKING ID', 280, detailY + 110);
        doc.fillColor('#0f172a').fontSize(13).text(booking.bookingId, 280, detailY + 122);
      }

      // Cutout Line
      doc.moveTo(420, 85).lineTo(420, 270).dash(5, { space: 5 }).stroke('#e2e8f0').undash();

      // Ensure ticket layout looks good
      doc.fillColor('#64748b').fontSize(8).text('SCAN VERIFY', 440, 100, { width: 100, align: 'center' });
      doc.image(qrBuffer, 440, 120, { width: 100 });
      doc.fillColor('#0f172a').fontSize(9).text('Valid Ticket ✅', 440, 235, { width: 100, align: 'center' });

      // Invoice Bottom Part
      doc.fillColor('#0f172a').fontSize(18).text('Payment Receipt', 40, 320);
      doc.moveTo(40, 350).lineTo(555, 350).stroke('#e2e8f0');
      
      doc.fillColor('#64748b').fontSize(10).text('TOTAL PAID AMOUNT', 40, 380);
      doc.fillColor('#10b981').fontSize(24).text(`INR ${booking.totalAmount?.toLocaleString('en-IN')}`, 40, 400);

      doc.fillColor('#64748b').fontSize(10).text('PAYMENT METHOD', 300, 380);
      doc.fillColor('#0f172a').fontSize(14).text((booking.paymentMethod || 'PAYMENT GATEWAY').toUpperCase(), 300, 405);
      
      doc.fillColor('#94a3b8').fontSize(10).text('This is a computer generated premium ticket from SkyStay.', 40, 780, { align: 'center', width: 515 });

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

const preTripEmailTemplate = (booking, user) => {
  const dest = booking.bookingType === 'hotel' ? booking.hotel?.city : booking.flight?.to;
  return {
    subject: `Your Journey to ${dest} starts tomorrow! 🧳`,
    html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #f8fafc; padding: 30px; border-radius: 12px;">
      <h2 style="color: #0f172a;">Pack your bags, ${user.name.split(' ')[0]}!</h2>
      <p style="color: #475569;">Your trip to <strong>${dest}</strong> is coming up in less than 24 hours.</p>
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <strong>Booking ID:</strong> #${booking.bookingId}<br/>
        <strong>Status:</strong> Confirmed ✅
      </div>
      <a href="https://skystay-frontend-dusky.vercel.app/bookings" style="display:inline-block; padding: 12px 24px; background: #1a6ef5; color: white; text-decoration: none; border-radius: 6px;">Manage Booking</a>
    </div>`
  };
};

const postTripEmailTemplate = (booking, user) => {
  return {
    subject: `Welcome Home, ${user.name.split(' ')[0]}! How was your trip? ⭐`,
    html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #f8fafc; padding: 30px; border-radius: 12px;">
      <h2 style="color: #0f172a;">Welcome Back!</h2>
      <p style="color: #475569;">We hope you had a fantastic luxury experience with SkyStay.</p>
      <p style="color: #475569;">As a valued traveler, your feedback helps us elevate our services.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://skystay-frontend-dusky.vercel.app/bookings" style="font-size: 24px; text-decoration: none; letter-spacing: 4px;">⭐⭐⭐⭐⭐</a>
      </div>
      <p style="color: #475569; font-size: 13px;">Leave a 5-star review and earn extra SkyPoints on your next booking!</p>
    </div>`
  };
};

const abandonedCartEmailTemplate = (booking, user) => {
  const item = booking.bookingType === 'hotel' ? booking.hotel?.name : `Flight to ${booking.flight?.to}`;
  return {
    subject: `You left something behind! Complete your booking ⏳`,
    html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #f8fafc; padding: 30px; border-radius: 12px;">
      <h2 style="color: #0f172a;">Still thinking about it?</h2>
      <p style="color: #475569;">Hi ${user.name}, you started a booking for <strong>${item}</strong> but didn't complete the payment.</p>
      <p style="color: #ef4444; font-weight: bold;">Rooms and seats are filling up fast!</p>
      <a href="https://skystay-frontend-dusky.vercel.app/profile" style="display:inline-block; padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Complete Your Booking Now</a>
    </div>`
  };
};

exports.sendPreTripReminder = async (booking, user) => {
  try {
    const { subject, html } = preTripEmailTemplate(booking, user);
    await transporter.sendMail({ from: `"SkyStay Concierge" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
  } catch (err) { console.error('PreTrip email failed:', err.message); }
};

exports.sendPostTripReview = async (booking, user) => {
  try {
    const { subject, html } = postTripEmailTemplate(booking, user);
    await transporter.sendMail({ from: `"SkyStay Experience" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
  } catch (err) { console.error('PostTrip email failed:', err.message); }
};

exports.sendAbandonedCartReminder = async (booking, user) => {
  try {
    const { subject, html } = abandonedCartEmailTemplate(booking, user);
    await transporter.sendMail({ from: `"SkyStay Booking" <${process.env.EMAIL_USER}>`, to: user.email, subject, html });
  } catch (err) { console.error('AbandonedCart email failed:', err.message); }
};
