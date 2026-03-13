const handlebars = require('handlebars');

const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Manager</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: #e0e7ff; margin: 5px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .body h2 { color: #1e293b; font-size: 20px; margin-top: 0; }
    .body p { color: #475569; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 15px 0; }
    .otp-box { background-color: #f1f5f9; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-box .otp { font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 8px; }
    .otp-box p { color: #64748b; font-size: 13px; margin-top: 8px; }
    .info-box { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; border-radius: 0 8px 8px 0; margin: 15px 0; }
    .info-box p { margin: 5px 0; color: #334155; font-size: 14px; }
    .info-box strong { color: #1e293b; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 3px 0; }
    .divider { height: 1px; background-color: #e2e8f0; margin: 20px 0; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>🏠 Property Manager</h1>
        <p>Your Trusted Property Management Platform</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Property Manager. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const templates = {
  welcome: baseLayout(`
    <h2>Welcome, {{firstName}}! 🎉</h2>
    <p>Thank you for joining Property Manager. We're excited to have you on board!</p>
    <p>Your account has been created successfully as a <strong>{{role}}</strong>.</p>
    <div class="divider"></div>
    <p>To get started, please verify your email address by clicking the button below:</p>
    <div style="text-align: center;">
      <a href="{{verificationLink}}" class="btn">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">This link will expire in 24 hours.</p>
  `),

  emailVerification: baseLayout(`
    <h2>Verify Your Email 📧</h2>
    <p>Hi {{firstName}},</p>
    <p>Please click the button below to verify your email address:</p>
    <div style="text-align: center;">
      <a href="{{verificationLink}}" class="btn">Verify Email</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">If you didn't create an account, please ignore this email.</p>
  `),

  otpEmail: baseLayout(`
    <h2>Password Reset OTP 🔐</h2>
    <p>Hi {{firstName}},</p>
    <p>You requested a password reset. Use the OTP below to proceed:</p>
    <div class="otp-box">
      <div class="otp">{{otp}}</div>
      <p>This OTP expires in 10 minutes</p>
    </div>
    <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
  `),

  passwordResetConfirmation: baseLayout(`
    <h2>Password Reset Successful ✅</h2>
    <p>Hi {{firstName}},</p>
    <p>Your password has been reset successfully. You can now log in with your new password.</p>
    <div style="text-align: center;">
      <a href="{{loginLink}}" class="btn">Go to Login</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">If you didn't make this change, please contact our support immediately.</p>
  `),

  bookingReceived: baseLayout(`
    <h2>New Booking Request 📋</h2>
    <p>Hi {{ownerName}},</p>
    <p>You have received a new booking request for your property:</p>
    <div class="info-box">
      <p><strong>Property:</strong> {{propertyTitle}}</p>
      <p><strong>Booking Type:</strong> {{bookingType}}</p>
      <p><strong>Tenant:</strong> {{tenantName}}</p>
      <p><strong>Contact:</strong> {{tenantEmail}}</p>
      {{#if visitDate}}<p><strong>Visit Date:</strong> {{visitDate}}</p>{{/if}}
      {{#if moveInDate}}<p><strong>Move-in Date:</strong> {{moveInDate}}</p>{{/if}}
    </div>
    <div style="text-align: center;">
      <a href="{{dashboardLink}}" class="btn">View Request</a>
    </div>
  `),

  bookingApproved: baseLayout(`
    <h2>Booking Approved! 🎉</h2>
    <p>Hi {{tenantName}},</p>
    <p>Great news! Your booking request has been approved:</p>
    <div class="info-box">
      <p><strong>Property:</strong> {{propertyTitle}}</p>
      <p><strong>Booking Type:</strong> {{bookingType}}</p>
      {{#if moveInDate}}<p><strong>Move-in Date:</strong> {{moveInDate}}</p>{{/if}}
      <p><strong>Owner Contact:</strong> {{ownerPhone}}</p>
    </div>
    <div style="text-align: center;">
      <a href="{{dashboardLink}}" class="btn">View Details</a>
    </div>
  `),

  bookingRejected: baseLayout(`
    <h2>Booking Update 😔</h2>
    <p>Hi {{tenantName}},</p>
    <p>Unfortunately, your booking request has been declined:</p>
    <div class="info-box">
      <p><strong>Property:</strong> {{propertyTitle}}</p>
      <p><strong>Reason:</strong> {{rejectionReason}}</p>
    </div>
    <p>Don't worry! There are plenty of other great properties available.</p>
    <div style="text-align: center;">
      <a href="{{browseLink}}" class="btn">Browse Properties</a>
    </div>
  `),

  maintenanceAssigned: baseLayout(`
    <h2>New Task Assigned 🔧</h2>
    <p>Hi {{workerName}},</p>
    <p>You have been assigned a new maintenance task:</p>
    <div class="info-box">
      <p><strong>Property:</strong> {{propertyTitle}}</p>
      <p><strong>Issue:</strong> {{title}}</p>
      <p><strong>Category:</strong> {{category}}</p>
      <p><strong>Priority:</strong> {{priority}}</p>
      <p><strong>Description:</strong> {{description}}</p>
    </div>
    <div style="text-align: center;">
      <a href="{{dashboardLink}}" class="btn">View Task</a>
    </div>
  `),

  maintenanceCompleted: baseLayout(`
    <h2>Maintenance Completed ✅</h2>
    <p>Hi {{tenantName}},</p>
    <p>Your maintenance request has been resolved:</p>
    <div class="info-box">
      <p><strong>Issue:</strong> {{title}}</p>
      <p><strong>Worker Notes:</strong> {{workerNotes}}</p>
      <p><strong>Completed At:</strong> {{completedAt}}</p>
    </div>
    <p>If the issue persists, please raise a new maintenance request.</p>
  `),

  propertyApproved: baseLayout(`
    <h2>Property Listing Approved! 🎉</h2>
    <p>Hi {{ownerName}},</p>
    <p>Your property listing has been approved and is now live:</p>
    <div class="info-box">
      <p><strong>Property:</strong> {{propertyTitle}}</p>
      <p><strong>Type:</strong> {{propertyType}}</p>
      <p><strong>Listing:</strong> {{listingType}}</p>
    </div>
    <div style="text-align: center;">
      <a href="{{propertyLink}}" class="btn">View Listing</a>
    </div>
  `),

  propertyRejected: baseLayout(`
    <h2>Property Listing Update 📝</h2>
    <p>Hi {{ownerName}},</p>
    <p>Your property listing was not approved:</p>
    <div class="info-box">
      <p><strong>Property:</strong> {{propertyTitle}}</p>
      <p><strong>Reason:</strong> {{rejectionReason}}</p>
    </div>
    <p>Please update your listing and resubmit for approval.</p>
    <div style="text-align: center;">
      <a href="{{dashboardLink}}" class="btn">Edit & Resubmit</a>
    </div>
  `),
};

const compileTemplate = (templateName, data) => {
  const templateSource = templates[templateName];
  if (!templateSource) {
    throw new Error(`Email template '${templateName}' not found`);
  }
  const compiled = handlebars.compile(templateSource);
  return compiled(data);
};

module.exports = { templates, compileTemplate };
