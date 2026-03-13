const Notification = require('../models/Notification');

const createNotification = async ({ user, type, title, message, link }) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      link,
    });
    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return null;
  }
};

module.exports = createNotification;
