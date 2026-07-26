const { Project, SyntaxKind } = require("ts-morph");

const project = new Project();

const filesToProcess = [
  "e:/iceandfire/src/content/westeros/eras/blackfyreRebellion.ts",
  "e:/iceandfire/src/content/westeros/eras/warOfFiveKings.ts",
  "e:/iceandfire/src/content/westeros/eras/aegonConquest.ts",
  "e:/iceandfire/src/content/westeros/eras/danceOfDragons.ts",
  "e:/iceandfire/src/content/westeros/eras/robertsRebellion.ts"
];

// Dictionary for extremely prominent characters to ensure 100% lore accuracy
const loreDict = {
  // War of Five Kings
  "robb-stark": { spouse: '"jeyne-westerling"', children: '[]', gold: 10000, startArmy: '{ size: 20000, quality: "Thành Thạo" }' },
  "tywin-lannister": { gold: 100000, startArmy: '{ size: 35000, quality: "Tinh Nhuệ" }', baseIncome: 1000 },
  "joffrey-baratheon": { father: '"robert-baratheon"', mother: '"cersei-lannister"', siblings: '["myrcella-baratheon", "tommen-baratheon"]', gold: 50000, startArmy: '{ size: 10000, quality: "Bình Thường" }' },
  "stannis-baratheon": { spouse: '"selyse-florent"', children: '["shireen-baratheon"]', gold: 5000, startArmy: '{ size: 5000, quality: "Tinh Nhuệ" }' },
  "renly-baratheon": { spouse: '"margaery-tyrell"', children: '[]', gold: 20000, startArmy: '{ size: 80000, quality: "Bình Thường" }' },
  "roose-bolton": { spouse: '"walda-frey"', children: '["domeric-bolton", "ramsay-snow"]', gold: 15000, startArmy: '{ size: 8000, quality: "Thành Thạo" }' },
  "olenna-tyrell": { children: '["mace-tyrell"]', spouse: '"luthor-tyrell"', gold: 20000 },
  "mace-tyrell": { children: '["willas-tyrell", "garlan-tyrell", "loras-tyrell", "margaery-tyrell"]', spouse: '"alerie-hightower"', gold: 80000, startArmy: '{ size: 70000, quality: "Thành Thạo" }' },
  
  // Roberts Rebellion
  "eddard-stark": { children: '["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "rickon-stark", "jon-snow"]', gold: 8000, startArmy: '{ size: 25000, quality: "Thành Thạo" }' },
  "robert-baratheon": { spouse: '"cersei-lannister"', children: '["joffrey-baratheon", "myrcella-baratheon", "tommen-baratheon", "gendry"]', gold: 20000, startArmy: '{ size: 30000, quality: "Tinh Nhuệ" }' },
  "rhaegar-targaryen": { spouse: '"elia-martell"', children: '["rhaenys-targaryen", "aegon-targaryen"]', gold: 15000, startArmy: '{ size: 20000, quality: "Tinh Nhuệ" }' },
  "aerys-ii": { spouse: '"rhaella-targaryen"', children: '["rhaegar-targaryen", "viserys-targaryen", "daenerys-targaryen"]', gold: 50000, startArmy: '{ size: 40000, quality: "Bình Thường" }' },
  "tywin-lannister-rebellion": { children: '["jaime-lannister", "cersei-lannister", "tyrion-lannister"]', gold: 90000, startArmy: '{ size: 30000, quality: "Tinh Nhuệ" }' },
  
  // Aegons Conquest
  "aegon-i": { spouse: '["visenya-targaryen", "rhaenys-targaryen"]', children: '["aenys-i", "maegor-i"]', gold: 30000, startArmy: '{ size: 10000, quality: "Tinh Nhuệ" }' },
  "visenya-targaryen": { spouse: '"aegon-i"', children: '["maegor-i"]', gold: 10000, startArmy: '{ size: 1000, quality: "Tinh Nhuệ" }' },
  "rhaenys-targaryen-conquest": { spouse: '"aegon-i"', children: '["aenys-i"]', gold: 10000, startArmy: '{ size: 1000, quality: "Tinh Nhuệ" }' },
  "torrhen-stark": { children: '["brandon-stark"]', gold: 5000, startArmy: '{ size: 30000, quality: "Thành Thạo" }' },
  "loren-lannister": { gold: 50000, startArmy: '{ size: 45000, quality: "Thành Thạo" }' },
  "mern-ix-gardener": { gold: 60000, startArmy: '{ size: 55000, quality: "Thành Thạo" }' },
  
  // Dance of Dragons
  "rhaenyra-targaryen": { spouse: '"daemon-targaryen"', children: '["jacaerys-velaryon", "lucerys-velaryon", "joffrey-velaryon", "aegon-the-younger", "viserys-ii"]', gold: 20000, startArmy: '{ size: 15000, quality: "Thành Thạo" }' },
  "aegon-ii-targaryen": { spouse: '"helaena-targaryen"', children: '["jaehaerys-targaryen", "jaehaera-targaryen", "maelour-targaryen"]', gold: 30000, startArmy: '{ size: 20000, quality: "Thành Thạo" }' },
  "daemon-targaryen": { spouse: '"rhaenyra-targaryen"', children: '["baela-targaryen", "rhaena-targaryen", "aegon-the-younger", "viserys-ii"]', gold: 15000, startArmy: '{ size: 5000, quality: "Tinh Nhuệ" }' },
  "corlys-velaryon": { spouse: '"rhaenys-targaryen"', children: '["laenor-velaryon", "laena-velaryon"]', gold: 80000, startArmy: '{ size: 10000, quality: "Thành Thạo" }' },
  
  // Blackfyre
  "daemon-blackfyre": { spouse: '"rohanne-tyrosh"', children: '["aegon-blackfyre", "aemon-blackfyre", "daemon-ii-blackfyre", "haegon-blackfyre", "aenys-blackfyre"]', gold: 10000, startArmy: '{ size: 15000, quality: "Tinh Nhuệ" }' },
  "daeron-ii": { spouse: '"myriah-martell"', children: '["baelor-breakspear", "aerys-i", "rhaegel-targaryen", "maekar-i"]', gold: 40000, startArmy: '{ size: 25000, quality: "Thành Thạo" }' }
};

for (const filePath of filesToProcess) {
  project.addSourceFileAtPath(filePath);
}

for (const sourceFile of project.getSourceFiles()) {
  console.log("Processing", sourceFile.getBaseName());
  
  // Find the character array
  const varDecl = sourceFile.getVariableDeclarations().find(v => v.getName().endsWith("Characters"));
  if (!varDecl) continue;
  
  const arrayLiteral = varDecl.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
  if (!arrayLiteral) continue;

  const elements = arrayLiteral.getElements();
  for (const el of elements) {
    if (el.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;
    
    // Get basic info
    const idProp = el.getProperty("id");
    if (!idProp) continue;
    const charId = idProp.getInitializer().getText().replace(/['"]/g, '');
    
    const houseProp = el.getProperty("house");
    const house = houseProp ? houseProp.getInitializer().getText().replace(/['"]/g, '') : "Không Nhà";
    
    const roleProp = el.getProperty("role");
    const role = roleProp ? roleProp.getInitializer().getText().replace(/['"]/g, '') : "";
    
    const tuocViProp = el.getProperty("tuocVi");
    const tuocVi = tuocViProp ? tuocViProp.getInitializer().getText().replace(/['"]/g, '') : "Thường Dân";
    
    const startHoldingsProp = el.getProperty("startHoldings");
    let primaryHolding = null;
    if (startHoldingsProp) {
        const holdingArray = startHoldingsProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
        if (holdingArray && holdingArray.getElements().length > 0) {
            primaryHolding = holdingArray.getElements()[0].getText().replace(/['"]/g, '');
        }
    }

    // BASE LOGIC RULES for gold, income, army based on House
    let bArmySize = 3000;
    let bQuality = "Bình Thường";
    let bIncome = 50;
    let bGold = 500;
    let bLevel = 1;
    
    if (house === "Lannister") { bArmySize = 25000; bQuality = "Tinh Nhuệ"; bIncome = 300; bGold = 30000; bLevel = 4; }
    else if (house === "Tyrell" || house === "Gardener") { bArmySize = 40000; bQuality = "Thành Thạo"; bIncome = 250; bGold = 25000; bLevel = 4; }
    else if (house === "Stark") { bArmySize = 15000; bQuality = "Thành Thạo"; bIncome = 150; bGold = 8000; bLevel = 4; }
    else if (house === "Targaryen") { bArmySize = 10000; bQuality = "Tinh Nhuệ"; bIncome = 200; bGold = 20000; bLevel = 5; }
    else if (house === "Baratheon") { bArmySize = 15000; bQuality = "Thành Thạo"; bIncome = 180; bGold = 10000; bLevel = 4; }
    else if (house === "Arryn") { bArmySize = 18000; bQuality = "Thành Thạo"; bIncome = 160; bGold = 12000; bLevel = 4; }
    else if (house === "Martell") { bArmySize = 15000; bQuality = "Thành Thạo"; bIncome = 150; bGold = 10000; bLevel = 3; }
    else if (house === "Tully") { bArmySize = 12000; bQuality = "Thành Thạo"; bIncome = 140; bGold = 8000; bLevel = 3; }
    else if (house === "Greyjoy") { bArmySize = 5000; bQuality = "Thành Thạo"; bIncome = 80; bGold = 3000; bLevel = 2; }
    else if (house === "Velaryon") { bArmySize = 4000; bQuality = "Tinh Nhuệ"; bIncome = 200; bGold = 40000; bLevel = 4; }
    else if (house === "Hightower") { bArmySize = 12000; bQuality = "Thành Thạo"; bIncome = 250; bGold = 20000; bLevel = 4; }
    else if (house === "Frey") { bArmySize = 4000; bQuality = "Bình Thường"; bIncome = 200; bGold = 8000; bLevel = 3; }
    else if (house === "Bolton") { bArmySize = 3500; bQuality = "Thành Thạo"; bIncome = 100; bGold = 5000; bLevel = 3; }
    else if (house === "Royce") { bArmySize = 5000; bQuality = "Thành Thạo"; bIncome = 120; bGold = 8000; bLevel = 3; }
    else if (house === "Manderly") { bArmySize = 4000; bQuality = "Thành Thạo"; bIncome = 180; bGold = 15000; bLevel = 4; }
    else if (house === "Umber" || house === "Karstark") { bArmySize = 3000; bQuality = "Thành Thạo"; bIncome = 80; bGold = 4000; bLevel = 2; }
    else if (house === "Tarly") { bArmySize = 6000; bQuality = "Tinh Nhuệ"; bIncome = 120; bGold = 8000; bLevel = 3; }
    else if (house === "Mooton") { bArmySize = 3000; bQuality = "Bình Thường"; bIncome = 200; bGold = 10000; bLevel = 3; }

    // Map logic
    let calculatedRegion = null;
    let calculatedSeat = null;

    if (tuocVi === "Đại Lãnh Chúa" || tuocVi === "Vua") {
      if (house === "Stark") { calculatedRegion = "the-north"; calculatedSeat = "the-north-seat"; }
      else if (house === "Lannister") { calculatedRegion = "the-westerlands"; calculatedSeat = "the-westerlands-seat"; }
      else if (house === "Tyrell" || house === "Gardener") { calculatedRegion = "the-reach"; calculatedSeat = "the-reach-seat"; }
      else if (house === "Targaryen" || house === "Baratheon" && charId === "robert-baratheon") { calculatedRegion = "the-crownlands"; calculatedSeat = "the-crownlands-seat"; }
      else if (house === "Baratheon" && charId !== "robert-baratheon") { calculatedRegion = "the-stormlands"; calculatedSeat = "the-stormlands-seat"; }
      else if (house === "Arryn") { calculatedRegion = "the-vale"; calculatedSeat = "the-vale-seat"; }
      else if (house === "Martell") { calculatedRegion = "dorne"; calculatedSeat = "dorne-seat"; }
      else if (house === "Tully") { calculatedRegion = "the-riverlands"; calculatedSeat = "the-riverlands-seat"; }
      else if (house === "Greyjoy" || house === "Hoare") { calculatedRegion = "the-iron-islands"; calculatedSeat = "the-iron-islands-seat"; }
    } else if (tuocVi === "Lãnh Chúa" || tuocVi === "Đại Bang Hầu") {
      if (house === "Velaryon") { calculatedSeat = "driftmark-seat"; }
      else if (house === "Hightower") { calculatedSeat = "oldtown-seat"; }
      else if (house === "Frey") { calculatedSeat = "the-twins-seat"; }
      else if (house === "Bolton") { calculatedSeat = "the-dreadfort-seat"; }
      else if (house === "Manderly") { calculatedSeat = "white-harbor-seat"; }
      else if (house === "Tarly") { calculatedSeat = "horn-hill-seat"; }
      else if (house === "Umber") { calculatedSeat = "last-hearth-seat"; }
      else if (house === "Karstark") { calculatedSeat = "karhold-seat"; }
      else if (house === "Royce") { calculatedSeat = "runestone-seat"; }
    }

    if (tuocVi !== "Đại Lãnh Chúa" && tuocVi !== "Vua") {
        bArmySize = Math.floor(bArmySize / 5);
        bGold = Math.floor(bGold / 4);
        bIncome = Math.floor(bIncome / 2);
        bLevel = Math.max(1, bLevel - 1);
    }
    if (tuocVi === "Thường Dân" || tuocVi === "Hiệp Sĩ" || tuocVi === "Vệ Vương") {
        bArmySize = Math.floor(bArmySize / 10);
        if (bArmySize < 50) bArmySize = 0;
        bGold = Math.floor(bGold / 10);
    }

    // Helper to safely set property without duplicating
    const setProp = (name, valueStr) => {
        const prop = el.getProperty(name);
        if (prop) {
            // Already exists, maybe replace if empty?
            if (prop.getKind() === SyntaxKind.PropertyAssignment) {
                const init = prop.getInitializer();
                if (init.getText() === '""' || init.getText() === "[]" || init.getText() === "{}") {
                    prop.setInitializer(valueStr);
                }
            }
        } else {
            el.addPropertyAssignment({ name, initializer: valueStr });
        }
    };
    
    // Inject defaults
    setProp("father", '""');
    setProp("mother", '""');
    setProp("spouse", '""');
    setProp("children", "[]");
    setProp("siblings", "[]");
    setProp("allies", "[]");
    setProp("rivals", "[]");
    setProp("items", "[]");
    setProp("equipment", "[]");
    setProp("startArmy", `{ size: ${bArmySize}, quality: "${bQuality}" }`);
    setProp("baseIncome", `${bIncome}`);
    setProp("gold", `${bGold}`);
    
    if (primaryHolding) {
        setProp("holdingsLevel", `{ "${primaryHolding}": ${bLevel} }`);
    } else if (calculatedSeat) {
        setProp("holdingsLevel", `{ "${calculatedSeat}": ${bLevel} }`);
        setProp("startHoldings", `["${calculatedSeat}"]`);
    } else {
        setProp("holdingsLevel", "{}");
    }

    if (calculatedRegion) {
        setProp("startRegions", `["${calculatedRegion}"]`);
    }

    // Inject Lore Dictionary
    if (loreDict[charId]) {
        const specific = loreDict[charId];
        for (const [k, v] of Object.entries(specific)) {
            const existing = el.getProperty(k);
            if (existing) {
                existing.setInitializer(String(v));
            } else {
                el.addPropertyAssignment({ name: k, initializer: String(v) });
            }
        }
    }
  }

  // Ensure file uses correct format, save
  sourceFile.formatText({
      indentSize: 2,
  });
  sourceFile.saveSync();
  console.log(`Saved ${sourceFile.getBaseName()}`);
}
