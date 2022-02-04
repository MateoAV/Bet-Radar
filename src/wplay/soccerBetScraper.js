import { Builder, By } from 'selenium-webdriver';
import log from 'loglevel';
import mongoose from 'mongoose';
import { findMatch, addMatch, Match, Quota} from './Match.model.js';

async function getBetBlocks(betBlocks){
    for(let betBlock of betBlocks) {
        const categoriesHeader = betBlock.findElement(By.className('expander-button'));
        const categoryName = await categoriesHeader.getText();
        
        const categoriesContent = await betBlock.findElement(By.className('expander-content'));
        const children = await categoriesContent.findElements(By.css('tr'));
        
        await getMatches(children, categoryName);
    }
}

async function getMatches(rows, category) {
    for(let child of rows){
        let match = new Match();
        
        let timeContainer;
        let eventScore;
        //Containers
        try{
            timeContainer = await child.findElement(By.className("time coupon-scoreboard"));
            eventScore = await child.findElement(By.className("event-scoreboard"));
            
            //Properties
            const live = await eventScore.findElements(By.className('inplay'));
            const marketCount = child.findElement(By.className("mkt-count"));
            const eventURL = await marketCount.findElement(By.css("a")).getAttribute("href");
            const splittedURL = eventURL.split("/");
            const wPlayID = splittedURL[splittedURL.length - 2];
            const slug = splittedURL[splittedURL.length - 1];
            
            //Match Initialization        
            match.category = category;
            match.wPlayID = wPlayID;
            match.eventURL = eventURL;
            match.slug = slug;
            match.live = live.length > 0;
        }catch(ex){
            log("Time or event container element not found.");
        }
        //Datetime Parser
        if(!match.live){
            let time, date;
            try{
                time = await timeContainer.findElement(By.className('time')).getAttribute('textContent');
                date = await timeContainer.findElement(By.className('date')).getAttribute('textContent');
            }catch(ex){
                time = "";
            }
            const dateSplitted = date.split(' ');
            const formattedDate = new Date(Date.parse(dateSplitted[1] + dateSplitted[0] + ", " + new Date().getFullYear()));
            formattedDate.setHours(parseInt(time.split(":")[0]), parseInt(time.split(":")[1]));
            match.date = formattedDate;
        }
        //Live Score Parser
        else{
            const period = await timeContainer.findElement(By.className('period')).getAttribute('textContent');
            const score = await eventScore.findElement(By.className('score')).getAttribute('textContent');
            match.score = score;
            match.period = period;
        }
        
        const curMatch = await findMatch(match);
        match._id = (curMatch) ? curMatch._id : new mongoose.Types.ObjectId();
        const results = await child.findElements(By.className('seln'));
        await getQuotas(results, match);
        await addMatch(match);
    }
}

async function getQuotas(results, match){
    let i = 0;
    for(let result of results){
        try{
            let quota = new Quota();
            const klazzz = i==1 ? 'seln-draw-label' : 'seln-name';
            const name = await result.findElement(By.className(klazzz)).getAttribute('textContent');
            const priceButton = result.findElement(By.className("price"));
            const prices = await priceButton.findElements(By.xpath('.//span[contains(@class, "price")]'));
            let priceNumbers = [];
            for(let price of prices){
                try{
                    let priceNumber = {}
                    const oddPrice = await price.getAttribute('textContent');
                    const oddType = await price.getAttribute('class');
                    const oddTypeText = oddType.split(' ')[1];
                    priceNumber.oddPrice = oddPrice;
                    priceNumber.oddType = oddTypeText;
                    priceNumbers.push(priceNumber);
                }catch(ex){
                    log.warn(ex)
                }
            }
            const date = Date.now();
            
            if(i==0){
                match.homeTeam = name;
                quota.description = "Home";
            }else if(i==1){
                quota.description = "Draw";
            }else{
                match.awayTeam = name;
                quota.description = "Away";
            }
            quota.match_id = match._id;
            quota._id = mongoose.Types.ObjectId();
            quota.odds = priceNumbers;
            quota.timestamp = date;
            quota.metadata = { src : "WPlay"};
            match.quotas.push(quota._id);
            await quota.save();
            i++;
        }catch(ex){
            log.warn(ex)
        }
    }
}

const uri = "mongodb+srv://admin:betradar@cluster0.x9nag.mongodb.net/betRadar?retryWrites=true&w=majority";

(async function wPlay() {
    let driver = await new Builder().forBrowser("chrome").build();
    try {
        await mongoose.connect(uri);
        await driver.get('https://apuestas.wplay.co/es/s/FOOT/Futbol');
        const mainArea = driver.findElement(By.id('main-area'));
        const betBlocks = await mainArea.findElements(By.className('fragment expander coupon-for-type'));
        await getBetBlocks(betBlocks);     
        
    } catch(ex){
        log.warn(ex);
    }
    finally {
        await driver.quit();
    }
})();
