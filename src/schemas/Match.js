import mongoose from 'mongoose';


export const matchSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    category: String,

    date: Date,

    eventURL: String,

    live: Boolean,

    homeTeam: String,

    awayTeam: String,

    quotas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quota' }],

    slug : String,

    wPlayID : String
});