const createTransporter = require('../config/email');
const { compileTemplate } = require('./emailTemplates');

const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    const html = compileTemplate(template, data);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // Don't throw — email failure shouldn't break the flow
    return null;
  }
};

module.exports = sendEmail;
