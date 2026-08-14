const SVG_NS = 'http://www.w3.org/2000/svg';
const GLYPH_FONT_SIZE = 260;
const FORM_LABELS = ['منفرد', 'بداية', 'وسط', 'نهاية'];

const FONT_LIBRARY = [
    { name: 'الثلث الكلاسيكي', url: 'fonts/DTHULUTH-II-1.ttf' },
    { name: 'ثلث أموشرف', url: 'fonts/ttf1/amoshref-thulth.ttf' },
    { name: 'ديكوتايب ثلث II', url: 'fonts/ttf4/DecoType Thuluth II Regular/DecoType Thuluth II Regular.ttf' },
    { name: 'ديكوتايب ثلث III', url: 'fonts/ttf6/decotype-thuluth-iii.ttf' },
    { name: 'جي إي ثلث خفيف', url: 'fonts/ttf3/GE Thuluth Light/GE Thuluth Light.ttf' },
    { name: 'ياسمين تايبو', url: 'fonts/ttf5/jassmin-typo.ttf' }
];

const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

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

// ===== عناصر الصفحة =====
const compFontSelect = document.getElementById('compFontSelect');
const letterPalette = document.getElementById('letterPalette');
const compositionStatus = document.getElementById('compositionStatus');
const compositionSvg = document.getElementById('compositionSvg');
const instancesLayer = document.getElementById('instancesLayer');
const selectionLayer = document.getElementById('selectionLayer');
const instanceToolbar = document.getElementById('instanceToolbar');
const clearCanvasBtn = document.getElementById('clearCanvasBtn');
const compExportQuality = document.getElementById('compExportQuality');
const exportCompSvgBtn = document.getElementById('exportCompSvgBtn');
const exportCompPngBtn = document.getElementById('exportCompPngBtn');

// ===== حالة اللوحة =====
let instances = [];
let nextId = 1;
let selectedId = null;

// ===== تحميل الخطوط (مع تخزين مؤقت) =====
const fontCache = new Map();
function loadFont(url) {
    if (fontCache.has(url)) return fontCache.get(url);
    const promise = fetch(url).then(r => r.arrayBuffer()).then(buf => opentype.parse(buf));
    fontCache.set(url, promise);
    return promise;
}

// ===== أدوات مسار SVG =====
function commandsToPathData(commands) {
    return commands.map(c => {
        if (c.type === 'M') return `M ${c.x} ${c.y}`;
        if (c.type === 'L') return `L ${c.x} ${c.y}`;
        if (c.type === 'C') return `C ${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
        if (c.type === 'Q') return `Q ${c.x1} ${c.y1} ${c.x} ${c.y}`;
        return 'Z';
    }).join(' ');
}

function computeBounds(commands) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of commands) {
        for (const [xk, yk] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
            if (c[xk] !== undefined) {
                minX = Math.min(minX, c[xk]); maxX = Math.max(maxX, c[xk]);
                minY = Math.min(minY, c[yk]); maxY = Math.max(maxY, c[yk]);
            }
        }
    }
    if (maxX < minX) return { cx: 0, cy: 0, hw: 10, hh: 10 };
    return {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        hw: Math.max((maxX - minX) / 2, 1),
        hh: Math.max((maxY - minY) / 2, 1)
    };
}

function createSvgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) el.setAttribute(key, attrs[key]);
    return el;
}

// ===== استخراج الأشكال السياقية المتوفرة فعليًا بالخط لحرف معيّن =====
function computeAvailableForms(letter, font) {
    const charForms = ARABIC_JOINING_FORMS[letter];
    if (!charForms) return [];

    const result = [];
    charForms.forEach((ch, formIndex) => {
        if (!ch) return;
        const glyph = font.charToGlyph(ch);
        if (!glyph || glyph.index === 0) return; // .notdef: الخط ما يدعم هذا الشكل

        const path = glyph.getPath(0, 0, GLYPH_FONT_SIZE);
        const commands = path.commands.map(c => ({ ...c }));
        if (!commands.length) return;

        result.push({ formIndex, commands, bounds: computeBounds(commands) });
    });
    return result;
}

function screenToSvgPoint(clientX, clientY) {
    const pt = compositionSvg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(compositionSvg.getScreenCTM().inverse());
}

function getInstanceMatrix(instance) {
    return new DOMMatrix()
        .translate(instance.x, instance.y)
        .rotate(instance.rotation)
        .scale(instance.scale);
}

function transformLocalPoint(instance, lx, ly) {
    const p = getInstanceMatrix(instance).transformPoint(new DOMPoint(lx, ly));
    return { x: p.x, y: p.y };
}

// ===== إنشاء / تحديث عنصر حرف على اللوحة =====
function renderInstance(instance) {
    const group = createSvgEl('g', { class: 'letter-instance' });
    const path = createSvgEl('path', { class: 'letter-instance-path' });
    group.appendChild(path);
    instancesLayer.appendChild(group);

    instance.group = group;
    instance.pathEl = path;

    updateInstanceShape(instance);
    updateInstanceTransform(instance);

    path.addEventListener('pointerdown', e => startMove(e, instance));
}

function updateInstanceTransform(instance) {
    instance.group.setAttribute('transform',
        `translate(${instance.x} ${instance.y}) rotate(${instance.rotation}) scale(${instance.scale})`);
}

function updateInstanceShape(instance) {
    const form = instance.forms[instance.formIndex];
    instance.pathEl.setAttribute('d', commandsToPathData(form.commands));
    instance.pathEl.setAttribute('transform', `translate(${-form.bounds.cx} ${-form.bounds.cy})`);
}

// ===== إضافة حرف جديد للوحة =====
async function addLetterInstance(letter) {
    const fontUrl = compFontSelect.value;
    const fontMeta = FONT_LIBRARY.find(f => f.url === fontUrl);

    compositionStatus.textContent = 'جاري تحميل الخط...';
    let font;
    try {
        font = await loadFont(fontUrl);
    } catch (err) {
        console.error(err);
        compositionStatus.textContent = 'تعذّر تحميل الخط';
        return;
    }

    const forms = computeAvailableForms(letter, font);
    if (!forms.length) {
        compositionStatus.textContent = `الخط "${fontMeta.name}" ما فيه شكل مرسوم لحرف "${letter}"`;
        return;
    }
    compositionStatus.textContent = '';

    const cascade = instances.length % 10;
    const instance = {
        id: nextId++,
        letter,
        fontUrl,
        fontName: fontMeta.name,
        forms,
        formIndex: 0,
        x: 700 + cascade * 35,
        y: 380 + cascade * 22,
        rotation: 0,
        scale: 1
    };

    instances.push(instance);
    renderInstance(instance);
    selectInstance(instance.id);
}

function removeInstance(id) {
    const idx = instances.findIndex(i => i.id === id);
    if (idx === -1) return;
    instances[idx].group.remove();
    instances.splice(idx, 1);
    if (selectedId === id) selectInstance(null);
}

function bringToFront(instance) {
    instancesLayer.appendChild(instance.group);
}
function sendToBack(instance) {
    instancesLayer.insertBefore(instance.group, instancesLayer.firstChild);
}

// ===== التحديد + شريط الأدوات + مقابض التعديل =====
function selectInstance(id) {
    selectedId = id;
    renderSelectionOverlay();
    renderInstanceToolbar();
}

function renderSelectionOverlay() {
    selectionLayer.innerHTML = '';
    const instance = instances.find(i => i.id === selectedId);
    if (!instance) return;

    const form = instance.forms[instance.formIndex];
    const PADDING = 18;
    const hw = form.bounds.hw + PADDING;
    const hh = form.bounds.hh + PADDING;

    const corners = [
        transformLocalPoint(instance, -hw, -hh),
        transformLocalPoint(instance, hw, -hh),
        transformLocalPoint(instance, hw, hh),
        transformLocalPoint(instance, -hw, hh)
    ];

    selectionLayer.appendChild(createSvgEl('polygon', {
        class: 'selection-outline',
        points: corners.map(p => `${p.x},${p.y}`).join(' ')
    }));

    // مقبض التدوير
    const topMid = transformLocalPoint(instance, 0, -hh);
    const rotatePt = transformLocalPoint(instance, 0, -hh - 45);
    selectionLayer.appendChild(createSvgEl('line', {
        class: 'selection-line', x1: topMid.x, y1: topMid.y, x2: rotatePt.x, y2: rotatePt.y
    }));
    const rotateHandle = createSvgEl('circle', {
        class: 'rotate-handle', cx: rotatePt.x, cy: rotatePt.y, r: 14
    });
    rotateHandle.addEventListener('pointerdown', e => startRotate(e, instance));
    selectionLayer.appendChild(rotateHandle);

    // مقبض التحجيم (الزاوية السفلية)
    const resizeHandle = createSvgEl('circle', {
        class: 'resize-handle', cx: corners[2].x, cy: corners[2].y, r: 14
    });
    resizeHandle.addEventListener('pointerdown', e => startResize(e, instance));
    selectionLayer.appendChild(resizeHandle);

    // مقبض الحذف (الزاوية العلوية المقابلة)
    const deleteHandle = createSvgEl('circle', {
        class: 'delete-handle', cx: corners[0].x, cy: corners[0].y, r: 14
    });
    deleteHandle.addEventListener('pointerdown', e => {
        e.stopPropagation();
        removeInstance(instance.id);
    });
    selectionLayer.appendChild(deleteHandle);
    const deleteLabel = createSvgEl('text', {
        class: 'delete-handle-label', x: corners[0].x, y: corners[0].y,
        'text-anchor': 'middle', 'dominant-baseline': 'central'
    });
    deleteLabel.textContent = '×';
    selectionLayer.appendChild(deleteLabel);
}

function renderInstanceToolbar() {
    instanceToolbar.innerHTML = '';
    const instance = instances.find(i => i.id === selectedId);

    if (!instance) {
        const hint = document.createElement('p');
        hint.className = 'font-match-hint';
        hint.textContent = 'اضغط على أي حرف موجود باللوحة لتحديده وتعديله.';
        instanceToolbar.appendChild(hint);
        return;
    }

    const info = document.createElement('p');
    info.className = 'instance-toolbar-info';
    info.textContent = `الحرف المحدد: ${instance.letter} — ${instance.fontName}`;
    instanceToolbar.appendChild(info);

    const shapesRow = document.createElement('div');
    shapesRow.className = 'instance-shapes-row';
    instance.forms.forEach((form, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'instance-shape-btn' + (idx === instance.formIndex ? ' active' : '');

        const b = form.bounds;
        const pad = Math.max(b.hw, b.hh) * 0.2 || 20;
        const svg = createSvgEl('svg', {
            viewBox: `${b.cx - b.hw - pad} ${b.cy - b.hh - pad} ${(b.hw + pad) * 2} ${(b.hh + pad) * 2}`
        });
        svg.appendChild(createSvgEl('path', { d: commandsToPathData(form.commands) }));
        btn.appendChild(svg);

        const label = document.createElement('span');
        label.textContent = FORM_LABELS[form.formIndex];
        btn.appendChild(label);

        btn.addEventListener('click', () => {
            instance.formIndex = idx;
            updateInstanceShape(instance);
            renderSelectionOverlay();
            renderInstanceToolbar();
        });
        shapesRow.appendChild(btn);
    });
    instanceToolbar.appendChild(shapesRow);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'instance-actions-row';
    actionsRow.appendChild(makeToolbarButton('طبقة للأمام', () => bringToFront(instance)));
    actionsRow.appendChild(makeToolbarButton('طبقة للخلف', () => sendToBack(instance)));
    const deleteBtn = makeToolbarButton('حذف الحرف', () => removeInstance(instance.id));
    deleteBtn.classList.add('danger-btn');
    actionsRow.appendChild(deleteBtn);
    instanceToolbar.appendChild(actionsRow);
}

function makeToolbarButton(text, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn instance-action-btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
}

// ===== السحب: تحريك =====
function startMove(e, instance) {
    e.stopPropagation();
    selectInstance(instance.id);

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const start = screenToSvgPoint(e.clientX, e.clientY);
    const origX = instance.x, origY = instance.y;

    function onMove(ev) {
        const p = screenToSvgPoint(ev.clientX, ev.clientY);
        instance.x = origX + (p.x - start.x);
        instance.y = origY + (p.y - start.y);
        updateInstanceTransform(instance);
        renderSelectionOverlay();
    }
    function onUp() {
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
    }
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
}

// ===== السحب: تدوير =====
function startRotate(e, instance) {
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startPt = screenToSvgPoint(e.clientX, e.clientY);
    const startAngle = Math.atan2(startPt.y - instance.y, startPt.x - instance.x) * 180 / Math.PI;
    const origRotation = instance.rotation;

    function onMove(ev) {
        const p = screenToSvgPoint(ev.clientX, ev.clientY);
        const angle = Math.atan2(p.y - instance.y, p.x - instance.x) * 180 / Math.PI;
        instance.rotation = origRotation + (angle - startAngle);
        updateInstanceTransform(instance);
        renderSelectionOverlay();
    }
    function onUp() {
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
    }
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
}

// ===== السحب: تحجيم =====
function startResize(e, instance) {
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startPt = screenToSvgPoint(e.clientX, e.clientY);
    const startDist = Math.hypot(startPt.x - instance.x, startPt.y - instance.y) || 1;
    const origScale = instance.scale;

    function onMove(ev) {
        const p = screenToSvgPoint(ev.clientX, ev.clientY);
        const dist = Math.hypot(p.x - instance.x, p.y - instance.y);
        instance.scale = Math.min(6, Math.max(0.15, origScale * (dist / startDist)));
        updateInstanceTransform(instance);
        renderSelectionOverlay();
    }
    function onUp() {
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
    }
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
}

// ===== لوحة اختيار الحروف =====
ARABIC_LETTERS.forEach(letter => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-letter-btn';
    btn.textContent = letter;
    btn.addEventListener('click', () => addLetterInstance(letter));
    letterPalette.appendChild(btn);
});

// ===== إلغاء التحديد بالضغط على منطقة فاضية باللوحة =====
compositionSvg.addEventListener('pointerdown', e => {
    if (e.target === compositionSvg) selectInstance(null);
});

// ===== حذف بمفتاح Delete/Backspace =====
document.addEventListener('keydown', e => {
    if (!selectedId) return;
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeInstance(selectedId);
    }
});

// ===== مسح اللوحة =====
clearCanvasBtn.addEventListener('click', () => {
    if (!instances.length) return;
    if (!confirm('مسح كل الحروف من اللوحة؟ لا يمكن التراجع.')) return;
    instances.forEach(inst => inst.group.remove());
    instances = [];
    selectInstance(null);
});

// ===== التصدير =====
function buildCleanSvgMarkup() {
    const clone = compositionSvg.cloneNode(true);
    const overlay = clone.querySelector('#selectionLayer');
    if (overlay) overlay.remove();
    clone.removeAttribute('id');
    clone.setAttribute('xmlns', SVG_NS);
    return new XMLSerializer().serializeToString(clone);
}

exportCompSvgBtn.addEventListener('click', () => {
    if (!instances.length) {
        compositionStatus.textContent = 'اللوحة فاضية، أضف حروفًا أولاً';
        return;
    }
    const markup = buildCleanSvgMarkup();
    const blob = new Blob([markup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'letter-composition.svg';
    a.click();
    URL.revokeObjectURL(url);
});

exportCompPngBtn.addEventListener('click', () => {
    if (!instances.length) {
        compositionStatus.textContent = 'اللوحة فاضية، أضف حروفًا أولاً';
        return;
    }
    const markup = buildCleanSvgMarkup();
    const scale = Number(compExportQuality.value);
    const vb = compositionSvg.getAttribute('viewBox').split(' ').map(Number);

    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = vb[2] * scale;
        canvas.height = vb[3] * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'letter-composition.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    };
    img.onerror = function (err) {
        console.error(err);
        compositionStatus.textContent = 'حدث خطأ أثناء تصدير الصورة';
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
});
