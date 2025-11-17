// Game State
let currentPuzzle = null;
let selectedCard = null;
let attemptsRemaining = 2;
let placedCards = {}; // { position: cardWord }
let lockedPositions = new Set(); // Positions that are correct and locked
let gameComplete = false;

// Load puzzle data
async function loadPuzzle() {
    try {
        const response = await fetch('puzzles.json');
        const data = await response.json();

        // For now, load puzzle based on day of year or use first puzzle
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const puzzleIndex = dayOfYear % data.puzzles.length;

        currentPuzzle = data.puzzles[puzzleIndex];

        // Update UI
        document.getElementById('puzzle-number').textContent = puzzleIndex + 1;

        // Load clues
        currentPuzzle.clues.forEach((clue, index) => {
            document.getElementById(`clue-${index}`).textContent = clue;
        });

        // Generate cards
        generateCards();

    } catch (error) {
        console.error('Error loading puzzle:', error);
        // Fallback to demo puzzle
        loadDemoPuzzle();
    }
}

function loadDemoPuzzle() {
    currentPuzzle = {
        solution: {
            top: "SUN",
            right: "MOON",
            bottom: "STAR",
            left: "PLANET"
        },
        clues: [
            "Sky Bodies",    // Top-Right (SUN-MOON)
            "Daytime Light", // Top-Left (SUN-PLANET)
            "Night Sky",     // Bottom-Right (MOON-STAR)
            "Orbit"          // Bottom-Left (PLANET-STAR)
        ],
        decoys: ["CLOUD", "COMET"]
    };

    // Load clues
    currentPuzzle.clues.forEach((clue, index) => {
        document.getElementById(`clue-${index}`).textContent = clue;
    });

    generateCards();
}

function generateCards() {
    const cardsPool = document.getElementById('cards-pool');
    cardsPool.innerHTML = '';

    // Combine solution cards and decoys
    const allCards = [
        ...Object.values(currentPuzzle.solution),
        ...currentPuzzle.decoys
    ];

    // Shuffle cards
    allCards.sort(() => Math.random() - 0.5);

    // Create card elements
    allCards.forEach(word => {
        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = word;
        card.dataset.word = word;
        card.addEventListener('click', () => selectCard(card));
        cardsPool.appendChild(card);
    });
}

function selectCard(cardElement) {
    if (cardElement.classList.contains('placed') || gameComplete) return;

    // Deselect previous card
    if (selectedCard) {
        selectedCard.classList.remove('selected');
    }

    // Select new card
    if (selectedCard === cardElement) {
        selectedCard = null;
    } else {
        selectedCard = cardElement;
        selectedCard.classList.add('selected');
    }
}

function placeCard(position) {
    if (!selectedCard || gameComplete) return;
    if (lockedPositions.has(position)) return;

    const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
    const word = selectedCard.dataset.word;

    // Remove card from previous position if exists
    if (placedCards[position]) {
        const oldCard = document.querySelector(`.card[data-word="${placedCards[position]}"]`);
        if (oldCard) {
            oldCard.classList.remove('placed');
        }
    }

    // Clear slot
    slot.innerHTML = '';

    // Create placed card
    const placedCard = document.createElement('div');
    placedCard.className = 'card';
    placedCard.textContent = word;
    placedCard.dataset.word = word;
    placedCard.addEventListener('click', () => removeCard(position));
    slot.appendChild(placedCard);

    // Update state
    placedCards[position] = word;
    selectedCard.classList.remove('selected');
    selectedCard.classList.add('placed');
    selectedCard = null;

    // Check if all slots filled
    updateSubmitButton();
}

function removeCard(position) {
    if (lockedPositions.has(position) || gameComplete) return;

    const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
    const word = placedCards[position];

    // Remove from slot
    slot.innerHTML = '<div class="empty-slot">?</div>';

    // Return card to pool
    const card = document.querySelector(`.card[data-word="${word}"]`);
    if (card) {
        card.classList.remove('placed');
    }

    // Update state
    delete placedCards[position];

    updateSubmitButton();
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-btn');
    const allFilled = Object.keys(placedCards).length === 4;
    submitBtn.disabled = !allFilled || gameComplete;
}

function submitAnswer() {
    if (gameComplete) return;

    // Check which cards are correct
    const correctPositions = [];
    const incorrectPositions = [];

    Object.keys(placedCards).forEach(position => {
        if (placedCards[position] === currentPuzzle.solution[position]) {
            correctPositions.push(position);
        } else {
            incorrectPositions.push(position);
        }
    });

    const allCorrect = incorrectPositions.length === 0;

    if (allCorrect) {
        // Victory!
        showResult('success', 'Perfect! You solved the puzzle!');
        markAllCorrect();
        gameComplete = true;
        updateSubmitButton();
    } else {
        attemptsRemaining--;
        document.getElementById('attempts').textContent = attemptsRemaining;

        if (attemptsRemaining > 0) {
            // First attempt failed - lock correct cards
            showResult('partial', `${correctPositions.length} correct! ${incorrectPositions.length} to fix. Try again!`);
            lockCorrectCards(correctPositions);
            markIncorrectCards(incorrectPositions);
        } else {
            // Second attempt failed - game over
            showResult('failure', 'Game Over! Better luck tomorrow!');
            revealSolution();
            gameComplete = true;
            updateSubmitButton();
        }
    }
}

function lockCorrectCards(positions) {
    positions.forEach(position => {
        lockedPositions.add(position);
        const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
        slot.classList.add('locked');
        const card = slot.querySelector('.card');
        if (card) {
            card.classList.add('locked');
        }
    });
}

function markIncorrectCards(positions) {
    positions.forEach(position => {
        const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
        slot.classList.add('incorrect');
        const card = slot.querySelector('.card');
        if (card) {
            card.classList.add('incorrect');
        }
    });

    // Remove incorrect marking after animation
    setTimeout(() => {
        positions.forEach(position => {
            const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
            slot.classList.remove('incorrect');
        });
    }, 1500);
}

function markAllCorrect() {
    Object.keys(placedCards).forEach(position => {
        const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
        slot.classList.add('locked');
        const card = slot.querySelector('.card');
        if (card) {
            card.classList.add('locked');
        }
    });
}

function revealSolution() {
    Object.keys(currentPuzzle.solution).forEach(position => {
        if (!lockedPositions.has(position)) {
            const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
            slot.innerHTML = '';

            const card = document.createElement('div');
            card.className = 'card locked';
            card.textContent = currentPuzzle.solution[position];
            slot.appendChild(card);
            slot.classList.add('locked');
        }
    });
}

function showResult(type, message) {
    const resultDiv = document.getElementById('result-message');
    resultDiv.className = `result-message ${type}`;
    resultDiv.textContent = message;
    resultDiv.classList.remove('hidden');
}

function resetBoard() {
    // Clear all placed cards
    Object.keys(placedCards).forEach(position => {
        if (!lockedPositions.has(position)) {
            const slot = document.querySelector(`.card-slot[data-position="${position}"]`);
            slot.innerHTML = '<div class="empty-slot">?</div>';
            slot.classList.remove('incorrect');
        }
    });

    // Reset card pool
    document.querySelectorAll('.card').forEach(card => {
        if (!card.parentElement.classList.contains('card-slot')) {
            card.classList.remove('placed', 'selected');
        }
    });

    // Clear non-locked placements
    const newPlacedCards = {};
    lockedPositions.forEach(position => {
        newPlacedCards[position] = placedCards[position];
    });
    placedCards = newPlacedCards;

    selectedCard = null;
    updateSubmitButton();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load puzzle
    loadPuzzle();

    // Card slot click handlers
    document.querySelectorAll('.card-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('card')) return; // Don't trigger if clicking card inside
            const position = slot.dataset.position;
            placeCard(position);
        });
    });

    // Submit button
    document.getElementById('submit-btn').addEventListener('click', submitAnswer);

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetBoard);
});
