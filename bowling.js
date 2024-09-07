document.addEventListener('DOMContentLoaded', function() {
    initializeGame(document.getElementById('scoresheet'));  // Initialize the first default game
    document.getElementById('add-bowler-button').addEventListener('click', addBowler);
});

function addBowler() {
    const bowlerName = document.getElementById('new-bowler-name').value.trim();
    if (bowlerName === '') {
        alert('Please enter a bowler name.');
        return;
    }
    document.getElementById('new-bowler-name').value = '';  // Clear the input after adding

    const newScoresheetContainer = document.createElement('div');
    newScoresheetContainer.className = 'score-sheet';
    newScoresheetContainer.setAttribute('data-bowler-name', bowlerName);

    // Create an editable header for the bowler's name
    const nameHeader = document.createElement('input');
    nameHeader.type = 'text';
    nameHeader.value = bowlerName;
    nameHeader.className = 'bowler-name';
    nameHeader.onchange = function() {
        newScoresheetContainer.setAttribute('data-bowler-name', this.value);
    };

    newScoresheetContainer.appendChild(nameHeader);
    document.getElementById('all-scoresheets-container').appendChild(newScoresheetContainer);
    
    initializeGame(newScoresheetContainer);
}

function initializeGame(containerElement) {
    const framesContainer = document.createElement('div');
    framesContainer.className = 'frames-container';
    containerElement.appendChild(framesContainer);
    // Add the default game name setup here
    setDefaultGameName(containerElement);

    let gameScores = Array(10).fill().map(() => ({ rolls: [], score: 0 }));
    let currentFrame = 0;
    let currentRoll = 0;
    let gameComplete = false;

    createFrames();

    function createFrames() {
        for (let i = 0; i < 10; i++) {
            const frame = document.createElement('div');
            frame.className = `frame ${i === 9 ? 'tenth-frame' : ''}`;
            frame.innerHTML = `
                <div class="frame-top">
                    <span class="roll1"></span>
                    <span class="roll2"></span>
                    ${i === 9 ? '<span class="roll3"></span>' : ''}
                </div>
                <div class="frame-bottom"></div>
            `;
            frame.addEventListener('click', () => selectFrame(i));
            framesContainer.appendChild(frame);
        }
    }

    function selectFrame(frameIndex) {
        currentFrame = frameIndex;
        const frame = gameScores[currentFrame];

        if (frameIndex === 9) {
            currentRoll = 0;
            gameComplete = false;
        } else {
            currentRoll = 0;
        }

        updateInputOptions();
        document.querySelectorAll(".frame").forEach(f => f.classList.remove("selected"));
        framesContainer.children[frameIndex].classList.add("selected");
    }

    function updateInputOptions() {
        const inputArea = document.getElementById('input-area');
        const inputButtons = document.getElementById('input-buttons');
        const rollInfo = document.getElementById('roll-info');
        inputButtons.innerHTML = "";
        let maxPins = 10;
        let rollText = "";

        const frame = gameScores[currentFrame];
        const rolls = frame.rolls;

        if (currentFrame === 9) {
            if (currentRoll === 0) {
                rollText = "10th Frame - 1st Roll";
            } else if (currentRoll === 1) {
                rollText = "10th Frame - 2nd Roll";
                if (rolls[0] < 10) maxPins = 10 - rolls[0];
            } else if (currentRoll === 2) {
                rollText = "10th Frame - 3rd Roll";
                if (rolls[0] === 10) {
                    if (rolls[1] === 10) {
                        maxPins = 10;
                    } else {
                        maxPins = 10 - rolls[1];
                    }
                } else if (rolls[0] + rolls[1] === 10) {
                    maxPins = 10;
                } else {
                    inputArea.style.display = "none";
                    return;
                }
            }
        } else {
            if (currentRoll === 0) {
                rollText = `Frame ${currentFrame + 1} - 1st Roll`;
            } else {
                rollText = `Frame ${currentFrame + 1} - 2nd Roll`;
                maxPins = 10 - rolls[0];
            }
        }

        rollInfo.textContent = rollText;
        for (let i = 0; i <= maxPins; i++) {
            const button = document.createElement("button");
            button.textContent = i === 10 ? "X" : i;
            button.addEventListener("click", () => handleRoll(i));
            if (rolls[currentRoll] === i) {
                button.classList.add("selected");
            }
            inputButtons.appendChild(button);
        }

        if ((currentRoll === 1 && currentFrame < 9 && rolls[0] < 10) ||
            (currentFrame === 9 && ((currentRoll === 1 && rolls[0] !== 10) ||
            (currentRoll === 2 && rolls[0] === 10 && rolls[1] !== 10)))) {
            if (maxPins > 0) {
                const spareButton = document.createElement("button");
                spareButton.textContent = "/";
                spareButton.addEventListener("click", () => handleRoll(maxPins));
                if (rolls[currentRoll] === maxPins) {
                    spareButton.classList.add("selected");
                }
                inputButtons.appendChild(spareButton);
            }
        }

        inputArea.style.display = "flex";
    }

    function handleRoll(pins) {
        const frame = gameScores[currentFrame];
        frame.rolls[currentRoll] = pins;

        if (currentFrame === 9) {
            if (currentRoll === 0) {
                currentRoll = 1;
            } else if (currentRoll === 1) {
                if (frame.rolls[0] === 10 || frame.rolls[0] + frame.rolls[1] === 10) {
                    currentRoll = 2;
                } else {
                    if (frame.rolls.length > 2) {
                        frame.rolls.pop();
                    }
                    currentRoll = 0;
                }
            } else {
                currentRoll = 0;
            }
        } else {
            if (pins === 10 || currentRoll === 1) {
                currentFrame++;
                currentRoll = 0;
                selectFrame(currentFrame);
            } else {
                currentRoll = 1;
            }
        }

        updateFrameDisplay();
        updateInputOptions();
        calculateScores();
    }

    function updateFrameDisplay() {
        const frames = framesContainer.children;
        gameScores.forEach((game, index) => {
            const frame = frames[index];
            const rolls = game.rolls;
            const rollDisplays = frame.querySelectorAll('.roll1, .roll2, .roll3');

            rollDisplays.forEach((display, rollIndex) => {
                if (rolls[rollIndex] !== undefined) {
                    if ((rollIndex === 1 && index < 9 && rolls[0] + rolls[1] === 10) || 
                        (index < 9 && rollIndex === 1 && rolls[0] === 0 && rolls[1] === 10) ||
                        (index === 9 && ((rollIndex === 1 && rolls[0] + rolls[1] === 10 && rolls[0] !== 10) || 
                        (rollIndex === 2 && rolls[1] + rolls[2] === 10)))) {
                        display.textContent = '/';
                    } else if (rolls[rollIndex] === 10) {
                        display.textContent = 'X';
                    } else {
                        display.textContent = rolls[rollIndex];
                    }
                } else {
                    display.textContent = '';
                }
            });

            frame.querySelector('.frame-bottom').textContent = game.score || '';
        });
    }

    function calculateScores() {
        let totalScore = 0;
        gameScores.forEach((frame, i) => {
            const rolls = frame.rolls;

            if (i < 9) {
                if (rolls[0] === 10) { // Strike
                    frame.score = 10 + (gameScores[i + 1].rolls[0] || 0) +
                        ((gameScores[i + 1].rolls[1] !== undefined) ? gameScores[i + 1].rolls[1] :
                        (gameScores[i + 2] && gameScores[i + 2].rolls[0]) || 0);
                } else if (rolls[0] + rolls[1] === 10) { // Spare
                    frame.score = 10 + (gameScores[i + 1].rolls[0] || 0);
                } else { // Open frame
                    frame.score = (rolls[0] || 0) + (rolls[1] || 0);
                }
            } else { // 10th frame
                frame.score = (rolls[0] || 0) + (rolls[1] || 0) + (rolls[2] || 0);
            }

            totalScore += frame.score;
            frame.score = totalScore;
        });

        updateFrameDisplay();
    }

    function setDefaultGameName(containerElement) {
        const gameNameInput = document.getElementById('game-name');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const defaultName = `Game_${year}-${month}-${day}`;
        gameNameInput.value = defaultName;
    }
}

document.getElementById('download-button').addEventListener('click', function() {
    const gameLabel = document.getElementById('game-name').value;  // Ensure the game label is captured

    const allScoresheets = document.querySelectorAll('.score-sheet');
    allScoresheets.forEach(scoresheet => {
        const bowlerName = scoresheet.querySelector('.bowler-name').value;
        const frames = scoresheet.querySelectorAll('.frame');

        const gameData = {
            gameLabel: gameLabel, // Adding game label to the JSON output
            bowlerName: bowlerName,
            scores: Array.from(frames).map(frame => {
                const rolls = Array.from(frame.querySelectorAll('.roll1, .roll2, .roll3')).map(roll => roll.textContent.trim());
                const score = frame.querySelector('.frame-bottom').textContent.trim();
                return { rolls, score };
            })
        };

        const blob = new Blob([JSON.stringify(gameData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bowlerName.replace(/\s/g, '_')}_${gameLabel}.json`; // Formatting filename to include game label
        a.click();
        URL.revokeObjectURL(url);
    });
});



const loadGameButton = document.getElementById('load-game');
loadGameButton.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedGameScores = JSON.parse(e.target.result);
                if (Array.isArray(loadedGameScores) && loadedGameScores.length === 10) {
                    gameScores = loadedGameScores;
                    gameComplete = gameScores[9].rolls.length === 3 || 
                                   (gameScores[9].rolls.length === 2 && gameScores[9].rolls[0] + gameScores[9].rolls[1] < 10);
                    currentFrame = gameComplete ? 9 : gameScores.findIndex(frame => frame.rolls.length < 2);
                    currentRoll = gameScores[currentFrame].rolls.length;
                    calculateScores();
                    for (let i = 0; i < 10; i++) {
                        updateFrameDisplay(i);
                    }
                    selectFrame(currentFrame);
                } else {
                    alert('Invalid game data format');
                }
            } catch (error) {
                alert('Error loading game data');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
});
