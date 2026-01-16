import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  })

  const sheets = google.sheets({ version: 'v4', auth })
  return sheets
}

export async function getSheetData(spreadsheetId: string, range: string) {
  const sheets = await getGoogleSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return response.data.values || []
}

export async function getAllSheetData(spreadsheetId: string, sheetName: string) {
  return getSheetData(spreadsheetId, `${sheetName}!A:ZZ`)
}
