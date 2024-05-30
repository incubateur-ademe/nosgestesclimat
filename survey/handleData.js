import rules from '../public/co2-model.FR-lang.fr.json' with { type: "json" }
import Engine from 'publicodes'
import { handleInputExcel, initOutputExcel } from './helpers/utils.js';

const { inputworksheet, numberOfRow } = await handleInputExcel();
const { outputWorkbook, outputWorksheet, headerRow } = await initOutputExcel();

for (let i = 2; i <= numberOfRow; i ++) {
    const engine = new Engine(rules);
    const headerInput = inputworksheet.getRow(1).values;
    const currentRow = inputworksheet.getRow(i).values;
    const situation = {};

    for (let headerIndex = 2; headerIndex <= headerInput.length; headerIndex ++) {
        if (headerInput[headerIndex] !== undefined && currentRow[headerIndex] !== "" && currentRow[headerIndex] !== undefined) {
            situation[headerInput[headerIndex]] = currentRow[headerIndex];
        }
    }
    engine.setSituation(situation);
    
    const computeRow = [currentRow[1]];

    for (let ruleIndex = 2; ruleIndex <= headerRow.length; ruleIndex ++) {
        const rule = headerRow[ruleIndex];
        if (rule) computeRow.push(engine.evaluate(rule).nodeValue);
        else computeRow.push(0);
    }

    outputWorksheet.addRow(computeRow);
}

await outputWorkbook.xlsx.writeFile("survey/test-output.xlsx");
