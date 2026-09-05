const Counter = require('./counter.model');

const getNextSequence = async (sequenceName) => {
    const counter = await Counter.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },
        {
            new: true,
            upsert: true
        }
    );

    return counter.seq;
};

module.exports = getNextSequence;