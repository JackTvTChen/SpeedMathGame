const RD_TIMEOUT = 15000;
const DEG_VALUES = [0, 30, 45, 60, 90, 120, 135, 150, 180, -30, -45, -60, -90, -120, -135, -150, -180, 210, 225, 240, 270, -210, -225, -240, -270, 300, 315, 330, -300, -315, -330];
const RAD_FRACS = [
    { num: 0, den: 1 }, { num: 1, den: 6 }, { num: 1, den: 4 }, { num: 1, den: 3 }, { num: 1, den: 2 },
    { num: 2, den: 3 }, { num: 3, den: 4 }, { num: 5, den: 6 }, { num: 1, den: 1 },
];
/* --- helpers --- */
function fracToTeX(n, d) {
    if (d === 1)
        return n === 0 ? "0" : `${n === 1 ? '' : n}\\pi`;
    return `${n === 1 ? '' : n}\\pi/${d}`;
}
function fracToNumeric(n, d) { return (n * Math.PI) / d; }
function degToRadTeX(deg) {
    const rad = (deg * Math.PI) / 180;
    // match to known frac table
    for (const { num, den } of RAD_FRACS) {
        if (Math.abs(rad - fracToNumeric(num, den)) < 1e-6)
            return fracToTeX(num, den);
        if (Math.abs(rad + fracToNumeric(num, den)) < 1e-6)
            return '-' + fracToTeX(num, den);
    }
    return rad.toFixed(3);
}
function radFracToDeg(num, den) { return (num * 180) / den; }
/* --- parse user answer --- */
function parseRad(str) {
    let s = str.trim().toLowerCase();
    if (!s)
        return null;
    s = s.replace(/\s+/g, "");
    s = s.replace(/π/, 'pi');
    if (!s.includes('pi')) {
        // decimal rad
        const v = Number(s);
        return isNaN(v) ? null : v;
    }
    // form like -3pi/4 or pi/6 or -pi
    let sign = 1;
    if (s.startsWith('-')) {
        sign = -1;
        s = s.slice(1);
    }
    s = s.replace('pi', '');
    if (s === '')
        return sign * Math.PI;
    if (s.startsWith('/')) {
        const den = Number(s.slice(1));
        return sign * (Math.PI / den);
    }
    const parts = s.split('/');
    const num = Number(parts[0]);
    const den = parts[1] ? Number(parts[1]) : 1;
    if (isNaN(num) || isNaN(den) || den === 0)
        return null;
    return sign * (num * Math.PI / den);
}
function parseDeg(str) {
    const v = Number(str.trim());
    return isNaN(v) ? null : v;
}
/* --- state --- */
let score = 0;
let highScore = Number(localStorage.getItem('rdHighScore')) || 0;
let currentQ = null;
let timerId = null;
const scoreDiv = document.getElementById('score');
const highScoreDiv = document.getElementById('highScore');
const levelDiv = document.getElementById("level") || document.createElement("div");
if (!levelDiv.id) {
    levelDiv.id = "level";
    levelDiv.classList.add("indicator");
    highScoreDiv.insertAdjacentElement("afterend", levelDiv);
}
const timerDiv = document.getElementById('timer');
const exprDiv = document.getElementById('expr');
const form = document.getElementById('answerForm');
const input = document.getElementById('ansInput');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreP = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
gameOverScreen?.classList.add('hidden');
restartBtn?.addEventListener('click', () => window.location.reload());
init();
function init() {
    nextQuestion();
    updateScore();
    highScoreDiv.textContent = `Best ${highScore}`;
}
function nextQuestion() {
    const askDegToRad = Math.random() < 0.5;
    if (askDegToRad) {
        const deg = DEG_VALUES[Math.floor(Math.random() * DEG_VALUES.length)];
        const tex = `${deg}^\\circ`;
        const radTeX = degToRadTeX(deg);
        currentQ = { prompt: tex, answerValue: (deg * Math.PI / 180), expectsRad: true };
        renderQuestion(tex);
    }
    else {
        // pick fraction
        const frac = RAD_FRACS[Math.floor(Math.random() * RAD_FRACS.length)];
        const sign = Math.random() < 0.5 ? -1 : 1;
        const tex = `${sign === -1 ? '-' : ''}${fracToTeX(frac.num, frac.den)}`;
        const degVal = sign * radFracToDeg(frac.num, frac.den);
        currentQ = { prompt: tex, answerValue: degVal, expectsRad: false };
        renderQuestion(tex);
    }
    startTimer();
}
form.addEventListener('submit', evt => {
    evt.preventDefault();
    if (!currentQ)
        return;
    const raw = input.value;
    input.value = '';
    const parsed = currentQ.expectsRad ? parseRad(raw) : parseDeg(raw);
    if (parsed === null)
        return;
    if (Math.abs(parsed - currentQ.answerValue) < 0.01) {
        score++;
        updateScore();
        nextQuestion();
    }
    else {
        score--;
        updateScore();
        if (score < 0)
            finish('Score below 0');
    }
});
function updateScore() {
    scoreDiv.textContent = `Score ${score}`;
    highScoreDiv.textContent = `Best ${highScore}`;
    const level = Math.min(10, Math.ceil((score + 1) / 3));
    levelDiv.textContent = `Level ${level}`;
}
function startTimer() {
    if (timerId)
        clearInterval(timerId);
    let rem = RD_TIMEOUT / 1000;
    timerDiv.textContent = `Time ${rem}s`;
    timerId = window.setInterval(() => { rem--; timerDiv.textContent = `Time ${rem}s`; if (rem === 0) {
        clearInterval(timerId);
        finish('Time up');
    } }, 1000);
}
function renderQuestion(tex) {
    exprDiv.textContent = `\\(${tex}\\)`;
    // @ts-ignore
    MathJax.typesetPromise([exprDiv]);
}
function finish(msg) {
    if (timerId)
        clearInterval(timerId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('rdHighScore', String(highScore));
    }
    if (gameOverScreen) {
        finalScoreP.textContent = `Your score: ${score}`;
        gameOverScreen.classList.remove('hidden');
    }
    else {
        alert(`Game over: ${msg}\nFinal score: ${score}`);
        window.location.reload();
    }
}
export {};
