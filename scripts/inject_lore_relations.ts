import { Project, SyntaxKind, ObjectLiteralExpression, PropertyAssignment } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const loreData = JSON.parse(fs.readFileSync(path.join(".", "scripts/lore_relations.json"), "utf8"));

const p = new Project();
p.addSourceFilesAtPaths("src/content/westeros/eras/*.ts");

for (const f of p.getSourceFiles()) {
  const era = f.getBaseNameWithoutExtension();
  let varDecl = f.getVariableDeclaration(era + "Characters");
  if (!varDecl && era === "aegonConquest") {
      varDecl = f.getVariableDeclaration("aegonConquestCharacters");
  }
  if (!varDecl) continue;

  const arr = varDecl.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
  if (!arr) continue;

  let modified = false;

  for (const el of arr.getElements()) {
    if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const obj = el as ObjectLiteralExpression;
      const idProp = obj.getProperty("id") as PropertyAssignment;
      if (idProp) {
        const init = idProp.getInitializer();
        if (init && init.getKind() === SyntaxKind.StringLiteral) {
          const charId = init.getText().replace(/"/g, "");
          const lore = loreData[charId];
          if (lore) {
             const updateStringProp = (name: string, val: string) => {
                 const prop = obj.getProperty(name) as PropertyAssignment;
                 if (prop && val !== undefined) {
                     prop.setInitializer(`"${val}"`);
                     modified = true;
                 } else if (!prop && val !== undefined && val !== "") {
                     obj.addPropertyAssignment({ name, initializer: `"${val}"` });
                     modified = true;
                 }
             };
             const updateArrayProp = (name: string, val: string[]) => {
                 const prop = obj.getProperty(name) as PropertyAssignment;
                 if (prop && val !== undefined) {
                     prop.setInitializer(`[${val.map(v => `"${v}"`).join(", ")}]`);
                     modified = true;
                 } else if (!prop && val !== undefined && val.length > 0) {
                     obj.addPropertyAssignment({ name, initializer: `[${val.map(v => `"${v}"`).join(", ")}]` });
                     modified = true;
                 }
             };

             updateStringProp("father", lore.father);
             updateStringProp("mother", lore.mother);
             updateStringProp("spouse", lore.spouse);
             updateArrayProp("children", lore.children);
             updateArrayProp("siblings", lore.siblings);
             updateArrayProp("allies", lore.allies);
             updateArrayProp("rivals", lore.rivals);
          }
        }
      }
    }
  }

  if (modified) {
     console.log(`Updated relations in ${era}.ts`);
  }
}

p.saveSync();
console.log("Finished injecting lore relations.");
