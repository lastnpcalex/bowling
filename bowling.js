const scoresheet = document.getElementById('scoresheet');
const inputArea = document.getElementById('input-area');
const inputButtons = document.getElementById('input-buttons');
const rollInfo = document.getElementById('roll-info');
const framesContainer = scoresheet.querySelector('.frames-container');
const gameNameInput = document.getElementById('game-name');
const downloadButton = document.getElementById('download-button');
let currentFrame = 0;
let currentRoll = 0;
let gameScores = Array(10).fill().map(() => ({ rolls: [], score: 0 }));
let gameComplete = false;

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
    inputArea.style.display = "flex";

    document.querySelectorAll(".frame").forEach(f => f.classList.remove("selected"));
    framesContainer.children[frameIndex].classList.add("selected");
}

function updateInputOptions() {
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
        if ((i === 10 && currentRoll === 1 && rolls[0] === 0) ||
            (i === 10 && currentFrame === 9 && currentRoll === 2 && rolls[0] === 10 && rolls[1] < 10)) {
            continue;
        }

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

    updateFrameDisplay(currentFrame);
    updateInputOptions();
    calculateScores();
}

function updateFrameDisplay(frameIndex) {
    const frame = framesContainer.children[frameIndex];
    const rolls = gameScores[frameIndex].rolls;
    const rollDisplays = frame.querySelectorAll('.roll1, .roll2, .roll3');

    rollDisplays.forEach((display, index) => {
        if (rolls[index] !== undefined) {
            if ((index === 1 && frameIndex < 9 && rolls[0] + rolls[1] === 10) || 
                (frameIndex < 9 && index === 1 && rolls[0] === 0 && rolls[1] === 10) ||
                (frameIndex === 9 && ((index === 1 && rolls[0] + rolls[1] === 10 && rolls[0] !== 10) || 
                (index === 2 && rolls[1] + rolls[2] === 10)))) {
                display.textContent = '/';
            } else if (rolls[index] === 10) {
                display.textContent = 'X';
            } else {
                display.textContent = rolls[index];
            }
        } else {
            display.textContent = '';
        }
    });

    frame.querySelector('.frame-bottom').textContent = gameScores[frameIndex].score || '';
}

function calculateScores() {
    let totalScore = 0;
    for (let i = 0; i < 10; i++) {
        const frame = gameScores[i];
        const rolls = frame.rolls;

        if (i < 9) {
            if (rolls[0] === 10) { // Strike
