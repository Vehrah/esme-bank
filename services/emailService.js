const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Port 587 uses STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);

// Verify SMTP connection when the server starts
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verify Error:", error);
  } else {
    console.log("✅ SMTP Server is ready.");
  }
});

// ================= EMAIL VERIFICATION =================

exports.sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;

  console.log("Preparing verification email...");
  console.log("Recipient:", email);
  console.log("Verification Link:", verificationLink);

  try {
    const info = await transporter.sendMail({
      from: `"ESM Bank" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your ESM Bank Account",
      html: `
        <h2>Welcome to ESM Bank</h2>

        <p>Thank you for creating an account.</p>

        <p>Please click the button below to verify your email address.</p>

        <a
          href="${verificationLink}"
          style="
            display:inline-block;
            padding:12px 24px;
            background:#facc15;
            color:#000;
            text-decoration:none;
            border-radius:6px;
            font-weight:bold;
          "
        >
          Verify Email
        </a>

        <p style="margin-top:20px;">
          This link expires in <strong>1 hour</strong>.
        </p>
      `,
    });

    console.log("✅ Verification email sent.");
    console.log(info);

    return info;
  } catch (error) {
    console.error("❌ Verification email failed:", error);
    throw error;
  }
};

// ================= RESET PASSWORD =================

exports.sendResetPasswordEmail = async (email, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

  console.log("Preparing password reset email...");

  try {
    const info = await transporter.sendMail({
      from: `"ESM Bank" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your ESM Bank Password",
      html: `
        <h2>Password Reset Request</h2>

        <p>We received a request to reset your password.</p>

        <a
          href="${resetLink}"
          style="
            display:inline-block;
            padding:12px 24px;
            background:#dc2626;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
            font-weight:bold;
          "
        >
          Reset Password
        </a>

        <p style="margin-top:20px;">
          This link expires in <strong>1 hour</strong>.
        </p>

        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      `,
    });

    console.log("✅ Password reset email sent.");
    console.log(info);

    return info;
  } catch (error) {
    console.error("❌ Password reset email failed:", error);
    throw error;
  }
};