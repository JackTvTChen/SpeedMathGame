/* ── tiny helper types ───────────────────────────────────────── */
interface QuestionRec {
  level: number;
  expression: string;
  answer: number;
  difficulty: number;
}

/* ── config ──────────────────────────────────────────────────── */
const FILE_URL       = "./questions_1B.jsonl";
const ANSWER_TIMEOUT = 20_000;        // 10 s
const BUFFER_SIZE    = 512;            // per-level random pool (was 64)
const MAX_RECENT = 500;

/* ── RNG per level (deterministic per session) ──────────────── */
const sessionSeed = crypto.getRandomValues(new Uint32Array(1))[0] || Date.now();
function lcg(seed: number) {
  let s = seed;
  return () => (s = (s * 48271) % 0x7fffffff);
}
const rngByLevel = Array.from({ length: 31 }, (_, i) => lcg(sessionSeed + i * 97));

/* ── game state ──────────────────────────────────────────────── */
let score = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;
let currentQ: QuestionRec | null = null;
let timerId: number | null = null;
let fileReader: ReadableStreamDefaultReader<string>;
const pool: QuestionRec[][] = Array.from({ length: 31 }, () => []);  // 1‑based
const recentSeen: string[] = JSON.parse(localStorage.getItem("recentQs") ?? "[]");
const recentSet = new Set<string>(recentSeen);

/* ── DOM refs ────────────────────────────────────────────────── */
const scoreDiv = document.getElementById("score")!;
const highScoreDiv = document.getElementById("highScore")!;
const levelDiv = document.getElementById("level") || document.createElement("div");
if (!levelDiv.id) {
  levelDiv.id = "level";
  levelDiv.classList.add("indicator");
  highScoreDiv.insertAdjacentElement("afterend", levelDiv);
}
const timerDiv = document.getElementById("timer")!;
const exprDiv  = document.getElementById("expr")  as HTMLElement;
const form     = document.getElementById("answerForm") as HTMLFormElement;
const input    = document.getElementById("ansInput")   as HTMLInputElement;
const gameOverScreen = document.getElementById("gameOverScreen") as HTMLElement;
const finalScoreP    = document.getElementById("finalScore")   as HTMLElement;
const restartBtn     = document.getElementById("restartBtn")    as HTMLButtonElement;

/* ── init: open stream and start ─────────────────────────────── */
(async function init() {
  const resp = await fetch(FILE_URL);
  if (!resp.body) throw new Error("No body in fetch response");

  const textStream = resp.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(splitLines());

  fileReader = textStream.getReader();

  // ── random skip to diversify each session ────────────────
  const SKIP = rngByLevel[0]() % 100_000;
  for (let i = 0; i < SKIP; i++) await fileReader.read();

  nextQuestion();
})();

/* ── supply a question whose level = ceil((score+1)/5) ───────── */
async function nextQuestion() {
  const lvl = Math.ceil((score + 1) / 5);      // 0‑5 →1, 6‑10 →2, …

  // fill pool for that level if needed
  while (pool[lvl].length < BUFFER_SIZE) {
    const { value, done } = await fileReader.read();
    if (done) { gameOver("End of file"); return; }
    if (!value) continue;
    const rec: QuestionRec = JSON.parse(value);
    if (rec.level >= 1 && rec.level <= 30) pool[rec.level].push(rec);
  }

  // pick a random index from the pool using level-specific RNG, avoiding recent repeats
  let idx: number;
  let attempts = 0;
  let candidate: QuestionRec;
  do {
    idx = rngByLevel[lvl]() % pool[lvl].length;
    candidate = pool[lvl][idx];
    attempts++;
  } while (attempts < 10 && recentSet.has(candidate.expression));

  currentQ = pool[lvl].splice(idx, 1)[0];

  // remember recently-seen questions (capped)
  recentSeen.push(currentQ.expression);
  if (recentSeen.length > MAX_RECENT) {
    const removed = recentSeen.shift();
    if (removed) recentSet.delete(removed);
  }
  localStorage.setItem("recentQs", JSON.stringify(recentSeen));
  recentSet.add(currentQ.expression);

  renderQuestion(currentQ.expression);
  startTimer();
  updateScore();
  highScoreDiv.textContent = `Best ${highScore}`;
}

/* ── answer handling ─────────────────────────────────────────── */
form.addEventListener("submit", evt => {
  evt.preventDefault();
  if (!currentQ) return;

  const given = Number(input.value.trim());
  input.value = "";

  if (given === currentQ.answer) {
    score++;
    updateScore();
    nextQuestion();
  } else {
    score--;
    updateScore();
    if (score < 0) { gameOver("Score below 0"); return; }
    // stay on same question
  }
});

/* ── helpers ─────────────────────────────────────────────────── */
function updateScore() {
  scoreDiv.textContent = `Score ${score}`;
  highScoreDiv.textContent = `Best ${highScore}`;
  const level = Math.ceil((score + 1) / 5);
  levelDiv.textContent = `Level ${level}`;
}

function startTimer() {
  if (timerId) clearInterval(timerId);
  let remaining = ANSWER_TIMEOUT / 1000;
  timerDiv.textContent = `Time ${remaining} s`;
  timerId = window.setInterval(() => {
    remaining--;
    timerDiv.textContent = `Time ${remaining} s`;
    if (remaining === 0) { clearInterval(timerId!); gameOver("Time up"); }
  }, 1000);
}

function renderQuestion(expr: string) {
  exprDiv.textContent = "\\(" + expr.replace("/", "÷").replace("*", "×") + "\\)";
  // @ts-ignore
  MathJax.typesetPromise([exprDiv]);
}

function gameOver(msg: string) {
  if (timerId) clearInterval(timerId);

  // update best score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", String(highScore));
    highScoreDiv.textContent = `Best ${highScore}`;
  }

  // Show overlay only if element exists (avoid dashboard)
  if (gameOverScreen) {
    finalScoreP.textContent = `Your score: ${score}`;
    gameOverScreen.classList.remove("hidden");
  } else {
    // fallback reload
    window.location.reload();
  }
}

/* split stream into lines ---------------------------------------------------- */
function splitLines() {
  let carry = "";
  return new TransformStream<string, string>({
    transform(chunk, ctrl) {
      const lines = (carry + chunk).split(/\r?\n/);
      carry = lines.pop()!;
      for (const l of lines) ctrl.enqueue(l);
    },
    flush(ctrl) { if (carry) ctrl.enqueue(carry); }
  });
}

// Immediately ensure overlay is hidden in case of hot reload
gameOverScreen.classList.add("hidden");
restartBtn.addEventListener("click", () => window.location.reload());

export {};