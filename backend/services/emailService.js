const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
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
    html: `<h1>Booking Cancelled</h1><p>Hi ${user.name}, your booking #${booking.bookingId} has been cancelled.</p>`
  };
};

const welcomeEmailTemplate = (user) => {
  const name = user.name || 'Traveler';
  return {
    subject: `👋 Welcome to SkyStay, ${name}!`,
    html: `<h1>Welcome to SkyStay, ${name}!</h1><p>We are glad to have you with us.</p>`
  };
};

const forgotPasswordEmailTemplate = (user, resetUrl) => {
  return {
    subject: `🔑 Reset Your Password — SkyStay`,
    html: `<p>Hi ${user.name}, click <a href="${resetUrl}">here</a> to reset your password.</p>`
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
      from: `"SkyStay" <${process.env.EMAIL_USER}>`,
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

const bookingInvoiceEmail = (booking, user) => {
  return {
    subject: `🧾 Order Invoice — SkyStay #${booking.bookingId}`,
    html: `<p>Hi ${user.name}, please find your invoice attached for booking #${booking.bookingId}.</p>`
  };
};
