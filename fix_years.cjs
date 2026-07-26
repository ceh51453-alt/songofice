const { Project, SyntaxKind } = require("ts-morph");

const project = new Project({ tsConfigFilePath: "e:/iceandfire/tsconfig.json" });
const files = [
  "e:/iceandfire/src/content/westeros/eras/warOfFiveKings.ts",
  "e:/iceandfire/src/content/westeros/eras/danceOfDragons.ts",
  "e:/iceandfire/src/content/westeros/eras/blackfyreRebellion.ts",
  "e:/iceandfire/src/content/westeros/eras/aegonConquest.ts",
  "e:/iceandfire/src/content/westeros/eras/robertsRebellion.ts",
  "e:/iceandfire/src/content/westeros/eras/dunkAndEgg.ts",
];

for (const filePath of files) {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) continue;
  let modified = false;

  const objectLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);
  for (const obj of objectLiterals) {
    const yearProp = obj.getProperty("year");
    const numericYearProp = obj.getProperty("numericYear");
    
    if (yearProp && !numericYearProp) {
      const init = yearProp.getInitializer();
      if (init && init.getKind() === SyntaxKind.StringLiteral) {
        const yearStr = init.getLiteralText();
        let num = parseInt(yearStr);
        if (yearStr.includes("BC")) {
          num = -num;
        }
        if (!isNaN(num)) {
          obj.addPropertyAssignment({ name: "numericYear", initializer: num.toString() });
          modified = true;
        }
      }
    }
  }

  if (modified) {
    console.log("Saved", filePath);
    sourceFile.saveSync();
  }
}
