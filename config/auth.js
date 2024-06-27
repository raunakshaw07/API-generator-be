const { google } = require('googleapis');

const authConfig = async () => {

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.CREDENTIALS_PATH,
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: 'v4', auth: client });

  return {auth, googleSheets};
}

module.exports = authConfig;
