const fs = require('fs');
let pipelineCode = fs.readFileSync('src/prompt/promptPipeline.ts', 'utf8');

if (!pipelineCode.includes('DRAGON_MECHANICS_PROMPT')) {
    pipelineCode = pipelineCode.replace(
        'import { MVU_UPDATE_PROMPT, NARRATIVE_TAGS_PROMPT, BATTLE_NARRATION_PROMPT, SQL_UPDATE_PROMPT, DICE_ROLL_PROMPT, ANTI_OMNISCIENCE_PROMPT } from "../mvu/mvuPrompt";',
        'import { MVU_UPDATE_PROMPT, NARRATIVE_TAGS_PROMPT, BATTLE_NARRATION_PROMPT, SQL_UPDATE_PROMPT, DICE_ROLL_PROMPT, ANTI_OMNISCIENCE_PROMPT, DRAGON_MECHANICS_PROMPT } from "../mvu/mvuPrompt";'
    );
    pipelineCode = pipelineCode.replace(
        '{ role: "system", content: ANTI_OMNISCIENCE_PROMPT },',
        '{ role: "system", content: ANTI_OMNISCIENCE_PROMPT },\n    { role: "system", content: DRAGON_MECHANICS_PROMPT },'
    );
    fs.writeFileSync('src/prompt/promptPipeline.ts', pipelineCode);
    console.log('Added DRAGON_MECHANICS_PROMPT to promptPipeline.ts');
} else {
    console.log('Already in pipeline.');
}
