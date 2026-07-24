const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// ================= EMAIL VERIFICATION =================
exports.sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `${process.env.CLIENT_URL}/verify-email/${token}`;

  console.log("Preparing email...");

  const mailOptions = {
    from: `"ESM Bank" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your ESM Bank Account",
    html: `
      <h2>Welcome to ESM Bank</h2>
      <a href="${verificationLink}">Verify Email</a>
    `,
  };

  console.log("Calling transporter.sendMail()...");

  const info = await transporter.sendMail(mailOptions);

  console.log("sendMail finished.");
  console.log(info);

  return info;
};

// exports.sendVerificationEmail = async (email, token) => {
//   const verificationLink =
//     `${process.env.CLIENT_URL}/verify-email/${token}`;
//     console.log("About to send email...");
     
//      const info = await transporter.sendMail({
//     from: `"ESM Bank" <${process.env.SMTP_USER}>`,
//     to: email,
//     subject: "Verify your ESM Bank Account",
//     html: `
//       <h2>Welcome to ESM Bank</h2>

//       <p>Click the button below to verify your email address.</p>

//       <a
//         href="${verificationLink}"
//         style="
//           display:inline-block;
//           padding:12px 20px;
//           background:#facc15;
//           color:#000;
//           text-decoration:none;
//           border-radius:6px;
//           font-weight:bold;
//         "
//       >
//         Verify Email
//       </a>

//       <p>This link expires in 1 hour.</p>
//     `,
//   });
//   console.log("Email sent:", info);
// };

// ================= RESET PASSWORD =================

exports.sendResetPasswordEmail = async (email, token) => {
  const resetLink =
    `${process.env.CLIENT_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: `"ESM Bank" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your ESM Bank password",
    html: `
      <h2>Password Reset Request</h2>

      <p>We received a request to reset your password.</p>

      <p>If you made this request, click the button below.</p>

      <a
        href="${resetLink}"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#dc2626;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
          font-weight:bold;
        "
      >
        Reset Password
      </a>

      <p>This link expires in 1 hour.</p>

      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `,
  });
};