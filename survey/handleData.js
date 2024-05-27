import rules from '../public/co2-model.FR-lang.fr.json' with { type: "json" }
import Engine from 'publicodes'
import { handleInputExcel, initOutputExcel } from './helpers/utils.js';
import { getSituationForTransport } from './helpers/transport.js';

const { inputworksheet, numberOfRow } = await handleInputExcel();
const { outputWorkbook, outputSheet } = await initOutputExcel();
const engine = new Engine(rules);

for (let i = 3; i <= numberOfRow; i ++) {
    const currentRow = inputworksheet.getRow(i);
    
    engine.setSituation({
        ...getSituationForTransport(currentRow.getCell(4).value, currentRow.getCell(3).value, currentRow.getCell(2).value)
    });
    
    const valeur = engine.evaluate('transport . deux roues . empreinte');

    outputSheet.addRow([currentRow.getCell(1).value, valeur.nodeValue]);
}

await outputWorkbook.xlsx.writeFile("survey/test-output.xlsx");
