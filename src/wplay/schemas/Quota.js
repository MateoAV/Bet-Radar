import mongoose from 'mongoose';

export const quotaSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    description: String,
    match_id: mongoose.Schema.Types.ObjectId,
    odds: [{
        oddType: {type: String},
        oddPrice: {type: String},
    }],
    metadata: {
        src : String,
    },
    timestamp: Date
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes',
    }
})