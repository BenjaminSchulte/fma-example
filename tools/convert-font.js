// This is a simple file used to convert the font into a binary file format
const pngparse = require('pngparse');
const fs = require('fs');

if (process.argv.length < 4) {
  throw new Error('Missing arguments. Usage: convert-font.js [input.png] [output.bin]');
}

function writeTile(data, offset, buffer, bufferIndex) {
  for (var y=0; y<8; y++) {
    var b0 = 0;
    var b1 = 0;

    for (var x=0; x<8; x++) {
      var isTransparent = data.data[offset + x + x + 1] < 128;
      var color = isTransparent ? 0 : (1 + Math.round(data.data[offset + x + x] / 100));

      b0 |= (color & 1) << (7 - x);
      b1 |= ((color >> 1) & 1) << (7 - x);
    }

    buffer[bufferIndex++] = b0;
    buffer[bufferIndex++] = b1;

    offset += data.width * 2;
  }
}

pngparse.parseFile(process.argv[2], function(err, data) {
  if (err) {
    throw err;
  }

  if (data.channels !== 2) {
    throw new Error(`Can only convert grayscale images with alpha`);
  }

  var actualHeight = Math.floor(data.height / 8) * 8;
  var actualWidth = Math.floor(data.width / 8) * 8;
  var numTiles = actualWidth * actualHeight / 8 / 8;
  var buffer = new Uint8Array(numTiles * 8 * 2 * 2);
  var bufferIndex = 0;
  var numTilesThisRow = 0;
  
  for (var tileY=0; tileY<actualHeight; tileY += 8) {
    for (var tileX=0; tileX<actualWidth; tileX += 8) {
      var offset = (tileX + tileY * data.width) * 2;

      writeTile(data, offset, buffer, bufferIndex);
      
      bufferIndex += 8 * 2 * 2;
    }
  }

  fs.writeFileSync(process.argv[3], new Buffer(buffer));
  console.log('Done.');
})