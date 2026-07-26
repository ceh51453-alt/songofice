import { Project, SyntaxKind, ObjectLiteralExpression, PropertyAssignment } from "ts-morph";
import * as fs from "fs";

const START_YEARS: Record<string, number> = {
  dawnAge: -8000,
  aegonConquest: 1,
  danceOfDragons: 129,
  blackfyreRebellion: 196,
  dunkAndEgg: 209,
  robertsRebellion: 282,
  warOfFiveKings: 298,
  windsOfWinter: 300
};

const HOUSE_DEFAULTS: Record<string, { size: number, quality: string, income: number, level: number }> = {
  "Stark": { size: 30000, quality: "Thành Thạo", income: 300, level: 5 },
  "Lannister": { size: 40000, quality: "Tinh Nhuệ", income: 500, level: 5 },
  "Tyrell": { size: 80000, quality: "Đồng Bộ Chỉnh Tề", income: 450, level: 5 },
  "Baratheon": { size: 25000, quality: "Thành Thạo", income: 250, level: 5 },
  "Martell": { size: 30000, quality: "Thành Thạo", income: 250, level: 5 },
  "Arryn": { size: 35000, quality: "Thành Thạo", income: 300, level: 5 },
  "Tully": { size: 20000, quality: "Mới Lập Đội", income: 350, level: 5 },
  "Greyjoy": { size: 15000, quality: "Thành Thạo", income: 200, level: 5 },
  "Targaryen": { size: 10000, quality: "Tinh Nhuệ", income: 400, level: 5 },
  "Hoare": { size: 20000, quality: "Thành Thạo", income: 300, level: 5 },
  "Durrandon": { size: 25000, quality: "Thành Thạo", income: 300, level: 5 },
  "Gardener": { size: 50000, quality: "Thành Thạo", income: 450, level: 5 },
  "Bolton": { size: 5000, quality: "Thành Thạo", income: 150, level: 4 },
  "Frey": { size: 4000, quality: "Thành Thạo", income: 200, level: 4 },
  "Khác": { size: 2000, quality: "Thành Thạo", income: 100, level: 3 }
};

const project = new Project();
project.addSourceFilesAtPaths("src/content/westeros/eras/**/*.ts");

for (const sourceFile of project.getSourceFiles()) {
  const fileName = sourceFile.getBaseNameWithoutExtension();
  if (!START_YEARS[fileName]) continue;
  
  const startYear = START_YEARS[fileName];
  console.log(`Processing ${fileName} (Start Year: ${startYear})...`);

  // Target the specific exported array like 'warOfFiveKingsCharacters'
  let varDecl = sourceFile.getVariableDeclaration(fileName + "Characters");
  if (!varDecl && fileName === "aegonConquest") {
      varDecl = sourceFile.getVariableDeclaration("aegonConquestCharacters");
  }
  if (!varDecl) continue;

  const arr = varDecl.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
  if (!arr) continue;

  const elements = arr.getElements();
  for (const el of elements) {
    if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const obj = el as ObjectLiteralExpression;
      
      const getProp = (name: string) => obj.getProperty(name) as PropertyAssignment;
      const getStringVal = (name: string) => {
        const p = getProp(name);
        if (!p) return null;
        const init = p.getInitializer();
        if (init && init.getKind() === SyntaxKind.StringLiteral) {
          return init.getText().replace(/"/g, "");
        }
        return null;
      };
      const getNumVal = (name: string) => {
        const p = getProp(name);
        if (!p) return null;
        const init = p.getInitializer();
        if (init && init.getKind() === SyntaxKind.NumericLiteral) {
          return parseFloat(init.getText());
        }
        return null;
      };
      const hasProp = (name: string) => !!obj.getProperty(name);

      const age = getNumVal("age");
      const house = getStringVal("house") || "Khác";
      const tuocVi = getStringVal("tuocVi");
      const startHoldingsProp = getProp("startHoldings");
      
      let startHoldings: string[] = [];
      if (startHoldingsProp) {
          const init = startHoldingsProp.getInitializer();
          if (init && init.getKind() === SyntaxKind.ArrayLiteralExpression) {
              startHoldings = init.getText().replace(/[\[\]"\s]/g, "").split(",").filter(s => s.length > 0);
          }
      }

      if (!hasProp("birthYear") && age !== null) {
          obj.addPropertyAssignment({ name: "birthYear", initializer: `${startYear - age}` });
      }

      if (["Vua", "Lãnh Chúa", "Đại Lãnh Chúa", "Vua Bảy Vương Quốc"].includes(tuocVi || "")) {
          const defaults = HOUSE_DEFAULTS[house] || HOUSE_DEFAULTS["Khác"];
          
          if (!hasProp("startArmy") && startHoldings.length > 0) {
            obj.addPropertyAssignment({ name: "startArmy", initializer: `{ size: ${defaults.size}, quality: "${defaults.quality}" }` });
          }
          if (!hasProp("baseIncome") && startHoldings.length > 0) {
            obj.addPropertyAssignment({ name: "baseIncome", initializer: `${defaults.income}` });
          }
          if (!hasProp("holdingsLevel") && startHoldings.length > 0) {
            obj.addPropertyAssignment({ name: "holdingsLevel", initializer: `{ "${startHoldings[0]}": ${defaults.level} }` });
          }
      }

      // Add missing relationship fields if not present
      if (!hasProp("father")) obj.addPropertyAssignment({ name: "father", initializer: `""` });
      if (!hasProp("mother")) obj.addPropertyAssignment({ name: "mother", initializer: `""` });
      if (!hasProp("spouse")) obj.addPropertyAssignment({ name: "spouse", initializer: `""` });
      if (!hasProp("children")) obj.addPropertyAssignment({ name: "children", initializer: `[]` });
      if (!hasProp("siblings")) obj.addPropertyAssignment({ name: "siblings", initializer: `[]` });
      if (!hasProp("allies")) obj.addPropertyAssignment({ name: "allies", initializer: `[]` });
      if (!hasProp("rivals")) obj.addPropertyAssignment({ name: "rivals", initializer: `[]` });
    }
  }
}

project.saveSync();
console.log("Finished enriching lore data.");
