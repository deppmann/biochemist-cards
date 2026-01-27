#!/usr/bin/env python3
"""
Sync Trading Cards from Google Drive to Local Repository

This script downloads card images from a Google Drive folder (linked to Google Forms)
and updates cards.json with the new entries.

Setup Instructions:
1. Install dependencies: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
2. Create a Google Cloud project and enable the Drive API
3. Create OAuth credentials (Desktop app) and download as credentials.json
4. Place credentials.json in the same directory as this script
5. Run the script - it will open a browser for authentication on first run

Usage:
    python sync_from_drive.py

The script will:
- Connect to your Google Drive
- Find the Google Forms response folder
- Download new card images
- Update cards.json with metadata
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path

# Google API imports
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    print("Google API libraries not installed.")
    print("Install with: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")

# Configuration
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID_HERE'  # Replace with your Google Drive folder ID
CARDS_DIR = Path(__file__).parent.parent / 'cards'
CARDS_JSON = Path(__file__).parent.parent / 'cards.json'

def get_credentials():
    """Get or refresh Google API credentials."""
    creds = None
    token_path = Path(__file__).parent / 'token.json'
    credentials_path = Path(__file__).parent / 'credentials.json'

    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not credentials_path.exists():
                print(f"Missing {credentials_path}")
                print("Download OAuth credentials from Google Cloud Console")
                return None
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
            creds = flow.run_local_server(port=0)

        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    return creds

def sanitize_filename(name):
    """Convert scientist name to filename format: lastname_firstname"""
    # Remove special characters
    name = re.sub(r'[^\w\s-]', '', name)
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[-1].lower()}_{parts[0].lower()}"
    return name.lower().replace(' ', '_')

def download_file(service, file_id, destination):
    """Download a file from Google Drive."""
    request = service.files().get_media(fileId=file_id)
    with open(destination, 'wb') as f:
        downloader = MediaIoBaseDownload(f, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            if status:
                print(f"  Download progress: {int(status.progress() * 100)}%")

def load_cards_json():
    """Load existing cards.json or create default structure."""
    if CARDS_JSON.exists():
        with open(CARDS_JSON, 'r') as f:
            return json.load(f)
    return {
        "cards": [],
        "eras": [
            "Pre-1900 Foundations",
            "Enzymology & Protein Chemistry",
            "Carbohydrate & Lipid Chemistry",
            "Vitamins & Nutrition",
            "Metabolic Revolutions",
            "DNA Structure & Replication",
            "Genetic Code & Protein Synthesis",
            "Structural Biology Revolution",
            "Structural Chemistry Revolution",
            "Molecular Biology of Gene Regulation",
            "Genomics & Bioinformatics Era",
            "Structural Biology & Drug Discovery",
            "Cancer Biology & Oncogenes",
            "Neuroscience & Metabolism Frontiers",
            "Contemporary Leaders & Rising Stars",
            "Synthetic Biology & Future Pioneers"
        ],
        "last_updated": datetime.now().isoformat()
    }

def save_cards_json(data):
    """Save cards.json with updated data."""
    data['last_updated'] = datetime.now().isoformat()
    with open(CARDS_JSON, 'w') as f:
        json.dump(data, f, indent=2)

def sync_from_drive():
    """Main sync function."""
    if not GOOGLE_API_AVAILABLE:
        return

    print("Connecting to Google Drive...")
    creds = get_credentials()
    if not creds:
        return

    service = build('drive', 'v3', credentials=creds)

    # Get files from the folder
    print(f"Scanning folder: {DRIVE_FOLDER_ID}")
    results = service.files().list(
        q=f"'{DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/'",
        fields="files(id, name, createdTime, mimeType)"
    ).execute()

    files = results.get('files', [])
    print(f"Found {len(files)} images")

    # Ensure cards directory exists
    CARDS_DIR.mkdir(exist_ok=True)

    # Load existing data
    data = load_cards_json()
    existing_ids = {card['id'] for card in data['cards']}

    # Process files (group by submission)
    # Assumes naming convention: [timestamp]_[scientist_name]_front.png
    for file in files:
        print(f"\nProcessing: {file['name']}")

        # Download if not already present
        local_path = CARDS_DIR / file['name']
        if not local_path.exists():
            print(f"  Downloading to {local_path}")
            download_file(service, file['id'], local_path)
        else:
            print(f"  Already exists, skipping")

    print("\nSync complete!")
    print(f"Cards directory: {CARDS_DIR}")
    print(f"Run 'git add . && git commit -m \"Add new cards\" && git push' to deploy")

def add_card_manually(scientist_name, years, era, contribution, front_file, back_file, student_name=""):
    """
    Manually add a card to cards.json.

    Usage:
        from sync_from_drive import add_card_manually
        add_card_manually(
            scientist_name="Marie Curie",
            years="1867-1934",
            era="Pre-1900 Foundations",
            contribution="Pioneered research on radioactivity",
            front_file="curie_marie_front.png",
            back_file="curie_marie_back.png",
            student_name="John Doe"
        )
    """
    data = load_cards_json()

    card_id = sanitize_filename(scientist_name)

    # Check if already exists
    for card in data['cards']:
        if card['id'] == card_id:
            print(f"Card {card_id} already exists, updating...")
            card.update({
                "scientist_name": scientist_name,
                "scientist_years": years,
                "era": era,
                "contribution": contribution,
                "card_front_url": f"cards/{front_file}",
                "card_back_url": f"cards/{back_file}",
                "student_name": student_name,
                "submitted_date": datetime.now().strftime("%Y-%m-%d")
            })
            save_cards_json(data)
            return

    # Add new card
    new_card = {
        "id": card_id,
        "scientist_name": scientist_name,
        "scientist_years": years,
        "era": era,
        "contribution": contribution,
        "card_front_url": f"cards/{front_file}",
        "card_back_url": f"cards/{back_file}",
        "student_name": student_name,
        "submitted_date": datetime.now().strftime("%Y-%m-%d")
    }

    data['cards'].append(new_card)
    save_cards_json(data)
    print(f"Added card: {scientist_name}")

if __name__ == '__main__':
    if GOOGLE_API_AVAILABLE:
        sync_from_drive()
    else:
        print("\n--- Manual Mode ---")
        print("To add cards manually, use the add_card_manually() function:")
        print("""
from sync_from_drive import add_card_manually

add_card_manually(
    scientist_name="Marie Curie",
    years="1867-1934",
    era="Pre-1900 Foundations",
    contribution="Pioneered research on radioactivity",
    front_file="curie_marie_front.png",
    back_file="curie_marie_back.png",
    student_name="Student Name"
)
""")
