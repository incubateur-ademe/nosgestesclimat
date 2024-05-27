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
    const outputSheet = outputWorkbook.addWorksheet("test");
    outputSheet.columns = [{ header: "Nom" }, { header: "valeur" }];

    return { outputWorkbook, outputSheet };
};
