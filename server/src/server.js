const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const clientPath = path.resolve(__dirname, '../../client');

app.use(cors());
app.use(express.json());

app.use('/node_modules', express.static(path.resolve(__dirname, '../../node_modules')));
app.use(express.static(clientPath));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Service is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
