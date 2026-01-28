/**
 * Google Apps Script for Late Submissions - Biochemist Trading Cards
 *
 * Handles both new late submissions and card replacements.
 *
 * SETUP:
 * 1. Create the late submission Google Form (see late-submission-setup.md)
 * 2. Open the linked response spreadsheet
 * 3. Go to Extensions → Apps Script
 * 4. Delete existing code and paste this entire file
 * 5. Update the CONFIG section below
 * 6. Run → initialSetup (and authorize)
 */

// ============ CONFIGURATION - UPDATE THESE VALUES ============
const CONFIG = {
  GITHUB_TOKEN: 'YOUR_GITHUB_TOKEN_HERE',  // Same token as original form
  GITHUB_REPO: 'deppmann/biochemist-cards',
  GITHUB_BRANCH: 'main',

  // Column numbers for LATE SUBMISSION form (1-indexed)
  COLUMNS: {
    TIMESTAMP: 1,
    EMAIL: 2,
    STUDENT_NAME: 3,
    DISCUSSION_SECTION: 4,
    SUBMISSION_TYPE: 5,        // "New submission" or "Replacement"
    PREVIOUS_SCIENTIST: 6,     // Only filled for replacements
    SCIENTIST_NAME: 7,
    SCIENTIST_YEARS: 8,
    ERA: 9,
    CONTRIBUTION: 10,
    FRONT_IMAGE: 11,
    BACK_IMAGE: 12,
    REASON: 13                 // Optional reason for late submission
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
  ScriptApp.newTrigger('onLateFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  Logger.log('Late submission setup complete!');
  Logger.log('The script will now run automatically on form submissions.');
}


/**
 * Triggered automatically when the late submission form is submitted
 */
function onLateFormSubmit(e) {
  try {
    const row = e.values;
    Logger.log('Late submission received');

    // Extract data from form response
    const data = {
      timestamp: row[CONFIG.COLUMNS.TIMESTAMP - 1],
      email: row[CONFIG.COLUMNS.EMAIL - 1],
      studentName: row[CONFIG.COLUMNS.STUDENT_NAME - 1],
      submissionType: row[CONFIG.COLUMNS.SUBMISSION_TYPE - 1],
      previousScientist: row[CONFIG.COLUMNS.PREVIOUS_SCIENTIST - 1] || '',
      scientistName: row[CONFIG.COLUMNS.SCIENTIST_NAME - 1],
      scientistYears: row[CONFIG.COLUMNS.SCIENTIST_YEARS - 1],
      era: row[CONFIG.COLUMNS.ERA - 1],
      contribution: row[CONFIG.COLUMNS.CONTRIBUTION - 1],
      frontImageUrl: row[CONFIG.COLUMNS.FRONT_IMAGE - 1],
      backImageUrl: row[CONFIG.COLUMNS.BACK_IMAGE - 1],
      reason: row[CONFIG.COLUMNS.REASON - 1] || ''
    };

    const isReplacement = data.submissionType.toLowerCase().includes('replacement');
    Logger.log(`Processing ${isReplacement ? 'REPLACEMENT' : 'NEW'} card for: ${data.scientistName}`);

    // Generate card ID from scientist name
    const cardId = sanitizeFilename(data.scientistName);

    // For replacements, also get the old card ID to remove if different scientist
    let oldCardId = null;
    if (isReplacement && data.previousScientist) {
      oldCardId = sanitizeFilename(data.previousScientist);
      if (oldCardId !== cardId) {
        Logger.log(`Replacement: will remove old card ${oldCardId} and create ${cardId}`);
      }
    }

    // Download images from Google Drive
    const frontImage = getImageFromDriveUrl(data.frontImageUrl);
    const backImage = getImageFromDriveUrl(data.backImageUrl);

    if (!frontImage || !backImage) {
      throw new Error('Could not retrieve images from Drive');
    }

    // Upload images to GitHub
    const frontPath = `cards/${cardId}_front.png`;
    const backPath = `cards/${cardId}_back.png`;

    uploadToGitHub(frontPath, frontImage, `Add front image for ${data.scientistName} (late submission)`);
    uploadToGitHub(backPath, backImage, `Add back image for ${data.scientistName} (late submission)`);

    // Update cards.json (handles both new cards and replacements)
    updateCardsJsonForLateSubmission(data, cardId, frontPath, backPath, oldCardId);

    Logger.log('Successfully processed late submission for: ' + data.scientistName);

    // Send confirmation email
    sendLateConfirmationEmail(data.email, data.scientistName, isReplacement);

  } catch (error) {
    Logger.log('Error processing late submission: ' + error.message);
    Logger.log(error.stack);
    // Optionally notify instructor of errors
    // MailApp.sendEmail('your@email.com', 'Late Submission Error', error.message + '\n\n' + error.stack);
  }
}


/**
 * Convert scientist name to filename format: lastname_firstname
 */
function sanitizeFilename(name) {
  // Remove special characters except spaces and hyphens
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

  // Check if file already exists
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
    // File doesn't exist
  }

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
 * Update cards.json for late submissions
 * Handles both new cards and replacements
 */
function updateCardsJsonForLateSubmission(data, cardId, frontPath, backPath, oldCardId) {
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

  // If this is a replacement with a different scientist, remove the old card
  if (oldCardId && oldCardId !== cardId) {
    const oldIndex = cardsJson.cards.findIndex(c => c.id === oldCardId);
    if (oldIndex >= 0) {
      Logger.log(`Removing old card: ${oldCardId}`);
      cardsJson.cards.splice(oldIndex, 1);
      // Note: Old images remain in repo but won't be referenced
    }
  }

  // Check if new card already exists
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
    submitted_date: new Date().toISOString().split('T')[0],
    late_submission: true
  };

  if (existingIndex >= 0) {
    cardsJson.cards[existingIndex] = newCard;
    Logger.log(`Updated existing card: ${cardId}`);
  } else {
    cardsJson.cards.push(newCard);
    Logger.log(`Added new late submission card: ${cardId}`);
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
      message: `Late submission: ${data.scientistName} by ${data.studentName}`,
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
 * Send confirmation email for late submission
 */
function sendLateConfirmationEmail(email, scientistName, isReplacement) {
  const subject = isReplacement
    ? 'Trading Card Replacement Submitted!'
    : 'Late Trading Card Submitted!';

  const body = `Your ${isReplacement ? 'replacement' : 'late'} trading card for ${scientistName} has been submitted successfully.

It will appear in the gallery within a few minutes.

View the gallery at: https://deppmann.github.io/biochemist-cards

Note: Late submissions may receive partial credit per the syllabus.`;

  try {
    MailApp.sendEmail(email, subject, body);
    Logger.log(`Confirmation email sent to ${email}`);
  } catch (e) {
    Logger.log(`Could not send email: ${e.message}`);
  }
}


/**
 * Manual test - run with the most recent submission
 */
function testWithLatestSubmission() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  onLateFormSubmit({ values: values });
}


/**
 * Utility: Process all unprocessed late submissions
 * Run this manually if any submissions failed to process
 */
function processAllPendingSubmissions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    try {
      Logger.log(`Processing row ${i + 1}...`);
      onLateFormSubmit({ values: data[i] });
      // Add delay to avoid rate limits
      Utilities.sleep(2000);
    } catch (e) {
      Logger.log(`Error on row ${i + 1}: ${e.message}`);
    }
  }

  Logger.log('Finished processing all submissions');
}
