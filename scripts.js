const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");

let memory = 0;
let isMemorySet = false;
let angleMode = "deg";
let isNewCalculation = false;
let currentMode = "standard";
let isSecondFunc = false;
let isFE = false;
let isHyp = false;
let currentBase = 10;
let currentWordSize = 64;
const WORD_LABELS = { 64: "QWORD", 32: "DWORD", 16 : "WORD", 8: "BYTE" };

// --- LOGIC MENU & SWITCH MODE ---

function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("overlay").classList.toggle("active");
}

function toggleTrigMenu() {
    const menu = document.getElementById("trig-dropdown");
    menu.classList.toggle("active");
}

function toggleFuncMenu() {
    const menu = document.getElementById("func-dropdown");
    document.getElementById("trig-dropdown").classList.remove("active");
    menu.classList.toggle("active");
}

function switchMode(mode, element) {
    currentMode = mode;
    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    if(element) element.classList.add("active");

    ["standard", "scientific", "programmer", "date", "graphing"].forEach(m => {
        const el = document.getElementById(`mode-${m}`);
        if (el) el.style.display = "none";
    });

    const tb = document.getElementById("sci-toolbar");
    if (tb) tb.style.display = "none";
    document.getElementById("trig-dropdown").classList.remove("active");
    document.getElementById("func-dropdown").classList.remove("active");

    const calc = document.getElementById("calculator");
    const title = document.getElementById("mode-title");

    if (mode === "standard") {
        document.getElementById("mode-standard").style.display = "grid";
        calc.classList.remove("wide-mode");
        title.innerText = "Standard";
    } 
    else if (mode === "scientific") {
        document.getElementById("mode-scientific").style.display = "grid";
        document.getElementById("sci-toolbar").style.display = "flex";
        calc.classList.add("wide-mode");
        title.innerText = "Scientific";

        const btn = document.getElementById("btn-deg");
        const labels = { "deg": "DEG", "rad": "RAD", "grad": "GRAD" };
        if (btn) btn.innerText = labels[angleMode] || "DEG";
    }
    else if (mode === "programmer") {
        document.getElementById("mode-programmer").style.display = "block";
        calc.classList.add("wide-mode");
        title.innerText = "Programmer";
        setBase(10);
        updateProgrammerDisplay();
    }
    else if (mode === "date") {
        document.getElementById("mode-date").style.display = "flex";
        calc.classList.remove("wide-mode");
        title.innerText = "Date Calculation";
        document.getElementById("date-from").valueAsDate = new Date();
        document.getElementById("date-to").valueAsDate = new Date();
    }
    else if (mode === "graphing") {
        document.getElementById("mode-graphing").style.display = "flex";
        calc.classList.add("wide-mode");
        title.innerText = "Graphing";
        drawGraph();
    }
    else {
        calc.classList.remove("wide-mode");
    }

    clearDisplay();
    
    if (isSecondFunc) {
        toggleSecondFunc();
    }
    if (isHyp) {
        toggleHyp();
    }
    toggleMenu();
}

// --- LOGIC MÁY TÍNH ---

function appendToDisplay(value) {
    if (currentMode === "programmer") {
        const operators = ["+", "-", "×", "÷", "%", "(", ")", "<<", ">>", "&", "|", "^", "~"];
        if (operators.includes(value)) {
        } else {
            if (value === ".") return;
            
            let potentialText = (display.innerText === "0" || isNewCalculation) ? value : display.innerText + value;
            let parts = potentialText.split(/[\+\-\×\÷\%\(\)\<\>\&\|\^\~]/);
            let currentNumStr = parts[parts.length - 1];

            if (currentNumStr.length > 0) {
                try {
                    let nextVal = 0n;
                    if(currentBase === 10){
                        nextVal = BigInt(currentNumStr);
                        let max = (1n << (BigInt(currentWordSize) - 1n)) - 1n; 
                        let min = -(1n << (BigInt(currentWordSize) - 1n));
                        if (nextVal > max || nextVal < min) return;
                    } else {
                        let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
                        nextVal = BigInt(prefix + currentNumStr);
                        let max = (1n << BigInt(currentWordSize)) - 1n; 
                        if(nextVal > max) return;
                    }
                } catch (e) { return; }
            }
        }
        if(isNewCalculation && !operators.includes(value)) display.innerText = "";
    }
    if (display.innerText === "0" || display.innerText === "Error" || isNewCalculation) {
        
        if (value === "." && display.innerText === "Error") {
            display.innerText = "0.";
        } 
        else if (value === "." && !isNewCalculation) {
            display.innerText += value;
        } 
        else {
            display.innerText = value;
        }

        if (currentMode === "programmer") {
            updateProgrammerDisplay();
        }
        
        isNewCalculation = false;
    } else {
        display.innerText += value;
    }
}

function clearDisplay() {
    display.innerText = "0";
    expressionDisplay.innerText = "";
    if (currentMode === "programmer") {
        updateProgrammerDisplay();
    }
}

function clearEntry() {
    display.innerText = "0";
}

function backspace() {
    if (display.innerText === "Error" || display.innerText === "Cannot divide by zero" || display.innerText === "Infinity") {
        display.innerText = "0";
        return; 
    }
    if (isNewCalculation) {
        display.innerText = "0";
        isNewCalculation = false;
        return;
    }
    display.innerText = display.innerText.slice(0, -1) || "0";
    if (currentMode === "programmer") {
        updateProgrammerDisplay();
    }
}

function toggleSign() {
    if (display.innerText === "Error") return;
    
    if (!isFinite(display.innerText)) {
        calculate();
    }
    if(currentMode === "programmer" && currentBase !== 10) return;

    if(display.innerText.startsWith("-")) 
        display.innerText = display.innerText.substring(1);
    else if(display.innerText !== "0")
        display.innerText = "-" + display.innerText;
}

function ensureResultBeforeMath() {
    if (!isFinite(display.innerText)) {
        calculate();
    }
    return display.innerText !== "Error";
}

function calculateSquare() {
    if (!ensureResultBeforeMath()) return;
    let v = parseFloat(display.innerText);
    display.innerText = Math.pow(v, 2);
    isNewCalculation = true;
}
function calculateSqrt() {
    if (!ensureResultBeforeMath()) return;
    let v = parseFloat(display.innerText);
    display.innerText = (v < 0) ? "Error" : Math.sqrt(v);
    isNewCalculation = true;
}
function calculateInverse() {
    if (!ensureResultBeforeMath()) return;
    let v = parseFloat(display.innerText);
    display.innerText = (v === 0) ? "Error" : 1/v;
    isNewCalculation = true;
}

// --- CÁC HÀM CHO CHẾ ĐỘ 2nd ---

function calculateCube() {
    if (!ensureResultBeforeMath()) return;
    let v = parseFloat(display.innerText);
    display.innerText = Math.pow(v, 3);
    isNewCalculation = true;
}
function calculateCbrt() {
    if (!ensureResultBeforeMath()) return;
    let v = parseFloat(display.innerText);
    display.innerText = (v < 0) ? -Math.pow(-v, 1/3) : Math.pow(v, 1/3);
    isNewCalculation = true;
}
function calculateTwoPowX() {
    appendToDisplay("2^");
}
function calculateEPowX() {
    appendToDisplay("𝑒^");
}

function calculate() {
    try {
        let raw = display.innerText;

        const toRad = (val) => {
            if (angleMode === "deg") return val * Math.PI / 180;
            if (angleMode === "grad") return val * Math.PI / 200;
            return val;
        };

        const fromRad = (val) => {
            if (angleMode === "deg") return val * 180 / Math.PI;
            if (angleMode === "grad") return val * 200 / Math.PI;
            return val;
        };
        
        const sin = (x) => Math.sin(toRad(x));
        const cos = (x) => Math.cos(toRad(x));
        const tan = (x) => Math.tan(toRad(x));
        const log = (x) => Math.log10(x);
        const ln = (x) => Math.log(x);
        const sqrt = (x) => Math.sqrt(x);
        const abs = (x) => Math.abs(x);
        const floor = (x) => Math.floor(x);
        const ceil = (x) => Math.ceil(x);
        
        const dms = (x) => {
            let sign = Math.sign(x);
            x = Math.abs(x);
            let d = Math.floor(x);
            let m = Math.floor((x - d) * 60);
            let s = ((x - d) * 60 - m) * 60;
            return sign * (d + m/100 + s/10000); 
        };

        const deg = (x) => {
            let sign = Math.sign(x);
            x = Math.abs(x);
            let d = Math.floor(x);
            let m = Math.floor((x - d) * 100);
            let s = Math.round(((x - d) * 100 - m) * 100);
            return sign * (d + m/60 + s/3600);
        };

        const asin = (x) => fromRad(Math.asin(x));
        const acos = (x) => fromRad(Math.acos(x));
        const atan = (x) => fromRad(Math.atan(x));
        const asec = (x) => fromRad(Math.acos(1/x));
        const acsc = (x) => fromRad(Math.asin(1/x));
        const acot = (x) => fromRad(Math.atan(1/x));

        const sinh = (x) => Math.sinh(x);
        const cosh = (x) => Math.cosh(x);
        const tanh = (x) => Math.tanh(x);
        const sech = (x) => 1 / Math.cosh(x);

        const asinh = (x) => Math.asinh(x);
        const acosh = (x) => Math.acosh(x);
        const atanh = (x) => Math.atanh(x);
        const asech = (x) => Math.acosh(1/x);
        const acsch = (x) => Math.asinh(1/x);
        const acoth = (x) => Math.atanh(1/x);

        const sec = (x) => 1 / Math.cos(toRad(x));
        const csc = (x) => 1 / Math.sin(toRad(x));
        const cot = (x) => 1 / Math.tan(toRad(x));
        
        let expr = raw.replace(/÷/g, "/")
                      .replace(/×/g, "*")
                      .replace(/\^/g, "**")
                      .replace(/π/g, "Math.PI")
                      .replace(/𝑒/g, "Math.E")
                      .replace(/asinh\(/g, "asinh(").replace(/acosh\(/g, "acosh(").replace(/atanh\(/g, "atanh(").replace(/asech\(/g, "asech(").replace(/acsch\(/g, "acsch(").replace(/acoth\(/g, "acoth(")
                      .replace(/sinh\(/g, "sinh(").replace(/cosh\(/g, "cosh(").replace(/tanh\(/g, "tanh(").replace(/sech\(/g, "sech(").replace(/csch\(/g, "csch(").replace(/coth\(/g, "coth(")
                      .replace(/asin\(/g, "asin(").replace(/acos\(/g, "acos(").replace(/atan\(/g, "atan(").replace(/asec\(/g, "asec(").replace(/acsc\(/g, "acsc(").replace(/acot\(/g, "acot(")
                      .replace(/sin\(/g, "sin(")
                      .replace(/cos\(/g, "cos(")
                      .replace(/tan\(/g, "tan(")
                      .replace(/sec\(/g, "sec(")
                      .replace(/csc\(/g, "csc(")
                      .replace(/cot\(/g, "cot(")
                      .replace(/log\(/g, "log(")
                      .replace(/ln\(/g, "ln(")
                      .replace(/√/g, "sqrt(")
                      .replace(/abs\(/g, "abs(")
                      .replace(/floor\(/g, "floor(")
                      .replace(/ceil\(/g, "ceil(")
                      .replace(/dms\(/g, "dms(")
                      .replace(/deg\(/g, "deg(")
                      .replace(/rand/g, "Math.random()")
                      .replace(/(\d+(?:\.\d+)?) yroot (\d+(?:\.\d+)?)/g, "Math.pow($1, 1/$2)")
                      .replace(/(\d+(?:\.\d+)?) logbase (\d+(?:\.\d+)?)/g, "(Math.log($1)/Math.log($2))");


        expr = expr.replace(/%/g, "/100");
        expr = expr.replace(/mod/g, "%");

        const openParens = (expr.match(/\(/g) || []).length;
        const closeParens = (expr.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            expr += ")".repeat(openParens - closeParens);
        }

        let result;
        if (currentMode === "scientific") {
            result = eval(expr);
        } else if (currentMode === "programmer") {
            let parts = expr.split(/(<<|>>|[+\-*\/%()&|^~])/);
            
            let processedExpr = parts.map(part => {
                let p = part.trim();
                if (!p) return "";
                if (/^(<<|>>|[+\-*\/%()&|^~])$/.test(p)) return p;
                
                try {
                    if (currentBase === 10) return p + "n";
                    else {
                        let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
                        return prefix + p + "n";
                    }
                } catch(e) { return p; }
            }).join("");
            
            result = eval(processedExpr);
        } else {
            result = evaluateStandard(expr);
        }
        
        if (!isFinite(result)) {
            display.innerText = "Error";
        } else {
            let finalRes = parseFloat(result.toPrecision(12));
            
            if (isFE) {
                display.innerText = finalRes.toExponential();
            } else {
                if (Math.abs(finalRes) < 1e-6 && finalRes !== 0) {
                    display.innerText = finalRes.toFixed(20).replace(/\.?0+$/, "");
                } else {
                    display.innerText = finalRes.toString();
                }
            }

            isNewCalculation = true;
            
            addToHistory(raw, finalRes);

            if (currentMode === "programmer") {
                try {
                    let bigRes = BigInt(finalRes);
                    bigRes = BigInt.asIntN(currentWordSize, bigRes);
                    display.innerText = bigRes.toString(currentBase).toUpperCase();
                }catch(e) {}
                updateProgrammerDisplay();
            }
        }
    } catch (e) {
        display.innerText = "Error";
    }
}

function evaluateStandard(expr) {
    let tokens = [];
    let currentNumber = "";
    
    for (let i = 0; i < expr.length; i++) {
        let char = expr[i];
        
        if (char === 'n' && currentMode === 'programmer') continue; 
        if ("+*/%×÷".includes(char)) {
            if (char === '+' && (currentNumber.endsWith("e") || currentNumber.endsWith("E"))) {
                currentNumber += char;
                continue;
            }
            
            if (currentNumber !== "") {
                if(currentMode === 'programmer'){
                    if (currentBase === 10) tokens.push(BigInt(currentNumber));
                    else {
                        let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
                        tokens.push(BigInt(prefix + currentNumber));
                    }
                }else{
                    tokens.push(parseFloat(currentNumber));
                }
                currentNumber = "";
            }
            tokens.push(char);
        } 
        else if (char === "-") {
            if (currentNumber.endsWith("e") || currentNumber.endsWith("E")) {
                currentNumber += char;
                continue;
            }
            
            if (currentNumber === "") {
                currentNumber += char;
            } else {
                if(currentMode === 'programmer'){
                    if (currentBase === 10) tokens.push(BigInt(currentNumber));
                    else {
                        let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
                        tokens.push(BigInt(prefix + currentNumber));
                    }
                }else{
                    tokens.push(parseFloat(currentNumber));
                }
                currentNumber = "";
                tokens.push(char);
            }
        } 
        else {
            currentNumber += char;
        }
    }
    if (currentNumber !== ""){
        if(currentMode === 'programmer'){
                    if (currentBase === 10) tokens.push(BigInt(currentNumber));
                    else {
                        let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
                        tokens.push(BigInt(prefix + currentNumber));
                    }
                }else{
                    tokens.push(parseFloat(currentNumber));
                }
    }
    
    if (tokens.length === 0) return 0;
    
    let result = tokens[0];
    for (let i = 1; i < tokens.length; i += 2) {
        let op = tokens[i];
        let val = tokens[i+1];
        
        if (op === '+') result += val;
        else if (op === '-') result -= val;
        else if (op === '*' || op === '×') result *= val;
        else if (op === '/' || op === '÷') result /= val;
        else if (op === '%') result %= val;
    }
    return result;
}

// --- LOGIC MEMORY (MC, MR, M+, M-, MS) ---

function updateMemoryButtons() {
    const hasMemory = isMemorySet;
    document.getElementById("btn-mc").disabled = !hasMemory;
    document.getElementById("btn-mr").disabled = !hasMemory;
    const btnMem = document.getElementById("btn-mem-dropdown");
    if (btnMem) btnMem.disabled = !hasMemory;
}

function memoryClear() {
    memory = 0;
    isMemorySet = false;
    updateMemoryButtons();
    renderMemory();
}

function memoryRecall() {
    display.innerText = memory;
    isNewCalculation = true;
    document.getElementById("memory-panel").classList.remove("active");
}

function memoryAdd() {
    if (!ensureResultBeforeMath()) return;
    memory += parseFloat(display.innerText || 0);
    isMemorySet = true;
    updateMemoryButtons();
    isNewCalculation = true;
    renderMemory();
}

function memorySubtract() {
    if (!ensureResultBeforeMath()) return;
    memory -= parseFloat(display.innerText || 0);
    isMemorySet = true;
    updateMemoryButtons();
    isNewCalculation = true;
    renderMemory();
}

function memoryStore() {
    if (!ensureResultBeforeMath()) return;
    memory = parseFloat(display.innerText || 0);
    isMemorySet = true;
    updateMemoryButtons();
    isNewCalculation = true;
    renderMemory();
}

// --- LOGIC SCIENTIFIC (KHOA HỌC) ---

function toggleDegRad() {
    const btn = document.getElementById("btn-deg");
    const modes = ["deg", "rad", "grad"];
    const labels = { "deg": "DEG", "rad": "RAD", "grad": "GRAD" };

    let currentIndex = modes.indexOf(angleMode);
    let nextIndex = (currentIndex + 1) % modes.length;
    
    angleMode = modes[nextIndex];
    btn.innerText = labels[angleMode];
}

function toggleSecondFunc() {
    isSecondFunc = !isSecondFunc;
    const btn2nd = document.getElementById("btn-2nd");
    const btnTrig2nd = document.getElementById("btn-trig-2nd");
    
    const btnSquare = document.getElementById("btn-square");
    const btnSqrt = document.getElementById("btn-sqrt");
    const btnPower = document.getElementById("btn-power");
    const btn10x = document.getElementById("btn-10x");
    const btnLog = document.getElementById("btn-log");
    const btnLn = document.getElementById("btn-ln");

    updateTrigButtons();

    if (isSecondFunc) {
        btn2nd.style.backgroundColor = "#0067c0";
        btn2nd.style.color = "white";
        if (btnTrig2nd) {
            btnTrig2nd.style.backgroundColor = "#0067c0";
            btnTrig2nd.style.color = "white";
        }

        btnSquare.innerHTML = "x<sup>3</sup>";
        btnSquare.onclick = calculateCube;

        btnSqrt.innerHTML = "<sup>3</sup>√x";
        btnSqrt.onclick = calculateCbrt;

        btnPower.innerHTML = "<sup>y</sup>√x";
        btnPower.onclick = function() { appendToDisplay(" yroot "); };

        btn10x.innerHTML = "2<sup>x</sup>";
        btn10x.onclick = calculateTwoPowX;

        btnLog.innerHTML = "log<sub>y</sub>x";
        btnLog.onclick = function() { appendToDisplay(" logbase "); };

        btnLn.innerHTML = "e<sup>x</sup>";
        btnLn.onclick = calculateEPowX;
    } else {
        btn2nd.style.backgroundColor = "";
        btn2nd.style.color = "";
        if (btnTrig2nd) {
            btnTrig2nd.style.backgroundColor = "";
            btnTrig2nd.style.color = "";
        }

        btnSquare.innerHTML = "x²";
        btnSquare.onclick = calculateSquare;

        btnSqrt.innerHTML = "²√x";
        btnSqrt.onclick = calculateSqrt;

        btnPower.innerHTML = "xʸ";
        btnPower.onclick = function() { appendToDisplay("^"); };

        btn10x.innerHTML = "10ˣ";
        btn10x.onclick = function() { appendToDisplay("10^"); };

        btnLog.innerHTML = "log";
        btnLog.onclick = function() { appendToDisplay("log("); };

        btnLn.innerHTML = "ln";
        btnLn.onclick = function() { appendToDisplay("ln("); };
    }
}

function toggleHyp() {
    isHyp = !isHyp;
    const btnHyp = document.getElementById("btn-hyp");
    
    if (isHyp) {
        btnHyp.style.backgroundColor = "#0067c0";
        btnHyp.style.color = "white";
        btnHyp.innerText = "hyp";
    } else {
        btnHyp.style.backgroundColor = "";
        btnHyp.style.color = "";
        btnHyp.innerText = "hyp";
    }
    updateTrigButtons();
}

function updateTrigButtons() {
    const btnSin = document.getElementById("btn-sin");
    const btnCos = document.getElementById("btn-cos");
    const btnTan = document.getElementById("btn-tan");
    const btnSec = document.getElementById("btn-sec");
    const btnCsc = document.getElementById("btn-csc");
    const btnCot = document.getElementById("btn-cot");

    if (isSecondFunc && isHyp) {
        btnSin.innerHTML = "sinh⁻¹"; btnCos.innerHTML = "cosh⁻¹"; btnTan.innerHTML = "tanh⁻¹"; 
        btnSec.innerHTML = "sech⁻¹"; btnCsc.innerHTML = "csch⁻¹"; btnCot.innerHTML = "coth⁻¹";
    } else if (isSecondFunc) {
        btnSin.innerHTML = "sin⁻¹"; btnCos.innerHTML = "cos⁻¹"; btnTan.innerHTML = "tan⁻¹"; 
        btnSec.innerHTML = "sec⁻¹"; btnCsc.innerHTML = "csc⁻¹"; btnCot.innerHTML = "cot⁻¹";
    } else if (isHyp) {
        btnSin.innerHTML = "sinh"; btnCos.innerHTML = "cosh"; btnTan.innerHTML = "tanh"; 
        btnSec.innerHTML = "sech"; btnCsc.innerHTML = "csch"; btnCot.innerHTML = "coth";
    } else {
        btnSin.innerHTML = "sin"; btnCos.innerHTML = "cos"; btnTan.innerHTML = "tan"; 
        btnSec.innerHTML = "sec"; btnCsc.innerHTML = "csc"; btnCot.innerHTML = "cot";
    }
}

function trigFunc(type) {
    let funcName = type;
    
    if (isHyp) {
        funcName += "h";
    }
    if (isSecondFunc) {
        funcName = "a" + funcName;
    }
    
    appendToDisplay(funcName + "(");
    
    document.getElementById("trig-dropdown").classList.remove("active");
}

function mathFunc(type) {
    if (type === 'rand') {
        appendToDisplay(type);
    } else {
        appendToDisplay(type + "(");
    }
    document.getElementById("func-dropdown").classList.remove("active");
}

function factorial() {
    if (!ensureResultBeforeMath()) return;
    let num = parseInt(display.innerText);
    if (num < 0) {
        display.innerText = "Error";
        return;
    }
    let result = 1;
    for (let i = 2; i <= num; i++) {
        result *= i;
    }
    display.innerText = result;
    isNewCalculation = true;
}

function expFunction() {
    appendToDisplay("E");
}

function toggleFE() {
    isFE = !isFE;
    const btn = document.getElementById("btn-fe");
    
    if (isFE) btn.classList.add("active");
    else btn.classList.remove("active");

    if (display.innerText === "Error") return;
    
    if (!isFinite(display.innerText)) {
        calculate();
    }

    let val = parseFloat(display.innerText);
    if (!isNaN(val)) {
        if (isFE) {
            display.innerText = val.toExponential();
        } else {
            if (Math.abs(val) < 1e-6 && val !== 0) {
                display.innerText = val.toFixed(20).replace(/\.?0+$/, "");
            } else {
                display.innerText = val.toString();
            }
        }
    }
}

// --- LOGIC PROGRAMMER MODE ---

function setBase(base) {
    currentBase = base;
    
    document.querySelectorAll(".radix-row").forEach(el => el.classList.remove("active"));
    if (base === 16) document.getElementById("radix-hex").classList.add("active");
    if (base === 10) document.getElementById("radix-dec").classList.add("active");
    if (base === 8) document.getElementById("radix-oct").classList.add("active");
    if (base === 2) document.getElementById("radix-bin").classList.add("active");
    let rawStr = display.innerText;
    let val = 0n;
    try {
        if (currentBase === 10) val = BigInt(rawStr);
        else {
            let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
            val = BigInt(prefix + rawStr);
        }
        
        if (base === 10) {
            val = BigInt.asIntN(currentWordSize, val);
            display.innerText = val.toString(10);
        } else {
            val = BigInt.asUintN(currentWordSize, val);
            display.innerText = val.toString(base).toUpperCase();
        }
    } catch(e) {
        display.innerText = "0";
    }
}

function toggleWordSize() {
    const sizes = [64, 32, 16, 8];
    let idx = sizes.indexOf(currentWordSize);
    currentWordSize = sizes[(idx + 1) % sizes.length];
    
    document.getElementById("btn-word-size").innerText = WORD_LABELS[currentWordSize];
    
    setBase(currentBase); 
    updateProgrammerDisplay();
}

function updateProgrammerDisplay() {
    let valStr = display.innerText;
    let val = 0n;
    try {
        if (currentBase === 10) val = BigInt(valStr);
        else {
            let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
            val = BigInt(prefix + valStr);
        }
    } catch(e) { val = 0n; }

    document.getElementById("val-hex").innerText = BigInt.asUintN(currentWordSize, val).toString(16).toUpperCase();
    document.getElementById("val-dec").innerText = BigInt.asIntN(currentWordSize, val).toString(10);
    document.getElementById("val-oct").innerText = BigInt.asUintN(currentWordSize, val).toString(8);
    document.getElementById("val-bin").innerText = BigInt.asUintN(currentWordSize, val).toString(2);
}

// --- LOGIC DATE CALCULATION ---

function calculateDateDiff() {
    const d1 = document.getElementById("date-from").valueAsDate;
    const d2 = document.getElementById("date-to").valueAsDate;
    const resDiv = document.getElementById("date-result");

    if (d1 && d2) {
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        const weeks = Math.floor(diffDays / 7);
        const daysLeft = diffDays % 7;
        
        let text = `${diffDays} days`;
        if (weeks > 0) {
            text += ` (${weeks} weeks, ${daysLeft} days)`;
        }
        resDiv.innerText = text;
    }
}

// --- LOGIC GRAPHING (SIMPLE) ---

function drawGraph() {
    const canvas = document.getElementById("graph-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const funcStr = document.getElementById("graph-func").value;

    ctx.clearRect(0, 0, w, h);
    
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#0067c0";
    ctx.lineWidth = 2;

    let started = false;
    for (let px = 0; px < w; px++) {
        let x = (px - w/2) / 10;
        
        try {
            let evalStr = funcStr.replace(/x/g, `(${x})`)
                                 .replace(/sin/g, "Math.sin").replace(/cos/g, "Math.cos").replace(/tan/g, "Math.tan");
            let y = eval(evalStr);
            
            let py = h/2 - (y * 10);

            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        } catch (e) {
        }
    }
    ctx.stroke();
}

// --- LOGIC LỊCH SỬ (HISTORY) ---

function toggleHistory() {
    const histPanel = document.getElementById("history-panel");
    const memPanel = document.getElementById("memory-panel");
    
    if (memPanel) memPanel.classList.remove("active");
    
    histPanel.classList.toggle("active");
}

function toggleMemory() {
    const histPanel = document.getElementById("history-panel");
    const memPanel = document.getElementById("memory-panel");
    
    if (histPanel) histPanel.classList.remove("active");
    
    memPanel.classList.toggle("active");
    renderMemory();
}

function renderMemory() {
    const list = document.getElementById("memory-list");
    if (!list) return;

    list.innerHTML = !isMemorySet ? '<p class="empty-msg">There\'s nothing saved in memory</p>' : 
        `<div class="history-item" onclick="memoryRecall()">
            <div class="hist-res" style="text-align: right; font-size: 1.5rem; font-weight: 600;">${memory}</div>
         </div>`;
}

function addToHistory(expression, result) {
    const historyList = document.getElementById("history-list");
    const emptyMsg = historyList.querySelector(".empty-msg");
    if (emptyMsg) {
        emptyMsg.remove();
    }

    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
        <div class="hist-expr">${expression} =</div>
        <div class="hist-res">${result}</div>
    `;
    
    item.onclick = function() {
        display.innerText = result;
        isNewCalculation = true;
        toggleHistory();
    };

    historyList.prepend(item);
}

function clearHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = '<p class="empty-msg">There\'s no history yet</p>';
}

window.onclick = function(event) {
    if (!event.target.matches('#btn-trig-menu') && !event.target.closest('#trig-dropdown')) {
        const d = document.getElementById("trig-dropdown");
        if (d && d.classList.contains('active')) d.classList.remove('active');
    }
    if (!event.target.matches('#btn-func-menu') && !event.target.closest('#func-dropdown')) {
        const d = document.getElementById("func-dropdown");
        if (d && d.classList.contains('active')) d.classList.remove('active');
    }
    if (event.target.matches('#overlay')) {
        toggleMenu();
    }
}

// --- HỖ TRỢ BÀN PHÍM (KEYBOARD SUPPORT) ---

document.addEventListener("keydown", function(event) {
    const key = event.key;

    if (/[0-9]/.test(key)) {
        appendToDisplay(key);
        return;
    }

    switch (key) {
        case "+":
            appendToDisplay("+");
            break;
        case "-":
            appendToDisplay("-");
            break;
        case "*":
            appendToDisplay("×");
            break;
        case "/":
            event.preventDefault();
            appendToDisplay("÷");
            break;
        case ".":
        case ",":
            appendToDisplay(".");
            break;
        case "Enter":
        case "=":
            event.preventDefault();
            calculate();
            break;
        case "Backspace":
            backspace();
            break;
        case "Escape":
            clearDisplay();
            break;
        case "Delete":
            clearEntry();
            break;
        case "%":
            appendToDisplay("%");
            break;
        case "^":
            appendToDisplay("^");
            break;
        case "(":
            appendToDisplay("(");
            break;
        case ")":
            appendToDisplay(")");
            break;
    }
});