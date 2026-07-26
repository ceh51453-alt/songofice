import { dawnAgeCharacters } from "../src/content/westeros/eras/dawnAge";
import { aegonConquestCharacters } from "../src/content/westeros/eras/aegonConquest";
import { danceOfDragonsCharacters } from "../src/content/westeros/eras/danceOfDragons";
import { blackfyreRebellionCharacters } from "../src/content/westeros/eras/blackfyreRebellion";
import { dunkAndEggCharacters } from "../src/content/westeros/eras/dunkAndEgg";
import { robertsRebellionCharacters } from "../src/content/westeros/eras/robertsRebellion";
import { warOfFiveKingsCharacters } from "../src/content/westeros/eras/warOfFiveKings";
import { windsOfWinterCharacters } from "../src/content/westeros/eras/windsOfWinter";
import { writeFileSync } from "fs";
import { join } from "path";

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

let output = "";
for (const [eraName, chars] of Object.entries(eras)) {
    output += `\n--- ${eraName} ---\n`;
    for (const c of chars) {
        output += `- ${c.name} [${c.id}] (House ${c.house}) - ${c.tuocVi}\n`;
        output += `  Holdings: ${JSON.stringify(c.startHoldings || [])}\n`;
        output += `  Regions: ${JSON.stringify(c.startRegions || [])}\n`;
    }
}
writeFileSync("scripts/char_dump.txt", output);
