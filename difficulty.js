
  

// (() => {
//     const opInput = document.getElementById('op');
//     const angleInput = document.getElementById('angle');
//     const resultEl = document.getElementById('result');
  
//     document.getElementById('compute').addEventListener('click', () => {
//       const op = opInput.value.trim().toLowerCase();
//       const angleStr = angleInput.value.trim();
//       const deg = parseAngle(angleStr);
//       if (deg === null) {
//         resultEl.textContent = 'Invalid angle format.';
//         return;
//       }
//       if (!isGoodAngle(deg)) {
//         resultEl.textContent = 'Angle must be a multiple of 30°, 45°, or 60°.';
//         return;
//       }
//       const diff = classifyDifficulty(op, deg);
//       resultEl.textContent = `Difficulty: ${diff}`;
//     });
  
//     // ------------------ Math helpers ------------------ //
//     function parseAngle(str) {
//       if (!str) return null;
//       str = str.replace(/\s+/g, '');
  
//       // Patterns for radian inputs
//       const radFrac = /^([+-]?)(\d*)?(?:π|pi)\/(\d+)$/i;   // e.g. -3pi/4
//       const radWhole = /^([+-]?)(\d*)?(?:π|pi)$/i;           // e.g. 2pi, -π
  
//       if (radFrac.test(str)) {
//         const [, sign, numStr, denStr] = str.match(radFrac);
//         let num = parseInt(numStr || '1', 10);
//         if (sign === '-') num *= -1;
//         const den = parseInt(denStr, 10);
//         return (num / den) * 180;
//       }
  
//       if (radWhole.test(str)) {
//         const [, sign, numStr] = str.match(radWhole);
//         let num = parseInt(numStr || '1', 10);
//         if (sign === '-') num *= -1;
//         return num * 180;
//       }
  
//       // Degrees
//       const deg = parseFloat(str);
//       return isNaN(deg) ? null : deg;
//     }
  
//     function mod(x, m) {
//       return ((x % m) + m) % m;
//     }
  
//     function isMultiple(angle, divisor, tol = 1e-6) {
//       return Math.abs(mod(angle, divisor)) < tol;
//     }
  
//     function isGoodAngle(deg) {
//       const tol = 1e-6;
//       return isMultiple(deg, 30, tol) || isMultiple(deg, 45, tol) || isMultiple(deg, 60, tol);
//     }
  
//     function classifyDifficulty(op, deg) {
//       const canonical = mod(deg, 360); // map to [0,360)
//       const tol = 1e-6;
  
//       // 90° easy-angle override
//       let base;
//       if (isMultiple(canonical, 90, tol)) {
//         base = 1;
//       } else {
//         const steps = Math.floor(Math.abs(deg) / 90);
//         base = 1 + 0.5 * steps;
//       }
  
//       let bonus = 0;
//       if (['sec', 'csc', 'cot'].includes(op)) bonus += 1; // reciprocal bonus
//       if (isUndefined(op, canonical, tol)) bonus += 1;   // undefined bonus
  
//       // NEW: negative-angle bonus
//       if (deg < 0) bonus += 1;
  
//       return base + bonus;
//     }
  
//     function isUndefined(op, angle, tol) {
//       const cosZero = isMultiple(angle - 90, 180, tol); // where cos = 0
//       const sinZero = isMultiple(angle, 180, tol);      // where sin = 0
  
//       switch (op) {
//         case 'tan':
//         case 'sec':
//           return cosZero;
//         case 'csc':
//         case 'cot':
//           return sinZero;
//         default:
//           return false; // sin, cos always defined
//       }
//     }
//   })();
  

(() => {
    /* -------------------------------------------------
       SECTION 0: constants & helper utilities
    -------------------------------------------------*/
    const ops = ["sin","cos","tan","sec","csc","cot"];
    const sinBase = {0:"0",30:"1/2",45:"r2/2",60:"r3/2",90:"1"};
    const cosBase = {0:"1",30:"r3/2",45:"r2/2",60:"1/2",90:"0"};
    const tanBase = {0:"0",30:"r3/3",45:"1",60:"r3",90:"U"};
    // positive canonical → positive reciprocal string (already rationalised)
    const recipMap = {
      "0":"U",
      "1":"1",
      "1/2":"2",
      "2":"1/2",
      "r2/2":"r2",
      "r2":"r2/2",
      "r3/2":"2r3/3",
      "2r3/3":"r3/2",
      "r3/3":"r3",
      "r3":"r3/3"
    };
  
    const sqrtVals = {r2: Math.sqrt(2), r3: Math.sqrt(3)};
  
    const tol = 1e-6;
    const gcd = (a,b)=> b?gcd(b,a%b):Math.abs(a);
    const mod = (x,m)=> ((x%m)+m)%m;
    const isMultiple=(angle,div)=> Math.abs(mod(angle,div))<tol;
  
    /* -------------------------------------------------
       SECTION 1: value engine (exact strings)
    -------------------------------------------------*/
    function referenceAngle(deg){
      const a = mod(deg,360);
      if (a<=90) return a;
      if (a<=180) return 180-a;
      if (a<=270) return a-180;
      return 360-a;
    }
    function quadrant(deg){
      const a = mod(deg,360);
      if(a>=0 && a<90) return 1;
      if(a>=90 && a<180) return 2;
      if(a>=180 && a<270) return 3;
      return 4;
    }
    function applySign(str,negative){
      if(str==="0"||str==="U") return str;
      return negative?"-"+str:str;
    }
    function reciprocal(str){
      const neg = str.startsWith("-");
      const core = neg?str.slice(1):str;
      const rec = recipMap[core]||"U";
      if(rec==="U") return "U";
      return neg?applySign(rec,true):rec;
    }
    function trigExact(op,deg){
      const q = quadrant(deg);
      const ref = referenceAngle(deg);
      let base="U";
      const signSin = (q===3||q===4)?-1:1;
      const signCos = (q===2||q===3)?-1:1;
      const signTan = (q===2||q===4)?-1:1;
  
      switch(op){
        case "sin":
          base = sinBase[ref];
          return applySign(base, signSin===-1);
        case "cos":
          base = cosBase[ref];
          return applySign(base, signCos===-1);
        case "tan":
          base = tanBase[ref];
          return base==="U"?"U":applySign(base, signTan===-1);
        case "csc":{
          const s = trigExact("sin",deg);
          return reciprocal(s);
        }
        case "sec":{
          const c = trigExact("cos",deg);
          return reciprocal(c);
        }
        case "cot":{
          const t = trigExact("tan",deg);
          return reciprocal(t);
        }
        default:
          return "U";
      }
    }
  
    /* -------------------------------------------------
       SECTION 2: difficulty classifier (unchanged, with neg bonus)
    -------------------------------------------------*/
    function classifyDifficulty(op, deg) {
      const canonical = mod(deg, 360);
      let base;
      if (isMultiple(canonical, 90)) {
        base = 1;
      } else {
        const steps = Math.floor(Math.abs(deg) / 90);
        base = 1 + 0.5 * steps;
      }
      let bonus = 0;
      if (["sec","csc","cot"].includes(op)) bonus += 1;
      if (isUndefined(op, canonical)) bonus += 1;
      if (deg < 0) bonus += 1;
      return base + bonus;
    }
    function isUndefined(op, angle){
      const cosZero = isMultiple(angle-90,180);
      const sinZero = isMultiple(angle,180);
      switch(op){
        case "tan":
        case "sec": return cosZero;
        case "csc":
        case "cot": return sinZero;
        default: return false;
      }
    }
  
    /* -------------------------------------------------
       SECTION 3: build question bank
    -------------------------------------------------*/
    const angleSet = new Set();
    for(let d=-720; d<=720; d++){
      if(d%30===0 || d%45===0 || d%60===0) angleSet.add(d);
    }
    const angles=[...angleSet].sort((a,b)=>a-b);
  
    function degToRadStr(deg){
      if(deg===0) return "0";
      const sign = deg<0?"-":"";
      const num = Math.abs(deg);
      const den = 180;
      const g = gcd(num,den);
      const n = (num/g);
      const d = (den/g);
      if(d===1) return `${sign}${n===1?"":n}π`;
      return `${sign}${n===1?"":n}π/${d}`;
    }
    function levelFromDifficulty(diff){
      if(diff===1) return 1;
      if(diff===1.5) return 2;
      if(diff===2) return 3;
      if(diff===2.5) return 4;
      if(diff===3) return 5;
      if(diff===3.5) return 6;
      if(diff===4) return 7;
      if(diff===4.5) return 8;
      if(diff===5||diff===5.5) return 9;
      return 10; // diff 6 or 6.5
    }
  
    const bank=[];
    angles.forEach(deg=>{
      ops.forEach(op=>{
        const diff = classifyDifficulty(op,deg);
        const level = levelFromDifficulty(diff);
        const entry = {
          op,
          angleDeg: deg,
          angleDegStr: `${deg}°`,
          angleRadStr: degToRadStr(deg),
          answer: trigExact(op,deg),
          difficulty: diff,
          level
        };
        bank.push(entry);
      });
    });
  
    /* -------------------------------------------------
       SECTION 4: simple game engine
    -------------------------------------------------*/
    const levelSelect = document.getElementById('levelSelect');
    const startBtn = document.getElementById('startBtn');
    const gameDiv = document.getElementById('game');
    const questionP = document.getElementById('question');
    const answerInput = document.getElementById('answerInput');
    const submitBtn = document.getElementById('submitBtn');
    const feedbackP = document.getElementById('feedback');
  
    // populate level dropdown
    for(let i=1;i<=10;i++){
      const opt=document.createElement('option');
      opt.value=i;opt.textContent=`Level ${i}`;
      levelSelect.appendChild(opt);
    }
    let pool=[];
    let currentQ=null;
  
    startBtn.addEventListener('click',()=>{
      const lvl=parseInt(levelSelect.value,10);
      pool = bank.filter(q=>q.level===lvl);
      if(pool.length===0){
        alert('No questions for that level');
        return;
      }
      gameDiv.style.display='block';
      feedbackP.textContent='';
      nextQuestion();
    });
  
    submitBtn.addEventListener('click',()=>{
      if(!currentQ) return;
      const userAns = answerInput.value.trim().toLowerCase();
      const correct = currentQ.answer.toLowerCase();
      if(userAns===correct){
        feedbackP.textContent='Correct!';
        nextQuestion();
      }else{
        alert(`Incorrect. Correct answer is ${currentQ.answer}`);
        feedbackP.textContent='';
        answerInput.focus();
      }
    });
  
    function nextQuestion(){
      if(pool.length===0){
        alert('You have answered all questions for this level!');
        questionP.textContent='';
        gameDiv.style.display='none';
        return;
      }
      const idx=Math.floor(Math.random()*pool.length);
      currentQ=pool.splice(idx,1)[0];
      const showRad = Math.random()<0.5;
      const angleStr = showRad?currentQ.angleRadStr:currentQ.angleDegStr;
      questionP.textContent = `${currentQ.op}(${angleStr}) = ?`;
      answerInput.value='';
      answerInput.focus();
    }
  })();
  