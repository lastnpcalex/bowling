let games = [];
let currentGameIndex = 0;



function initializeGame(bowlerName = 'Bowler 1') {
    // Find the current game number for this bowler based on existing games
    let gameNumber = 1;
    const existingGameLabels = games
        .filter(game => game.bowlerName === bowlerName)
        .map(game => game.gameInfo)
        .filter(label => label) // Ensure only valid game labels are processed
        .map(label => {
            const match = label.match(/Game(\d+)_(\d{4}-\d{2}-\d{2})/); // Match both the game number and the date
            return match ? parseInt(match[1], 10) : 1; // Get the game number
        });

    if (existingGameLabels.length > 0) {
        gameNumber = Math.max(...existingGameLabels) + 1;
    }

    // Create the default game label with the incremented game number and full date
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const gameLabel = `Game${gameNumber}_${formattedDate}`; // Ensure the date is always appended

    const game = {
        bowlerName: bowlerName,
        currentFrame: 0,
        currentRoll: 0,
        gameScores: Array(10).fill().map(() => ({ rolls: [], score: 0 })),
        gameComplete: false,
        gameInfo: gameLabel, // Set the game label with game number and date
        containerElement: null
    };

    games.push(game);
    currentGameIndex = games.length - 1;

    createGameUI(game);
    selectFrame(game, 0);
}


function addNewGameForAllBowlers() {
    // Get the unique bowler names from the current games
    const uniqueBowlers = [...new Set(games.map(game => game.bowlerName))];

    // For each unique bowler, create a new game with the incremented game number
    uniqueBowlers.forEach(bowlerName => {
        initializeGame(bowlerName); // Initialize a new game for each bowler
    });
}


function createGameUI(game) {
    const container = document.createElement('div');
    container.className = 'score-sheet';
    
    let gameInfoHTML = `<input type="text" class="bowler-name" value="${game.bowlerName}">`;
    if (game.gameInfo) {
        gameInfoHTML += `<span class="game-date">${game.gameInfo}</span>`;
    }

    container.innerHTML = `
        <div class="game-info">
            ${gameInfoHTML}
        </div>
        <div class="frames-container"></div>
        <div class="input-area">
            <div class="roll-info"></div>
            <div class="input-buttons"></div>
        </div>
    `;
    document.getElementById('all-scoresheets-container').appendChild(container);
    game.containerElement = container;

    // Add event listener to update the bowler name in the game object when the input changes
    const bowlerNameInput = container.querySelector('.bowler-name');
    bowlerNameInput.addEventListener('input', (e) => {
        game.bowlerName = e.target.value.trim();
    });

    createFrames(game);
}


function createFrames(game) {
    const framesContainer = game.containerElement.querySelector('.frames-container');
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
        frame.addEventListener('click', () => selectFrame(game, i));
        framesContainer.appendChild(frame);
    }
}

function selectFrame(game, frameIndex) {
    game.currentFrame = frameIndex;
    const frame = game.gameScores[game.currentFrame];

    if (frameIndex === 9) {
        // For the 10th frame, start at the first roll by default
        game.currentRoll = 0;
        game.gameComplete = false; // Reset game complete status when selecting 10th frame
    } else {
        game.currentRoll = 0;
    }

    updateInputOptions(game);
    game.containerElement.querySelector('.input-area').style.display = "flex";

    game.containerElement.querySelectorAll(".frame").forEach((f) => f.classList.remove("selected"));
    game.containerElement.querySelectorAll(".frame")[frameIndex].classList.add("selected");
}

function updateInputOptions(game) {
    const inputButtons = game.containerElement.querySelector('.input-buttons');
    const rollInfo = game.containerElement.querySelector('.roll-info');
    inputButtons.innerHTML = ""; // Clear existing buttons
    let maxPins = 10;
    let rollText = "";

    const frame = game.gameScores[game.currentFrame];
    const rolls = frame.rolls;

    if (game.currentFrame === 9) {
        // 10th frame logic (unchanged)
        if (game.currentRoll === 0) {
            rollText = "10th Frame - 1st Roll";
        } else if (game.currentRoll === 1) {
            rollText = "10th Frame - 2nd Roll";
            if (rolls[0] < 10) {
                maxPins = 10 - rolls[0];
            }
        } else if (game.currentRoll === 2) {
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
                game.containerElement.querySelector('.input-area').style.display = "none";
                return;
            }
        }
    } else {
        // Frames 1-9 logic (unchanged)
        if (game.currentRoll === 0) {
            rollText = `Frame ${game.currentFrame + 1} - 1st Roll`;
        } else {
            rollText = `Frame ${game.currentFrame + 1} - 2nd Roll`;
            maxPins = 10 - rolls[0];
        }
    }

    rollInfo.textContent = rollText;

    for (let i = 0; i <= maxPins; i++) {
        // Prevent adding the "X" button if it's the second roll 
        // AND the first roll's value was 0
        if ((i === 10 && game.currentRoll === 1 && rolls[0] === 0) ||
            (i === 10 && game.currentFrame === 9 && game.currentRoll === 2 && rolls[0] === 10 && rolls[1] < 10)) {
            continue; // Skip adding the "X" button
        }

        const button = document.createElement("button");
        button.textContent = i === 10 ? "X" : i;
        button.addEventListener("click", () => handleRoll(game, i));
        if (rolls[game.currentRoll] === i) {
            button.classList.add("selected");
        }
// Add this line to apply the correct CSS class
        button.classList.add("roll-button");
        inputButtons.appendChild(button);
    }

    // Add spare button (unchanged logic)
    if (
        (game.currentRoll === 1 && game.currentFrame < 9 && rolls[0] < 10) ||
        (game.currentFrame === 9 && (
            (game.currentRoll === 1 && rolls[0] !== 10) ||
            (game.currentRoll === 2 && rolls[0] === 10 && rolls[1] !== 10)
        ))
    ) {
        if (maxPins > 0) {
            const spareButton = document.createElement("button");
            spareButton.textContent = "/";
            spareButton.addEventListener("click", () => handleRoll(game, maxPins));
            if (rolls[game.currentRoll] === maxPins) {
                spareButton.classList.add("selected");
            }
            inputButtons.appendChild(spareButton);
        }
    }
}

function handleRoll(game, pins) {
    const frame = game.gameScores[game.currentFrame];
    frame.rolls[game.currentRoll] = pins;

    if (game.currentFrame === 9) {
        // 10th frame logic (unchanged)
        if (game.currentRoll === 0) {
            game.currentRoll = 1;
        } else if (game.currentRoll === 1) {
            if (frame.rolls[0] === 10 || frame.rolls[0] + frame.rolls[1] === 10) {
                game.currentRoll = 2;
            } else {
                if (frame.rolls.length > 2) {
                    frame.rolls.pop();
                }
                game.currentRoll = 0;
            }
        } else {
            game.currentRoll = 0;
        }
    } else {
        // Frames 1-9 logic (unchanged)
        if (pins === 10 || game.currentRoll === 1) {
            game.currentFrame++;
            game.currentRoll = 0;
            
            // Automatically select the next frame, including the 10th frame
            selectFrame(game, game.currentFrame);
        } else {
            game.currentRoll = 1;
        }
    }

    updateFrameDisplay(game, game.currentFrame);
    updateInputOptions(game);
    calculateScores(game);
}

function updateFrameDisplay(game, frameIndex) {
    const frame = game.containerElement.querySelectorAll('.frame')[frameIndex];
    const rolls = game.gameScores[frameIndex].rolls;
    const rollDisplays = frame.querySelectorAll('.roll1, .roll2, .roll3');

    rollDisplays.forEach((display, index) => {
        if (rolls[index] !== undefined) {
            if (
                (index === 1 && frameIndex < 9 && rolls[0] + rolls[1] === 10) || 
                (frameIndex < 9 && index === 1 && rolls[0] === 0 && rolls[1] === 10) ||
                (frameIndex === 9 && 
                    ((index === 1 && rolls[0] + rolls[1] === 10 && rolls[0] !== 10) || 
                    (index === 2 && rolls[1] + rolls[2] === 10)))
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

    frame.querySelector('.frame-bottom').textContent = game.gameScores[frameIndex].score || '';
}

function calculateScores(game) {
    let totalScore = 0;
    for (let i = 0; i < 10; i++) {
        const frame = game.gameScores[i];
        const rolls = frame.rolls;

        if (i < 9) {
            if (rolls[0] === 10) { // Strike
                frame.score = 10 + (game.gameScores[i+1].rolls[0] || 0) + 
                              ((game.gameScores[i+1].rolls[1] !== undefined) ? game.gameScores[i+1].rolls[1] : 
                               (game.gameScores[i+2] && game.gameScores[i+2].rolls[0]) || 0);
            } else if (rolls[0] + rolls[1] === 10) { // Spare
                frame.score = 10 + (game.gameScores[i+1].rolls[0] || 0);
            } else { // Open frame
                frame.score = (rolls[0] || 0) + (rolls[1] || 0);
            }
        } else { // 10th frame
            frame.score = (rolls[0] || 0) + (rolls[1] || 0) + (rolls[2] || 0);
        }

        totalScore += frame.score;
        frame.score = totalScore;
        updateFrameDisplay(game, i);
    }
}

function setDefaultGameName() {
    const gameNameInput = document.getElementById('game-name');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const defaultName = `Game_${year}-${month}-${day}`;
    gameNameInput.value = defaultName;
}

function addBowler() {
    const bowlerName = document.getElementById('new-bowler-name').value.trim();
    if (bowlerName === '') {
        alert('Please enter a bowler name.');
        return;
    }
    document.getElementById('new-bowler-name').value = '';
    initializeGame(bowlerName);
}

function addNewGameForAllBowlers() {
    // Get the current game number from the existing games' labels
    let currentGameNumber = 1;
    const existingGameLabels = games
        .map(game => game.gameInfo)
        .filter(label => label) // Filter out undefined or null labels
        .map(label => {
            const match = label.match(/Game(\d+)/);
            return match ? parseInt(match[1], 10) : 1;
        });

    if (existingGameLabels.length > 0) {
        // Extract the current highest game number
        currentGameNumber = Math.max(...existingGameLabels) + 1;
    }

    // Get the unique bowler names from the current games
    const uniqueBowlers = [...new Set(games.map(game => game.bowlerName))];

    // For each unique bowler, create a new game with the incremented game number
    uniqueBowlers.forEach(bowlerName => {
        const newGameLabel = `Game${currentGameNumber}`;
        initializeGame(bowlerName); // Create a new game for the bowler
        const currentGame = games[games.length - 1]; // Get the most recently added game
        currentGame.gameInfo = newGameLabel; // Set the new game number
        setDefaultGameName(); // Update the game name in the UI
    });

    // Increment the game number for the next round of new games
    currentGameNumber++;
}


document.addEventListener('DOMContentLoaded', function() {
    initializeGame();  // Initialize the first default game
    document.getElementById('add-bowler-button').addEventListener('click', addBowler);
    document.getElementById('download-button').addEventListener('click', downloadGames);
    document.getElementById('load-game').addEventListener('change', loadGames);

    // Add event listener for the new "New Game for All Bowlers" button
    document.getElementById('new-game-button').addEventListener('click', addNewGameForAllBowlers);
});


function downloadGames() {
    games.forEach(game => {
        // Get the bowler name from the input field
        const bowlerNameInput = game.containerElement.querySelector('.bowler-name');
        const bowlerName = bowlerNameInput ? bowlerNameInput.value.trim() : 'Unnamed Bowler';

        // Prepare the game data as an array of frame objects (rolls and score)
        const gameData = game.gameScores.map(frame => ({
            rolls: frame.rolls,
            score: frame.score
        }));

        // Ensure the game label (gameInfo) includes the date, if not already included
        let gameLabel = game.gameInfo || 'Game1'; // Default to 'Game1' if gameInfo is not set
        const dateRegex = /\d{4}-\d{2}-\d{2}/; // Regex to check if date is present
        if (!dateRegex.test(gameLabel)) {
            // If no date is present in the game label, append the current date
            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            gameLabel = `${gameLabel}_${formattedDate}`;
        }

        // Convert the game data to JSON and trigger download
        const blob = new Blob([JSON.stringify(gameData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bowlerName.replace(/\s/g, '_')}_${gameLabel}.json`;

        a.click();
        URL.revokeObjectURL(url);
    });
}





function loadGames(event) {
    const files = event.target.files;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedGame = JSON.parse(e.target.result);
                // Validate the structure of the loaded game
                if (Array.isArray(loadedGame) && loadedGame.length === 10 && loadedGame.every(frame => 'rolls' in frame && 'score' in frame)) {
                    // Extract bowler name and game info from filename
                    const fileNameParts = file.name.split('_');
                    let bowlerName = fileNameParts[0].trim();
                    if (!bowlerName) {
                        bowlerName = 'Unnamed Bowler';
                    }
                    const gameInfo = fileNameParts.slice(1).join('_').replace('.json', '');

                    // Create a new game object based on the loaded data
                    const game = {
                        bowlerName: bowlerName,
                        gameInfo: gameInfo,
                        currentFrame: 0,
                        currentRoll: 0,
                        gameScores: loadedGame,  // Directly assign the loaded game scores
                        gameComplete: false,
                        containerElement: null
                    };

                    // Add the game to the games array
                    games.push(game);

                    // Create the UI for the loaded game and display the scores
                    createGameUI(game);
                    calculateScores(game); // Recalculate scores to ensure display consistency
                    selectFrame(game, 0);  // Select the first frame by default
                } else {
                    console.error('Invalid game data format in file:', file.name);
                    alert('The file format is invalid. Please check the JSON structure.');
                }
            } catch (error) {
                console.error('Error loading game data from file:', file.name, error);
                alert('Failed to load the game data. Please check the file.');
            }
        };
        reader.readAsText(file);
    });
}
