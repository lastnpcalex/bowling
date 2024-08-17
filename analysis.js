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
    const strikePercentage = (totalStrikes / totalFrames) * 100;
    const sparePercentage = (totalSpares / totalFrames) * 100;

    document.getElementById('average-score').textContent = `Average Score: ${averageScore.toFixed(2)}`;
    document.getElementById('strike-percentage').textContent = `Strike Percentage: ${strikePercentage.toFixed(2)}%`;
    document.getElementById('spare-percentage').textContent = `Spare Percentage: ${sparePercentage.toFixed(2)}%`;
}
