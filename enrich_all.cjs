const { Project, SyntaxKind } = require("ts-morph");

const project = new Project();

const filesToProcess = [
  "e:/iceandfire/src/content/westeros/eras/blackfyreRebellion.ts",
  "e:/iceandfire/src/content/westeros/eras/warOfFiveKings.ts",
  "e:/iceandfire/src/content/westeros/eras/aegonConquest.ts",
  "e:/iceandfire/src/content/westeros/eras/danceOfDragons.ts",
  "e:/iceandfire/src/content/westeros/eras/robertsRebellion.ts"
];

for (const filePath of filesToProcess) {
  project.addSourceFileAtPath(filePath);
}

try {
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

    const setProp = (name, valueStr) => {
        const prop = el.getProperty(name);
        if (prop) {
            // Already exists
        } else {
            el.addPropertyAssignment({ name, initializer: valueStr });
        }
    };
    
    // Inject defaults (ONLY IF MISSING)
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
    } else {
        setProp("holdingsLevel", "{}");
    }
  }

  sourceFile.saveSync();
  console.log(`Saved ${sourceFile.getBaseName()}`);
}
} catch (e) {
  console.error("ERROR:", e.message);
}
