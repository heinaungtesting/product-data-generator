# Google Sheets Integration Setup Guide

This guide explains how to set up Google Sheets integration for logging product usage.

## Prerequisites

- Google Cloud Platform account
- A Google Sheet to store logs

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in details:
   - Name: `myapp-sheets-logger`
   - Description: `Service account for logging to Google Sheets`
4. Click "Create and Continue"
5. Grant role: **Editor** (or create custom role with Sheets write access)
6. Click "Done"

## Step 3: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose **JSON** format
5. Click "Create" - the JSON file will download automatically
6. Save this file securely (DO NOT commit to git!)

## Step 4: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: `MyApp Product Logs`
4. Add headers in the first row:
   - A1: `Timestamp`
   - B1: `Product ID`
   - C1: `Product Name`
   - D1: `Category`
   - E1: `Points`
5. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
6. Share the sheet with the service account email:
   - Click "Share" button
   - Add the service account email (found in the JSON file: `client_email`)
   - Give **Editor** permission
   - Uncheck "Notify people"
   - Click "Share"

## Step 5: Configure Environment Variables

Create or update `.env.local` file in the myapp directory:

```bash
# Google Sheets Configuration
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_SHEET_NAME=Sheet1

# Google Service Account Credentials (from JSON file)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT**:
- Replace `your_spreadsheet_id_here` with the actual ID from Step 4
- Copy `client_email` and `private_key` from the downloaded JSON file
- Keep the quotes around GOOGLE_PRIVATE_KEY
- The `\n` in the private key must be actual newlines or escaped `\\n`

### Alternative: Use Full JSON File Path

Instead of copying individual fields, you can point to the JSON file:

```bash
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_SHEET_NAME=Sheet1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Step 6: Restart Development Server

```bash
npm run dev
```

## Step 7: Test Integration

1. Open your app
2. Go to any product detail page
3. Click "Add to log"
4. Check your Google Sheet - a new row should appear!

## Troubleshooting

### Error: "The caller does not have permission"

**Solution**: Make sure you shared the sheet with the service account email (Step 4, point 6)

### Error: "Invalid credentials"

**Solution**:
- Check that `GOOGLE_PRIVATE_KEY` has the correct format
- Ensure quotes are correct
- Try using `GOOGLE_APPLICATION_CREDENTIALS` instead

### Error: "Unable to parse range"

**Solution**:
- Check `GOOGLE_SHEETS_SHEET_NAME` matches the actual sheet tab name
- Default is `Sheet1`

### Logs not appearing in Sheet

**Solution**:
- Check browser console for errors
- Verify `.env.local` is in the correct directory
- Restart the dev server after changing environment variables
- Check that `GOOGLE_SHEETS_ENABLED=true`

## Disabling Google Sheets Integration

To disable (use local logs only):

```bash
GOOGLE_SHEETS_ENABLED=false
```

Or simply remove/comment out the Google Sheets environment variables.

## Security Best Practices

1. **Never commit credentials to git**:
   - Add `.env.local` to `.gitignore`
   - Add `*-credentials.json` to `.gitignore`

2. **Use environment variables in production**:
   - In Vercel: Project Settings > Environment Variables
   - Add each variable individually

3. **Restrict service account permissions**:
   - Only grant Sheets API access
   - Use least-privilege principle

4. **Rotate keys periodically**:
   - Delete old keys from Google Cloud Console
   - Generate new ones every 90 days

## Production Deployment

For Vercel or other platforms:

1. Go to project settings
2. Add environment variables:
   - `GOOGLE_SHEETS_ENABLED`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SHEETS_SHEET_NAME`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (paste entire key with `\n` as actual newlines)

3. Redeploy

## Monitoring

To monitor Google Sheets API usage:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Dashboard"
3. Click "Google Sheets API"
4. View quotas and usage statistics

## Rate Limits

Google Sheets API limits:
- 500 requests per 100 seconds per project
- 100 requests per 100 seconds per user

The current implementation:
- Makes 1 request per log entry
- Typical usage: <100 logs per day (well within limits)
- For high-volume apps, consider batch writing

## Data Format

Each log entry in the sheet contains:

| Column | Value | Example |
|--------|-------|---------|
| Timestamp | ISO 8601 | `2025-11-12T10:30:00.000Z` |
| Product ID | Product identifier | `vitc-1000mg` |
| Product Name | Localized name | `Vitamin C 1000mg` |
| Category | health or cosmetic | `health` |
| Points | Point value | `10` |

## Future Enhancements

Potential improvements:
- Batch writing for performance
- Add user ID column (if implementing auth)
- Add device/browser info
- Create summary sheets with formulas
- Set up Google Sheets triggers for notifications

---

**Setup Date**: 2025-11-12
**Last Updated**: 2025-11-12
**Status**: Ready for configuration
