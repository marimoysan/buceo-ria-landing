// Implementar como Aplicación web: Ejecutar como "Yo", Acceso "Cualquier usuario".
// La URL /exec resultante va en SHEETS_WEBHOOK_URL (js/main.js).
// SPREADSHEET_ID: de la URL de la hoja, https://docs.google.com/spreadsheets/d/ESTE_TROZO/edit
const SPREADSHEET_ID = 'REEMPLAZA_CON_EL_ID_DE_TU_HOJA';
const NOTIFY_EMAIL = 'vigo@buceoriavigo.com';

// Evita que un valor que empiece por = + - @ se interprete como fórmula en Sheets
// (protección estándar contra formula/CSV injection en endpoints públicos).
function asText(value) {
  const str = String(value);
  return /^[=+\-@]/.test(str) ? "'" + str : str;
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      asText(data.nombre),
      asText(data.email),
      asText((data.intereses || []).join(', ')),
      data.newsletter ? 'Sí' : 'No',
    ]);
  } catch (err) {
    // El formulario no lee esta respuesta (no-cors), así que un fallo aquí
    // sería invisible sin esto: avisamos por email para no perder el registro.
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      'Fallo guardando una inscripción de la web',
      'No se pudo guardar un envío del formulario en la hoja.\n\n' +
      'Error: ' + err.message + '\n\n' +
      'Datos recibidos (añádelos a mano si son válidos):\n' +
      (e.postData ? e.postData.contents : '(sin datos)')
    );
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
