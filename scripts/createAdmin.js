require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Profile = require('../modules/profile/profile.model');
const Role = require('../modules/roles/role.model');
const Counter = require('../utils/counter.model');
const getNextSequence = require('../utils/counter');

const createAdmin = async () => {
    const name = process.env.ADMIN_NAME || 'Administrator';
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
    if (!email) throw new Error('ADMIN_EMAIL is required');
    if (!password || password.length < 12) {
        throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('ADMIN_PASSWORD must not exceed 72 bytes');
    }

    await mongoose.connect(process.env.MONGO_URI);

    if (await Profile.exists({ email })) {
        throw new Error(`A profile already exists for ${email}; refusing to change its access`);
    }

    let adminRole = await Role.findOne({ name: 'ADMIN' });
    if (!adminRole) {
        const latestRole = await Role.findOne().sort({ id: -1 }).select('id').lean();
        const roleCounter = await Counter.findById('role');
        if (!roleCounter || roleCounter.seq < (latestRole?.id || 0)) {
            await Counter.findOneAndUpdate(
                { _id: 'role' },
                { $max: { seq: latestRole?.id || 0 } },
                { upsert: true }
            );
        }
        adminRole = await Role.create({
            id: await getNextSequence('role'),
            name: 'ADMIN',
            description: 'Administrator access',
            isActive: true
        });
    }

    if (!adminRole.isActive) throw new Error('The ADMIN role is inactive');

    const latestProfile = await Profile.findOne().sort({ id: -1 }).select('id').lean();
    const profileCounter = await Counter.findById('profile');
    if (!profileCounter || profileCounter.seq < (latestProfile?.id || 0)) {
        await Counter.findOneAndUpdate(
            { _id: 'profile' },
            { $max: { seq: latestProfile?.id || 0 } },
            { upsert: true }
        );
    }

    const profile = await Profile.create({
        id: await getNextSequence('profile'),
        name,
        email,
        age: 30,
        designation: 'Administrator',
        role: adminRole.id,
        passwordHash: await bcrypt.hash(password, 12),
        emailVerifiedAt: new Date()
    });

    console.log(`Admin account created for ${profile.email} (profile ID ${profile.id}).`);
};

createAdmin()
    .catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
