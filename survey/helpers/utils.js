import ExcelJS from "exceljs";

export const handleInputExcel = async () => {
    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.readFile("survey/test-input.xlsx");
    const inputworksheet = inputWorkbook.getWorksheet();
    const numberOfRow = inputworksheet.rowCount;

    return { inputworksheet, numberOfRow };
}

export const initOutputExcel = async () => {
    const outputWorkbook = new ExcelJS.Workbook();
    await outputWorkbook.xlsx.readFile("survey/test-output.xlsx");
    const outputWorksheet = outputWorkbook.getWorksheet();
    const headerRow = outputWorksheet.getRow(2).values;

    return { outputWorkbook, outputWorksheet, headerRow };
};
