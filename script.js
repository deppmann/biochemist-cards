/**
 * Biochemists Through Time - Trading Card Gallery
 * Carousel + Grid Hybrid Display
 * BIOL 3030 • UVA • Spring 2026
 */

// ===== STATE =====
let allCards = [];
let filteredCards = [];
let cardsByEra = {};
let eras = [];
let carouselCards = [];
let carouselIndex = 0;
let carouselRotation = 0;
let autoRotateInterval = null;
let currentLightboxIndex = 0;
let allExpanded = false;

const CAROUSEL_VISIBLE = 7; // Number of visible cards in carousel
const AUTO_ROTATE_DELAY = 4000; // ms between auto-rotations

// ===== DOM ELEMENTS =====
const carouselTrack = document.getElementById('carousel-track');
const eraSections = document.getElementById('era-sections');
const searchInput = document.getElementById('search');
const eraFilter = document.getElementById('era-filter');
const sortSelect = document.getElementById('sort-by');
const expandToggle = document.getElementById('expand-toggle');
const spinBtn = document.getElementById('spin-btn');
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
        eras = data.eras || [];

        populateEraFilter();
        organizeByEra();
        filteredCards = [...allCards];

        initCarousel();
        renderEraSections();
        updateCount();
        setupEventListeners();

        startAutoRotate();
    } catch (error) {
        console.error('Error loading cards:', error);
        eraSections.innerHTML = '<div class="loading"><p>Unable to load cards. Please refresh the page.</p></div>';
    }
}

// ===== CAROUSEL FUNCTIONS =====
function initCarousel() {
    // Pick random cards for carousel from filtered set
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    carouselCards = shuffled.slice(0, Math.min(CAROUSEL_VISIBLE, shuffled.length));
    carouselIndex = Math.floor(carouselCards.length / 2); // Start with center card
    carouselRotation = 0;

    renderCarousel();
}

function renderCarousel() {
    if (carouselCards.length === 0) {
        carouselTrack.innerHTML = '<div class="loading"><p>No cards to display</p></div>';
        return;
    }

    const angleStep = 360 / carouselCards.length;
    const radius = getComputedStyle(document.documentElement).getPropertyValue('--carousel-radius').trim() || '500px';
    const radiusNum = parseInt(radius);

    carouselTrack.innerHTML = carouselCards.map((card, i) => {
        const angle = angleStep * i;
        const isCenter = i === carouselIndex;

        return `
            <div class="carousel-card ${isCenter ? 'center' : ''}"
                 data-index="${i}"
                 data-card-id="${card.id}"
                 style="transform: rotateY(${angle}deg) translateZ(${radiusNum}px)">
                <div class="carousel-card-inner">
                    <div class="carousel-card-face carousel-card-front">
                        <img src="${card.card_front_url}" alt="${card.scientist_name}" loading="eager">
                    </div>
                    <div class="carousel-card-face carousel-card-back">
                        <img src="${card.card_back_url}" alt="${card.scientist_name} - Stats" loading="eager">
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Apply rotation to track
    carouselTrack.style.transform = `rotateY(${carouselRotation}deg)`;

    // Add click listeners to carousel cards
    carouselTrack.querySelectorAll('.carousel-card').forEach((el, i) => {
        let clickCount = 0;
        let clickTimer = null;

        el.addEventListener('click', () => {
            clickCount++;

            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    // Single click
                    if (el.classList.contains('center')) {
                        // Flip the center card
                        el.classList.toggle('flipped');
                    } else {
                        // Rotate to this card
                        rotateToCard(i);
                    }
                    clickCount = 0;
                }, 250);
            } else if (clickCount === 2) {
                // Double click - open lightbox
                clearTimeout(clickTimer);
                clickCount = 0;
                openLightboxForCard(carouselCards[i]);
            }
        });
    });
}

function rotateToCard(targetIndex) {
    stopAutoRotate();

    const angleStep = 360 / carouselCards.length;
    const currentAngle = carouselRotation % 360;
    const targetAngle = -angleStep * targetIndex;

    // Find shortest rotation path
    let diff = targetAngle - currentAngle;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    carouselRotation += diff;
    carouselIndex = targetIndex;

    updateCarouselTransform();
    updateCenterClass();

    // Restart auto-rotate after user interaction
    setTimeout(startAutoRotate, 3000);
}

function rotateCarousel(direction) {
    stopAutoRotate();

    const angleStep = 360 / carouselCards.length;
    carouselRotation += direction * angleStep;
    carouselIndex = (carouselIndex - direction + carouselCards.length) % carouselCards.length;

    updateCarouselTransform();
    updateCenterClass();

    setTimeout(startAutoRotate, 3000);
}

function updateCarouselTransform() {
    carouselTrack.style.transform = `rotateY(${carouselRotation}deg)`;
}

function updateCenterClass() {
    carouselTrack.querySelectorAll('.carousel-card').forEach((el, i) => {
        el.classList.toggle('center', i === carouselIndex);
        if (i !== carouselIndex) {
            el.classList.remove('flipped'); // Unflip non-center cards
        }
    });
}

function spinCarousel() {
    stopAutoRotate();

    // Pick new random cards
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    carouselCards = shuffled.slice(0, Math.min(CAROUSEL_VISIBLE, shuffled.length));

    // Add spinning animation class
    carouselTrack.classList.add('spinning');

    // Random number of rotations (2-4 full spins) plus random position
    const spins = 2 + Math.floor(Math.random() * 3);
    const randomIndex = Math.floor(Math.random() * carouselCards.length);
    const angleStep = 360 / carouselCards.length;

    carouselRotation = -(spins * 360) - (randomIndex * angleStep);
    carouselIndex = randomIndex;

    renderCarousel();

    // Remove spinning class after animation
    setTimeout(() => {
        carouselTrack.classList.remove('spinning');
        startAutoRotate();
    }, 2000);
}

function startAutoRotate() {
    stopAutoRotate();
    autoRotateInterval = setInterval(() => {
        rotateCarouselSilent(1);
    }, AUTO_ROTATE_DELAY);
}

function stopAutoRotate() {
    if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
        autoRotateInterval = null;
    }
}

function rotateCarouselSilent(direction) {
    const angleStep = 360 / carouselCards.length;
    carouselRotation += direction * angleStep;
    carouselIndex = (carouselIndex - direction + carouselCards.length) % carouselCards.length;

    updateCarouselTransform();
    updateCenterClass();
}

// ===== ERA SECTIONS FUNCTIONS =====
function organizeByEra() {
    cardsByEra = {};

    // Initialize all eras
    eras.forEach(era => {
        cardsByEra[era] = [];
    });

    // Add "Unknown Era" for cards without era
    cardsByEra['Unknown Era'] = [];

    // Sort cards into eras
    allCards.forEach(card => {
        const era = card.era || 'Unknown Era';
        if (!cardsByEra[era]) {
            cardsByEra[era] = [];
        }
        cardsByEra[era].push(card);
    });

    // Sort cards within each era alphabetically by default
    Object.keys(cardsByEra).forEach(era => {
        cardsByEra[era].sort((a, b) => a.scientist_name.localeCompare(b.scientist_name));
    });
}

function renderEraSections() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedEra = eraFilter.value;

    // Combine defined eras with any extras
    const allEras = [...eras];
    if (cardsByEra['Unknown Era'] && cardsByEra['Unknown Era'].length > 0) {
        allEras.push('Unknown Era');
    }

    eraSections.innerHTML = allEras.map(era => {
        const cards = cardsByEra[era] || [];

        // Filter cards based on search
        const matchingCards = cards.filter(card => {
            const matchesSearch = !searchTerm ||
                card.scientist_name.toLowerCase().includes(searchTerm) ||
                (card.contribution && card.contribution.toLowerCase().includes(searchTerm));
            const matchesEra = selectedEra === 'all' || card.era === selectedEra;
            return matchesSearch && matchesEra;
        });

        if (matchingCards.length === 0) {
            return ''; // Hide era with no matching cards
        }

        // Sort based on dropdown
        const sortBy = sortSelect.value;
        const sortedCards = [...matchingCards];
        sortCards(sortedCards, sortBy);

        return `
            <div class="era-group ${allExpanded ? 'expanded' : ''}" data-era="${era}">
                <button class="era-header" aria-expanded="${allExpanded}">
                    <div class="era-header-content">
                        <span class="era-name">${era}</span>
                        <span class="era-count">${matchingCards.length}</span>
                    </div>
                    <svg class="era-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="era-cards">
                    ${sortedCards.map(card => createThumbHTML(card)).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to era headers
    eraSections.querySelectorAll('.era-header').forEach(header => {
        header.addEventListener('click', () => {
            const group = header.closest('.era-group');
            group.classList.toggle('expanded');
            header.setAttribute('aria-expanded', group.classList.contains('expanded'));
        });
    });

    // Add event listeners to thumbnails
    eraSections.querySelectorAll('.thumb-wrapper').forEach(wrapper => {
        const cardId = wrapper.dataset.cardId;
        let clickCount = 0;
        let clickTimer = null;

        wrapper.addEventListener('click', () => {
            clickCount++;

            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    // Single click - flip the thumb
                    wrapper.querySelector('.thumb').classList.toggle('flipped');
                    clickCount = 0;
                }, 250);
            } else if (clickCount === 2) {
                // Double click - open in lightbox
                clearTimeout(clickTimer);
                clickCount = 0;
                const card = allCards.find(c => c.id === cardId);
                if (card) {
                    openLightboxForCard(card);
                }
            }
        });
    });
}

function createThumbHTML(card) {
    return `
        <div class="thumb-wrapper" data-card-id="${card.id}">
            <div class="thumb">
                <div class="thumb-face thumb-front">
                    <img src="${card.card_front_url}" alt="${card.scientist_name}" loading="lazy">
                    <div class="thumb-info">
                        <div class="thumb-name">${card.scientist_name}</div>
                    </div>
                </div>
                <div class="thumb-face thumb-back">
                    <img src="${card.card_back_url}" alt="${card.scientist_name} - Stats" loading="lazy">
                </div>
            </div>
        </div>
    `;
}

function sortCards(cards, sortBy) {
    cards.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.scientist_name.localeCompare(b.scientist_name);
            case 'name-desc':
                return b.scientist_name.localeCompare(a.scientist_name);
            case 'recent':
                return (b.submitted_date || '').localeCompare(a.submitted_date || '');
            default:
                return 0;
        }
    });
}

function toggleAllSections(expand) {
    allExpanded = expand;
    eraSections.querySelectorAll('.era-group').forEach(group => {
        group.classList.toggle('expanded', expand);
        group.querySelector('.era-header').setAttribute('aria-expanded', expand);
    });
    expandToggle.textContent = expand ? 'Collapse All' : 'Expand All';
}

// ===== FILTER FUNCTIONS =====
function populateEraFilter() {
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

    // Filter the global filteredCards list
    filteredCards = allCards.filter(card => {
        const matchesSearch = !searchTerm ||
            card.scientist_name.toLowerCase().includes(searchTerm) ||
            (card.contribution && card.contribution.toLowerCase().includes(searchTerm));
        const matchesEra = selectedEra === 'all' || card.era === selectedEra;
        return matchesSearch && matchesEra;
    });

    // Re-initialize carousel with filtered cards
    initCarousel();

    // Re-render era sections
    renderEraSections();

    // Update count
    updateCount();
}

function updateCount() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedEra = eraFilter.value;

    const count = allCards.filter(card => {
        const matchesSearch = !searchTerm ||
            card.scientist_name.toLowerCase().includes(searchTerm) ||
            (card.contribution && card.contribution.toLowerCase().includes(searchTerm));
        const matchesEra = selectedEra === 'all' || card.era === selectedEra;
        return matchesSearch && matchesEra;
    }).length;

    countDisplay.textContent = count;
}

// ===== LIGHTBOX FUNCTIONS =====
function openLightboxForCard(card) {
    // Find index in filtered cards for navigation
    currentLightboxIndex = filteredCards.findIndex(c => c.id === card.id);
    if (currentLightboxIndex === -1) {
        currentLightboxIndex = 0;
    }

    lightboxFront.src = card.card_front_url;
    lightboxBack.src = card.card_back_url;
    lightboxFront.alt = `${card.scientist_name} - Front`;
    lightboxBack.alt = `${card.scientist_name} - Back`;

    lightboxCard.classList.remove('flipped');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    stopAutoRotate();
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    startAutoRotate();
}

function navigateLightbox(direction) {
    if (filteredCards.length === 0) return;

    currentLightboxIndex = (currentLightboxIndex + direction + filteredCards.length) % filteredCards.length;
    const card = filteredCards[currentLightboxIndex];

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
    sortSelect.addEventListener('change', () => {
        renderEraSections();
    });

    // Expand/Collapse toggle
    expandToggle.addEventListener('click', () => {
        toggleAllSections(!allExpanded);
    });

    // Carousel navigation
    document.querySelector('.carousel-prev').addEventListener('click', () => {
        rotateCarousel(-1);
    });

    document.querySelector('.carousel-next').addEventListener('click', () => {
        rotateCarousel(1);
    });

    // Spin button
    spinBtn.addEventListener('click', spinCarousel);

    // Pause auto-rotate on carousel hover
    document.querySelector('.carousel-section').addEventListener('mouseenter', stopAutoRotate);
    document.querySelector('.carousel-section').addEventListener('mouseleave', startAutoRotate);

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
        // Don't intercept keyboard events when user is typing in an input
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable
        );

        // Lightbox keyboard navigation
        if (lightbox.classList.contains('active')) {
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
                    if (!isTyping) {
                        e.preventDefault();
                        flipLightboxCard();
                    }
                    break;
            }
            return;
        }

        // Don't intercept if user is typing
        if (isTyping) return;

        // Carousel keyboard navigation (when lightbox is closed)
        switch (e.key) {
            case 'ArrowLeft':
                rotateCarousel(-1);
                break;
            case 'ArrowRight':
                rotateCarousel(1);
                break;
            case ' ':
                e.preventDefault();
                // Flip center carousel card
                const centerCard = carouselTrack.querySelector('.carousel-card.center');
                if (centerCard) {
                    centerCard.classList.toggle('flipped');
                }
                break;
        }
    });

    // Touch swipe for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    // Lightbox swipe
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleLightboxSwipe();
    }, { passive: true });

    function handleLightboxSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                navigateLightbox(1);
            } else {
                navigateLightbox(-1);
            }
        }
    }

    // Carousel swipe
    const carouselSection = document.querySelector('.carousel-section');
    carouselSection.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselSection.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleCarouselSwipe();
    }, { passive: true });

    function handleCarouselSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                rotateCarousel(1);
            } else {
                rotateCarousel(-1);
            }
        }
    }
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
