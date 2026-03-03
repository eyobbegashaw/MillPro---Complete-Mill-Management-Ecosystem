const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      req.user = user;
      next();
      
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
    
  } catch (error) {
    next(error);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};
exports.isAny = (req, res, next) => {
  // 1. መጀመሪያ 'protect' የሚለው ሚድልዌር ተጠቃሚው መሆኑን ያረጋግጣል (req.user ይፈጥራል)
  // 2. 'isAny' ደግሞ ተጠቃሚው መኖሩን ብቻ አይቶ ያሳልፋል
  if (req.user) {
    return next(); // "እሺ ሎጊን አድርገሃል፣ እለፍ" ይለዋል
  }
  
  // 3. ካልገባ ግን ይሄን መልዕክት ይሰጣል
  return res.status(401).json({ message: 'እባክዎ መጀመሪያ ይግቡ' });
};