#!/usr/bin/env python3
"""
Quick script to add a new card to cards.json

Usage:
    python add_card.py "Scientist Name" "1901-1994" "Era Name" "Contribution sentence" "front.png" "back.png"

Or run interactively:
    python add_card.py
"""

import json
import sys
import re
from datetime import datetime
from pathlib import Path

CARDS_JSON = Path(__file__).parent.parent / 'cards.json'

def sanitize_id(name):
    """Convert name to ID format: lastname_firstname"""
    name = re.sub(r'[^\w\s-]', '', name)
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[-1].lower()}_{parts[0].lower()}"
    return name.lower().replace(' ', '_')

def load_data():
    if CARDS_JSON.exists():
        with open(CARDS_JSON, 'r') as f:
            return json.load(f)
    return {"cards": [], "eras": [], "last_updated": ""}

def save_data(data):
    data['last_updated'] = datetime.now().isoformat()
    with open(CARDS_JSON, 'w') as f:
        json.dump(data, f, indent=2)

def add_card(name, years, era, contribution, front_file, back_file, student=""):
    data = load_data()
    card_id = sanitize_id(name)

    # Check for duplicate
    for i, card in enumerate(data['cards']):
        if card['id'] == card_id:
            print(f"Updating existing card: {card_id}")
            data['cards'][i] = {
                "id": card_id,
                "scientist_name": name,
                "scientist_years": years,
                "era": era,
                "contribution": contribution,
                "card_front_url": f"cards/{front_file}",
                "card_back_url": f"cards/{back_file}",
                "student_name": student,
                "submitted_date": datetime.now().strftime("%Y-%m-%d")
            }
            save_data(data)
            return

    # Add new
    data['cards'].append({
        "id": card_id,
        "scientist_name": name,
        "scientist_years": years,
        "era": era,
        "contribution": contribution,
        "card_front_url": f"cards/{front_file}",
        "card_back_url": f"cards/{back_file}",
        "student_name": student,
        "submitted_date": datetime.now().strftime("%Y-%m-%d")
    })
    save_data(data)
    print(f"Added: {name} ({card_id})")

def interactive():
    print("\n=== Add New Trading Card ===\n")

    name = input("Scientist's full name: ").strip()
    years = input("Years (e.g., 1901-1994): ").strip()

    print("\nAvailable eras:")
    data = load_data()
    for i, era in enumerate(data.get('eras', []), 1):
        print(f"  {i}. {era}")

    era_input = input("\nEnter era number or name: ").strip()
    try:
        era = data['eras'][int(era_input) - 1]
    except (ValueError, IndexError):
        era = era_input

    contribution = input("One-sentence contribution: ").strip()

    card_id = sanitize_id(name)
    default_front = f"{card_id}_front.png"
    default_back = f"{card_id}_back.png"

    front_file = input(f"Front image filename [{default_front}]: ").strip() or default_front
    back_file = input(f"Back image filename [{default_back}]: ").strip() or default_back

    student = input("Student name (optional): ").strip()

    add_card(name, years, era, contribution, front_file, back_file, student)

    print(f"\nDone! Make sure {front_file} and {back_file} are in the cards/ folder.")
    print("Then: git add . && git commit -m 'Add card' && git push")

if __name__ == '__main__':
    if len(sys.argv) >= 7:
        add_card(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6],
                 sys.argv[7] if len(sys.argv) > 7 else "")
    else:
        interactive()
