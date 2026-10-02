require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/database');
const profileRoutes = require('./modules/profile/profile.routes');
const roleRoutes = require('./modules/roles/role.routes');
const authRoutes = require('./modules/auth/auth.routes');
const errorHandler = require('./utils/errorHandler');


const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/role', roleRoutes);

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
