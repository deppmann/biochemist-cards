# Setting Up Automatic Card Sync from Google Forms to GitHub

This guide walks you through setting up automatic syncing so that when students submit cards via Google Forms, they automatically appear on your website.

## Step 1: Create a GitHub Personal Access Token

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - **Note:** `Biochemist Cards Sync`
   - **Expiration:** `90 days` (or longer if needed)
   - **Scopes:** Check **`repo`** (this gives access to push to your repository)
4. Click **"Generate token"**
5. **IMPORTANT:** Copy the token immediately! It starts with `ghp_` and you won't be able to see it again.

Save this token - you'll need it in Step 3.

---

## Step 2: Open Google Apps Script

1. Open your Google Form (the one collecting card submissions)
2. Go to the **Responses** tab
3. Click the **Google Sheets icon** to open (or create) the response spreadsheet
4. In the spreadsheet, go to **Extensions** → **Apps Script**
5. This opens the script editor

---

## Step 3: Add the Script

1. Delete any existing code in the editor
2. Copy the ENTIRE contents of `scripts/google-apps-script.js` and paste it
3. **Update the CONFIG section** at the top:

```javascript
const CONFIG = {
  GITHUB_TOKEN: 'ghp_YOUR_TOKEN_HERE',  // Paste your token from Step 1
  GITHUB_REPO: 'deppmann/biochemist-cards',
  GITHUB_BRANCH: 'main',

  // Update these column numbers to match your form
  // Count columns in your response spreadsheet (A=1, B=2, etc.)
  COLUMNS: {
    TIMESTAMP: 1,
    EMAIL: 2,
    STUDENT_NAME: 3,
    DISCUSSION_SECTION: 4,
    SCIENTIST_NAME: 5,
    SCIENTIST_YEARS: 6,
    ERA: 7,
    CONTRIBUTION: 8,
    FRONT_IMAGE: 9,
    BACK_IMAGE: 10
  }
};
```

4. **Verify your column numbers:**
   - Open your form's response spreadsheet
   - Check which column contains each piece of data
   - Update the numbers in CONFIG.COLUMNS to match

---

## Step 4: Run Initial Setup

1. In the Apps Script editor, select **`initialSetup`** from the function dropdown (next to the play button)
2. Click the **Run** button (play icon)
3. You'll be prompted to authorize the script:
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [project name] (unsafe)"
   - Click "Allow"

This creates a trigger that runs automatically on each form submission.

---

## Step 5: Test It

1. Submit a test response to your Google Form
2. Wait 30-60 seconds
3. Check your GitHub repository - you should see:
   - New images in the `cards/` folder
   - Updated `cards.json`
4. Check your live site: https://deppmann.github.io/biochemist-cards

---

## Troubleshooting

### View Script Logs
1. In Apps Script, go to **View** → **Executions**
2. Click on any execution to see detailed logs

### Common Issues

**"Could not retrieve images from Drive"**
- The image URLs might be in a different format
- Check the Execution logs to see the URL format
- You may need to adjust the `getImageFromDriveUrl` function

**"GitHub upload failed"**
- Verify your GitHub token has the `repo` scope
- Check that the token hasn't expired
- Make sure the repository name is correct

**Column numbers don't match**
- Open your response spreadsheet
- Count columns carefully (A=1, B=2, etc.)
- Update CONFIG.COLUMNS to match

### Manual Test
Run `testWithLatestSubmission` from the Apps Script editor to test with the most recent form response.

---

## Security Notes

- The GitHub token is stored in your Apps Script, which only you can access
- Don't share the script with the token in it
- Generate a new token if you suspect it's been compromised
- Consider setting a shorter expiration and renewing each semester

---

## Form Field Requirements

Your Google Form should collect these fields (in order):
1. Student Name
2. Email (collected automatically by Google Forms)
3. Discussion Section
4. Scientist's Full Name
5. Scientist's Years (e.g., "1901-1994")
6. Era (dropdown with the 16 era options)
7. One-Sentence Contribution
8. Card Front Image (file upload, PNG, max 1MB)
9. Card Back Image (file upload, PNG, max 1MB)

The column order in your spreadsheet should match the COLUMNS config.
