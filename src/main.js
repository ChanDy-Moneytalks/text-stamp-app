document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('stampCanvas');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const textInput = document.getElementById('textInput');
    const fontSelect = document.getElementById('fontSelect');
    const textColor = document.getElementById('textColor');
    const textColorHex = document.getElementById('textColorHex');
    const strokeColor = document.getElementById('strokeColor');
    const strokeColorHex = document.getElementById('strokeColorHex');
    const strokeWidth = document.getElementById('strokeWidth');
    const strokeWidthVal = document.getElementById('strokeWidthVal');
    const scaleXInput = document.getElementById('scaleX');
    const scaleXVal = document.getElementById('scaleXVal');
    const scaleYInput = document.getElementById('scaleY');
    const scaleYVal = document.getElementById('scaleYVal');
    const letterSpacingInput = document.getElementById('letterSpacing');
    const letterSpacingVal = document.getElementById('letterSpacingVal');
    const fontSizeInput = document.getElementById('fontSize');
    const fontSizeVal = document.getElementById('fontSizeVal');
    const downloadBtn = document.getElementById('downloadBtn');

    // Default State
    const CANVAS_SIZE = 500;

    function draw() {
        // Clear Canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before clearing
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const text = textInput.value;
        if (!text) return;

        const font = fontSelect.value;
        const fill = textColor.value;
        const stroke = strokeColor.value;
        const sWidth = parseInt(strokeWidth.value, 10);
        const scX = parseFloat(scaleXInput.value);
        const scY = parseFloat(scaleYInput.value);
        const spacing = parseInt(letterSpacingInput.value, 10);
        const sliderFontSize = parseInt(fontSizeInput.value, 10);

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sWidth; // Line width is affected by scale, so we might need to adjust?
        // Actually line width is applied in the transformed space. 
        // If we want consistent visual thickness, we might need to divide by scale, but usually for "stamp" distortion, scaling the border is desired.
        // Let's keep it simple for now.

        ctx.lineJoin = 'round';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Apply Letter Spacing (Canvas API supports this now)
        if (ctx.letterSpacing !== undefined) {
            ctx.letterSpacing = `${spacing}px`;
        }

        const maxAllowedFontSize = calculateMaxFontSize(text, font, sWidth, scX, scY, spacing);
        const fontSize = Math.min(sliderFontSize, maxAllowedFontSize);

        ctx.font = `bold ${fontSize}px ${font}`;

        // Transform for stretching
        ctx.setTransform(scX, 0, 0, scY, 0, 0);

        // Precision measurement for centering
        const metrics = ctx.measureText(text);
        const L = metrics.actualBoundingBoxLeft;
        const R = metrics.actualBoundingBoxRight;
        const A = metrics.actualBoundingBoxAscent;
        const D = metrics.actualBoundingBoxDescent;

        // Calculate anchor position to put the geometric center of the text at the canvas center
        const x = (CANVAS_SIZE / 2) / scX - (R - L) / 2;
        const y = (CANVAS_SIZE / 2) / scY - (D - A) / 2;

        // Draw Stroke (if width > 0)
        if (sWidth > 0) {
            ctx.strokeText(text, x, y);
        }

        // Draw Text
        ctx.fillText(text, x, y);

        // Reset Transform for next frame (important!)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Binary search for max font size to fit in 500x500
    // Taking stroke width, scale, and spacing into account
    function calculateMaxFontSize(text, fontName, strokeW, scX, scY, spacing) {
        let min = 1;
        let max = 1000;
        let optimal = 1;

        // Ensure spacing is set for measurement
        if (ctx.letterSpacing !== undefined) {
            ctx.letterSpacing = `${spacing}px`;
        }

        // Available space is CANVAS_SIZE (500)
        // We want to fit within the CANVAS_SIZE inclusive of stroke.
        // The stroke expands outward by strokeW / 2.
        const margin = (strokeW / 2);
        const availableW = CANVAS_SIZE;
        const availableH = CANVAS_SIZE;

        while (min <= max) {
            const mid = Math.floor((min + max) / 2);
            ctx.font = `bold ${mid}px ${fontName}`;
            const metrics = ctx.measureText(text);

            // Precision measurement using actualBoundingBox
            // width = right boundary - left boundary (usually right is positive, left is negative or zero)
            // But better: actualBoundingBoxRight + actualBoundingBoxLeft (absolute values if they represent distance from anchor)
            const textWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
            const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

            // Total size including stroke
            const totalWidth = (textWidth + strokeW) * scX;
            const totalHeight = (textHeight + strokeW) * scY;

            if (totalWidth <= availableW && totalHeight <= availableH) {
                optimal = mid;
                min = mid + 1;
            } else {
                max = mid - 1;
            }
        }
        return optimal;
    }

    // Export to PNG
    function downloadImage() {
        const text = textInput.value.trim() || 'stamp';
        const link = document.createElement('a');
        link.download = `${text}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // Event Listeners
    textInput.addEventListener('input', draw);
    fontSelect.addEventListener('change', draw);
    textColor.addEventListener('input', (e) => {
        textColorHex.value = e.target.value.toUpperCase();
        draw();
    });
    textColorHex.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            textColor.value = e.target.value;
            draw();
        }
    });

    strokeColor.addEventListener('input', (e) => {
        strokeColorHex.value = e.target.value.toUpperCase();
        draw();
    });
    strokeColorHex.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            strokeColor.value = e.target.value;
            draw();
        }
    });
    fontSizeInput.addEventListener('input', (e) => {
        fontSizeVal.textContent = `${e.target.value}px`;
        draw();
    });

    strokeWidth.addEventListener('input', (e) => {
        strokeWidthVal.textContent = `${e.target.value}px`;
        draw();
    });

    scaleXInput.addEventListener('input', (e) => {
        scaleXVal.textContent = parseFloat(e.target.value).toFixed(1);
        draw();
    });
    scaleYInput.addEventListener('input', (e) => {
        scaleYVal.textContent = parseFloat(e.target.value).toFixed(1);
        draw();
    });
    letterSpacingInput.addEventListener('input', (e) => {
        letterSpacingVal.textContent = `${e.target.value}px`;
        draw();
    });

    downloadBtn.addEventListener('click', downloadImage);

    // Custom Font Loader
    const fontFile = document.getElementById('fontFile');

    fontFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fontData = event.target.result;
            const fontName = 'CustomFont'; // Verification name
            const fontFace = new FontFace(fontName, fontData);

            try {
                await fontFace.load();
                document.fonts.add(fontFace);

                // Add to dropdown if not already present
                let option = document.querySelector(`option[value="${fontName}"]`);
                if (!option) {
                    option = document.createElement('option');
                    option.value = fontName;
                    option.textContent = file.name.split('.')[0] + " (Custom)";
                    fontSelect.appendChild(option);
                } else {
                    option.textContent = file.name.split('.')[0] + " (Custom)";
                }

                // Select and redraw
                fontSelect.value = fontName;
                draw();

            } catch (err) {
                console.error('Font loading failed:', err);
                alert('フォントの読み込みに失敗しました。有効なフォントファイルを選択してください。');
            }
        };
        reader.readAsArrayBuffer(file);
    });

    // Initial Draw when fonts are ready
    document.fonts.ready.then(() => {
        draw();
    });
});
