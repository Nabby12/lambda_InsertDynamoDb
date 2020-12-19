'use strict'

const SPREADSHEET_ID = process.env['SPREADSHEET_ID'];
const SPREADSHEET_NAME = process.env['SPREADSHEET_NAME'];
const SPREADSHEET_RANGE = process.env['SPREADSHEET_RANGE'];
const SPREADSHEET_JAN_PHRASE_COLUMN = process.env['SPREADSHEET_JAN_PHRASE_COLUMN'];
const SPREADSHEET_ENG_PHRASE_COLUMN = process.env['SPREADSHEET_ENG_PHRASE_COLUMN'];

const CREDENTIALS = process.env['CREDENTIALS'];
const TOKEN = process.env['TOKEN'];

const {google} = require('googleapis');

module.exports.getSpreadSheetPhrase = async () => {
    try{
        const result = await authorize(JSON.parse(CREDENTIALS), getCellsValue);
        console.log('authorize succeeded.');

        return result;
    } catch(err) {
        console.log('authorize failed.');
        console.log(err);
    };
}
    
async function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try{
        oAuth2Client.setCredentials(JSON.parse(TOKEN));
        let result = await callback(oAuth2Client);
        console.log('oAuth succeeded.');

        return result;
    } catch(err) {
        console.log('oAuth failed.');
        console.log(err);
    };
}
    
async function getCellsValue(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    const params = {
        spreadsheetId: SPREADSHEET_ID,
        range: SPREADSHEET_NAME + SPREADSHEET_RANGE,
    };

    try {
        let response = await sheets.spreadsheets.values.get(params);
        const rows = response.data.values;
        const lastIndex = rows.length - 1;

        const result = [
            rows[lastIndex][SPREADSHEET_JAN_PHRASE_COLUMN - 1],
            rows[lastIndex][SPREADSHEET_ENG_PHRASE_COLUMN - 1]
        ]

        console.log('statusCode: ' + response.status);
        console.log('statusText: ' + response.statusText);
        
        return result;
    } catch(err) {
        return console.log('The API returned an error: ' + err);
    }
}