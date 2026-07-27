const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project();
project.addSourceFilesAtPaths(path.join(__dirname, "../src/content/westeros/eras/*.ts"));

const RULER_TITLES = ["Quốc Vương", "Đại Lãnh Chúa", "Vua", "Nữ Vương", "Thái hậu Nhiếp chính", "Vua Bảy Vương Quốc"];

const HOUSE_TO_REGION = {
    "Stark": { r: "the-north", s: "the-north-seat", inc: 400, lvl: 5 },
    "Lannister": { r: "the-westerlands", s: "the-westerlands-seat", inc: 800, lvl: 5 },
    "Tully": { r: "the-riverlands", s: "the-riverlands-seat", inc: 450, lvl: 5 },
    "Arryn": { r: "the-vale", s: "the-vale-seat", inc: 400, lvl: 5 },
    "Greyjoy": { r: "the-iron-islands", s: "the-iron-islands-seat", inc: 300, lvl: 5 },
    "Hoare": { r: "the-iron-islands", s: "the-iron-islands-seat", inc: 300, lvl: 5 },
    "Greyiron": { r: "the-iron-islands", s: "the-iron-islands-seat", inc: 300, lvl: 5 },
    "Martell": { r: "dorne", s: "dorne-seat", inc: 400, lvl: 5 },
    "Gardener": { r: "the-reach", s: "the-reach-seat", inc: 700, lvl: 5 },
    "Tyrell": { r: "the-reach", s: "the-reach-seat", inc: 700, lvl: 5 },
    "Durrandon": { r: "the-stormlands", s: "the-stormlands-seat", inc: 400, lvl: 5 },
    "Baratheon": { r: "the-stormlands", s: "the-stormlands-seat", inc: 400, lvl: 5 },
    "Targaryen": { r: "the-crownlands", s: "the-crownlands-seat", inc: 800, lvl: 5 }
};

const EXCEPTIONS = {
    // Aegon Conquest
    "vickon-greyjoy": { r: ["the-iron-islands"], h: ["the-iron-islands-seat"], l: {"the-iron-islands-seat": 5}, inc: 250 },
    "aegon-the-conqueror": { r: [], h: ["dragonstone"], l: {"dragonstone": 5}, inc: 300 },
    "robert-baratheon": { r: ["the-stormlands"], h: ["the-stormlands-seat"], l: {"the-stormlands-seat": 5}, inc: 400 },
    "stannis-baratheon": { r: [], h: ["dragonstone"], l: {"dragonstone": 4}, inc: 150 },
    "roose-bolton": { r: [], h: ["dreadfort"], l: {"dreadfort": 4}, inc: 200 },
    "roose-bolton-robert": { r: [], h: ["dreadfort"], l: {"dreadfort": 4}, inc: 200 },
    "walder-frey": { r: [], h: ["twins"], l: {"twins": 4}, inc: 300 },
    "petyr-baelish": { r: [], h: ["harrenhal"], l: {"harrenhal": 1}, inc: 500 },
    "mance-rayder": { r: [], h: [], l: {}, inc: 10 },
    "euron-greyjoy": { r: ["the-iron-islands"], h: ["the-iron-islands-seat"], l: {"the-iron-islands-seat": 5}, inc: 300 },
    "balon-greyjoy": { r: ["the-iron-islands"], h: ["the-iron-islands-seat"], l: {"the-iron-islands-seat": 5}, inc: 300 },
    "rhaegar-targaryen": { r: [], h: ["dragonstone"], l: {"dragonstone": 4}, inc: 200 },
    "mace-tyrell": { r: ["the-reach"], h: ["the-reach-seat"], l: {"the-reach-seat": 5}, inc: 700 },
    "doran-martell": { r: ["dorne"], h: ["dorne-seat"], l: {"dorne-seat": 5}, inc: 400 },
    "jon-snow": { r: [], h: [], l: {}, inc: 10 },
    "arya-stark": { r: [], h: [], l: {}, inc: 10 },
    "sansa-stark": { r: [], h: [], l: {}, inc: 10 },
    "bran-stark": { r: [], h: [], l: {}, inc: 10 },
    "sandor-clegane": { r: [], h: [], l: {}, inc: 10 },
    "brienne-tarth": { r: [], h: [], l: {}, inc: 15 },
    "davos-seaworth": { r: [], h: [], l: {}, inc: 50 },
    "varys": { r: [], h: [], l: {}, inc: 200 },
    "melisandre": { r: [], h: [], l: {}, inc: 50 },
    "tormund-giantsbane": { r: [], h: [], l: {}, inc: 15 },
    "victarion-greyjoy": { r: [], h: [], l: {}, inc: 100 },
    "duncan-the-tall": { r: [], h: [], l: {}, inc: 10 }
};

for (const file of project.getSourceFiles()) {
    const arrays = file.getVariableDeclarations().filter(v => v.getType().isArray() && v.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression));
    
    for (const arr of arrays) {
        const elements = arr.getInitializer().getElements();
        for (const el of elements) {
            if (!el.isKind(SyntaxKind.ObjectLiteralExpression)) continue;
            
            const getProp = (name) => {
                const prop = el.getProperty(name);
                if (prop && prop.isKind(SyntaxKind.PropertyAssignment)) {
                    const init = prop.getInitializer();
                    if (init && init.isKind(SyntaxKind.StringLiteral)) {
                        return init.getLiteralValue();
                    }
                }
                return null;
            };

            const id = getProp("id");
            const house = getProp("house");
            const tuocVi = getProp("tuocVi");
            
            if (!id) continue;

            let finalRegions = [];
            let finalHoldings = [];
            let finalHoldingsLevel = {};
            let finalIncome = 50;

            if (EXCEPTIONS[id]) {
                const ex = EXCEPTIONS[id];
                finalRegions = ex.r;
                finalHoldings = ex.h;
                finalHoldingsLevel = ex.l;
                finalIncome = ex.inc;
            } else if (house && HOUSE_TO_REGION[house] && (RULER_TITLES.includes(tuocVi) || id.includes("king") || id.includes("ix-gardener") || tuocVi === "Vua")) {
                const map = HOUSE_TO_REGION[house];
                finalRegions = [map.r];
                finalHoldings = [map.s];
                finalHoldingsLevel = { [map.s]: map.lvl };
                finalIncome = map.inc;
            } else {
                finalRegions = [];
                finalHoldings = [];
                finalHoldingsLevel = {};
                finalIncome = 25;
            }

            for (const propName of ["startRegions", "startHoldings", "holdingsLevel", "baseIncome"]) {
                const p = el.getProperty(propName);
                if (p) p.remove();
            }

            el.addPropertyAssignment({ name: "startRegions", initializer: JSON.stringify(finalRegions) });
            el.addPropertyAssignment({ name: "startHoldings", initializer: JSON.stringify(finalHoldings) });
            el.addPropertyAssignment({ name: "holdingsLevel", initializer: JSON.stringify(finalHoldingsLevel) });
            el.addPropertyAssignment({ name: "baseIncome", initializer: String(finalIncome) });
        }
    }
}

project.saveSync();
console.log("Updated all era files successfully.");
