/**
 * Google Sheets Integration
 * Handles logging product usage to Google Sheets for backup/analysis
 */

import { google } from 'googleapis';

interface LogEntry {
  productId: string;
  productName: string;
  category: string;
  timestamp: string;
  points: number;
}

/**
 * Check if Google Sheets integration is enabled
 */
export function isGoogleSheetsEnabled(): boolean {
  return process.env.GOOGLE_SHEETS_ENABLED === 'true';
}

/**
 * Get Google Sheets client with authentication
 */
function getGoogleSheetsClient() {
  // Method 1: Use service account credentials from environment variables
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  }

  // Method 2: Use GOOGLE_APPLICATION_CREDENTIALS file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  }

  throw new Error('Google Sheets credentials not configured. See GOOGLE_SHEETS_SETUP.md');
}

/**
 * Append a log entry to Google Sheets
 */
export async function appendLogToSheet(entry: LogEntry): Promise<{ success: boolean; error?: string }> {
  // Check if Google Sheets is enabled
  if (!isGoogleSheetsEnabled()) {
    console.log('Google Sheets integration is disabled');
    return { success: true }; // Silently succeed
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  if (!spreadsheetId) {
    console.error('GOOGLE_SHEETS_SPREADSHEET_ID not configured');
    return { success: false, error: 'Spreadsheet ID not configured' };
  }

  try {
    const sheets = getGoogleSheetsClient();

    // Format the row data
    const row = [
      entry.timestamp,
      entry.productId,
      entry.productName,
      entry.category,
      entry.points,
    ];

    // Append the row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log('Successfully logged to Google Sheets:', response.data.updates?.updatedRows, 'row(s)');

    return { success: true };
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);

    // Return a user-friendly error message
    let errorMessage = 'Failed to write to Google Sheets';

    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Check sheet sharing with service account.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Spreadsheet or sheet not found. Check SPREADSHEET_ID and SHEET_NAME.';
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Invalid credentials. Check service account configuration.';
      }
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Batch append multiple log entries (for future optimization)
 */
export async function batchAppendLogsToSheet(entries: LogEntry[]): Promise<{ success: boolean; error?: string }> {
  if (!isGoogleSheetsEnabled()) {
    return { success: true };
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  if (!spreadsheetId) {
    return { success: false, error: 'Spreadsheet ID not configured' };
  }

  try {
    const sheets = getGoogleSheetsClient();

    // Format rows
    const rows = entries.map((entry) => [
      entry.timestamp,
      entry.productId,
      entry.productName,
      entry.category,
      entry.points,
    ]);

    // Append all rows at once
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    console.log('Successfully batch logged to Google Sheets:', response.data.updates?.updatedRows, 'row(s)');

    return { success: true };
  } catch (error) {
    console.error('Error batch writing to Google Sheets:', error);
    return { success: false, error: 'Batch write failed' };
  }
}

/**
 * Initialize the Google Sheet with headers (run once)
 */
export async function initializeSheet(): Promise<{ success: boolean; error?: string }> {
  if (!isGoogleSheetsEnabled()) {
    return { success: true };
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  if (!spreadsheetId) {
    return { success: false, error: 'Spreadsheet ID not configured' };
  }

  try {
    const sheets = getGoogleSheetsClient();

    // Check if headers already exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:E1`,
    });

    if (response.data.values && response.data.values.length > 0) {
      console.log('Sheet already has headers');
      return { success: true };
    }

    // Add headers
    const headers = ['Timestamp', 'Product ID', 'Product Name', 'Category', 'Points'];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:E1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });

    console.log('Successfully initialized Google Sheet with headers');

    return { success: true };
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
    return { success: false, error: 'Failed to initialize sheet' };
  }
}

/**
 * Test Google Sheets connection
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isGoogleSheetsEnabled()) {
    return { success: false, error: 'Google Sheets integration is disabled' };
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    return { success: false, error: 'Spreadsheet ID not configured' };
  }

  try {
    const sheets = getGoogleSheetsClient();

    // Try to read sheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log('Successfully connected to Google Sheet:', response.data.properties?.title);

    return { success: true };
  } catch (error) {
    console.error('Google Sheets connection test failed:', error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Connection test failed' };
  }
}
