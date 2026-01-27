# Biochemists Through Time

A trading card gallery celebrating the scientists who shaped biochemistry, created by BIOL 3030 students at UVA.

**Live Site:** [deppmann.github.io/biochemist-cards](https://deppmann.github.io/biochemist-cards)

## Overview

This gallery displays student-created trading cards for famous biochemists. Each card features:
- **Front:** Stylized AI-generated portrait with name and tagline
- **Back:** Stats, key facts, signature discovery, and a quote

### Features
- Click cards to flip between front and back
- Double-click to open enlarged view with navigation
- Filter by era or search by name
- Shuffle for random viewing
- Keyboard navigation (arrows, space, ESC)
- Mobile-friendly with swipe gestures

## For Students

See the assignment instructions in Canvas/Piazza for how to create and submit your card.

## For Instructors

### Quick Start: Adding Cards Manually

1. **Download images** from Google Form responses
2. **Rename files** to: `lastname_firstname_front.png` and `lastname_firstname_back.png`
3. **Put images** in the `cards/` folder
4. **Run the add script:**
   ```bash
   python scripts/add_card.py
   # Follow the prompts
   ```
5. **Deploy:**
   ```bash
   git add . && git commit -m "Add new cards" && git push
   ```

The site automatically rebuilds when you push to GitHub.

### File Naming Convention

```
cards/
├── pauling_linus_front.png
├── pauling_linus_back.png
├── curie_marie_front.png
├── curie_marie_back.png
└── ...
```

### Manual JSON Editing

If you prefer to edit `cards.json` directly:

```json
{
  "id": "lastname_firstname",
  "scientist_name": "Full Name",
  "scientist_years": "1901–1994",
  "era": "Era Name",
  "contribution": "One sentence description",
  "card_front_url": "cards/lastname_firstname_front.png",
  "card_back_url": "cards/lastname_firstname_back.png",
  "student_name": "Student Name",
  "submitted_date": "2026-02-04"
}
```

### Era Categories

```
Pre-1900 Foundations
Enzymology & Protein Chemistry
Carbohydrate & Lipid Chemistry
Vitamins & Nutrition
Metabolic Revolutions
DNA Structure & Replication
Genetic Code & Protein Synthesis
Structural Biology Revolution
Structural Chemistry Revolution
Molecular Biology of Gene Regulation
Genomics & Bioinformatics Era
Structural Biology & Drug Discovery
Cancer Biology & Oncogenes
Neuroscience & Metabolism Frontiers
Contemporary Leaders & Rising Stars
Synthetic Biology & Future Pioneers
```

## GitHub Setup

### Initial Setup

1. Create repository at github.com named `biochemist-cards`
2. Make it **Public**
3. Upload all files from this folder
4. Go to **Settings → Pages**
5. Source: `GitHub Actions`
6. The workflow will automatically deploy on push

### Automatic Deployment

The `.github/workflows/deploy.yml` file handles automatic deployment. Every time you push changes, the site updates automatically.

## File Structure

```
biochemist-cards/
├── index.html              # Main gallery page
├── styles.css              # Styling
├── script.js               # Interactivity
├── cards.json              # Card data
├── README.md               # This file
├── cards/                  # Card images
│   ├── pauling_linus_front.png
│   ├── pauling_linus_back.png
│   └── ...
├── scripts/
│   ├── add_card.py         # Interactive card adder
│   └── sync_from_drive.py  # Google Drive sync (advanced)
└── .github/
    └── workflows/
        └── deploy.yml      # Auto-deploy workflow
```

## Local Development

To test locally before pushing:

```bash
# Simple Python server
python -m http.server 8000
# Visit http://localhost:8000
```

## Batch Processing Tips

### Download All Form Responses at Once

1. Open your Google Form
2. Go to **Responses → Spreadsheet icon** (view in Sheets)
3. In Sheets: **File → Download → CSV**
4. The image URLs in the CSV can be bulk-downloaded

### Bulk Rename Files

On Mac/Linux:
```bash
# If files are named "Response 1 - Front.png", etc.
for f in *.png; do
  # Your renaming logic here
  echo "$f"
done
```

## Course Info

**BIOL 3030: Biochemistry**
University of Virginia • Spring 2026
Prof. Christopher Deppmann
