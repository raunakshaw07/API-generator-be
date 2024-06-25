function extractSpreadsheetId(url) {
  const pattern = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(pattern);

  if (match) {
      const spreadsheetId = match[1];
      return spreadsheetId;
  } else {
      return null;
  }
}

module.exports = extractSpreadsheetId;