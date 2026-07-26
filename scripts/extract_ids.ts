import { Project, SyntaxKind, ObjectLiteralExpression, PropertyAssignment } from "ts-morph";

const p = new Project();
p.addSourceFilesAtPaths("src/content/westeros/eras/*.ts");
const chars: Record<string, string[]> = {};

for (const f of p.getSourceFiles()) {
  const era = f.getBaseNameWithoutExtension();
  chars[era] = [];
  
  let varDecl = f.getVariableDeclaration(era + "Characters");
  if (!varDecl && era === "aegonConquest") {
      varDecl = f.getVariableDeclaration("aegonConquestCharacters");
  }
  if (!varDecl) continue;

  const arr = varDecl.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
  if (!arr) continue;

  for (const el of arr.getElements()) {
    if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const obj = el as ObjectLiteralExpression;
      const idProp = obj.getProperty("id") as PropertyAssignment;
      if (idProp) {
        const init = idProp.getInitializer();
        if (init && init.getKind() === SyntaxKind.StringLiteral) {
          chars[era].push(init.getText().replace(/"/g, ""));
        }
      }
    }
  }
}
console.log(JSON.stringify(chars, null, 2));
