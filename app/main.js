/* eslint-disable no-unused-vars */
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
  // return bytes.slice( offset, offset + 10 );
  // Perform a -1 shift (first line is at offset+16, second at offset, third at offset+1, ... )
  return [bytes[offset+15]].concat( bytes.slice( offset, offset + 9 ) );
}

function bytesToBinary(bytes) {
  return bytes.reduce( (acc, octet) => {
    for (let i=7; i>=0; i--) {
      acc.push( (octet >> i) & 1 ); // NOTE: pushes bits MSB first
    }
    return acc;
  }, []);
}

// returns array[80] of binary pixels: 8 width x 10 height
function getRawCharData(charCode) {
  let bytes = getCharDataBytes(charCode);
  console.log(charCode, bytes);
  return bytesToBinary( bytes );
}

// returns array[100] of binary pixels: 10 width x 10 height
function getCharData(charCode, dot_replication = false, dot_stretching = false) {
  let raw = getRawCharData(charCode);
  let out = [];
  let pbit = 0; // previous bit on scanline
  for (let j=0; j<10; j++) {
    for (let i=0; i<8; i++) {
      let bit = raw[j*8+i]; // current bit
      // output current bit
      if (dot_stretching && pbit) { out.push(1); }
      else { out.push(bit); }
      pbit = bit;
    }
    // output two extra bits
    if (dot_replication && pbit) { out.push(1, 1); } 
    else { out.push(0, 0); }
    pbit = 0;
  }
  console.log(out);
  return out;
}


function getLineData(text) {
  let line = [ [],[],[],[],[],[],[],[],[],[] ]; // ten 'scanlines' per text line
  for (let i=0; i<text.length; i++) {
    let data = getCharData( text.charCodeAt(i) );
    for (let s=0; s<10; s++) { line[s] = line[s].concat( data.slice(s*10, s*10+10) ); }
  }
  return line;
}

function getTextData(text) {
  let lines = text.split('\n');
  return lines.reduce( (acc, line) => acc.concat(getLineData(line)), [] );
}

function getString(text, zero = '0', one = '1') {
  let data = getTextData(text);
  return data.reduce( (acc, scanline) => {
    acc.push( scanline.map( b => b ? one : zero).join('') );
    return acc;
  }, []).join('\n');
}

function drawChar(charCode, x, y, height = 10, aspect = 1, spacing = 0, dot_replication = false, dot_stretching = false) {
  let ch = getCharData(charCode, dot_replication, dot_stretching);
  for (let j=0; j<10; j++) {
    for (let i=0; i<10; i++) {
      if ( ch[j*10+i] ) { 
        ctx.fillStyle = 'black'; 
        ctx.fillRect(
          x + i*height/10*aspect * (1+spacing),
          y + j*height/10 * (1+spacing),
          height/10*aspect, height/10);
      }
    }
  }
}

function drawText(text, ox, oy, height = 10, aspect = 1, spacing = 0, dot_replication = false, dot_stretching = false) {
  let x = 0;
  let y = 0; // number of newlines (LF) encountered
  for (let i=0; i<text.length; i++) {
    let ch = text.charCodeAt(i);
    if ( ch === 10 ) { x=0; y++; continue; }
    drawChar( ch, 
      ox + x*height*aspect * (1+spacing),
      oy + y*height * (1+spacing),
      height, aspect, spacing, dot_replication, dot_stretching);
    x++;
  }
}

(async function main() {
  bytes = await load();
  console.log(bytes);
  
  src = await fetch('./app/main.js').then(res => res.text());
  console.log(src);
  
  let canvas = document.querySelector('canvas');
  ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  
  // let pad = 0.4;
  // ctx.translate((canvas.width - 16*size*(1+pad))/2, (canvas.height - 8*size*(1+pad))/2);
  // for (let j=0; j<8; j++) {
  //   for (let i=0; i<16; i++) {
  //     drawChar( j*16+i, i*size*(1+pad), j*size*(1+pad), size, 0.5 );
  //   }
  // }
  
  // drawText(rom, 100, 100, size, 0.5);
  // drawText(src, 1500, 300, size, 0.5);
  
  // drawText('OPEN\nCODES', 300, 300, 300, 1.0, 1.0);
  
  let h1 = ' code\n camp';
  let h2 = ' camp\n code';
  
  let t1 = getString(h1, String.fromCharCode(31), String.fromCharCode(1)); // dot+star
  let t2 = getString(h1, String.fromCharCode(31), String.fromCharCode(25)); // dot+vertical
  let t3 = getString(h1, String.fromCharCode(31), '\\'); // dot+backslash
  let t4 = getString(h1, String.fromCharCode(31), '>'); // dot+>
  let t5 = getString(h1, String.fromCharCode(31), String.fromCharCode(2)); // dot+ cursor
  let t6 = getString(h1, String.fromCharCode(31), '('); // dot+ (
  
  let t7 = getString(h1, '\\', '/');
  let t8 = getString(h1, '/', '\\');
  
  let t9 = getString(h1, '0', '1');
  let t10 = getString(h1, String.fromCharCode(25), String.fromCharCode(15));
  let t11 = getString(h1, String.fromCharCode(13), String.fromCharCode(11));
  let t12 = getString(h1, String.fromCharCode(60), String.fromCharCode(62));
  let t13 = getString(h1, ' ', String.fromCharCode(42));
  
  let t14 = getString(h1, 'O', 'I');
  let t15 = getString(h1, 'I', 'O');
  let t16 = getString(h1, '[', ']');
  
  // console.log(title);
  
  let size = 100;
  let cellx = 10 * size * 5;
  let celly = 10 * size * 2;
  canvas.width = cellx * 1;
  canvas.height = celly * 1;
  // drawText(title1, 0, celly, size, 1, 0, true, false);
  // drawText(title2, 0, 0, size, 1, 0, true, false);
  // drawText(title3, 0, celly*2, size, 1, 0, true, false);
  // 
  // drawText(title4, cellx, 0, size, 1, 0, true, false);
  // drawText(title5, cellx, celly, size, 1, 0, true, false);
  // drawText(title6, cellx, celly*2, size, 1, 0, true, false);
    
  // drawText(String.fromCharCode(25) + String.fromCharCode(16), 0, 0, 1000,    1.0, 0, true, false);
  // drawText('code camp', 0, 1100, 1000,   1, 0, false, false );
  
  drawText(t16, 0, 0, size, 1, 0, true, false);

})();
