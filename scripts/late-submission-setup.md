# Late Submission Form Setup Guide

This guide explains how to set up a Google Form for late submissions and card replacements.

## Step 1: Create the Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Click **+ Blank** to create a new form
3. Name it: **"BIOL 3030 Trading Card - Late Submission"**

### Form Questions (in order):

1. **Email address** (automatic - enable "Collect email addresses" in Settings)

2. **Your Name** (Short answer, Required)
   - Description: "First and Last name"

3. **Discussion Section/Pod** (Dropdown, Required)
   - Add all your pod options

4. **Submission Type** (Multiple choice, Required)
   - "New submission (I haven't submitted a card before)"
   - "Replacement (I want to replace my previous card)"

5. **If replacing, what scientist was your previous card about?** (Short answer)
   - Description: "Leave blank if this is a new submission"

6. **Scientist Name** (Short answer, Required)
   - Description: "Full name of the biochemist"

7. **Years Active** (Short answer, Required)
   - Description: "e.g., 1867-1934"

8. **Era/Topic** (Dropdown, Required)
   - Add all eras:
     - Amino Acid & Nitrogen Metabolism
     - Ancient Metabolism & Fermentation
     - Bioinformatics & Computational Biology
     - Biotechnology & Genetic Engineering
     - Cell Biology & Compartmentalization
     - Chromatin & Epigenetics
     - DNA Damage & Repair
     - Enzymology Golden Age
     - Founders of Intermediary Metabolism
     - Gene Expression & Regulation
     - Genomics & Post-Genomic Biology
     - Historical Figures Often Overlooked
     - Hormone & Signal Transduction
     - Lipids & Membrane Biochemistry
     - mRNA Vaccines & Targeted Therapy
     - Photosynthesis & Plant Biochemistry
     - Protein Biochemistry & Enzymes
     - RNA World & Beyond
     - Structural Biology Revolution
     - The Chromosome & Genetic Inheritance
     - The DNA Revolution
     - The Genetic Code & Protein Synthesis

9. **One-sentence contribution** (Short answer, Required)
   - Description: "A brief description of their main contribution to biochemistry"

10. **Card Front Image** (File upload, Required)
    - Allow only: Images
    - Max files: 1
    - Max file size: 10 MB

11. **Card Back Image** (File upload, Required)
    - Allow only: Images
    - Max files: 1
    - Max file size: 10 MB

12. **Reason for late submission** (Paragraph)
    - Description: "Optional - explain why you're submitting late or replacing your card"

## Step 2: Form Settings

1. Click the **Settings** gear icon
2. Under **Responses**:
   - Turn ON "Collect email addresses"
   - Turn ON "Limit to 1 response" (optional, but recommended)
3. Under **Defaults**:
   - Turn ON "Make questions required by default"

## Step 3: Link to Response Spreadsheet

1. Go to the **Responses** tab
2. Click the green Sheets icon to create a linked spreadsheet
3. Name it: "BIOL 3030 Late Submissions (Responses)"

## Step 4: Set Up the Apps Script

1. In the response spreadsheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy and paste the contents of `late-submission-script.js`
4. Update the CONFIG section with:
   - Your GitHub token
   - Verify column numbers match your form
5. Click **Run → initialSetup**
6. Authorize the script when prompted

## Step 5: Test the Form

1. Submit a test response through the form
2. Check the Apps Script logs (View → Logs) for any errors
3. Verify the card appears on the website

## Notes on Replacements

When a student submits a "replacement":
- The script will look for their previous card by scientist name
- If found, it updates the existing entry (same ID)
- If not found, it creates a new entry
- Old images are overwritten with new ones

## Column Reference

The default column configuration assumes:
1. Timestamp
2. Email
3. Student Name
4. Discussion Section
5. Submission Type (New/Replacement)
6. Previous Scientist Name
7. Scientist Name
8. Years Active
9. Era
10. Contribution
11. Front Image URL
12. Back Image URL
13. Reason for late submission

Adjust `CONFIG.COLUMNS` in the script if your form has different ordering.
