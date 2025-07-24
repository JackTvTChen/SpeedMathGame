/* Trigonometry Game Logic */
interface TrigQuestion {
  expression: string;
  answer: string;
  level: number;
}

/* -------------------------------------------------
   SECTION 0: constants & helper utilities
-------------------------------------------------*/
const ANSWER_TIMEOUT = 15_000; // 15 seconds per question
const ops = ["sin", "cos", "tan", "sec", "csc", "cot"];
const sinBase = { 0: "0", 30: "1/2", 45: "r2/2", 60: "r3/2", 90: "1" };
const cosBase = { 0: "1", 30: "r3/2", 45: "r2/2", 60: "1/2", 90: "0" };
const tanBase = { 0: "0", 30: "r3/3", 45: "1", 60: "r3", 90: "U" };
// positive canonical → positive reciprocal string (already rationalised)
const recipMap: { [key: string]: string } = {
  "0": "U",
  "1": "1",
  "1/2": "2",
  "2": "1/2",
  "r2/2": "r2",
  "r2": "r2/2",
  "r3/2": "2r3/3",
  "2r3/3": "r3/2",
  "r3/3": "r3",
  "r3": "r3/3"
};

const tol = 1e-6;
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : Math.abs(a);
const mod = (x: number, m: number): number => ((x % m) + m) % m;
const isMultiple = (angle: number, div: number): boolean => Math.abs(mod(angle, div)) < tol;

/* -------------------------------------------------
   SECTION 1: value engine (exact strings)
-------------------------------------------------*/
function referenceAngle(deg: number): number {
  const a = mod(deg, 360);
  if (a <= 90) return a;
  if (a <= 180) return 180 - a;
  if (a <= 270) return a - 180;
  return 360 - a;
}

function quadrant(deg: number): number {
  const a = mod(deg, 360);
  if (a >= 0 && a < 90) return 1;
  if (a >= 90 && a < 180) return 2;
  if (a >= 180 && a < 270) return 3;
  return 4;
}

function applySign(str: string, negative: boolean): string {
  if (str === "0" || str === "U") return str;
  return negative ? "-" + str : str;
}

function reciprocal(str: string): string {
  const neg = str.startsWith("-");
  const core = neg ? str.slice(1) : str;
  const rec = recipMap[core] || "U";
  if (rec === "U") return "U";
  return neg ? applySign(rec, true) : rec;
}

function trigExact(op: string, deg: number): string {
  const q = quadrant(deg);
  const ref = referenceAngle(deg);
  let base = "U";
  const signSin = (q === 3 || q === 4) ? -1 : 1;
  const signCos = (q === 2 || q === 3) ? -1 : 1;
  const signTan = (q === 2 || q === 4) ? -1 : 1;

  switch (op) {
    case "sin":
      base = sinBase[ref as keyof typeof sinBase] || "U";
      return applySign(base, signSin === -1);
    case "cos":
      base = cosBase[ref as keyof typeof cosBase] || "U";
      return applySign(base, signCos === -1);
    case "tan":
      base = tanBase[ref as keyof typeof tanBase] || "U";
      return base === "U" ? "U" : applySign(base, signTan === -1);
    case "csc": {
      const s = trigExact("sin", deg);
      return reciprocal(s);
    }
    case "sec": {
      const c = trigExact("cos", deg);
      return reciprocal(c);
    }
    case "cot": {
      const t = trigExact("tan", deg);
      return reciprocal(t);
    }
    default:
      return "U";
  }
}

/* -------------------------------------------------
   SECTION 2: difficulty classifier
-------------------------------------------------*/
function isUndefined(op: string, angle: number): boolean {
  const cosZero = isMultiple(angle - 90, 180);
  const sinZero = isMultiple(angle, 180);
  switch (op) {
    case "tan":
    case "sec": return cosZero;
    case "csc":
    case "cot": return sinZero;
    default: return false;
  }
}

function classifyDifficulty(op: string, deg: number): number {
  const canonical = mod(deg, 360);
  let base;
  if (isMultiple(canonical, 90)) {
    base = 1;
  } else {
    const steps = Math.floor(Math.abs(deg) / 90);
    base = 1.0 + 0.5 * steps;
  }
  let bonus = 0;
  if (["sec", "csc", "cot"].includes(op)) bonus += 1;
  if (isUndefined(op, canonical)) bonus += 1;
  if (deg < 0) bonus += 0.5;
  return base + bonus;
}

function levelFromDifficulty(diff: number): number {
  if (diff === 1) return 1;
  if (diff === 1.5) return 2;
  if (diff === 2) return 3;
  if (diff === 2.5) return 4;
  if (diff === 3) return 5;
  if (diff === 3.5) return 6;
  if (diff === 4) return 7;
  if (diff === 4.5) return 8;
  if (diff === 5 || diff === 5.5) return 9;
  return 10; // diff 6 or 6.5
}

/* -------------------------------------------------
   SECTION 3: question bank
-------------------------------------------------*/
function buildQuestionBank(): TrigQuestion[] {
  const angleSet = new Set<number>();
  for (let d = -360; d <= 360; d++) {
    if (d % 30 === 0 || d % 45 === 0 || d % 60 === 0) angleSet.add(d);
  }
  const angles = [...angleSet].sort((a, b) => a - b);

  const bank: TrigQuestion[] = [];
  angles.forEach(deg => {
    ops.forEach(op => {
      const answer = trigExact(op, deg);
      if (answer === "U") return; // Skip undefined values
      
      const diff = classifyDifficulty(op, deg);
      const level = levelFromDifficulty(diff);
      const entry = {
        expression: `${op}(${deg}°)`,
        answer: answer,
        level: level
      };
      bank.push(entry);
    });
  });
  return bank;
}

const questionBank = buildQuestionBank();

/* -------------------------------------------------
   SECTION 4: game state
-------------------------------------------------*/
let score = 0;
let highScore = Number(localStorage.getItem("trigHighScore")) || 0;
let timerId: number | null = null;
let currentQ: TrigQuestion | null = null;
let currentLevel = 1;

/* -------------------------------------------------
   SECTION 5: DOM references & UI
-------------------------------------------------*/
const scoreDiv = document.getElementById("score") as HTMLElement;
const highScoreDiv = document.getElementById("highScore") as HTMLElement;
const levelDiv = document.getElementById("level") || document.createElement("div");
if (!levelDiv.id) {
  levelDiv.id = "level";
  levelDiv.classList.add("indicator");
  highScoreDiv.insertAdjacentElement("afterend", levelDiv);
}
const timerDiv = document.getElementById("timer") as HTMLElement;
const exprDiv = document.getElementById("expr") as HTMLElement;
const form = document.getElementById("answerForm") as HTMLFormElement;
const input = document.getElementById("ansInput") as HTMLInputElement;
const gameOverScreen = document.getElementById("gameOverScreen") as HTMLElement;
const finalScoreP = document.getElementById("finalScore") as HTMLElement;
const restartBtn = document.getElementById("restartBtn") as HTMLButtonElement;

if (gameOverScreen) gameOverScreen.classList.add("hidden");
if (restartBtn) restartBtn.addEventListener("click", () => window.location.reload());

/* -------------------------------------------------
   SECTION 6: game logic
-------------------------------------------------*/
init();
function init() {
  updateScore();
  highScoreDiv.textContent = `Best ${highScore}`;
  nextQuestion();
}

function nextQuestion() {
  // Get level based on score (increases every 5 points)
  currentLevel = Math.min(10, Math.ceil((score + 1) / 5));
  
  // Filter questions for current level
  const levelQuestions = questionBank.filter(q => q.level === currentLevel);
  
  // Pick random question from level
  const randomIndex = Math.floor(Math.random() * levelQuestions.length);
  currentQ = levelQuestions[randomIndex];
  
  renderQuestion(currentQ.expression);
  startTimer();
}

form.addEventListener("submit", evt => {
  evt.preventDefault();
  if (!currentQ) return;

  const userAnswer = input.value.trim().toLowerCase();
  input.value = "";
  
  // Compare user answer with correct answer
  if (userAnswer === currentQ.answer.toLowerCase()) {
    score++;
    updateScore();
    nextQuestion();
  } else {
    score--;
    updateScore();
    if (score < 0) { finishGame("Score below 0"); }
  }
});

/* -------------------------------------------------
   SECTION 7: helpers
-------------------------------------------------*/
function updateScore() {
  scoreDiv.textContent = `Score ${score}`;
  highScoreDiv.textContent = `Best ${highScore}`;
  levelDiv.textContent = `Level ${currentLevel}`;
}

function startTimer() {
  if (timerId) clearInterval(timerId);
  let remaining = ANSWER_TIMEOUT / 1000;
  timerDiv.textContent = `Time ${remaining}s`;
  timerId = window.setInterval(() => {
    remaining--;
    timerDiv.textContent = `Time ${remaining}s`;
    if (remaining === 0) {
      clearInterval(timerId!);
      finishGame("Time up");
    }
  }, 1000);
}

function renderQuestion(expr: string) {
  exprDiv.textContent = "\\(" + expr.replace("/", "÷").replace("*", "×") + "\\)";
  // @ts-ignore
  MathJax.typesetPromise([exprDiv]);
}

function finishGame(reason: string) {
  if (timerId) clearInterval(timerId);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("trigHighScore", String(highScore));
  }
  if (gameOverScreen) {
    finalScoreP.textContent = `Your score: ${score}`;
    gameOverScreen.classList.remove("hidden");
  } else {
    window.location.reload();
  }
}

/* -------------------------------------------------
   SECTION 8: answer parsing
-------------------------------------------------*/
function parseAnswer(raw: string): number | null {
  let str = raw.trim().toLowerCase();
  if (!str) return null;

  // helper to parse a term (number or root)
  const termVal = (t: string): number | null => {
    if (t.startsWith("r")) {
      const n = Number(t.slice(1));
      return isNaN(n) ? null : Math.sqrt(n);
    }
    const num = Number(t);
    return isNaN(num) ? null : num;
  };

  let numeratorStr = str;
  let denomStr = "";
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length !== 2) return null;
    [numeratorStr, denomStr] = parts;
  }

  const numVal = termVal(numeratorStr);
  if (numVal === null) return null;
  if (!denomStr) return numVal;

  const denVal = termVal(denomStr);
  if (denVal === null || denVal === 0) return null;
  return numVal / denVal;
}

export {}; 