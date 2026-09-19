// Implementar como Aplicación web: Ejecutar como "Yo", Acceso "Cualquier usuario".
// La URL /exec resultante va en SHEETS_WEBHOOK_URL (js/main.js).
// SPREADSHEET_ID: de la URL de la hoja, https://docs.google.com/spreadsheets/d/ESTE_TROZO/edit
const SPREADSHEET_ID = 'REEMPLAZA_CON_EL_ID_DE_TU_HOJA';

// Evita que un valor que empiece por = + - @ se interprete como fórmula en Sheets
// (protección estándar contra formula/CSV injection en endpoints públicos).
function asText(value) {
  const str = String(value);
  return /^[=+\-@]/.test(str) ? "'" + str : str;
}

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    asText(data.nombre),
    asText(data.email),
    asText((data.intereses || []).join(', ')),
    data.newsletter ? 'Sí' : 'No',
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
