const mongoose = require('mongoose');

// Middleware to validate Mongoose ObjectId parameters in URI requests
const validateObjectId = (paramNames = ['id']) => {
  return (req, res, next) => {
    for (const name of paramNames) {
      const val = req.params[name];
      if (val && !mongoose.Types.ObjectId.isValid(val)) {
        return res.status(400).json({
          success: false,
          message: `Invalid resource identifier format: ${name}`,
        });
      }
    }
    next();
  };
};

module.exports = {
  validateObjectId,
};
