
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const sendResetEmail = async (email, link) => {
  await  resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset Your Password",
    html: `
      <h3>Password Reset</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
};

module.exports = sendResetEmail;
