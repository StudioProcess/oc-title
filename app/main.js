let src, rom;
let bytes;
let ctx;

async function load() {
  return fetch('./data/23-018E2.json')
    .then(res => res.text())
    .then(text => { rom = text; console.log(text); return text; })
    .then(text => text.replace(/\/\/.*/g, '')) // remove comments
    .then(text => text.replace(/0x[0-9a-fA-F]*/g, x => parseInt(x,16))) // convert hex literals to decimals
    .then(text => JSON.parse(text))
    .then(data => data.bytes);
}

function getCharDataBytes(charCode) {
  let offset = charCode * 16;
  return bytes.slice( offset, offset + 10 );
}

function bytesToBinary(bytes) {
  return bytes.reduce( (acc, octet) => {
    for (let i=7; i>=0; i--) {
      acc.push( (octet >> i) & 1 ); // NOTE: pushes bits MSB first
    }
    return acc;
  }, []);
}

// returns binary pixels: 8 width x 10 height
function getCharData(charCode) {
  let bytes = getCharDataBytes(charCode);
  return bytesToBinary( bytes );
}

function drawChar(charCode, x, y, height = 10, aspect = 1, spacing = 0) {
  let ch = getCharData(charCode);
  for (let j=0; j<10; j++) {
    for (let i=0; i<8; i++) {
      if ( ch[j*8+i] ) { ctx.fillStyle = 'white'; } else { ctx.fillStyle = 'black'; }
      ctx.fillRect(
        x + i*height/10*aspect * (1+spacing),
        y + j*height/10 * (1+spacing),
        height/10*aspect, height/10);
    }
  }
}

function drawText(text, ox, oy, height = 10, aspect = 1, spacing = 0) {
  let x = 0;
  let y = 0; // number of newlines (LF) encountered
  for (let i=0; i<text.length; i++) {
    let ch = text.charCodeAt(i);
    if ( ch === 10 ) { x=0; y++; continue; }
    drawChar( ch, 
      ox + x*height*aspect*(1+spacing),
      oy + y*height*(1+spacing),
      height, aspect, spacing );
    x++;
  }
}

(async function main() {
  bytes = await load();
  console.log(bytes);
  
  src = await fetch('./app/main.js').then(res => res.text());
  console.log(src);
  
  let canvas = document.querySelector('canvas');
  canvas.width = 4000;
  canvas.height = 2000;
  ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  
  let size = 20;
  // let pad = 0.4;
  // ctx.translate((canvas.width - 16*size*(1+pad))/2, (canvas.height - 8*size*(1+pad))/2);
  // for (let j=0; j<8; j++) {
  //   for (let i=0; i<16; i++) {
  //     drawChar( j*16+i, i*size*(1+pad), j*size*(1+pad), size, 0.5 );
  //   }
  // }
  
  // drawText(rom, 100, 100, size, 0.5);
  // drawText(src, 1500, 300, size, 0.5);
  
  drawText("OPEN\nCODES", 300, 300, 300, 1.0, 1.0);
})();
