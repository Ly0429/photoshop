const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const upload = document.getElementById('upload');
const sliderBrillo = document.getElementById('brillo');
const sliderContraste = document.getElementById('contraste');
const sliderCalidad = document.getElementById('calidad');
const sliderEscala = document.getElementById('escala');

const valorBrillo = document.getElementById('valorBrillo');
const valorContraste = document.getElementById('valorContraste');
const valorCalidad = document.getElementById('valorCalidad');
const valorEscala = document.getElementById('valorEscala');

const formato = document.getElementById('formato');
const notaCalidad = document.getElementById('notaCalidad');
const btnReset = document.getElementById('btnReset');
const btnDescargar = document.getElementById('btnDescargar');
const info = document.getElementById('info');
const placeholder = document.getElementById('placeholder');



let originalImage = null;
let nombreArchivo =  "imagen_editada";

function clamp(v){
return Math.max(0, Math.min(255, v));
}


function actualizarTextos(){
  const brillo = parseInt(sliderBrillo.value, 10);
  const contraste = parseInt(sliderContraste.value, 10) / 100;
  const calidad = parseInt(sliderCalidad.value);
  const escala = parseInt(sliderEscala.value, 10);

  valorBrillo.textContent = brillo;
  valorContraste.textContent = contraste.toFixed(2);
  valorCalidad.textContent = calidad.toFixed(1);
  valorEscala.textContent = escala + "%";
}

function mostrarInfo(texto){
  info.innerHTML = texto;
}


function aplicarAjustes(){
  if(!originalImage) return;

  const brillo = parseInt(sliderBrillo.value, 10);
  const contraste = parseInt(sliderContraste.value, 10) / 100;

  const imageData = new ImageData(
    new Uint8ClampedArray(originalImage.data),
    originalImage.width,
    originalImage.height
  );

  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4){
    data[i] = clamp((data[i] - 128) * contraste + 128 + brillo);
    data[i + 1] = clamp((data[i + 1] - 128) * contraste + 128 + brillo);
    data[i + 2] = clamp((data[i + 2] - 128) * contraste + 128 + brillo);
}


ctx.putImageData(imageData, 0,0);

mostrarInfo(`
  <strong>Imagen cargada:</strong> ${nombreArchivo}<br>
  <strong>Resolucion actual: </strong> ${canvas.width} X ${canvas.height}px <br>
  <strong>Brillo: </strong> ${brillo} <br>
  <strong>Contraste: </strong> ${contraste.toFixed(2)} <br>
  <strong>Formato de descarga: </strong> ${formato.options[formato.selectedIndex].text} <br>
  <strong>Calidad: </strong> ${parseFloat(sliderCalidad.value).toFixed(1)} <br>
  <strong>Escala de salida: </strong> ${sliderEscala.value} <br>
`)
}

function resetearEdicion(){
  if(!originalImage) return;

  sliderBrillo.value = 0;
  sliderContraste.value = 100;
  sliderCalidad.value = 0.8;
  sliderEscala.value = 100;
  formato.value = "image/png";

  actualizarTextos();
  ctx.putImageData(originalImage,0,0);

  mostrarInfo(`
    <strong>Imagen restaurada.</strong><br>
    Resolucion: ${canvas.width} X ${canvas.height} px
    `);
}

upload.addEventListener("change", function(e){
  const file = e.target.files[0];
  if(!file) return;

  nombreArchivo = file.name.replace(/\.[^/.]+$/, "");

  const img = new Image();

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
  



ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0);
originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

canvas.classList.remove("oculto");
placeholder.classList.add("oculto");

sliderBrillo.value = 0;
sliderContraste.value = 100;

actualizarTextos();
aplicarAjustes();
};

img.onerror = function(){
  alert("no se pudo cargar la imagen");
};

img.src = URL.createObjectURL(file);
});

sliderBrillo.addEventListener("input", function(){
  actualizarTextos();
  aplicarAjustes();
});

sliderContraste.addEventListener("input", function(){
  actualizarTextos();
  aplicarAjustes();
});

sliderCalidad.addEventListener("input", actualizarTextos);
sliderEscala.addEventListener("input", actualizarTextos);
formato.addEventListener("change", actualizarTextos);


btnReset.addEventListener("click", resetearEdicion);

btnDescargar.addEventListener("click", function(){
  if(!originalImage){
    alert("Primero carga una imagen.");
    return;
  }
const escala = parseInt(sliderEscala.value, 10) / 100;
const mimeType = formato.value;
const calidad = parseFloat(sliderCalidad.value);


const anchoSalida = Math.max(1, Math.round(canvas.width * escala));
const altoSalida= Math.max(1, Math.round(canvas.height * escala));

const canvasTemporal = document.createElement("canvas");
const ctxTemporal = canvasTemporal.getContext("2d");

canvasTemporal.width = anchoSalida;
canvasTemporal.height  = altoSalida;

ctxTemporal.drawImage(canvas, 0, 0, anchoSalida, altoSalida);

const extension = mimeType === "image/png"
? "png"
: mimeType === "image/jpeg"
? "jpg"
: "webp";

if (mimeType === "image/png"){
  canvasTemporal.toBlob(function (blob){
    if (!blob){
      alert("No se pudo generar el archivo.");
      return;
    }
    descargarBlob(blob,`${nombreArchivo}_editada.${extension}`);
  }, mimeType);
} else{
  canvasTemporal.toBlob(function (blob) {
    if (!blob){
      alert("No se pudo generar el archivo.");
      return;
    }
    descargarBlob(blob, `${nombreArchivo}_editada.${extension}`);
  }, mimeType, calidad);
}
});

function descargarBlob(blob, nombre){
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

actualizarTextos();