require('dotenv').config();

const mongoose = require('mongoose');
const Profile = require('../modules/profile/profile.model');

const backfillEmailVerification = async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

    await mongoose.connect(process.env.MONGO_URI);
    const verifiedAt = new Date();
    const result = await Profile.updateMany(
        { emailVerifiedAt: { $exists: false } },
        { $set: { emailVerifiedAt: verifiedAt } }
    );

    console.log(`Marked ${result.modifiedCount} existing profiles as verified.`);
};

backfillEmailVerification()
    .catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
