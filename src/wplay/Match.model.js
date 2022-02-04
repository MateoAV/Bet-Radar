import mongoose from 'mongoose';
import { matchSchema } from './schemas/Match.js'
import { quotaSchema } from './schemas/Quota.js';

export const Quota = mongoose.model('Quota', quotaSchema);
export const Match = mongoose.model('Match', matchSchema);

export async function addMatch(newMatch){
    try{
        const match = await findMatch(newMatch);
        if(match){
            match.quotas = newMatch.quotas;
            match.live = newMatch.live;
            match.date = newMatch.date;
            await match.save();
            
        }else{
            await newMatch.save();
        }
    }
    catch(ex){
        log.error(ex);
    }
}

export async function findMatch(tmpMatch){
    const match = await Match.findOne({wPlayID: tmpMatch.wPlayID, date: tmpMatch.date}).exec();
    return match;
}

export async function findAllMatches(){
    const matches = await Match.find().exec();
    return matches;
}