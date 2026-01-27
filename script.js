/**
 * Biochemists Through Time - Trading Card Gallery
 * BIOL 3030 • UVA • Spring 2026
 */

// ===== STATE =====
let allCards = [];
let filteredCards = [];
let currentLightboxIndex = 0;

// ===== DOM ELEMENTS =====
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('search');
const eraFilter = document.getElementById('era-filter');
const sortSelect = document.getElementById('sort-by');
const shuffleBtn = document.getElementById('shuffle-btn');
const countDisplay = document.getElementById('count');
const lightbox = document.getElementById('lightbox');
const lightboxCard = document.getElementById('lightbox-card');
const lightboxFront = document.getElementById('lightbox-front');
const lightboxBack = document.getElementById('lightbox-back');

// ===== INITIALIZATION =====
async function init() {
    try {
        const response = await fetch('cards.json');
        const data = await response.json();

        allCards = data.cards || [];
        populateEraFilter(data.eras || []);
        filteredCards = [...allCards];
        renderCards();
        setupEventListeners();
    } catch (error) {
        console.error('Error loading cards:', error);
        showEmptyState('Unable to load cards. Please refresh the page.');
    }
}

// ===== RENDER FUNCTIONS =====
function renderCards() {
    if (filteredCards.length === 0) {
        showEmptyState('No cards match your search.');
        countDisplay.textContent = '0';
        return;
    }

    gallery.innerHTML = filteredCards.map((card, index) => createCardHTML(card, index)).join('');
    countDisplay.textContent = filteredCards.length;

    // Add click listeners to cards
    document.querySelectorAll('.card-wrapper').forEach((wrapper, index) => {
        const card = wrapper.querySelector('.card');
        let clickCount = 0;
        let clickTimer = null;

        wrapper.addEventListener('click', (e) => {
            clickCount++;

            if (clickCount === 1) {
                // Wait to see if it's a double-click
                clickTimer = setTimeout(() => {
                    // Single click - flip the card
                    card.classList.toggle('flipped');
                    clickCount = 0;
                }, 250);
            } else if (clickCount === 2) {
                // Double click - open lightbox
                clearTimeout(clickTimer);
                clickCount = 0;
                openLightbox(index);
            }
        });
    });
}

function createCardHTML(card, index) {
    const shortEra = card.era ? card.era.split(' ').slice(0, 3).join(' ') : '';

    return `
        <div class="card-wrapper" data-scientist="${card.scientist_name}" data-era="${card.era}" data-index="${index}">
            <div class="card">
                <div class="card-face card-front">
                    <img src="${card.card_front_url}" alt="${card.scientist_name} - Front" loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 500 700%22><rect fill=%22%231a237e%22 width=%22500%22 height=%22700%22/><text fill=%22white%22 x=%22250%22 y=%22350%22 text-anchor=%22middle%22 font-size=%2220%22>Image Loading...</text></svg>'">
                    ${shortEra ? `<span class="card-era-tag">${shortEra}</span>` : ''}
                    <div class="card-info">
                        <div class="card-name">${card.scientist_name}</div>
                        <div class="card-years">${card.scientist_years || ''}</div>
                    </div>
                    <div class="flip-indicator">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                        </svg>
                    </div>
                </div>
                <div class="card-face card-back">
                    <img src="${card.card_back_url}" alt="${card.scientist_name} - Back" loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 500 700%22><rect fill=%22%23f5f5f0%22 width=%22500%22 height=%22700%22/><text fill=%22%23333%22 x=%22250%22 y=%22350%22 text-anchor=%22middle%22 font-size=%2220%22>Back Side</text></svg>'">
                </div>
            </div>
        </div>
    `;
}

function showEmptyState(message) {
    gallery.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>${message}</p>
        </div>
    `;
}

// ===== FILTER & SORT FUNCTIONS =====
function populateEraFilter(eras) {
    eras.forEach(era => {
        const option = document.createElement('option');
        option.value = era;
        option.textContent = era;
        eraFilter.appendChild(option);
    });
}

function filterAndSort() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedEra = eraFilter.value;
    const sortBy = sortSelect.value;

    // Filter
    filteredCards = allCards.filter(card => {
        const matchesSearch = !searchTerm ||
            card.scientist_name.toLowerCase().includes(searchTerm) ||
            (card.contribution && card.contribution.toLowerCase().includes(searchTerm));

        const matchesEra = selectedEra === 'all' || card.era === selectedEra;

        return matchesSearch && matchesEra;
    });

    // Sort
    if (sortBy === 'random') {
        shuffleArray(filteredCards);
    } else {
        filteredCards.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.scientist_name.localeCompare(b.scientist_name);
                case 'name-desc':
                    return b.scientist_name.localeCompare(a.scientist_name);
                case 'era':
                    return (a.era || '').localeCompare(b.era || '');
                case 'recent':
                    return (b.submitted_date || '').localeCompare(a.submitted_date || '');
                default:
                    return 0;
            }
        });
    }

    renderCards();
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function shuffle() {
    shuffleArray(filteredCards);
    gallery.classList.add('shuffling');
    renderCards();

    // Remove shuffling class after animation
    setTimeout(() => {
        gallery.classList.remove('shuffling');
    }, 500);

    // Update sort dropdown to show "Shuffle"
    sortSelect.value = 'random';
}

// ===== LIGHTBOX FUNCTIONS =====
function openLightbox(index) {
    currentLightboxIndex = index;
    const card = filteredCards[index];

    lightboxFront.src = card.card_front_url;
    lightboxBack.src = card.card_back_url;
    lightboxFront.alt = `${card.scientist_name} - Front`;
    lightboxBack.alt = `${card.scientist_name} - Back`;

    // Reset to front side
    lightboxCard.classList.remove('flipped');

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    currentLightboxIndex = (currentLightboxIndex + direction + filteredCards.length) % filteredCards.length;
    const card = filteredCards[currentLightboxIndex];

    // Reset flip state when navigating
    lightboxCard.classList.remove('flipped');

    lightboxFront.src = card.card_front_url;
    lightboxBack.src = card.card_back_url;
    lightboxFront.alt = `${card.scientist_name} - Front`;
    lightboxBack.alt = `${card.scientist_name} - Back`;
}

function flipLightboxCard() {
    lightboxCard.classList.toggle('flipped');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Search with debounce
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAndSort, 200);
    });

    // Filters
    eraFilter.addEventListener('change', filterAndSort);
    sortSelect.addEventListener('change', filterAndSort);

    // Shuffle button
    shuffleBtn.addEventListener('click', shuffle);

    // Lightbox close
    document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

    // Lightbox navigation
    document.querySelector('.lightbox-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });

    document.querySelector('.lightbox-next').addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });

    // Click lightbox card to flip
    lightboxCard.addEventListener('click', (e) => {
        e.stopPropagation();
        flipLightboxCard();
    });

    // Click outside lightbox card to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                navigateLightbox(-1);
                break;
            case 'ArrowRight':
                navigateLightbox(1);
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                flipLightboxCard();
                break;
        }
    });

    // Touch swipe for mobile lightbox navigation
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                navigateLightbox(1); // Swipe left = next
            } else {
                navigateLightbox(-1); // Swipe right = previous
            }
        }
    }
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
