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
        // For the 10th frame, start at the first roll by default
        currentRoll = 0;
        gameComplete = false; // Reset game complete status when selecting 10th frame
    } else {
        currentRoll = 0;
    }

    updateInputOptions();
    inputArea.style.display = "flex";

    document.querySelectorAll(".frame").forEach((f) => f.classList.remove("selected"));
    framesContainer.children[frameIndex].classList.add("selected");
}


function updateInputOptions() {
  inputButtons.innerHTML = ""; // Clear existing buttons
  let maxPins = 10;
  let rollText = "";

  const frame = gameScores[currentFrame];
  const rolls = frame.rolls;

  if (currentFrame === 9) {
    // 10th frame logic
    if (currentRoll === 0) {
      rollText = "10th Frame - 1st Roll";
    } else if (currentRoll === 1) {
      rollText = "10th Frame - 2nd Roll";
      if (rolls[0] < 10) {
        maxPins = 10 - rolls[0];
      }
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
    // Frames 1-9 logic
    if (currentRoll === 0) {
      rollText = `Frame ${currentFrame + 1} - 1st Roll`;
    } else {
      rollText = `Frame ${currentFrame + 1} - 2nd Roll`;
      maxPins = 10 - rolls[0];
    }
  }

  rollInfo.textContent = rollText;

  for (let i = 0; i <= maxPins; i++) {
    // Prevent adding the "X" button if it's the second roll 
    // AND the first roll's value was 0
    if ((i === 10 && currentRoll === 1 && rolls[0] === 0) ||
      (i === 10 && currentFrame === 9 && currentRoll === 2 && rolls[0] === 10 && rolls[1] < 10)) {
      continue; // Skip adding the "X" button
    }

    const button = document.createElement("button");
    button.textContent = i === 10 ? "X" : i;
    button.addEventListener("click", () => handleRoll(i));
    if (rolls[currentRoll] === i) {
      button.classList.add("selected");
    }
    inputButtons.appendChild(button);
  }

  // Add spare button for 2nd roll in frames 1-9
  // and for 2nd/3rd rolls in the 10th frame, 
  // or for the 1st roll if it's a 0 
   if (
 
  (currentRoll === 1 && currentFrame < 9 && rolls[0] < 10) || // 2nd roll in frames 1-9, and 1st roll wasn't a strike
  (currentFrame === 9 && ( // 10th frame
    (currentRoll === 1 && rolls[0] !== 10) || // 2nd roll, and 1st roll wasn't a strike
    (currentRoll === 2 && rolls[0] === 10 && rolls[1] !== 10) // 3rd roll, 1st or 2nd was strike/spare, but 2nd wasn't a strike
  ))
)
{
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
    // 10th frame logic 
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
    // Frames 1-9 logic
    if (pins === 10 || currentRoll === 1) {
      currentFrame++; 
      currentRoll = 0;

      // Automatically select the next frame if it's not the 10th frame
      if (currentFrame < 9) {
        selectFrame(currentFrame); 
      }
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
      if (
        // Spare conditions for frames 1-9 (unchanged)
        (index === 1 && frameIndex < 9 && rolls[0] + rolls[1] === 10) || 
        (frameIndex < 9 && index === 1 && rolls[0] === 0 && rolls[1] === 10) ||

        // Spare conditions for the 10th frame
        (frameIndex === 9 && // 10th frame
          ((index === 1 && rolls[0] + rolls[1] === 10 && rolls[0] !== 10) || // Spare on 2nd roll
           (index === 2 && rolls[1] + rolls[2] === 10))) // Spare on 3rd roll
      ) {
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
                frame.score = 10 + (gameScores[i+1].rolls[0] || 0) + 
                              ((gameScores[i+1].rolls[1] !== undefined) ? gameScores[i+1].rolls[1] : 
                               (gameScores[i+2] && gameScores[i+2].rolls[0]) || 0);
            } else if (rolls[0] + rolls[1] === 10) { // Spare
                frame.score = 10 + (gameScores[i+1].rolls[0] || 0);
            } else { // Open frame
                frame.score = (rolls[0] || 0) + (rolls[1] || 0);
            }
        } else { // 10th frame
            frame.score = (rolls[0] || 0) + (rolls[1] || 0) + (rolls[2] || 0);
        }

        totalScore += frame.score;
        frame.score = totalScore;
        updateFrameDisplay(i);
    }
}

function setDefaultGameName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const defaultName = `Game_${year}-${month}-${day}`;
    gameNameInput.value = defaultName;
}

function initializeGame() {
    createFrames();
    setDefaultGameName();
    selectFrame(0);
}

document.addEventListener('DOMContentLoaded', initializeGame);

downloadButton.addEventListener('click', () => {
    const gameData = JSON.stringify(gameScores);
    const blob = new Blob([gameData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gameNameInput.value}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('load-game').addEventListener('change', (event) => {
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
