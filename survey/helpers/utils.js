import ExcelJS from "exceljs";
import personas from "../../public/personas-fr.json" with { type: "json" };

export const handleInputExcel = async () => {
    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.readFile("survey/personas.xlsx");
    const inputworksheet = inputWorkbook.getWorksheet();
    const numberOfRow = inputworksheet.rowCount;

    return { inputworksheet, numberOfRow };
};

export const initOutputExcel = async () => {
    const outputWorkbook = new ExcelJS.Workbook();
    await outputWorkbook.xlsx.readFile("survey/test-output.xlsx");
    const outputWorksheet = outputWorkbook.getWorksheet();
    const headerRow = outputWorksheet.getRow(2).values;

    return { outputWorkbook, outputWorksheet, headerRow };
};

export const fromJsonToExcel = async () => {
    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.readFile("survey/personas.xlsx");
    const inputWorksheet = inputWorkbook.getWorksheet();
    const personaNameList = Object.keys(personas);

    const headerSet = new Set();

    for (const persona of personaNameList) {
        for (const headerInfo of Object.keys(personas[persona].situation) || []) {
            headerSet.add(headerInfo);
        }
    }
    const header = ["nom", ...headerSet];

    inputWorksheet.addRow(header);

    for (const persona of personaNameList) {
        const newRow = [personas[persona].nom];
        for (const rule of headerSet) {
            if (personas[persona].situation[rule] != undefined) newRow.push(personas[persona].situation[rule]);
            else newRow.push("");
        }
        inputWorksheet.addRow(newRow)
    }

    await inputWorkbook.xlsx.writeFile("survey/personas.xlsx");
};
