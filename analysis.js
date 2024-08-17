let globalStrikePercentage = 0;
let globalSparePercentage = 0;

function analyzeFiles() {
    const files = document.getElementById('jsonFiles').files;
    if (files.length === 0) return;
    let totalScore = 0;
    let totalStrikes = 0;
    let totalSpares = 0;
    let totalFrames = 0;
    let processedFiles = 0;
    const progressBar = document.getElementById('progress-bar');
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = JSON.parse(event.target.result);
            data.forEach(frame => {
                totalScore += frame.score;
                totalFrames++;
                // Count strikes and spares
                if (frame.rolls.length === 1 && frame.rolls[0] === 10) {
                    totalStrikes++;
                } else if (frame.rolls.length === 2 && frame.rolls[0] + frame.rolls[1] === 10) {
                    totalSpares++;
                }
            });
            processedFiles++;
            progressBar.style.width = `${(processedFiles / files.length) * 100}%`;
            if (processedFiles === files.length) {
                displayResults(totalScore, totalStrikes, totalSpares, totalFrames);
            }
        };
        reader.readAsText(file);
    });
}

function displayResults(totalScore, totalStrikes, totalSpares, totalFrames) {
    const averageScore = totalScore / totalFrames;
    globalStrikePercentage = (totalStrikes / totalFrames) * 100;
    globalSparePercentage = (totalSpares / (totalFrames - totalStrikes)) * 100;
    document.getElementById('average-score').textContent = `Average Score: ${averageScore.toFixed(2)}`;
    document.getElementById('strike-percentage').textContent = `Strike Percentage: ${globalStrikePercentage.toFixed(2)}%`;
    document.getElementById('spare-percentage').textContent = `Spare Percentage: ${globalSparePercentage.toFixed(2)}%`;
    document.getElementById('generate-game').style.display = 'block';
}

function generateRepresentativeGame() {
    const game = simulateBowlingGame(globalStrikePercentage, globalSparePercentage);
    displayScorecard(game);
}

function simulateBowlingGame(strikePercentage, sparePercentage) {
    const frames = 10;
    let score = 0;
    let frameScores = [];
    let rolls = [];

    function generateRoll(pinsLeft = 10) {
        const random = Math.random() * 100;
        if (pinsLeft === 10 && random < strikePercentage) {
            return 10;
        } else {
            const maxRoll = Math.min(pinsLeft, 9);
            return Math.floor(Math.random() * (maxRoll + 1));
        }
    }

    function isSpare(roll1, roll2) {
        return roll1 + roll2 === 10 && roll1 !== 10;
    }

    for (let frame = 0; frame < frames; frame++) {
        let firstRoll = generateRoll();
        rolls.push(firstRoll);
        
        if (firstRoll < 10 || frame === 9) {
            let secondRoll = generateRoll(10 - firstRoll);
            if (frame < 9 && firstRoll + secondRoll === 10) {
                if (Math.random() * 100 >= sparePercentage) {
                    secondRoll = Math.min(secondRoll, 9 - firstRoll);
                }
            }
            rolls.push(secondRoll);
            
            if (frame === 9 && (firstRoll === 10 || isSpare(firstRoll, secondRoll))) {
                let thirdRoll = generateRoll();
                rolls.push(thirdRoll);
            }
        }
    }

    let rollIndex = 0;
    for (let frame = 0; frame < frames; frame++) {
        let frameScore = 0;
        
        if (frame < 9) {
            if (rolls[rollIndex] === 10) {
                frameScore = 10 + (rolls[rollIndex + 1] || 0) + (rolls[rollIndex + 2] || 0);
                rollIndex += 1;
            } else if (isSpare(rolls[rollIndex], rolls[rollIndex + 1])) {
                frameScore = 10 + (rolls[rollIndex + 2] || 0);
                rollIndex += 2;
            } else {
                frameScore = rolls[rollIndex] + rolls[rollIndex + 1];
                rollIndex += 2;
            }
        } else {
            frameScore = rolls[rollIndex] + (rolls[rollIndex + 1] || 0) + (rolls[rollIndex + 2] || 0);
            rollIndex += 3;
        }
        
        score += frameScore;
        frameScores.push(frameScore);
    }

    return { score, frameScores, rolls };
}

function displayScorecard(game) {
    let html = '<div class="score-sheet">';
    html += '<h2>Representative Game</h2>';
    html += '<div class="frames-container">';
    let rollIndex = 0;
    let cumulativeScore = 0;

    for (let i = 0; i < 10; i++) {
        let firstRoll = game.rolls[rollIndex];
        let secondRoll = game.rolls[rollIndex + 1] || 0;
        let thirdRoll = (i === 9) ? (game.rolls[rollIndex + 2] || 0) : 0;
        
        cumulativeScore += game.frameScores[i];

        let roll1Display = firstRoll === 10 ? 'X' : firstRoll;
        let roll2Display = '';
        let roll3Display = '';

        if (i < 9) {
            if (firstRoll < 10) {
                roll2Display = (firstRoll + secondRoll === 10) ? '/' : secondRoll;
            }
        } else {
            if (firstRoll === 10) {
                roll2Display = secondRoll === 10 ? 'X' : secondRoll;
                roll3Display = thirdRoll === 10 ? 'X' : thirdRoll;
            } else if (firstRoll + secondRoll === 10) {
                roll2Display = '/';
                roll3Display = thirdRoll === 10 ? 'X' : thirdRoll;
            } else {
                roll2Display = secondRoll;
            }
        }

        html += `<div class="frame ${i === 9 ? 'tenth-frame' : ''}">
                    <div class="frame-top">
                        <span class="roll1">${roll1Display}</span>
                        <span class="roll2">${roll2Display}</span>
                        ${i === 9 ? `<span class="roll3">${roll3Display}</span>` : ''}
                    </div>
                    <div class="frame-bottom">${cumulativeScore}</div>
                </div>`;

        rollIndex += (i < 9 && firstRoll === 10) ? 1 : (i === 9) ? 3 : 2;
    }

    html += '</div></div>';
    document.getElementById('scorecard').innerHTML = html;
}
