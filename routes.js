const express = require('express');
const router = express.Router();
const extractSpreadsheetId = require('./utils/extractSpreadsheetId');
const authConfig = require('./config/auth');
const CreateJSON = require('./utils/CreateJSON');


const handleSheetCRUD = (googleSheets, auth, spreadsheetId, sheetTitle) => {
  // Method     @GET
  // Route      /{sheetTitle}
  // Desc       Get all data from selected spreadsheet
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

  // Method     @GET
  // Route      /{sheetTitle}/:field/:id
  // Desc       Get all data from selected spreadsheet
  router.get(`/${sheetTitle}/:field/:id`, async (req, res) => {
    try {
      const { field, id } = req.params;
      const response = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: sheetTitle,
      });

      const rows = response.data.values || [];
      const jsonData = CreateJSON(rows);
      const record = jsonData.find(record => record[field] === id);

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      return res.json(record);
    } catch (err) {
      console.error('Error fetching single record:', err);
      return res.status(500).json({ error: 'Failed to fetch single record' });
    }
  });

  // Method     @POST
  // Route      /{sheetTitle}
  // Desc       Create new record
  router.post(`/${sheetTitle}`, async (req, res) => {
    try {
      const { data } = req.body;
      const values = Object.values(data);
      const response = await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: sheetTitle,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        },
      });

      return res.status(201).json({ msg: 'Record created successfully', data: response.data });
    } catch (err) {
      console.error('Error creating record:', err);
      return res.status(500).json({ error: 'Failed to create record' });
    }
  });

  // Method     @PUT
  // Route      /{sheetTitle}/:id
  // Desc       Update existing record
  router.put(`/${sheetTitle}/:field/:id`, async (req, res) => {
    try {
      const { id, field } = req.params;
      const { data } = req.body;
      const values = Object.values(data);

      const response = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: sheetTitle,
      });

      const rows = response.data.values || [];
      const jsonData = CreateJSON(rows);
      const recordIndex = jsonData.findIndex(record => record[field] === id);

      if (recordIndex === -1) {
        return res.status(404).json({ error: 'Record not found' });
      }

      const updateResponse = await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `${sheetTitle}!A${recordIndex + 2}`,
        valueInputOption: 'RAW',
        resource: {
          values: [values],
        },
      });

      return res.json({ msg: 'Record updated successfully', data: updateResponse.data });
    } catch (err) {
      console.error('Error updating record:', err);
      return res.status(500).json({ error: 'Failed to update record' });
    }
  });

  // Method     @DELETE
  // Route      /{sheetTitle}/:field/:id
  // Desc       Delete entire row based on field and id
  router.delete(`/${sheetTitle}/:field/:id`, async (req, res) => {
    try {
      const { id, field } = req.params;

      const response = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: sheetTitle,
      });

      const rows = response.data.values || [];
      const jsonData = CreateJSON(rows);
      const record = jsonData.find(record => record[field] === id);

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      const rowIndex = jsonData.indexOf(record);

      // Calculate the A1 notation for the entire row
      const rowRange = `${sheetTitle}!A${rowIndex + 2}:Z${rowIndex + 2}`;

      // Delete the entire row using batchClear
      const deleteResponse = await googleSheets.spreadsheets.values.batchClear({
        auth,
        spreadsheetId,
        resource: {
          ranges: [rowRange],
        },
      });

      return res.json({ msg: 'Record deleted successfully', data: deleteResponse.data });
    } catch (err) {
      console.error('Error deleting record:', err);
      return res.status(500).json({ error: 'Failed to delete record' });
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
    return res.status(500).json(err);
  }
});

module.exports = router;
