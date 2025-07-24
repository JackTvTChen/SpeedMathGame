var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// --- config -----------------------------------------------------------------
var FILE_URL = "./questions_1B.jsonl"; // path to your 1‑billion file
var ANSWER_TIMEOUT = 10000; // 10 s per question
// --- game state -------------------------------------------------------------
var score = 0;
var currentQ = null;
var timerId = null;
var fileReader;
// --- DOM refs ---------------------------------------------------------------
var scoreDiv = document.getElementById("score");
var timerDiv = document.getElementById("timer");
var exprDiv = document.getElementById("expr");
var form = document.getElementById("answerForm");
var input = document.getElementById("ansInput");
// --- initialise -------------------------------------------------------------
(function init() {
    return __awaiter(this, void 0, void 0, function () {
        var resp, textStream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(FILE_URL)];
                case 1:
                    resp = _a.sent();
                    if (!resp.body)
                        throw new Error("No body in fetch response");
                    textStream = resp.body
                        .pipeThrough(new TextDecoderStream())
                        .pipeThrough(splitLines());
                    fileReader = textStream.getReader();
                    nextQuestion();
                    return [2 /*return*/];
            }
        });
    });
})();
// --- core logic -------------------------------------------------------------
function nextQuestion() {
    return __awaiter(this, void 0, void 0, function () {
        var targetLevel, _a, value, done, rec;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    targetLevel = Math.ceil((score + 1) / 5);
                    _b.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [4 /*yield*/, fileReader.read()];
                case 2:
                    _a = _b.sent(), value = _a.value, done = _a.done;
                    if (done) {
                        gameOver("End of file");
                        return [2 /*return*/];
                    }
                    if (!value)
                        return [3 /*break*/, 1];
                    rec = JSON.parse(value);
                    if (rec.level === targetLevel) { // take first matching level
                        currentQ = rec;
                        renderQuestion(rec.expression);
                        startTimer();
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    });
}
form.addEventListener("submit", function (evt) {
    evt.preventDefault();
    if (!currentQ)
        return;
    var given = Number(input.value.trim());
    input.value = "";
    if (given === currentQ.answer) {
        score++;
        updateScore();
        nextQuestion();
    }
    else {
        score--;
        updateScore();
        if (score < 0) {
            gameOver("Score below 0");
            return;
        }
        // stay on same question (no nextQuestion)
    }
});
// --- utilities --------------------------------------------------------------
function updateScore() { scoreDiv.textContent = "Score\u00A0".concat(score); }
function startTimer() {
    if (timerId)
        clearInterval(timerId);
    var remaining = ANSWER_TIMEOUT / 1000;
    timerDiv.textContent = "Time\u00A0".concat(remaining, "\u202Fs");
    timerId = window.setInterval(function () {
        remaining--;
        timerDiv.textContent = "Time\u00A0".concat(remaining, "\u202Fs");
        if (remaining === 0) {
            clearInterval(timerId);
            gameOver("Time up");
        }
    }, 1000);
}
function renderQuestion(texExpr) {
    exprDiv.textContent = "\\(" + texExpr.replace("/", "÷") + "\\)";
    // MathJax typeset
    // @ts-ignore
    MathJax.typesetPromise([exprDiv]);
}
function gameOver(msg) {
    if (timerId)
        clearInterval(timerId);
    alert("Game over: ".concat(msg, "\nFinal score: ").concat(score));
    window.location.reload();
}
/* --- transform stream: split text into lines --------------------------------*/
function splitLines() {
    var carry = "";
    return new TransformStream({
        transform: function (chunk, controller) {
            var lines = (carry + chunk).split(/\r?\n/);
            carry = lines.pop();
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var l = lines_1[_i];
                controller.enqueue(l);
            }
        },
        flush: function (controller) {
            if (carry)
                controller.enqueue(carry);
        }
    });
}
