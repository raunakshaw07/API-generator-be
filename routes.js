const express = require('express');
const router = express.Router();
const extractSpreadsheetId = require('./utils/extractSpreadsheetId');
const authConfig = require('./config/auth');
const CreateJSON = require('./utils/CreateJSON');


const handleSheetCRUD = (googleSheets, auth, spreadsheetId, sheetTitle) => {
  router.get(`/${sheetTitle}`, async (req, res) => {
    try {
      const response = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: sheetTitle,
      });
      const rows = response.data.values || [];
      const JSONResponse = CreateJSON(rows);
      return res.json(JSONResponse);
    } catch (err) {
      console.error('Error fetching records:', err);
      return res.status(500).json({ error: 'Failed to fetch records' });
    }
  });
};

router.get('/', (req, res) => {
  res.json({ msg: `Server running on port ${process.env.PORT}` });
});

router.post('/', async (req, res) => {
  try {
    const { spreadsheetUrl } = req.body;
    const sheetId = extractSpreadsheetId(spreadsheetUrl);

    const { auth, googleSheets } = await authConfig();
    const metaData = await googleSheets.spreadsheets.get({ auth, spreadsheetId: sheetId });

    if (metaData) {
      const { spreadsheetId, sheets } = metaData.data;
      const payload = { id: spreadsheetId, sheets: sheets };
      sheets.forEach(sheet => {
        const { properties: { title } } = sheet;
        handleSheetCRUD(googleSheets, auth, spreadsheetId, title);
      });
      return res.status(200).json(payload);
    }
    return res.status(404).json({ msg: "Spreadsheet not found" });
  } catch (err) {
    console.error('Error retrieving spreadsheet metadata:', err);
    return res.status(500).json({ error: 'Failed to retrieve spreadsheet metadata' });
  }
});

router.post('/fetch-sheet', async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.body;
    const { auth, googleSheets } = await authConfig();
    const response = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: sheetName,
    });

    const { data } = response;
    const rows = data.values || [];

    const JSONResponse = CreateJSON(rows);

    return res.json(JSONResponse);
  } catch (err) {
    console.error('Error fetching sheet data:', err);
    return res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
});

module.exports = router;
