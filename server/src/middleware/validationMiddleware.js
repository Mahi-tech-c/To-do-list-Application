const validateTaskPayload = (req, res, next) => {
  const { title, description, status } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Title is required and must be at least 2 characters.'
    });
  }

  if (description && typeof description !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Description must be a string.'
    });
  }

  if (status && !['pending', 'in-progress', 'completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be one of: pending, in-progress, completed.'
    });
  }

  next();
};

const validateAuthPayload = (req, res, next) => {
  const { name, email, password } = req.body;

  if (req.path === '/register') {
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters.'
      });
    }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required.'
    });
  }

  if (!password || password.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be at least 6 characters.'
    });
  }

  next();
};

module.exports = { validateTaskPayload, validateAuthPayload };
