import rules from '../public/co2-model.FR-lang.fr.json' with { type: "json" }
import Engine from 'publicodes'
import { handleInputExcel, initOutputExcel } from './helpers/utils.js';
import { getSituationForTransport } from './helpers/transport.js';
import personas from "../public/personas-fr.json" with { type: "json" };

const { inputworksheet, numberOfRow } = await handleInputExcel();
const { outputWorkbook, outputWorksheet, headerRow } = await initOutputExcel();
const engine = new Engine(rules);

// for (let i = 3; i <= numberOfRow; i ++) {
//     const currentRow = inputworksheet.getRow(i);
    
    engine.setSituation(personas["personas . yoram"].situation);
    
    const computeRow = ["yoram"];

    for (let ruleIndex = 2; ruleIndex <= headerRow.length; ruleIndex ++) {
        const rule = headerRow[ruleIndex];
        console.log(rule);
        if (rule) computeRow.push(engine.evaluate(rule).nodeValue);
        else computeRow.push(0);
    }

    outputWorksheet.addRow(computeRow);
// }

await outputWorkbook.xlsx.writeFile("survey/test-output.xlsx");
