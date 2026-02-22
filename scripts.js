const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");

let memory = 0;
let isMemorySet = false; // Biến kiểm tra xem có gì trong bộ nhớ không (kể cả số 0)
let angleMode = "deg"; // Mặc định là Degree (Độ), các giá trị: deg, rad, grad
let isNewCalculation = false; // Biến kiểm soát khi nhập số mới sau khi tính
let currentMode = "standard"; // Theo dõi chế độ hiện tại
let isSecondFunc = false; // Trạng thái nút 2nd
let isFE = false; // Trạng thái hiển thị F-E (Fixed-Exponent)
let isHyp = false; // Trạng thái nút Hyperbolic
let currentBase = 10; // Cơ số hiện tại cho Programmer Mode (10, 16, 8, 2)
let currentWordSize = 64; // Word size hiện tại cho Programmer Mode (32 hoặc 64)
const WORD_LABELS = { 64: "QWORD", 32: "DWORD", 16 : "WORD", 8: "BYTE" };
// --- LOGIC MENU & SWITCH MODE ---

function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("overlay").classList.toggle("active");
}

// Toggle menu Trigonometry
function toggleTrigMenu() {
    const menu = document.getElementById("trig-dropdown");
    menu.classList.toggle("active");
}

// Toggle menu Function
function toggleFuncMenu() {
    const menu = document.getElementById("func-dropdown");
    // Đóng menu Trig nếu đang mở
    document.getElementById("trig-dropdown").classList.remove("active");
    menu.classList.toggle("active");
}

function switchMode(mode, element) {
    currentMode = mode;
    // 1. Cập nhật UI Menu
    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
    if(element) element.classList.add("active");

    // 2. Ẩn tất cả các grid
    ["standard", "scientific", "programmer", "date", "graphing"].forEach(m => {
        const el = document.getElementById(`mode-${m}`);
        if (el) el.style.display = "none";
    });

    // Ẩn thanh công cụ khoa học và đóng menu dropdown mặc định
    const tb = document.getElementById("sci-toolbar");
    if (tb) tb.style.display = "none";
    document.getElementById("trig-dropdown").classList.remove("active");
    document.getElementById("func-dropdown").classList.remove("active");

    // 3. Xử lý logic từng mode
    const calc = document.getElementById("calculator");
    const title = document.getElementById("mode-title");

    if (mode === "standard") {
        document.getElementById("mode-standard").style.display = "grid";
        calc.classList.remove("wide-mode"); // Thu nhỏ
        title.innerText = "Standard";
    } 
    else if (mode === "scientific") {
        document.getElementById("mode-scientific").style.display = "grid";
        document.getElementById("sci-toolbar").style.display = "flex";
        calc.classList.add("wide-mode"); // Phình to
        title.innerText = "Scientific";

        // Cập nhật trạng thái nút Deg/Rad/Grad cho đúng với biến angleMode
        const btn = document.getElementById("btn-deg");
        const labels = { "deg": "DEG", "rad": "RAD", "grad": "GRAD" };
        if (btn) btn.innerText = labels[angleMode] || "DEG";
    }
    else if (mode === "programmer") {
        document.getElementById("mode-programmer").style.display = "block"; // Block vì chứa flex con
        calc.classList.add("wide-mode");
        title.innerText = "Programmer";
        setBase(10); // Reset về DEC
        updateProgrammerDisplay();
    }
    else if (mode === "date") {
        document.getElementById("mode-date").style.display = "flex";
        calc.classList.remove("wide-mode");
        title.innerText = "Date Calculation";
        // Set default dates
        document.getElementById("date-from").valueAsDate = new Date();
        document.getElementById("date-to").valueAsDate = new Date();
    }
    else if (mode === "graphing") {
        document.getElementById("mode-graphing").style.display = "flex";
        calc.classList.add("wide-mode");
        title.innerText = "Graphing";
        drawGraph(); // Vẽ mẫu
    }
    else {
        calc.classList.remove("wide-mode");
    }

    // 4. Reset màn hình khi đổi chế độ
    clearDisplay();
    
    // Reset trạng thái 2nd nếu đang bật để tránh lỗi hiển thị
    if (isSecondFunc) {
        toggleSecondFunc();
    }
    if (isHyp) {
        toggleHyp();
    }
    toggleMenu(); // Đóng menu
}

// --- LOGIC MÁY TÍNH ---

function appendToDisplay(value) {
    if (currentMode === "programmer") {
        // Nếu là toán tử thì cho phép nhập luôn, không cần kiểm tra giới hạn số
        const operators = ["+", "-", "×", "÷", "%", "(", ")", "<<", ">>", "&", "|", "^", "~"];
        if (operators.includes(value)) {
            // Fall through để append bình thường
        } else {
            if (value === ".") return;
            
            // Lấy số cuối cùng đang nhập để kiểm tra giới hạn
            let potentialText = (display.innerText === "0" || isNewCalculation) ? value : display.innerText + value;
            // Tách theo các toán tử để lấy token cuối cùng
            let parts = potentialText.split(/[\+\-\×\÷\%\(\)\<\>\&\|\^\~]/);
            let currentNumStr = parts[parts.length - 1];

            if (currentNumStr.length > 0) {
                try {
                    let nextVal = 0n;
                    if(currentBase === 10){
                        nextVal = BigInt(currentNumStr);
                        // Decimal là Signed Integer
                        let max = (1n << (BigInt(currentWordSize) - 1n)) - 1n; 
                        let min = -(1n << (BigInt(currentWordSize) - 1n));
                        if (nextVal > max || nextVal < min) return;
                    } else {
                        // Hex/Oct/Bin là Unsigned (Bits)
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
        
        // Nếu đang lỗi mà bấm dấu chấm (.) thì đổi thành "0."
        if (value === "." && display.innerText === "Error") {
            display.innerText = "0.";
        } 
        // Logic cũ cho dấu chấm
        else if (value === "." && !isNewCalculation) {
            display.innerText += value;
        } 
        // Nhập số bình thường -> Xóa Error đi thay bằng số mới
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
    
    // Nếu đang là biểu thức (vd: 5+5), hãy tính toán trước khi đổi dấu
    if (!isFinite(display.innerText)) {
        calculate();
    }
    if(currentMode === "programmer" && currentBase !== 10) return; // Không cho đổi dấu trong Programmer mode nếu không phải DEC{

    if(display.innerText.startsWith("-")) 
        display.innerText = display.innerText.substring(1);
    else if(display.innerText !== "0")
        display.innerText = "-" + display.innerText;
}

// Hàm tính toán nâng cao
// Helper: Nếu màn hình đang là biểu thức (vd: "5+5"), hãy tính nó trước khi áp dụng hàm
function ensureResultBeforeMath() {
    if (!isFinite(display.innerText)) {
        calculate();
    }
    // Nếu sau khi tính mà vẫn lỗi thì trả về false
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
    display.innerText = (v < 0) ? -Math.pow(-v, 1/3) : Math.pow(v, 1/3); // Xử lý căn bậc 3 số âm
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

        // Hàm hỗ trợ tính toán lượng giác theo Deg/Rad
        const toRad = (val) => {
            if (angleMode === "deg") return val * Math.PI / 180;
            if (angleMode === "grad") return val * Math.PI / 200;
            return val; // rad
        };

        const fromRad = (val) => {
            if (angleMode === "deg") return val * 180 / Math.PI;
            if (angleMode === "grad") return val * 200 / Math.PI;
            return val;
        };
        
        // Định nghĩa các hàm cục bộ để eval sử dụng
        const sin = (x) => Math.sin(toRad(x));
        const cos = (x) => Math.cos(toRad(x));
        const tan = (x) => Math.tan(toRad(x));
        const log = (x) => Math.log10(x);
        const ln = (x) => Math.log(x);
        const sqrt = (x) => Math.sqrt(x);
        const abs = (x) => Math.abs(x);
        const floor = (x) => Math.floor(x);
        const ceil = (x) => Math.ceil(x);
        
        // Hàm chuyển đổi DMS (Degree Minute Second)
        // Ví dụ: 12.5 -> 12.30 (12 độ 30 phút)
        const dms = (x) => {
            let sign = Math.sign(x);
            x = Math.abs(x);
            let d = Math.floor(x);
            let m = Math.floor((x - d) * 60);
            let s = ((x - d) * 60 - m) * 60;
            return sign * (d + m/100 + s/10000); 
        };
        // Hàm chuyển đổi DEG (Decimal Degree)
        // Ví dụ: 12.30 -> 12.5
        const deg = (x) => {
            let sign = Math.sign(x);
            x = Math.abs(x);
            let d = Math.floor(x);
            let m = Math.floor((x - d) * 100);
            let s = Math.round(((x - d) * 100 - m) * 100);
            return sign * (d + m/60 + s/3600);
        };

        // Hàm lượng giác ngược (kết quả trả về radian -> cần convert sang deg/grad)
        const asin = (x) => fromRad(Math.asin(x));
        const acos = (x) => fromRad(Math.acos(x));
        const atan = (x) => fromRad(Math.atan(x));
        const asec = (x) => fromRad(Math.acos(1/x)); // sec-1(x) = cos-1(1/x)
        const acsc = (x) => fromRad(Math.asin(1/x));
        const acot = (x) => fromRad(Math.atan(1/x));

        // Hàm Hyperbolic (không phụ thuộc deg/rad)
        const sinh = (x) => Math.sinh(x);
        const cosh = (x) => Math.cosh(x);
        const tanh = (x) => Math.tanh(x);
        const sech = (x) => 1 / Math.cosh(x);

        // Hàm Hyperbolic ngược
        const asinh = (x) => Math.asinh(x);
        const acosh = (x) => Math.acosh(x);
        const atanh = (x) => Math.atanh(x);
        const asech = (x) => Math.acosh(1/x);
        const acsch = (x) => Math.asinh(1/x);
        const acoth = (x) => Math.atanh(1/x);

        // Hàm thường khác
        const sec = (x) => 1 / Math.cos(toRad(x));
        const csc = (x) => 1 / Math.sin(toRad(x));
        const cot = (x) => 1 / Math.tan(toRad(x));
        
        // Thay thế ký tự toán học thành JS code
        // Lưu ý: Thay thế chuỗi dài trước (asinh) để tránh bị replace nhầm (sin)
        let expr = raw.replace(/÷/g, "/")
                      .replace(/×/g, "*")
                      .replace(/\^/g, "**")
                      .replace(/π/g, "Math.PI")
                      .replace(/𝑒/g, "Math.E") // Thay thế ký tự e in nghiêng thành hằng số
                      // KHÔNG replace chữ 'e' thường nữa để tránh lỗi với ceil, sec, exp...
                      // Hyperbolic & Inverse Hyperbolic
                      .replace(/asinh\(/g, "asinh(").replace(/acosh\(/g, "acosh(").replace(/atanh\(/g, "atanh(").replace(/asech\(/g, "asech(").replace(/acsch\(/g, "acsch(").replace(/acoth\(/g, "acoth(")
                      .replace(/sinh\(/g, "sinh(").replace(/cosh\(/g, "cosh(").replace(/tanh\(/g, "tanh(").replace(/sech\(/g, "sech(").replace(/csch\(/g, "csch(").replace(/coth\(/g, "coth(")
                      // Inverse Trig
                      .replace(/asin\(/g, "asin(").replace(/acos\(/g, "acos(").replace(/atan\(/g, "atan(").replace(/asec\(/g, "asec(").replace(/acsc\(/g, "acsc(").replace(/acot\(/g, "acot(")
                      // Standard Trig
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
                      // Xử lý random
                      .replace(/rand/g, "Math.random()")
                      // Xử lý custom operators cho 2nd mode
                      // yroot: 8 yroot 3 -> Math.pow(8, 1/3)
                      .replace(/(\d+(?:\.\d+)?) yroot (\d+(?:\.\d+)?)/g, "Math.pow($1, 1/$2)")
                      // logbase: 8 logbase 2 -> Math.log(8)/Math.log(2)
                      .replace(/(\d+(?:\.\d+)?) logbase (\d+(?:\.\d+)?)/g, "(Math.log($1)/Math.log($2))");


        // Xử lý phần trăm (%) trước: 50% -> 50/100
        expr = expr.replace(/%/g, "/100");

        // Xử lý mod (chia lấy dư)
        // Sau khi xử lý %, ta mới đổi mod thành % (toán tử JS)
        expr = expr.replace(/mod/g, "%");

        // Tự động đóng ngoặc nếu thiếu
        const openParens = (expr.match(/\(/g) || []).length;
        const closeParens = (expr.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            expr += ")".repeat(openParens - closeParens);
        }

        let result;
        if (currentMode === "scientific") {
            result = eval(expr);
        } else if (currentMode === "programmer") {
            // Xử lý riêng cho Programmer: Dùng eval với BigInt để hỗ trợ Bitwise (<<, >>, &, |...)
            // Tách chuỗi theo các toán tử để chèn 'n' vào sau số (tạo BigInt literal)
            // Regex: Tách giữ lại các toán tử: <<, >> hoặc các ký tự đơn + - * / % ( ) & | ^ ~
            let parts = expr.split(/(<<|>>|[+\-*\/%()&|^~])/);
            
            let processedExpr = parts.map(part => {
                let p = part.trim();
                if (!p) return "";
                // Nếu là toán tử thì giữ nguyên
                if (/^(<<|>>|[+\-*\/%()&|^~])$/.test(p)) return p;
                
                // Nếu là số, thêm 'n' và prefix (0x, 0o, 0b) nếu cần
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
            // Làm tròn kết quả nếu quá dài
            let finalRes = parseFloat(result.toPrecision(12));
            
            // Kiểm tra chế độ F-E
            if (isFE) {
                display.innerText = finalRes.toExponential();
            } else {
                // Chế độ Fixed: Cố gắng hiển thị dạng số thường cho số nhỏ (tránh 1e-7)
                if (Math.abs(finalRes) < 1e-6 && finalRes !== 0) {
                    display.innerText = finalRes.toFixed(20).replace(/\.?0+$/, "");
                } else {
                    display.innerText = finalRes.toString();
                }
            }

            isNewCalculation = true; // Đánh dấu đã tính xong
            
            addToHistory(raw, finalRes);

            if (currentMode === "programmer") {
                try {
                    let bigRes = BigInt(finalRes);
                    bigRes = BigInt.asIntN(currentWordSize, bigRes); // Áp dụng giới hạn word size  
                    display.innerText = bigRes.toString(currentBase).toUpperCase();
                }catch(e) {}
                updateProgrammerDisplay();
            }
        }
    } catch (e) {
        display.innerText = "Error";
    }
}

// Hàm tính toán từ trái sang phải cho Standard Mode
function evaluateStandard(expr) {
    let tokens = [];
    let currentNumber = "";
    
    for (let i = 0; i < expr.length; i++) {
        let char = expr[i];
        
        if (char === 'n' && currentMode === 'programmer') continue; 
        // Thêm các ký tự toán tử hiển thị trên màn hình (×, ÷)
        if ("+*/%×÷".includes(char)) {
            // Xử lý số mũ (Scientific Notation: 1e+5)
            if (char === '+' && (currentNumber.endsWith("e") || currentNumber.endsWith("E"))) {
                currentNumber += char;
                continue;
            }
            
            if (currentNumber !== "") {
                if(currentMode === 'programmer'){
                    // Parse BigInt theo base hiện tại
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
            // Xử lý số mũ (Scientific Notation: 1e-5)
            if (currentNumber.endsWith("e") || currentNumber.endsWith("E")) {
                currentNumber += char;
                continue;
            }
            
            // Dấu âm: nếu là đầu chuỗi hoặc sau toán tử khác thì là số âm
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
        // if (isNaN(val)) return NaN; // BigInt không check isNaN
        
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
    // Nếu memory khác 0 thì enable nút MC và MR
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
    isNewCalculation = true; // Để khi bấm số tiếp theo sẽ nhập mới
    // Đóng panel nếu đang mở để tiện nhìn kết quả
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
    
    // Các nút cần thay đổi
    const btnSquare = document.getElementById("btn-square");
    const btnSqrt = document.getElementById("btn-sqrt");
    const btnPower = document.getElementById("btn-power");
    const btn10x = document.getElementById("btn-10x");
    const btnLog = document.getElementById("btn-log");
    const btnLn = document.getElementById("btn-ln");

    updateTrigButtons(); // Cập nhật nhãn các nút sin/cos/tan

    if (isSecondFunc) {
        btn2nd.style.backgroundColor = "#0067c0";
        btn2nd.style.color = "white";
        if (btnTrig2nd) {
            btnTrig2nd.style.backgroundColor = "#0067c0";
            btnTrig2nd.style.color = "white";
        }

        // Thay đổi giao diện và chức năng
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

        // Trả về mặc định
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
        btnHyp.innerText = "hyp"; // Giữ nguyên text
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
    
    // Xác định tên hàm dựa trên trạng thái 2nd và Hyp
    if (isHyp) {
        funcName += "h"; // sin -> sinh
    }
    if (isSecondFunc) {
        // Nếu là inverse (2nd), thêm 'a' vào trước. 
        // Vd: sin -> asin, sinh -> asinh
        funcName = "a" + funcName;
    }
    
    appendToDisplay(funcName + "(");
    
    // Đóng menu sau khi chọn
    document.getElementById("trig-dropdown").classList.remove("active");
}

function mathFunc(type) {
    if (type === 'rand') {
        appendToDisplay(type); // rand không cần dấu ngoặc
    } else {
        appendToDisplay(type + "(");
    }
    // Đóng menu sau khi chọn
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
    // Hàm exp trong máy tính thường là nhập số mũ (Scientific Notation)
    // Ví dụ: 2E3 = 2000. Dùng E hoa để không bị replace nhầm bởi Math.E (e thường)
    appendToDisplay("E");
}

function toggleFE() {
    isFE = !isFE;
    const btn = document.getElementById("btn-fe");
    
    // Cập nhật giao diện nút (active state)
    if (isFE) btn.classList.add("active");
    else btn.classList.remove("active");

    // Cập nhật hiển thị ngay lập tức nếu đang có số trên màn hình
    if (display.innerText === "Error") return;
    
    // Nếu đang là biểu thức (vd: 5+5), tính toán trước để không bị mất dữ liệu
    if (!isFinite(display.innerText)) {
        calculate();
    }

    let val = parseFloat(display.innerText);
    if (!isNaN(val)) {
        if (isFE) {
            display.innerText = val.toExponential();
        } else {
            // Quay về dạng thường (Fixed)
            // Xử lý số quá nhỏ bị chuyển thành e- (vd: 1e-7 -> 0.0000001)
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
    
    // Update UI active class
    document.querySelectorAll(".radix-row").forEach(el => el.classList.remove("active"));
    if (base === 16) document.getElementById("radix-hex").classList.add("active");
    if (base === 10) document.getElementById("radix-dec").classList.add("active");
    if (base === 8) document.getElementById("radix-oct").classList.add("active");
    if (base === 2) document.getElementById("radix-bin").classList.add("active");
    let rawStr = display.innerText;
    let val = 0n;
    try {
        // Parse giá trị hiện tại về BigInt
        if (currentBase === 10) val = BigInt(rawStr);
        else {
            let prefix = currentBase === 16 ? "0x" : (currentBase === 8 ? "0o" : "0b");
            val = BigInt(prefix + rawStr);
        }
        
        // Hiển thị lại theo base mới
        if (base === 10) {
            // Dec hiển thị Signed
            val = BigInt.asIntN(currentWordSize, val);
            display.innerText = val.toString(10);
        } else {
            // Hex/Oct/Bin hiển thị Unsigned (Masked)
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
    
    // Refresh lại hiển thị để áp dụng mask mới
    setBase(currentBase); 
    updateProgrammerDisplay();
}

function updateProgrammerDisplay() {
    // Lấy giá trị hiện tại (đang hiển thị ở base nào đó)
    // Để đơn giản, ta giả sử người dùng nhập ở DEC, hoặc ta parse theo currentBase
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
        
        // Tính thêm tuần
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

    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Draw Axis
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); // X axis
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); // Y axis
    ctx.stroke();

    // Draw Function
    ctx.beginPath();
    ctx.strokeStyle = "#0067c0";
    ctx.lineWidth = 2;

    // Plotting: x đi từ -w/2 đến w/2
    // Scale: giả sử 1 đơn vị pixel = 1 đơn vị toán học (hoặc scale nhỏ lại)
    // Ta dịch gốc tọa độ về giữa (w/2, h/2)
    
    let started = false;
    for (let px = 0; px < w; px++) {
        // Chuyển pixel x sang tọa độ toán học x
        // Giả sử zoom level: 10px = 1 unit -> x_math = (px - w/2) / 10
        let x = (px - w/2) / 10;
        
        try {
            // Eval hàm số: thay 'x' bằng giá trị, các hàm sin/cos cần Math.
            // Lưu ý: Đây là eval đơn giản, không an toàn tuyệt đối nhưng đủ cho demo
            let evalStr = funcStr.replace(/x/g, `(${x})`)
                                 .replace(/sin/g, "Math.sin").replace(/cos/g, "Math.cos").replace(/tan/g, "Math.tan");
            let y = eval(evalStr);
            
            // Chuyển y toán học sang pixel y
            // y_pixel = h/2 - (y * 10) (Dấu trừ vì trục y canvas hướng xuống)
            let py = h/2 - (y * 10);

            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        } catch (e) {
            // Bỏ qua lỗi nếu hàm sai
        }
    }
    ctx.stroke();
}

// --- LOGIC LỊCH SỬ (HISTORY) ---

function toggleHistory() {
    const histPanel = document.getElementById("history-panel");
    const memPanel = document.getElementById("memory-panel");
    
    // Nếu Memory đang mở thì đóng lại
    if (memPanel) memPanel.classList.remove("active");
    
    histPanel.classList.toggle("active");
}

function toggleMemory() {
    const histPanel = document.getElementById("history-panel");
    const memPanel = document.getElementById("memory-panel");
    
    // Nếu History đang mở thì đóng lại
    if (histPanel) histPanel.classList.remove("active");
    
    memPanel.classList.toggle("active");
    renderMemory();
}

function renderMemory() {
    const list = document.getElementById("memory-list");
    if (!list) return;

    // Vì logic hiện tại chỉ lưu 1 biến memory, ta hiển thị nó như 1 item
    // Tái sử dụng class 'history-item' để có giao diện giống lịch sử
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
    
    // Click vào lịch sử để lấy lại giá trị
    item.onclick = function() {
        display.innerText = result;
        isNewCalculation = true; // Sửa lỗi: Đánh dấu để nhập số mới sẽ reset màn hình
        toggleHistory(); // Đóng bảng sau khi chọn
    };

    historyList.prepend(item); // Thêm vào đầu danh sách
}

function clearHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = '<p class="empty-msg">There\'s no history yet</p>';
}

// Đóng menu Trigonometry khi click ra ngoài
window.onclick = function(event) {
    // Đóng Trig menu
    if (!event.target.matches('#btn-trig-menu') && !event.target.closest('#trig-dropdown')) {
        const d = document.getElementById("trig-dropdown");
        if (d && d.classList.contains('active')) d.classList.remove('active');
    }
    // Đóng Func menu
    if (!event.target.matches('#btn-func-menu') && !event.target.closest('#func-dropdown')) {
        const d = document.getElementById("func-dropdown");
        if (d && d.classList.contains('active')) d.classList.remove('active');
    }
    // Logic đóng sidebar cũ
    if (event.target.matches('#overlay')) {
        toggleMenu();
    }
}

// --- HỖ TRỢ BÀN PHÍM (KEYBOARD SUPPORT) ---
document.addEventListener("keydown", function(event) {
    const key = event.key;

    // Số (0-9)
    if (/[0-9]/.test(key)) {
        appendToDisplay(key);
        return;
    }

    // Các phím chức năng
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
            event.preventDefault(); // Chặn tính năng tìm kiếm nhanh của Firefox
            appendToDisplay("÷");
            break;
        case ".":
        case ",":
            appendToDisplay(".");
            break;
        case "Enter":
        case "=":
            event.preventDefault(); // Chặn hành vi mặc định (như click nút đang focus)
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