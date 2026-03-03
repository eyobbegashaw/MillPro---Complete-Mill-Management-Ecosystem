const User = require('../models/User');
const Driver = require('../models/Driver');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Google OAuth Login/Register
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name, picture, sub: googleId } = ticket.getPayload();
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Check if this is an admin email (you can customize this logic)
      const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'customer';
      
      user = new User({
        googleId,
        email,
        name,
        profilePicture: picture,
        role
      });
      
      await user.save();
      
      // If driver role, create driver profile
      if (role === 'driver') {
        await Driver.create({
          user: user._id,
          status: 'offline'
        });
      }
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.profilePicture = picture || user.profilePicture;
      await user.save();
    }
    
    const jwtToken = generateToken(user);
    
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Local Login
exports.localLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      role: role || 'customer'
    });
    
    await user.save();
    
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed' 
    });
  }
};
 
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Find user with this refresh token and remove it
      const user = await User.findOne({ refreshToken });
      
      if (user) {
        user.refreshToken = null;
        await user.save();
        
        logger.info(`User logged out: ${user.email}`);
      }
    }

    // Clear cookie if using cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.id, 
      refreshToken,
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

/**
 * Forgot password - send reset email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist (security)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save to user document
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - MillPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">MillPro Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">MillPro Management System</p>
        </div>
      `
    });

    logger.info(`Password reset email sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
};

/**
 * Reset password with token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = null; // Invalidate all existing sessions
    
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Successful - MillPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Password Reset Successful</h2>
          <p>Hello ${user.name},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't perform this action, please contact support immediately.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">MillPro Management System</p>
        </div>
      `
    });

    logger.info(`Password reset successful for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// /**
//  * Verify email with token
//  */
// exports.verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.params;

//     if (!token) {
//       return res.status(400).json({
//         success: false,
//         message: 'Verification token required'
//       });
//     }

//     const hashedToken = crypto
//       .createHash('sha256')
//       .update(token)
//       .digest('hex');

//     const user = await User.findOne({
//       emailVerificationToken: hashedToken,
//       emailVerificationExpires: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email verification token is invalid or has expired'
//       });
//     }

//     user.isEmailVerified = true;
//     user.emailVerificationToken = undefined;
//     user.emailVerificationExpires = undefined;
//     await user.save();

//     logger.info(`Email verified for: ${user.email}`);

//     res.status(200).json({
//       success: true,
//       message: 'Email verified successfully'
//     });
//   } catch (error) {
//     logger.error('Email verification error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error verifying email',
//       error: error.message
//     });
//   }
// };

// /**
//  * Resend verification email
//  */
// exports.resendVerification = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email is required'
//       });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     if (user.isEmailVerified) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email already verified'
//       });
//     }

//     // Generate new verification token
//     const verificationToken = crypto.randomBytes(32).toString('hex');
//     const hashedToken = crypto
//       .createHash('sha256')
//       .update(verificationToken)
//       .digest('hex');

//     user.emailVerificationToken = hashedToken;
//     user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
//     await user.save();

//     const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

//     await sendEmail({
//       to: user.email,
//       subject: 'Verify Your Email - MillPro',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #4CAF50;">Email Verification</h2>
//           <p>Hello ${user.name},</p>
//           <p>Please verify your email address by clicking the button below:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${verificationUrl}" 
//                style="background-color: #4CAF50; color: white; padding: 12px 30px; 
//                       text-decoration: none; border-radius: 5px; display: inline-block;">
//               Verify Email
//             </a>
//           </div>
//           <p>This link will expire in 24 hours.</p>
//           <hr>
//           <p style="color: #666; font-size: 12px;">MillPro Management System</p>
//         </div>
//       `
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Verification email sent'
//     });
//   } catch (error) {
//     logger.error('Resend verification error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending verification email',
//       error: error.message
//     });
//   }
// };
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};