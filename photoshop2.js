const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Elementos UI
const upload = document.getElementById('upload');
const info = document.getElementById('info');
const placeholder = document.getElementById('placeholder');

// Sliders Izquierda
const sliderBrillo = document.getElementById('brillo');
const sliderContraste = document.getElementById('contraste');
const sliderSaturation = document.getElementById('sliderSaturation');
const sliderCalidad = document.getElementById('calidad');
const sliderEscala = document.getElementById('escala');
const valorBrillo = document.getElementById('valorBrillo');
const valorContraste = document.getElementById('valorContraste');
const valorCalidad = document.getElementById('valorCalidad');
const valorEscala = document.getElementById('valorEscala');
const formato = document.getElementById('formato');

// Botones Derecha
const btnBlur = document.getElementById("blur");
const btnSharpen = document.getElementById("sharpen");
const btnBordes = document.getElementById("bordes");
const btnRelieve = document.getElementById("relieve");
const btnLineash = document.getElementById("lineash");
const btnLineasv = document.getElementById("lineasv");
const btnNoise = document.getElementById("noise");
const btnSalt = document.getElementById("salt");
const btnMedian = document.getElementById("median");
const sliderNoise = document.getElementById("sliderNoise");

// Variables de estado
let originalImage = null;
let currentImage = null; // Para filtros acumulativos
let nombreArchivo = "imagen_editada";

// --- UTILIDADES ---
function clamp(v) { return Math.max(0, Math.min(255, v)); }

// --- CARGA DE IMAGEN ---
upload.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;
    nombreArchivo = file.name.replace(/\.[^/.]+$/, "");
    const img = new Image();
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.classList.remove("oculto");
        placeholder.classList.add("oculto");
        actualizarTextos();
        aplicarAjustes();
    };
    img.src = URL.createObjectURL(file);
});

// --- LOGICA DEL EDITOR (IZQUIERDA) ---
function actualizarTextos() {
    valorBrillo.textContent = sliderBrillo.value;
    valorContraste.textContent = (sliderContraste.value / 100).toFixed(2);
    valorCalidad.textContent = parseFloat(sliderCalidad.value).toFixed(1);
    valorEscala.textContent = sliderEscala.value + "%";
}

function aplicarAjustes() {
    if (!originalImage) return;
    const brillo = parseInt(sliderBrillo.value);
    const contraste = sliderContraste.value / 100;
    const saturation = sliderSaturation.value / 100;

    let imageData = new ImageData(new Uint8ClampedArray(originalImage.data), originalImage.width, originalImage.height);
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Contraste + Brillo
        for (let j = 0; j < 3; j++) {
            data[i+j] = clamp((data[i+j] - 128) * contraste + 128 + brillo);
        }
        // Saturación
        let r = data[i], g = data[i+1], b = data[i+2];
        let gray = 0.3 * r + 0.59 * g + 0.11 * b;
        data[i] = clamp(gray + saturation * (r - gray));
        data[i+1] = clamp(gray + saturation * (g - gray));
        data[i+2] = clamp(gray + saturation * (b - gray));
    }
    ctx.putImageData(imageData, 0, 0);
    mostrarInfo();
}

function mostrarInfo() {
    info.innerHTML = `<strong>${nombreArchivo}</strong><br>${canvas.width}x${canvas.height}px<br>F: ${formato.value}`;
}

// --- FILTROS DE CONVOLUCIÓN (DERECHA) ---
function applyKernel(kernel) {
    if (!originalImage) return;
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;
    let copy = new Uint8ClampedArray(data);
    let width = imgData.width, height = imgData.height;
    let size = kernel.length, half = Math.floor(size / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let i = (y * width + x) * 4;
            let r = 0, g = 0, b = 0;
            for (let ky = 0; ky < size; ky++) {
                for (let kx = 0; kx < size; kx++) {
                    let px = clampCoord(x + kx - half, width);
                    let py = clampCoord(y + ky - half, height);
                    let ii = (py * width + px) * 4;
                    r += copy[ii] * kernel[ky][kx];
                    g += copy[ii + 1] * kernel[ky][kx];
                    b += copy[ii + 2] * kernel[ky][kx];
                }
            }
            if (kernel === blurKernel) { r /= 9; g /= 9; b /= 9; }
            data[i] = clamp(r); data[i + 1] = clamp(g); data[i + 2] = clamp(b);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}
function clampCoord(pos, max) { return Math.max(0, Math.min(max - 1, pos)); }

const blurKernel = [[1,1,1],[1,1,1],[1,1,1]];
const sharpenKernel = [[0,-1,0],[-1,5,-1],[0,-1,0]];
const bordesKernel = [[0,-1,0],[-1,4,-1],[0,-1,0]];
const relieveKernel = [[-2,-1,0],[-1,1,1],[0,1,2]];
const lineashKernel = [[-1,-1,-1],[2,2,2],[-1,-1,-1]];
const lineasvKernel = [[-1,2,-1],[-1,2,-1],[-1,2,-1]];

btnBlur.onclick = () => applyKernel(blurKernel);
btnSharpen.onclick = () => applyKernel(sharpenKernel);
btnBordes.onclick = () => applyKernel(bordesKernel);
btnRelieve.onclick = () => applyKernel(relieveKernel);
btnLineash.onclick = () => applyKernel(lineashKernel);
btnLineasv.onclick = () => applyKernel(lineasvKernel);

// --- RUIDO Y MEDIANA (DERECHA) ---
btnNoise.onclick = () => {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    let intensity = sliderNoise.value;
    for (let i = 0; i < data.length; i += 4) {
        let noise = (Math.random() - 0.5) * intensity;
        data[i] = clamp(data[i] + noise);
        data[i + 1] = clamp(data[i + 1] + noise);
        data[i + 2] = clamp(data[i + 2] + noise);
    }
    ctx.putImageData(imageData, 0, 0);
};

btnSalt.onclick = () => {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    let prob = sliderNoise.value / 200;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < prob) {
            let val = Math.random() < 0.5 ? 0 : 255;
            data[i] = data[i+1] = data[i+2] = val;
        }
    }
    ctx.putImageData(imageData, 0, 0);
};

btnMedian.onclick = () => {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    let copy = new Uint8ClampedArray(data);
    let w = canvas.width, h = canvas.height;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let i = (y * w + x) * 4;
            let valsR = [], valsG = [], valsB = [];
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    let ii = ((y + ky) * w + (x + kx)) * 4;
                    valsR.push(copy[ii]); valsG.push(copy[ii+1]); valsB.push(copy[ii+2]);
                }
            }
            valsR.sort((a, b) => a - b); valsG.sort((a, b) => a - b); valsB.sort((a, b) => a - b);
            data[i] = valsR[4]; data[i+1] = valsG[4]; data[i+2] = valsB[4];
        }
    }
    ctx.putImageData(imageData, 0, 0);
};



// --- RESET Y DESCARGA ---
document.getElementById('btnReset').onclick = () => {
    if (!originalImage) return;
    sliderBrillo.value = 0; sliderContraste.value = 100; sliderSaturation.value = 100;
    sliderCalidad.value = 0.8; sliderEscala.value = 100;
    actualizarTextos();
    ctx.putImageData(originalImage, 0, 0);
};

document.getElementById('btnDescargar').onclick = () => {
    if (!originalImage) return;
    const escala = sliderEscala.value / 100;
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = canvas.width * escala;
    canvasTemp.height = canvas.height * escala;
    canvasTemp.getContext("2d").drawImage(canvas, 0, 0, canvasTemp.width, canvasTemp.height);
    canvasTemp.toBlob((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${nombreArchivo}_editada.${formato.value.split('/')[1]}`;
        link.click();
    }, formato.value, parseFloat(sliderCalidad.value));
};

// Eventos de entrada para ajustes en tiempo real
[sliderBrillo, sliderContraste, sliderSaturation].forEach(s => s.oninput = () => {
    actualizarTextos();
    aplicarAjustes();
});
sliderCalidad.oninput = actualizarTextos;
sliderEscala.oninput = actualizarTextos;
formato.onchange = actualizarTextos;