import { dawnAgeCharacters } from "../src/content/westeros/eras/dawnAge";
import { aegonConquestCharacters } from "../src/content/westeros/eras/aegonConquest";
import { danceOfDragonsCharacters } from "../src/content/westeros/eras/danceOfDragons";
import { blackfyreRebellionCharacters } from "../src/content/westeros/eras/blackfyreRebellion";
import { dunkAndEggCharacters } from "../src/content/westeros/eras/dunkAndEgg";
import { robertsRebellionCharacters } from "../src/content/westeros/eras/robertsRebellion";
import { warOfFiveKingsCharacters } from "../src/content/westeros/eras/warOfFiveKings";
import { windsOfWinterCharacters } from "../src/content/westeros/eras/windsOfWinter";

const eras = {
    dawnAge: dawnAgeCharacters,
    aegonConquest: aegonConquestCharacters,
    danceOfDragons: danceOfDragonsCharacters,
    blackfyreRebellion: blackfyreRebellionCharacters,
    dunkAndEgg: dunkAndEggCharacters,
    robertsRebellion: robertsRebellionCharacters,
    warOfFiveKings: warOfFiveKingsCharacters,
    windsOfWinter: windsOfWinterCharacters
};

for (const [eraName, chars] of Object.entries(eras)) {
    console.log(`\n--- ${eraName} ---`);
    let count = 0;
    for (const c of chars) {
        if ((c.startHoldings && c.startHoldings.length > 0) || (c.startRegions && c.startRegions.length > 0)) {
            console.log(`- ${c.name} [${c.id}] (House ${c.house})`);
            console.log(`  Tước Vị: ${c.tuocVi}`);
            console.log(`  Holdings: ${JSON.stringify(c.startHoldings || [])}`);
            console.log(`  Regions: ${JSON.stringify(c.startRegions || [])}`);
            count++;
        }
    }
    console.log(`Total: ${count}`);
}
