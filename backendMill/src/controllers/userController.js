const User = require('../models/User');
const Customer = require('../models/Customer');
const Operator = require('../models/Operator');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const fileService = require('../services/fileService');
const notificationService = require('../services/notificationService');

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isActive,
      search 
    } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get role-specific data
    let roleData = null;
    if (user.role === 'customer') {
      roleData = await Customer.findOne({ user: user._id });
    } else if (user.role === 'operator') {
      roleData = await Operator.findOne({ user: user._id })
        .populate('assignedOrders', 'orderNumber status');
    } else if (user.role === 'driver') {
      roleData = await Driver.findOne({ user: user._id })
        .populate('assignedDeliveries');
    } else if (user.role === 'admin') {
      roleData = await Admin.findOne({ user: user._id });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        roleData
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    // Get role-specific data
    let roleData = null;
    if (user.role === 'customer') {
      roleData = await Customer.findOne({ user: user._id })
        .populate('favorites.product', 'name price image')
        .populate('cart.product', 'name price image millingFee');
    } else if (user.role === 'operator') {
      roleData = await Operator.findOne({ user: user._id });
    } else if (user.role === 'driver') {
      roleData = await Driver.findOne({ user: user._id });
    } else if (user.role === 'admin') {
      roleData = await Admin.findOne({ user: user._id });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        roleData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, backupPhone, address, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (backupPhone) user.backupPhone = backupPhone;
    if (address) user.address = address;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    user.updatedAt = new Date();
    await user.save();

    // Update role-specific data if needed
    if (user.role === 'customer') {
      await Customer.findOneAndUpdate(
        { user: user._id },
        { 
          defaultAddress: address ? { address } : undefined,
          'preferences.notifications': preferences?.notifications
        }
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Delete old avatar if exists
    const user = await User.findById(req.user.id);
    if (user.profilePicture && !user.profilePicture.includes('ui-avatars.com')) {
      await fileService.deleteFile(user.profilePicture);
    }

    // Save new avatar
    const imageData = await fileService.saveImage(req.file, 'avatars', {
      resize: { width: 200, height: 200 },
      quality: 80
    });

    user.profilePicture = imageData.filePath;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl: imageData.filePath }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive, address } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role && req.user.role === 'admin') user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (address) user.address = address;

    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete role-specific data
    if (user.role === 'customer') {
      await Customer.deleteOne({ user: user._id });
    } else if (user.role === 'operator') {
      await Operator.deleteOne({ user: user._id });
    } else if (user.role === 'driver') {
      await Driver.deleteOne({ user: user._id });
    } else if (user.role === 'admin') {
      await Admin.deleteOne({ user: user._id });
    }

    // Delete avatar if exists
    if (user.profilePicture && !user.profilePicture.includes('ui-avatars.com')) {
      await fileService.deleteFile(user.profilePicture);
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Notify user if they're being deactivated
    if (!user.isActive) {
      await notificationService.createNotification({
        userId: user._id,
        title: 'Account Deactivated',
        message: 'Your account has been deactivated. Please contact admin for more information.',
        type: 'system',
        priority: 'high'
      });
    }

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status'
    });
  }
};

// Get activity log
exports.getActivityLog = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // This would need an ActivityLog model
    // For now, return mock data
    const activities = [
      {
        action: 'Login',
        timestamp: new Date(),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      },
      {
        action: 'Order Placed',
        timestamp: new Date(Date.now() - 3600000),
        details: 'Order #ORD-2401-001'
      },
      {
        action: 'Profile Updated',
        timestamp: new Date(Date.now() - 86400000)
      }
    ];

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        pages: Math.ceil(activities.length / limit)
      }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity log'
    });
  }
};

// Get user stats (admin only)
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactive: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const newToday = await User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    res.json({
      success: true,
      data: {
        byRole: stats,
        total: totalUsers,
        newToday,
        newThisMonth
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats'
    });
  }
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find({ role, isActive: true })
      .select('name email phone profilePicture')
      .sort('name')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({ role, isActive: true });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users by role'
    });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { q, role } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name email phone role profilePicture isActive')
      .limit(20);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

// Export users (admin only)
exports.exportUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .lean();

    const exportData = users.map(u => ({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastActive: u.lastActive
    }));

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users'
    });
  }
};

// Get online users
exports.getOnlineUsers = async (req, res) => {
  try {
    // This would typically come from socket.io
    // For now, return users active in last 15 minutes
    const onlineUsers = await User.find({
      lastActive: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
    }).select('name email role profilePicture');

    res.json({
      success: true,
      data: onlineUsers
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online users'
    });
  }
};

// Bulk update users
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !userIds.length || !updates) {
      return res.status(400).json({
        success: false,
        message: 'User IDs and updates are required'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users`,
      data: result
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update users'
    });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Handle role-specific data migration
    if (oldRole !== role) {
      // Delete old role data
      if (oldRole === 'customer') await Customer.deleteOne({ user: user._id });
      if (oldRole === 'operator') await Operator.deleteOne({ user: user._id });
      if (oldRole === 'driver') await Driver.deleteOne({ user: user._id });
      if (oldRole === 'admin') await Admin.deleteOne({ user: user._id });

      // Create new role data
      if (role === 'customer') {
        await Customer.create({ user: user._id });
      } else if (role === 'operator') {
        await Operator.create({ 
          user: user._id,
          currentStatus: 'offline'
        });
      } else if (role === 'driver') {
        await Driver.create({ 
          user: user._id,
          status: 'offline'
        });
      } else if (role === 'admin') {
        await Admin.create({ 
          user: user._id,
          secretKey: Math.random().toString(36).substring(2, 15)
        });
      }
    }

    // Notify user
    await notificationService.createNotification({
      userId: user._id,
      title: 'Role Updated',
      message: `Your account role has been updated to ${role}`,
      type: 'system',
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { role }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};