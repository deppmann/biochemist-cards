/**
 * Google Apps Script for Biochemist Trading Cards
 *
 * This script automatically syncs form submissions to GitHub.
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Open your Google Form
 * 2. Click the three dots menu → "Script editor" (or go to Extensions → Apps Script)
 * 3. Delete any existing code and paste this entire file
 * 4. Update the CONFIG section below with your values
 * 5. Click "Run" → "initialSetup" and authorize the script
 * 6. The script will now run automatically on each form submission
 *
 * TO GET A GITHUB TOKEN:
 * 1. Go to github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
 * 2. Click "Generate new token (classic)"
 * 3. Name: "Biochemist Cards Sync"
 * 4. Expiration: Choose based on your semester (e.g., 90 days)
 * 5. Scopes: Check "repo" (full control of private repositories)
 * 6. Click "Generate token" and copy it immediately
 * 7. Paste it in the GITHUB_TOKEN field below
 */

// ============ CONFIGURATION - UPDATE THESE VALUES ============
const CONFIG = {
  GITHUB_TOKEN: 'YOUR_GITHUB_TOKEN_HERE',  // Your GitHub personal access token
  GITHUB_REPO: 'deppmann/biochemist-cards', // Your repo (username/repo-name)
  GITHUB_BRANCH: 'main',

  // Column numbers in your form response spreadsheet (1-indexed)
  // Adjust these based on your form's question order
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
// ============ END CONFIGURATION ============


/**
 * Run this once to set up the form submission trigger
 */
function initialSetup() {
  // Remove any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create new trigger for form submissions
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  Logger.log('Setup complete! The script will now run automatically on form submissions.');
  Logger.log('Test it by submitting a form response.');
}


/**
 * Triggered automatically when a form is submitted
 */
function onFormSubmit(e) {
  try {
    const row = e.values;
    Logger.log('New form submission received');

    // Extract data from form response
    const data = {
      timestamp: row[CONFIG.COLUMNS.TIMESTAMP - 1],
      email: row[CONFIG.COLUMNS.EMAIL - 1],
      studentName: row[CONFIG.COLUMNS.STUDENT_NAME - 1],
      scientistName: row[CONFIG.COLUMNS.SCIENTIST_NAME - 1],
      scientistYears: row[CONFIG.COLUMNS.SCIENTIST_YEARS - 1],
      era: row[CONFIG.COLUMNS.ERA - 1],
      contribution: row[CONFIG.COLUMNS.CONTRIBUTION - 1],
      frontImageUrl: row[CONFIG.COLUMNS.FRONT_IMAGE - 1],
      backImageUrl: row[CONFIG.COLUMNS.BACK_IMAGE - 1]
    };

    Logger.log('Processing card for: ' + data.scientistName);

    // Generate card ID from scientist name
    const cardId = sanitizeFilename(data.scientistName);

    // Download images from Google Drive
    const frontImage = getImageFromDriveUrl(data.frontImageUrl);
    const backImage = getImageFromDriveUrl(data.backImageUrl);

    if (!frontImage || !backImage) {
      throw new Error('Could not retrieve images from Drive');
    }

    // Upload images to GitHub
    const frontPath = `cards/${cardId}_front.png`;
    const backPath = `cards/${cardId}_back.png`;

    uploadToGitHub(frontPath, frontImage, `Add front image for ${data.scientistName}`);
    uploadToGitHub(backPath, backImage, `Add back image for ${data.scientistName}`);

    // Update cards.json
    updateCardsJson(data, cardId, frontPath, backPath);

    Logger.log('Successfully processed card for: ' + data.scientistName);

    // Optional: Send confirmation email
    // sendConfirmationEmail(data.email, data.scientistName);

  } catch (error) {
    Logger.log('Error processing submission: ' + error.message);
    // Optional: Send error notification
    // MailApp.sendEmail('your@email.com', 'Card Sync Error', error.message);
  }
}


/**
 * Convert scientist name to filename format: lastname_firstname
 */
function sanitizeFilename(name) {
  // Remove special characters
  name = name.replace(/[^\w\s-]/g, '');
  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    // Take last word as lastname, first word as firstname
    return parts[parts.length - 1].toLowerCase() + '_' + parts[0].toLowerCase();
  }
  return name.toLowerCase().replace(/\s+/g, '_');
}


/**
 * Get image blob from Google Drive URL
 */
function getImageFromDriveUrl(url) {
  try {
    // Extract file ID from Drive URL
    // URLs can be in format: https://drive.google.com/open?id=XXX or https://drive.google.com/file/d/XXX/view
    let fileId;

    if (url.includes('id=')) {
      fileId = url.split('id=')[1].split('&')[0];
    } else if (url.includes('/d/')) {
      fileId = url.split('/d/')[1].split('/')[0];
    } else {
      Logger.log('Could not parse Drive URL: ' + url);
      return null;
    }

    const file = DriveApp.getFileById(fileId);
    return file.getBlob();

  } catch (error) {
    Logger.log('Error getting image from Drive: ' + error.message);
    return null;
  }
}


/**
 * Upload a file to GitHub
 */
function uploadToGitHub(path, blob, message) {
  const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${path}`;

  // Check if file already exists (to get its SHA for updating)
  let sha = null;
  try {
    const existingResponse = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });

    if (existingResponse.getResponseCode() === 200) {
      sha = JSON.parse(existingResponse.getContentText()).sha;
    }
  } catch (e) {
    // File doesn't exist, that's fine
  }

  // Upload/update file
  const payload = {
    message: message,
    content: Utilities.base64Encode(blob.getBytes()),
    branch: CONFIG.GITHUB_BRANCH
  };

  if (sha) {
    payload.sha = sha;
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  });

  if (response.getResponseCode() !== 200 && response.getResponseCode() !== 201) {
    throw new Error(`GitHub upload failed: ${response.getContentText()}`);
  }

  Logger.log(`Uploaded ${path} to GitHub`);
}


/**
 * Update cards.json with new card data
 */
function updateCardsJson(data, cardId, frontPath, backPath) {
  const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/cards.json`;

  // Get current cards.json
  const response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  const fileData = JSON.parse(response.getContentText());
  const currentContent = Utilities.newBlob(Utilities.base64Decode(fileData.content)).getDataAsString();
  const cardsJson = JSON.parse(currentContent);

  // Check if card already exists
  const existingIndex = cardsJson.cards.findIndex(c => c.id === cardId);

  const newCard = {
    id: cardId,
    scientist_name: data.scientistName,
    scientist_years: data.scientistYears,
    era: data.era,
    contribution: data.contribution,
    card_front_url: frontPath,
    card_back_url: backPath,
    student_name: data.studentName,
    submitted_date: new Date().toISOString().split('T')[0]
  };

  if (existingIndex >= 0) {
    cardsJson.cards[existingIndex] = newCard;
    Logger.log(`Updated existing card: ${cardId}`);
  } else {
    cardsJson.cards.push(newCard);
    Logger.log(`Added new card: ${cardId}`);
  }

  cardsJson.last_updated = new Date().toISOString();

  // Upload updated cards.json
  const updatedContent = JSON.stringify(cardsJson, null, 2);

  const uploadResponse = UrlFetchApp.fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      message: `Add card for ${data.scientistName}`,
      content: Utilities.base64Encode(updatedContent),
      sha: fileData.sha,
      branch: CONFIG.GITHUB_BRANCH
    })
  });

  if (uploadResponse.getResponseCode() !== 200 && uploadResponse.getResponseCode() !== 201) {
    throw new Error(`Failed to update cards.json: ${uploadResponse.getContentText()}`);
  }
}


/**
 * Optional: Send confirmation email to student
 */
function sendConfirmationEmail(email, scientistName) {
  const subject = 'Trading Card Submitted Successfully!';
  const body = `Your trading card for ${scientistName} has been submitted and will appear in the gallery shortly.\n\nView the gallery at: https://deppmann.github.io/biochemist-cards`;

  MailApp.sendEmail(email, subject, body);
}


/**
 * Manual test function - run this to test with the most recent form submission
 */
function testWithLatestSubmission() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  onFormSubmit({ values: values });
}


/**
 * Utility: List all files in the form's response folder
 */
function listFormFiles() {
  const form = FormApp.getActiveForm();
  const folder = DriveApp.getFileById(form.getId()).getParents().next();
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    Logger.log(`${file.getName()} - ${file.getId()}`);
  }
}
