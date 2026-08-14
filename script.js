// ===== العناصر الأساسية =====
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== عناصر الأزرار والنتائج =====
const copyBtn = document.getElementById('copyBtn');
const copyImageBtn = document.getElementById('copyImageBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportQuality = document.getElementById('exportQuality');
const copyMsg = document.getElementById('copyMsg');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const extractBtn = document.getElementById('extractBtn');
const ocrStatus = document.getElementById('ocrStatus');
const ocrResult = document.getElementById('ocrResult');
const copyOcrBtn = document.getElementById('copyOcrBtn');
const fontSelect = document.getElementById('fontSelect');
const analyzeFontBtn = document.getElementById('analyzeFontBtn');
const fontMatchStatus = document.getElementById('fontMatchStatus');
const fontMatchResults = document.getElementById('fontMatchResults');
const altLetterHint = document.getElementById('altLetterHint');

function showMessage(text) {
    copyMsg.textContent = text;
    copyMsg.classList.add('show');
    setTimeout(() => copyMsg.classList.remove('show'), 2000);
}

// ===== حروف بأشكال بديلة قابلة للتبديل (متاح مع خط ثلث أموشرف فقط) =====
// النتيجة مبنية على فحص فعلي لملفات الخطوط: هذا الخط وحده فيه شكل بديل
// حقيقي (عبر خاصية OpenType ss01) لهذه الحروف. باقي خطوط المكتبة ما فيها
// أي أشكال بديلة مدمجة، فما نقدر نوفّر الميزة لها.
const ALT_GLYPH_FONT_FAMILY = 'AmoshrefThuluth';
const ALT_GLYPH_CHARS = new Set(['س', 'ص', 'ق', 'ل', 'م', 'ن', 'و', 'ي']);

function isAltGlyphFontActive() {
    return fontSelect.value.includes(ALT_GLYPH_FONT_FAMILY);
}

function updateAltHint() {
    altLetterHint.style.display = isAltGlyphFontActive() ? 'block' : 'none';
}

// إعادة بناء منطقة العرض: الحروف اللي عندها شكل بديل تُغلَّف بـ <span>
// قابلة للنقر، وباقي النص يبقى نص عادي
function renderOutput(text) {
    const altActive = isAltGlyphFontActive();
    const frag = document.createDocumentFragment();
    let buffer = '';

    function flushBuffer() {
        if (buffer) {
            frag.appendChild(document.createTextNode(buffer));
            buffer = '';
        }
    }

    for (const ch of text) {
        if (altActive && ALT_GLYPH_CHARS.has(ch)) {
            flushBuffer();
            const span = document.createElement('span');
            span.className = 'alt-letter';
            span.textContent = ch;
            frag.appendChild(span);
        } else {
            buffer += ch;
        }
    }
    flushBuffer();

    outputText.innerHTML = '';
    outputText.appendChild(frag);
    updateAltHint();
}

outputText.addEventListener('click', function (e) {
    const span = e.target.closest('.alt-letter');
    if (span) {
        span.classList.toggle('alt-active');
    }
});

// ===== تحديث فوري أثناء الكتابة =====
inputText.addEventListener('input', function () {
    renderOutput(this.value);
});

// ===== إضافة علامة تشكيل في مكان المؤشر =====
function addTashkeel(mark) {
    const start = inputText.selectionStart;
    const end = inputText.selectionEnd;
    const value = inputText.value;
    inputText.value = value.slice(0, start) + mark + value.slice(end);
    inputText.selectionStart = inputText.selectionEnd = start + mark.length;
    inputText.focus();
    renderOutput(inputText.value);
}

// ===== تغيير نمط الخط (مع تلاشٍ سلس بدل التبديل الفجائي) =====
function changeFont() {
    if (prefersReducedMotion) {
        outputText.style.fontFamily = fontSelect.value;
        renderOutput(inputText.value);
        return;
    }
    outputText.classList.add('font-fade-out');
    setTimeout(() => {
        outputText.style.fontFamily = fontSelect.value;
        renderOutput(inputText.value);
        outputText.classList.remove('font-fade-out');
    }, 180);
}

// ===== تغيير حجم الخط =====
function changeSize() {
    const size = document.getElementById('fontSize').value;
    outputText.style.fontSize = size + 'px';
    document.getElementById('sizeValue').textContent = size + 'px';
}

// ===== 1) نسخ النص المُنسّق كنص =====
copyBtn.addEventListener('click', function () {
    const text = outputText.textContent;
    if (!text.trim()) return;

    navigator.clipboard.writeText(text).then(() => {
        showMessage('تم نسخ النص ✅');
    }).catch(() => {
        showMessage('فشل نسخ النص');
    });
});

// ===== 2) نسخ النص المُنسّق كصورة =====
copyImageBtn.addEventListener('click', function () {
    if (!outputText.textContent.trim()) return;

    html2canvas(outputText, {
        backgroundColor: '#ffffff',
        scale: Number(exportQuality.value)
    }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                showMessage('تم نسخ الصورة ✅');
            }).catch(err => {
                showMessage('فشل نسخ الصورة');
                console.error(err);
            });
        });
    });
});

// ===== 2ب) تصدير النص المُنسّق كملف PDF جاهز للطباعة =====
exportPdfBtn.addEventListener('click', function () {
    if (!outputText.textContent.trim()) return;

    html2canvas(outputText, {
        backgroundColor: '#ffffff',
        scale: Number(exportQuality.value)
    }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const w = canvas.width;
        const h = canvas.height;
        const doc = new jsPDF({
            orientation: w > h ? 'landscape' : 'portrait',
            unit: 'px',
            format: [w, h]
        });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
        doc.save('arabic-calligraphy.pdf');
        showMessage('تم تصدير PDF ✅');
    }).catch(err => {
        showMessage('فشل تصدير PDF');
        console.error(err);
    });
});

// ===== 3) معاينة الصورة المختارة =====
imageInput.addEventListener('change', function () {
    const file = imageInput.files[0];
    if (!file) {
        imagePreview.style.display = 'none';
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // صورة جديدة تعني إن أي نص مستخرج أو تحليل خط سابق ما عاد صالح
    ocrResult.value = '';
    ocrStatus.textContent = '';
    fontMatchResults.innerHTML = '';
    fontMatchStatus.textContent = '';
});

// ===== 4) استخراج نص عربي من صورة (بدون تشكيل) =====
const TASHKEEL_PATTERN = new RegExp(
    '[' + String.fromCharCode(0x064B) + '-' + String.fromCharCode(0x065F) + String.fromCharCode(0x0670) + ']',
    'g'
);

function recognizeText(file, onProgress) {
    return Tesseract.recognize(
        file,
        'ara',
        {
            logger: m => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(Math.round(m.progress * 100));
                }
            }
        }
    ).then(({ data: { text } }) => text.replace(TASHKEEL_PATTERN, '').trim());
}

extractBtn.addEventListener('click', function () {
    const file = imageInput.files[0];
    if (!file) {
        ocrStatus.textContent = 'الرجاء اختيار صورة أولاً';
        return;
    }

    ocrStatus.textContent = 'جاري تحليل الصورة... قد يستغرق بضع ثوانٍ';
    ocrResult.value = '';
    extractBtn.disabled = true;

    recognizeText(file, pct => {
        ocrStatus.textContent = `جاري التعرف... ${pct}%`;
    }).then(cleanedText => {
        ocrResult.value = cleanedText;
        ocrStatus.textContent = 'تم الاستخراج ✅';
        extractBtn.disabled = false;
    }).catch(err => {
        ocrStatus.textContent = 'حدث خطأ أثناء التحليل';
        console.error(err);
        extractBtn.disabled = false;
    });
});

// ===== 5) نسخ النص المستخرج من الصورة =====
copyOcrBtn.addEventListener('click', function () {
    const text = ocrResult.value;
    if (!text.trim()) {
        ocrStatus.textContent = 'لا يوجد نص لنسخه';
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        ocrStatus.textContent = 'تم نسخ النص المستخرج ✅';
    }).catch(() => {
        ocrStatus.textContent = 'فشل نسخ النص';
    });
});

// ===== 6) تحليل نوع الخط من الصورة =====
// مكتبة الخطوط القابلة للمطابقة: كل خطوط الموقع المتاحة بقائمة الاختيار.
// cssValue لازم يطابق بالضبط قيمة value لعنصر <option> المقابل بـ index.html
// حتى تشتغل fontSelect.value = cssValue صح.
const FONT_MATCH_LIBRARY = [
    { name: 'الثلث الكلاسيكي', family: 'ThuluthClassic', cssValue: "'ThuluthClassic', serif" },
    { name: 'ثلث أموشرف', family: 'AmoshrefThuluth', cssValue: "'AmoshrefThuluth', serif" },
    { name: 'ديكوتايب ثلث II', family: 'DecotypeThuluthII', cssValue: "'DecotypeThuluthII', serif" },
    { name: 'ديكوتايب ثلث III', family: 'DecotypeThuluthIII', cssValue: "'DecotypeThuluthIII', serif" },
    { name: 'جي إي ثلث خفيف', family: 'GEThuluthLight', cssValue: "'GEThuluthLight', serif" },
    { name: 'ياسمين تايبو', family: 'JassminTypo', cssValue: "'JassminTypo', serif" },
    { name: 'كاتبة', family: 'Katibeh', cssValue: "'Katibeh', serif" },
    { name: 'عارف رقعة', family: 'Aref Ruqaa', cssValue: "'Aref Ruqaa', serif" },
    { name: 'ريم كوفي', family: 'Reem Kufi', cssValue: "'Reem Kufi', sans-serif" },
    { name: 'أميري', family: 'Amiri', cssValue: "'Amiri', serif" },
    { name: 'نسخ (Noto Naskh)', family: 'Noto Naskh Arabic', cssValue: "'Noto Naskh Arabic', serif" },
    { name: 'كوفي (Noto Kufi)', family: 'Noto Kufi Arabic', cssValue: "'Noto Kufi Arabic', sans-serif" },
    { name: 'مركزي', family: 'Markazi Text', cssValue: "'Markazi Text', serif" },
    { name: 'المسيري', family: 'El Messiri', cssValue: "'El Messiri', serif" },
    { name: 'رقاص', family: 'Rakkas', cssValue: "'Rakkas', serif" },
    { name: 'ليمونادة', family: 'Lemonada', cssValue: "'Lemonada', serif" },
    { name: 'القاهرة', family: 'Cairo', cssValue: "'Cairo', sans-serif" },
    { name: 'تجوال', family: 'Tajawal', cssValue: "'Tajawal', sans-serif" },
];

const MATCH_WIDTH = 260;
const MATCH_HEIGHT = 70;

// تحويل صورة (Canvas) إلى قيم تدرج رمادي
function getGrayscaleData(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const gray = new Float64Array(width * height);
    for (let i = 0; i < gray.length; i++) {
        const r = imgData.data[i * 4];
        const g = imgData.data[i * 4 + 1];
        const b = imgData.data[i * 4 + 2];
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return gray;
}

// إيجاد أفضل حد فاصل بين الحبر والخلفية بطريقة Otsu
function otsuThreshold(gray) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i++) {
        histogram[Math.round(gray[i])]++;
    }
    const total = gray.length;
    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * histogram[t];

    let sumB = 0, wB = 0, maxVar = 0, threshold = 127;
    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        const wF = total - wB;
        if (wF === 0) break;
        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const varBetween = wB * wF * (mB - mF) * (mB - mF);
        if (varBetween > maxVar) {
            maxVar = varBetween;
            threshold = t;
        }
    }
    return threshold;
}

// تحويل التدرج الرمادي لصورة ثنائية (1 = حبر/غامق، 0 = خلفية)
function binarize(gray, threshold) {
    const bin = new Uint8Array(gray.length);
    for (let i = 0; i < gray.length; i++) {
        bin[i] = gray[i] < threshold ? 1 : 0;
    }
    return bin;
}

// أصغر مربع محيط بكل بكسلات الحبر
function getInkBoundingBox(bin, width, height) {
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (bin[y * width + x]) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) return null;
    return { minX, minY, maxX, maxY };
}

// تحويل أي Canvas (صورة مصدر أو نص مرسوم بخط معيّن) لبصمة ثنائية موحّدة الحجم
// عشان تصير المقارنة بين مصدرين مختلفين ممكنة
function toNormalizedBitmap(sourceCanvas) {
    const { width, height } = sourceCanvas;
    const ctx = sourceCanvas.getContext('2d');
    const gray = getGrayscaleData(ctx, width, height);
    const threshold = otsuThreshold(gray);
    const bin = binarize(gray, threshold);
    const box = getInkBoundingBox(bin, width, height);
    if (!box) return null;

    const pad = 4;
    const cropX = Math.max(0, box.minX - pad);
    const cropY = Math.max(0, box.minY - pad);
    const cropW = Math.min(width, box.maxX + pad) - cropX;
    const cropH = Math.min(height, box.maxY + pad) - cropY;

    const resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = MATCH_WIDTH;
    resizeCanvas.height = MATCH_HEIGHT;
    const rctx = resizeCanvas.getContext('2d');
    rctx.fillStyle = '#fff';
    rctx.fillRect(0, 0, MATCH_WIDTH, MATCH_HEIGHT);
    rctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, MATCH_WIDTH, MATCH_HEIGHT);

    const finalGray = getGrayscaleData(rctx, MATCH_WIDTH, MATCH_HEIGHT);
    const finalThreshold = otsuThreshold(finalGray);
    return binarize(finalGray, finalThreshold);
}

// نسبة تطابق بكسلات بين بصمتين بنفس الحجم
function bitmapSimilarity(a, b) {
    let matches = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) matches++;
    }
    return matches / a.length;
}

// تحويل ملف الصورة المرفوع لـ Canvas بحجم معقول للمعالجة (مباشرة من الملف
// وليس من عنصر <img> المعاينة، حتى لا يعتمد التحليل على انتهاء تحميل
// المعاينة أولاً)
async function imageFileToCanvas(file, maxDim = 900) {
    const bitmap = await createImageBitmap(file);
    const naturalW = bitmap.width;
    const naturalH = bitmap.height;
    const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
    const w = Math.max(1, Math.round(naturalW * scale));
    const h = Math.max(1, Math.round(naturalH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas;
}

// رسم نص بخط معيّن على Canvas عشان نقارنه بالصورة المصدر
function renderTextCanvas(text, fontFamily, width = 900, height = 220, fontSize = 110) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillText(text, width / 2, height / 2);
    return canvas;
}

async function ensureFontLoaded(fontFamily, fontSize = 110) {
    try {
        await document.fonts.load(`${fontSize}px "${fontFamily}"`);
    } catch (err) {
        // إذا فشل التحميل، الرسم بيستخدم خط بديل ودرجة التشابه بتنعكس تلقائيًا لأسفل
        console.warn('font load failed:', fontFamily, err);
    }
}

function renderFontMatchResults(results) {
    fontMatchResults.innerHTML = '';
    results.forEach((r, i) => {
        const li = document.createElement('li');
        if (i === 0) li.classList.add('top-match');

        const info = document.createElement('span');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-match-name';
        nameSpan.textContent = r.name;
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'font-match-score';
        scoreSpan.textContent = `${Math.round(r.score * 100)}٪ تشابه`;
        info.appendChild(nameSpan);
        info.appendChild(document.createTextNode(' '));
        info.appendChild(scoreSpan);

        const useBtn = document.createElement('button');
        useBtn.type = 'button';
        useBtn.className = 'copy-btn font-match-use-btn';
        useBtn.textContent = 'استخدم هذا الخط';
        useBtn.addEventListener('click', () => useMatchedFont(r.cssValue, r.text));

        li.appendChild(info);
        li.appendChild(useBtn);
        fontMatchResults.appendChild(li);
    });
}

// تطبيق الخط المطابَق على أداة الكتابة الرئيسية بالموقع
function useMatchedFont(cssValue, text) {
    fontSelect.value = cssValue;
    if (text) {
        inputText.value = text;
    }
    changeFont();
    showMessage('تم تطبيق الخط المطابق ✅');
    inputText.focus();
}

async function analyzeFontFromImage() {
    const file = imageInput.files[0];
    if (!file) {
        fontMatchStatus.textContent = 'الرجاء اختيار صورة أولاً';
        return;
    }

    analyzeFontBtn.disabled = true;
    fontMatchResults.innerHTML = '';
    fontMatchStatus.textContent = 'جاري تجهيز النص من الصورة...';

    try {
        let text = ocrResult.value.trim();
        if (!text) {
            text = await recognizeText(file, pct => {
                fontMatchStatus.textContent = `جاري استخراج النص... ${pct}%`;
            });
            ocrResult.value = text;
        }

        if (!text) {
            fontMatchStatus.textContent = 'تعذّر العثور على نص واضح بالصورة';
            return;
        }

        fontMatchStatus.textContent = 'جاري تحليل شكل الحروف ومقارنتها بمكتبة الخطوط...';

        const sourceCanvas = await imageFileToCanvas(file);
        const sourceBitmap = toNormalizedBitmap(sourceCanvas);

        if (!sourceBitmap) {
            fontMatchStatus.textContent = 'تعذّر تمييز الحبر عن الخلفية بهذه الصورة، جرّب صورة أوضح';
            return;
        }

        const scored = [];
        for (const font of FONT_MATCH_LIBRARY) {
            await ensureFontLoaded(font.family);
            const renderCanvas = renderTextCanvas(text, font.family);
            const renderBitmap = toNormalizedBitmap(renderCanvas);
            if (!renderBitmap) continue;
            const score = bitmapSimilarity(sourceBitmap, renderBitmap);
            scored.push({ ...font, score, text });
        }

        if (!scored.length) {
            fontMatchStatus.textContent = 'تعذّر إجراء المقارنة، حاول مرة أخرى';
            return;
        }

        scored.sort((a, b) => b.score - a.score);
        renderFontMatchResults(scored.slice(0, 3));
        fontMatchStatus.textContent = 'تم التحليل ✅';
    } catch (err) {
        console.error(err);
        fontMatchStatus.textContent = 'حدث خطأ أثناء تحليل الخط';
    } finally {
        analyzeFontBtn.disabled = false;
    }
}

analyzeFontBtn.addEventListener('click', analyzeFontFromImage);

// ===== 7) محرر تصميم الحروف الحر (مسار متجهات حقيقي عبر opentype.js) =====
// ملاحظة: يعرض شكل حرف منفرد فقط كما هو مخزّن بملف الخط، بدون محرك ربط
// تلقائي بين الحروف — هذا يحتاج بيانات ومحرك مخصصين غير متوفرين هنا.
const vectorFontSelect = document.getElementById('vectorFontSelect');
const vectorLetterSelect = document.getElementById('vectorLetterSelect');
const loadVectorBtn = document.getElementById('loadVectorBtn');
const suggestShapesBtn = document.getElementById('suggestShapesBtn');
const resetVectorBtn = document.getElementById('resetVectorBtn');
const vectorEditorSvg = document.getElementById('vectorEditorSvg');
const exportVectorSvgBtn = document.getElementById('exportVectorSvgBtn');
const exportVectorPngBtn = document.getElementById('exportVectorPngBtn');
const vectorEditorStatus = document.getElementById('vectorEditorStatus');
const shapeSuggestions = document.getElementById('shapeSuggestions');
const shapeSuggestionsStatus = document.getElementById('shapeSuggestionsStatus');

const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
vectorLetterSelect.innerHTML = '<option value="">النص المكتوب أعلاه</option>' +
    ARABIC_LETTERS.map(l => `<option value="${l}">${l}</option>`).join('');

let vectorCommands = null;
const vectorFontCache = new Map();

async function loadOpentypeFont(url) {
    if (vectorFontCache.has(url)) return vectorFontCache.get(url);
    const buffer = await fetch(url).then(r => r.arrayBuffer());
    const font = opentype.parse(buffer);
    vectorFontCache.set(url, font);
    return font;
}

function commandsToPathData(commands) {
    return commands.map(c => {
        if (c.type === 'M') return `M ${c.x} ${c.y}`;
        if (c.type === 'L') return `L ${c.x} ${c.y}`;
        if (c.type === 'C') return `C ${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
        if (c.type === 'Q') return `Q ${c.x1} ${c.y1} ${c.x} ${c.y}`;
        return 'Z';
    }).join(' ');
}

function vectorPathBounds(commands) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of commands) {
        for (const [xk, yk] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
            if (c[xk] !== undefined) {
                minX = Math.min(minX, c[xk]); maxX = Math.max(maxX, c[xk]);
                minY = Math.min(minY, c[yk]); maxY = Math.max(maxY, c[yk]);
            }
        }
    }
    return { minX, minY, maxX, maxY };
}

function vectorViewBox(commands) {
    const { minX, minY, maxX, maxY } = vectorPathBounds(commands);
    const pad = Math.max((maxX - minX), (maxY - minY)) * 0.15 || 20;
    return {
        x: minX - pad,
        y: minY - pad,
        w: (maxX - minX) + pad * 2,
        h: (maxY - minY) + pad * 2
    };
}

function addVectorHandle(cmdIndex, xk, yk, radius, isControl) {
    const c = vectorCommands[cmdIndex];
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', c[xk]);
    circle.setAttribute('cy', c[yk]);
    circle.setAttribute('r', radius);
    circle.setAttribute('class', 'vector-handle');
    if (isControl) circle.style.fillOpacity = '0.6';
    circle.dataset.cmdIndex = cmdIndex;
    circle.dataset.xk = xk;
    circle.dataset.yk = yk;
    circle.addEventListener('pointerdown', startVectorDrag);
    vectorEditorSvg.appendChild(circle);
}

function renderVectorEditor() {
    const vb = vectorViewBox(vectorCommands);
    vectorEditorSvg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    vectorEditorSvg.innerHTML = '';

    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('class', 'vector-path');
    pathEl.setAttribute('d', commandsToPathData(vectorCommands));
    vectorEditorSvg.appendChild(pathEl);

    // نعرض فقط نقاط الرسو (على المسار) ونخفي مقابض التحكم الوسيطة لمنحنيات
    // Bezier — تقليل عدد النقاط القابلة للسحب يجعل التعديل أسرع وأقل عرضة
    // لتشويه شكل الحرف بسحب مقبض تحكم بالخطأ.
    const handleRadius = Math.max(vb.w, vb.h) * 0.012;
    vectorCommands.forEach((c, cmdIndex) => {
        if (c.type !== 'Z') {
            addVectorHandle(cmdIndex, 'x', 'y', handleRadius, false);
        }
    });
}

function vectorScreenToPoint(clientX, clientY) {
    const pt = vectorEditorSvg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(vectorEditorSvg.getScreenCTM().inverse());
}

let vectorDragTarget = null;
function startVectorDrag(e) {
    vectorDragTarget = e.currentTarget;
    vectorDragTarget.setPointerCapture(e.pointerId);
    vectorDragTarget.addEventListener('pointermove', onVectorDrag);
    vectorDragTarget.addEventListener('pointerup', endVectorDrag);
}
function onVectorDrag(e) {
    if (!vectorDragTarget) return;
    const p = vectorScreenToPoint(e.clientX, e.clientY);
    const cmdIndex = Number(vectorDragTarget.dataset.cmdIndex);
    const xk = vectorDragTarget.dataset.xk;
    const yk = vectorDragTarget.dataset.yk;
    vectorCommands[cmdIndex][xk] = p.x;
    vectorCommands[cmdIndex][yk] = p.y;
    vectorDragTarget.setAttribute('cx', p.x);
    vectorDragTarget.setAttribute('cy', p.y);
    vectorEditorSvg.querySelector('.vector-path').setAttribute('d', commandsToPathData(vectorCommands));
}
function endVectorDrag(e) {
    if (vectorDragTarget) {
        vectorDragTarget.removeEventListener('pointermove', onVectorDrag);
        vectorDragTarget.removeEventListener('pointerup', endVectorDrag);
    }
    vectorDragTarget = null;
}

// جدول أشكال الحروف السياقية (Arabic Presentation Forms-B): [منفرد، بداية، وسط، نهاية]
// null = هذا الشكل غير موجود لهذا الحرف (حرف يتصل بجهة واحدة فقط، زي الألف والواو)
const ARABIC_JOINING_FORMS = {
    'ء': ['ﺀ', null, null, null],
    'آ': ['ﺁ', null, null, 'ﺂ'],
    'أ': ['ﺃ', null, null, 'ﺄ'],
    'ؤ': ['ﺅ', null, null, 'ﺆ'],
    'إ': ['ﺇ', null, null, 'ﺈ'],
    'ئ': ['ﺉ', 'ﺋ', 'ﺌ', 'ﺊ'],
    'ا': ['ﺍ', null, null, 'ﺎ'],
    'ب': ['ﺏ', 'ﺑ', 'ﺒ', 'ﺐ'],
    'ة': ['ﺓ', null, null, 'ﺔ'],
    'ت': ['ﺕ', 'ﺗ', 'ﺘ', 'ﺖ'],
    'ث': ['ﺙ', 'ﺛ', 'ﺜ', 'ﺚ'],
    'ج': ['ﺝ', 'ﺟ', 'ﺠ', 'ﺞ'],
    'ح': ['ﺡ', 'ﺣ', 'ﺤ', 'ﺢ'],
    'خ': ['ﺥ', 'ﺧ', 'ﺨ', 'ﺦ'],
    'د': ['ﺩ', null, null, 'ﺪ'],
    'ذ': ['ﺫ', null, null, 'ﺬ'],
    'ر': ['ﺭ', null, null, 'ﺮ'],
    'ز': ['ﺯ', null, null, 'ﺰ'],
    'س': ['ﺱ', 'ﺳ', 'ﺴ', 'ﺲ'],
    'ش': ['ﺵ', 'ﺷ', 'ﺸ', 'ﺶ'],
    'ص': ['ﺹ', 'ﺻ', 'ﺼ', 'ﺺ'],
    'ض': ['ﺽ', 'ﺿ', 'ﻀ', 'ﺾ'],
    'ط': ['ﻁ', 'ﻃ', 'ﻄ', 'ﻂ'],
    'ظ': ['ﻅ', 'ﻇ', 'ﻈ', 'ﻆ'],
    'ع': ['ﻉ', 'ﻋ', 'ﻌ', 'ﻊ'],
    'غ': ['ﻍ', 'ﻏ', 'ﻐ', 'ﻎ'],
    'ف': ['ﻑ', 'ﻓ', 'ﻔ', 'ﻒ'],
    'ق': ['ﻕ', 'ﻗ', 'ﻘ', 'ﻖ'],
    'ك': ['ﻙ', 'ﻛ', 'ﻜ', 'ﻚ'],
    'ل': ['ﻝ', 'ﻟ', 'ﻠ', 'ﻞ'],
    'م': ['ﻡ', 'ﻣ', 'ﻤ', 'ﻢ'],
    'ن': ['ﻥ', 'ﻧ', 'ﻨ', 'ﻦ'],
    'ه': ['ﻩ', 'ﻫ', 'ﻬ', 'ﻪ'],
    'و': ['ﻭ', null, null, 'ﻮ'],
    'ى': ['ﻯ', null, null, 'ﻰ'],
    'ي': ['ﻱ', 'ﻳ', 'ﻴ', 'ﻲ'],
};

// حالة خاصة: ربطة لام-ألف (لا/لآ/لأ/لإ) — [منفرد، نهاية]
const LAM_ALEF_LIGATURES = {
    'ا': ['ﻻ', 'ﻼ'],
    'آ': ['ﻵ', 'ﻶ'],
    'أ': ['ﻷ', 'ﻸ'],
    'إ': ['ﻹ', 'ﻺ'],
};

function letterExtendsForward(ch) {
    const f = ARABIC_JOINING_FORMS[ch];
    return !!(f && (f[1] || f[2]));
}
function letterReceivesFromBehind(ch) {
    const f = ARABIC_JOINING_FORMS[ch];
    return !!(f && (f[2] || f[3]));
}

// تحويل كلمة عربية منطقية لتسلسل رموز الأشكال السياقية بترتيب العرض البصري
// (من اليسار لليمين) — عشان نقدر نرسمها بتقدّم أفقي عادي زي أي خط LTR
function shapeArabicWordToVisualGlyphs(word) {
    const chars = Array.from(word).filter(c => ARABIC_JOINING_FORMS[c]);
    const glyphChars = [];
    let i = 0;
    while (i < chars.length) {
        const cur = chars[i];
        const next = chars[i + 1];

        if (cur === 'ل' && next && LAM_ALEF_LIGATURES[next]) {
            const prev = chars[i - 1];
            const joinsPrev = prev ? letterExtendsForward(prev) : false;
            const [isolated, final] = LAM_ALEF_LIGATURES[next];
            glyphChars.push(joinsPrev ? final : isolated);
            i += 2;
            continue;
        }

        const prev = chars[i - 1];
        const joinsPrev = prev ? (letterExtendsForward(prev) && letterReceivesFromBehind(cur)) : false;
        const joinsNext = next ? (letterExtendsForward(cur) && letterReceivesFromBehind(next)) : false;
        const [isolated, initial, medial, final] = ARABIC_JOINING_FORMS[cur];

        let form;
        if (joinsPrev && joinsNext) form = medial || final || isolated;
        else if (joinsPrev) form = final || isolated;
        else if (joinsNext) form = initial || isolated;
        else form = isolated;

        glyphChars.push(form);
        i++;
    }
    return glyphChars.reverse(); // من الترتيب المنطقي للترتيب البصري (يسار ← يمين)
}

async function loadVectorLetter() {
    const fontUrl = vectorFontSelect.value;
    const letter = vectorLetterSelect.value;
    const word = letter ? '' : inputText.value.trim();
    const fontSize = 300;

    if (!letter && !word) {
        vectorEditorStatus.textContent = 'اكتب نصًا بمربع "اكتب نصك هنا" أو اختر حرفًا لتحميله';
        return;
    }

    vectorEditorStatus.textContent = 'جاري تحميل الخط واستخراج الشكل...';
    loadVectorBtn.disabled = true;
    try {
        const font = await loadOpentypeFont(fontUrl);
        let commands = [];

        if (word) {
            const visualGlyphs = shapeArabicWordToVisualGlyphs(word);
            const scale = fontSize / font.unitsPerEm;
            let penX = 0;
            for (const glyphChar of visualGlyphs) {
                const glyph = font.charToGlyph(glyphChar);
                const path = glyph.getPath(penX, 0, fontSize);
                commands.push(...path.commands.map(c => ({ ...c })));
                penX += (glyph.advanceWidth || 0) * scale;
            }
        } else {
            const path = font.getPath(letter, 0, 0, fontSize);
            commands = path.commands.map(c => ({ ...c }));
        }

        if (!commands.length) {
            vectorEditorStatus.textContent = 'هذا الخط ما فيه شكل مرسوم لهذا الحرف/الكلمة، جرّب خط ثاني';
            vectorCommands = null;
            vectorEditorSvg.innerHTML = '';
            return;
        }
        vectorCommands = commands;
        renderVectorEditor();
        vectorEditorStatus.textContent = 'تم التحميل ✅ — اسحب النقاط لتعديل الشكل';
    } catch (err) {
        console.error(err);
        vectorEditorStatus.textContent = 'حدث خطأ أثناء تحميل الخط';
    } finally {
        loadVectorBtn.disabled = false;
    }
}

loadVectorBtn.addEventListener('click', loadVectorLetter);
resetVectorBtn.addEventListener('click', loadVectorLetter);

// ===== 8) اقتراح عدة أشكال لنفس الحرف (كل الخطوط × الأشكال السياقية) =====
// يجمع لكل حرف: شكله بكل خط من خطوط الثلث المحلية، وفي كل خط بكل أشكاله
// السياقية المتاحة (منفرد/بداية/وسط/نهاية) — عشان المستخدم يقارنها بصورته
// المرجعية ويختار الأقرب، بدل ما يجرّب خط-خط يدويًا.
const CONTEXTUAL_FORM_LABELS = ['منفرد', 'بداية', 'وسط', 'نهاية'];

function getVectorFontLibrary() {
    return Array.from(vectorFontSelect.options).map(o => ({ name: o.textContent, url: o.value }));
}

async function buildShapeCandidates(letter) {
    const forms = ARABIC_JOINING_FORMS[letter];
    if (!forms) return [];

    const fontLibrary = getVectorFontLibrary();
    const candidates = [];

    for (const font of fontLibrary) {
        let openTypeFont;
        try {
            openTypeFont = await loadOpentypeFont(font.url);
        } catch (err) {
            console.warn('تعذّر تحميل الخط:', font.url, err);
            continue;
        }

        forms.forEach((formChar, formIndex) => {
            if (!formChar) return;
            const glyph = openTypeFont.charToGlyph(formChar);
            if (!glyph || glyph.index === 0) return; // .notdef: الخط ما يدعم هذا الشكل

            const path = glyph.getPath(0, 0, 300);
            const commands = path.commands.map(c => ({ ...c }));
            if (!commands.length) return;

            candidates.push({
                fontName: font.name,
                fontUrl: font.url,
                formLabel: CONTEXTUAL_FORM_LABELS[formIndex],
                commands
            });
        });
    }

    return candidates;
}

function renderShapeSuggestions(candidates) {
    shapeSuggestions.innerHTML = '';

    candidates.forEach(candidate => {
        const vb = vectorViewBox(candidate.commands);

        const card = document.createElement('div');
        card.className = 'shape-suggestion-card';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', commandsToPathData(candidate.commands));
        svg.appendChild(path);
        card.appendChild(svg);

        const label = document.createElement('span');
        label.className = 'shape-suggestion-label';
        label.textContent = `${candidate.fontName} — ${candidate.formLabel}`;
        card.appendChild(label);

        card.addEventListener('click', () => {
            shapeSuggestions.querySelectorAll('.shape-suggestion-card.selected')
                .forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');

            vectorCommands = candidate.commands.map(c => ({ ...c }));
            renderVectorEditor();
            vectorFontSelect.value = candidate.fontUrl;
            vectorEditorStatus.textContent = `تم تحميل شكل "${candidate.formLabel}" من خط ${candidate.fontName} ✅ — اسحب النقاط للتعديل`;
        });

        shapeSuggestions.appendChild(card);
    });
}

suggestShapesBtn.addEventListener('click', async function () {
    const letter = vectorLetterSelect.value;
    if (!letter) {
        shapeSuggestionsStatus.textContent = 'اختر حرفًا واحدًا أولاً (وليس "النص المكتوب أعلاه")';
        shapeSuggestions.innerHTML = '';
        return;
    }

    suggestShapesBtn.disabled = true;
    shapeSuggestions.innerHTML = '';
    shapeSuggestionsStatus.textContent = 'جاري تجهيز الاقتراحات...';

    try {
        const candidates = await buildShapeCandidates(letter);
        if (!candidates.length) {
            shapeSuggestionsStatus.textContent = 'تعذّر إيجاد أشكال لهذا الحرف بخطوط المكتبة';
            return;
        }
        renderShapeSuggestions(candidates);
        shapeSuggestionsStatus.textContent = `تم إيجاد ${candidates.length} شكلاً — اضغط على أي شكل لتحميله للتعديل`;
    } catch (err) {
        console.error(err);
        shapeSuggestionsStatus.textContent = 'حدث خطأ أثناء تجهيز الاقتراحات';
    } finally {
        suggestShapesBtn.disabled = false;
    }
});

vectorLetterSelect.addEventListener('change', function () {
    shapeSuggestions.innerHTML = '';
    shapeSuggestionsStatus.textContent = '';
});

exportVectorSvgBtn.addEventListener('click', function () {
    if (!vectorCommands) return;
    const vb = vectorViewBox(vectorCommands);
    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"><path d="${commandsToPathData(vectorCommands)}" fill="#000"/></svg>`;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-letter-shape.svg';
    a.click();
    URL.revokeObjectURL(url);
});

exportVectorPngBtn.addEventListener('click', function () {
    if (!vectorCommands) return;
    const vb = vectorViewBox(vectorCommands);
    const scale = 4;
    const canvas = document.createElement('canvas');
    canvas.width = vb.w * scale;
    canvas.height = vb.h * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.scale(scale, scale);
    ctx.translate(-vb.x, -vb.y);
    ctx.fill(new Path2D(commandsToPathData(vectorCommands)));

    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom-letter-shape.png';
        a.click();
        URL.revokeObjectURL(url);
    });
});

// ===== حركة رسم شعار الـHero بخط الثلث (GSAP DrawSVGPlugin) =====
// يحمّل شكل كلمة "أهلاً" الحقيقي من ملف الخط عبر opentype.js (نفس الأسلوب
// المستخدم بمحرر الفيكتور)، ويرسمه بتأثير "الرسم بالحبر" عبر GSAP DrawSVGPlugin
// ثم يملؤه بالذهبي. لو تعذّر تحميل GSAP أو الخط (مثلاً بدون سيرفر محلي)،
// يظهر نص Thuluth ثابت بدلاً منه.
async function initHeroCalligraphy() {
    const svg = document.getElementById('heroDrawSvg');
    const fallback = document.querySelector('.hero-calligraphy-fallback');
    console.log('[hero] بدء initHeroCalligraphy — svg موجود:', !!svg, '| prefersReducedMotion:', prefersReducedMotion);
    if (!svg) {
        console.warn('[hero] لم يتم العثور على #heroDrawSvg بالـDOM — توقف التنفيذ هنا.');
        return;
    }

    function showFallback() {
        console.warn('[hero] عرض النص الاحتياطي الثابت بدل الأنيميشن.');
        svg.style.display = 'none';
        if (fallback) fallback.classList.add('show');
    }

    const gsapLoaded = typeof gsap !== 'undefined';
    const drawSvgLoaded = typeof DrawSVGPlugin !== 'undefined';
    console.log('[hero] gsap محمّل:', gsapLoaded, '| DrawSVGPlugin محمّل:', drawSvgLoaded);
    if (!gsapLoaded || !drawSvgLoaded) {
        console.warn('تعذّر تحميل GSAP/DrawSVGPlugin، سيظهر نص ثابت بدلاً من الرسم المتحرك.');
        showFallback();
        return;
    }
    gsap.registerPlugin(DrawSVGPlugin);
    console.log('[hero] تم تسجيل DrawSVGPlugin.');

    try {
        const font = await loadOpentypeFont('fonts/DTHULUTH-II-1.ttf');
        console.log('[hero] تم تحميل الخط، unitsPerEm:', font && font.unitsPerEm);
        const glyphChars = shapeArabicWordToVisualGlyphs('أهلاً');
        console.log('[hero] أشكال الحروف الناتجة عن التشكيل السياقي:', glyphChars);
        const fontSize = 300;
        const scale = fontSize / font.unitsPerEm;
        let penX = 0;
        const commands = [];
        for (const glyphChar of glyphChars) {
            const glyph = font.charToGlyph(glyphChar);
            const path = glyph.getPath(penX, 0, fontSize);
            commands.push(...path.commands);
            penX += (glyph.advanceWidth || 0) * scale;
        }
        console.log('[hero] عدد أوامر مسار SVG المستخرجة من الخط:', commands.length);
        if (!commands.length) {
            console.warn('[hero] الخط لا يحتوي أي مسار مرسوم لهذه الحروف.');
            showFallback();
            return;
        }

        const vb = vectorViewBox(commands);
        svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('class', 'hero-draw-path');
        pathEl.setAttribute('d', commandsToPathData(commands));
        svg.appendChild(pathEl);
        console.log('[hero] تمت إضافة عنصر <path> لعنصر SVG بالـHero.');

        if (prefersReducedMotion) {
            console.log('[hero] prefers-reduced-motion مفعّل بالمتصفح/النظام — سيظهر الشكل كاملاً فوراً بدون رسم متدرّج (سلوك متعمّد لإتاحة الوصول، وليس عطلاً).');
            gsap.set(pathEl, { drawSVG: '100%' });
            pathEl.classList.add('is-inked');
            return;
        }

        console.log('[hero] استدعاء gsap.set/gsap.to الآن لبدء أنيميشن الرسم...');
        gsap.set(pathEl, { drawSVG: '0%' });
        gsap.to(pathEl, {
            drawSVG: '100%',
            duration: 2.4,
            ease: 'power2.inOut',
            onStart: () => console.log('[hero] ✅ بدأ تشغيل أنيميشن drawSVG فعلياً.'),
            onComplete: () => {
                console.log('[hero] ✅ اكتمل الرسم، يبدأ التحبير بالذهبي.');
                pathEl.style.transition = 'fill 0.6s ease';
                pathEl.classList.add('is-inked');
            }
        });
        console.log('[hero] تم إرسال أمر gsap.to (لا يعني هذا اكتمال التشغيل، راقب رسالة onStart أعلاه).');
    } catch (err) {
        console.error('[hero] ❌ خطأ أثناء تجهيز رسم الشعار المتحرك:', err);
        showFallback();
    }
}

// ===== حركة الظهور عند التمرير (Intersection Observer بدون مكتبات خارجية) =====
function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach((el, i) => {
        el.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
        observer.observe(el);
    });
}

// ===== تهيئة أولية =====
renderOutput(inputText.value);
initHeroCalligraphy();
initScrollReveal();
