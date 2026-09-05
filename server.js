require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/database');
const profileRoutes = require('./modules/profile/profile.routes');
const errorHandler = require('./utils/errorHandler');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/profile', profileRoutes);

// Health check
app.get('/', (req, res) => {
    res.status(200).json({
        code: 200,
        success: true,
        message: 'Node Server Running',
        data: null
    });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});