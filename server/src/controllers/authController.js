const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let memoryUsers = [
  {
    id: 'demo-user',
    name: 'Demo User',
    email: 'admin@flow.com',
    password: '$2a$10$jWe8HfYAEtcJI4tjTjJRyuP9p9nlsVJsmQzIAn/wmpcIFNChSWsv6'
  }
];

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email },
    process.env.JWT_SECRET || 'development-secret',
    { expiresIn: '7d' }
  );
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!process.env.MONGO_URI) {
      const existing = memoryUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email.'
        });
      }

      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: await bcrypt.hash(password, 10)
      };

      memoryUsers.push(newUser);

      const { password: _password, ...publicUser } = newUser;

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: generateToken(newUser),
        user: publicUser
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    const resultUser = newUser.toObject();
    delete resultUser.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: generateToken(newUser),
      user: resultUser
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!process.env.MONGO_URI) {
      const user = memoryUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const { password: _password, ...publicUser } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: generateToken(user),
        user: publicUser
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(user),
      user: userObject
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, memoryUsers };
