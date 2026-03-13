const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
};

const generateResetToken = (userId) => {
  return jwt.sign({ id: userId, purpose: 'password-reset' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '10m',
  });
};

const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ id: userId, purpose: 'email-verify' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '24h',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  generateEmailVerificationToken,
  verifyAccessToken,
  verifyRefreshToken,
};
