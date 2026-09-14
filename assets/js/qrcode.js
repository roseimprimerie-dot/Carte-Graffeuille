/*!
 * qrcode.js — encodeur QR autonome (mode octet / UTF-8), versions 1 à 40.
 * Aucune dépendance, aucun CDN : la carte reste utilisable hors ligne.
 * Implémentation de la norme ISO/IEC 18004.
 */
(function (global) {
  'use strict';

  // Nombre de codets de correction par bloc, indexé [niveau][version-1].
  var ECC_PER_BLOCK = {
    L: [7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    M: [10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
    Q: [13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    H: [17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]
  };

  // Nombre de blocs de correction, indexé [niveau][version-1].
  var NUM_BLOCKS = {
    L: [1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
    M: [1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
    Q: [1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
    H: [1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]
  };

  var ECC_FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  /* ---------------------------------------------------------------- outils */

  // Nombre total de modules de données (en bits) disponibles pour une version.
  function rawDataModules(ver) {
    var size = ver * 4 + 17;
    var result = size * size;
    result -= 8 * 8 * 3;                 // trois détecteurs de position + séparateurs
    result -= 15 * 2 + 1;                // information de format + module noir
    result -= (size - 16) * 2;           // bandes de synchronisation
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (numAlign - 1) * (numAlign - 1) * 25;
      result -= (numAlign - 2) * 2 * 20;
      if (ver >= 7) result -= 6 * 3 * 2; // information de version
    }
    return result;
  }

  function dataCodewords(ver, ecl) {
    return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver - 1] * NUM_BLOCKS[ecl][ver - 1];
  }

  function alignPositions(ver) {
    if (ver === 1) return [];
    var numAlign = Math.floor(ver / 7) + 2;
    var size = ver * 4 + 17;
    var step = Math.ceil((size - 13) / (2 * numAlign - 2)) * 2;
    var pos = [6];
    for (var p = size - 7; pos.length < numAlign; p -= step) pos.splice(1, 0, p);
    return pos;
  }

  /* ------------------------------------------------- arithmétique de Galois */

  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  }());

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  function rsGenerator(degree) {
    var poly = [1];
    for (var i = 0; i < degree; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= gfMul(poly[j], 1);
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsRemainder(data, degree) {
    var gen = rsGenerator(degree);
    var res = new Array(degree).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res[0];
      res.shift(); res.push(0);
      for (var j = 0; j < degree; j++) res[j] ^= gfMul(gen[j + 1], factor);
    }
    return res;
  }

  /* ------------------------------------------------------------- encodage */

  function utf8Bytes(str) {
    var out = [], i, c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
        var c2 = str.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function buildCodewords(bytes, ver, ecl) {
    var bits = [];
    function push(value, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    }
    var lenBits = ver < 10 ? 8 : 16;
    push(4, 4);                 // indicateur de mode octet
    push(bytes.length, lenBits);
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var capacity = dataCodewords(ver, ecl) * 8;
    push(0, Math.min(4, capacity - bits.length));      // terminateur
    while (bits.length % 8 !== 0) bits.push(0);
    for (var pad = 0xEC; bits.length < capacity; pad ^= 0xEC ^ 0x11) push(pad, 8);

    var data = [];
    for (var k = 0; k < bits.length; k += 8) {
      var b = 0;
      for (var m = 0; m < 8; m++) b = (b << 1) | bits[k + m];
      data.push(b);
    }
    return data;
  }

  // Entrelacement des blocs de données et de correction.
  function interleave(data, ver, ecl) {
    var numBlocks = NUM_BLOCKS[ecl][ver - 1];
    var eccLen = ECC_PER_BLOCK[ecl][ver - 1];
    var totalCw = Math.floor(rawDataModules(ver) / 8);
    var shortBlocks = numBlocks - (totalCw % numBlocks);
    var shortLen = Math.floor(totalCw / numBlocks) - eccLen;

    var blocks = [], offset = 0;
    for (var i = 0; i < numBlocks; i++) {
      var len = shortLen + (i < shortBlocks ? 0 : 1);
      var dat = data.slice(offset, offset + len);
      offset += len;
      blocks.push({ data: dat, ecc: rsRemainder(dat, eccLen) });
    }

    var out = [];
    for (var j = 0; j < shortLen + 1; j++)
      for (var b = 0; b < numBlocks; b++)
        if (j < blocks[b].data.length) out.push(blocks[b].data[j]);
    for (var e = 0; e < eccLen; e++)
      for (var b2 = 0; b2 < numBlocks; b2++) out.push(blocks[b2].ecc[e]);
    return out;
  }

  /* -------------------------------------------------------------- matrice */

  function Matrix(size) {
    this.size = size;
    this.modules = [];
    this.reserved = [];
    for (var i = 0; i < size; i++) {
      this.modules.push(new Uint8Array(size));
      this.reserved.push(new Uint8Array(size));
    }
  }
  Matrix.prototype.set = function (x, y, dark, reserve) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    this.modules[y][x] = dark ? 1 : 0;
    if (reserve) this.reserved[y][x] = 1;
  };

  function drawFunctionPatterns(m, ver, ecl) {
    var size = m.size, i, j;

    // Bandes de synchronisation
    for (i = 0; i < size; i++) {
      m.set(6, i, i % 2 === 0, true);
      m.set(i, 6, i % 2 === 0, true);
    }

    // Détecteurs de position + séparateurs
    [[0, 0], [size - 7, 0], [0, size - 7]].forEach(function (p) {
      for (var dy = -1; dy <= 7; dy++)
        for (var dx = -1; dx <= 7; dx++) {
          var x = p[0] + dx, y = p[1] + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          var d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
          m.set(x, y, d !== 2 && d !== 4, true);
        }
    });

    // Motifs d'alignement
    var pos = alignPositions(ver);
    for (i = 0; i < pos.length; i++)
      for (j = 0; j < pos.length; j++) {
        var skip = (i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0);
        if (skip) continue;
        for (var ay = -2; ay <= 2; ay++)
          for (var ax = -2; ax <= 2; ax++)
            m.set(pos[j] + ax, pos[i] + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1, true);
      }

    // Emplacements réservés à l'information de format
    for (i = 0; i < 9; i++) { m.set(i, 8, false, true); m.set(8, i, false, true); }
    for (i = 0; i < 8; i++) { m.set(size - 1 - i, 8, false, true); m.set(8, size - 1 - i, false, true); }
    m.set(8, size - 8, true, true); // module toujours noir

    // Information de version (version 7 et au-delà)
    if (ver >= 7) {
      var rem = ver;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var bits = (ver << 12) | rem;
      for (i = 0; i < 18; i++) {
        var bit = ((bits >>> i) & 1) === 1;
        var a = size - 11 + (i % 3), b = Math.floor(i / 3);
        m.set(a, b, bit, true);
        m.set(b, a, bit, true);
      }
    }
  }

  function drawFormat(m, ecl, mask) {
    var data = (ECC_FORMAT_BITS[ecl] << 3) | mask;
    var rem = data;
    for (var k = 0; k < 10; k++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    var size = m.size, i;
    for (i = 0; i <= 5; i++) m.set(8, i, ((bits >>> i) & 1) === 1, true);
    m.set(8, 7, ((bits >>> 6) & 1) === 1, true);
    m.set(8, 8, ((bits >>> 7) & 1) === 1, true);
    m.set(7, 8, ((bits >>> 8) & 1) === 1, true);
    for (i = 9; i < 15; i++) m.set(14 - i, 8, ((bits >>> i) & 1) === 1, true);
    for (i = 0; i < 8; i++) m.set(size - 1 - i, 8, ((bits >>> i) & 1) === 1, true);
    for (i = 8; i < 15; i++) m.set(8, size - 15 + i, ((bits >>> i) & 1) === 1, true);
  }

  function drawCodewords(m, codewords) {
    var size = m.size, i = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var k = 0; k < 2; k++) {
          var x = right - k;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (m.reserved[y][x]) continue;
          if (i < codewords.length * 8) {
            m.modules[y][x] = (codewords[i >>> 3] >>> (7 - (i & 7))) & 1;
            i++;
          }
        }
      }
    }
  }

  function maskFn(mask, x, y) {
    switch (mask) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
      case 5: return (x * y) % 2 + (x * y) % 3 === 0;
      case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
      case 7: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    }
  }

  function applyMask(m, mask) {
    for (var y = 0; y < m.size; y++)
      for (var x = 0; x < m.size; x++)
        if (!m.reserved[y][x] && maskFn(mask, x, y)) m.modules[y][x] ^= 1;
  }

  function penalty(m) {
    var size = m.size, score = 0, x, y;

    function runPenalty(run) { return run >= 5 ? 3 + (run - 5) : 0; }

    for (y = 0; y < size; y++) {
      var run = 1;
      for (x = 1; x < size; x++) {
        if (m.modules[y][x] === m.modules[y][x - 1]) run++;
        else { score += runPenalty(run); run = 1; }
      }
      score += runPenalty(run);
    }
    for (x = 0; x < size; x++) {
      var runv = 1;
      for (y = 1; y < size; y++) {
        if (m.modules[y][x] === m.modules[y - 1][x]) runv++;
        else { score += runPenalty(runv); runv = 1; }
      }
      score += runPenalty(runv);
    }
    for (y = 0; y < size - 1; y++)
      for (x = 0; x < size - 1; x++) {
        var v = m.modules[y][x];
        if (v === m.modules[y][x + 1] && v === m.modules[y + 1][x] && v === m.modules[y + 1][x + 1]) score += 3;
      }

    var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    function matches(get, start) {
      for (var p = 0; p < 11; p++) if (get(start + p) !== pat1[p]) return false;
      return true;
    }
    function matches2(get, start) {
      for (var p = 0; p < 11; p++) if (get(start + p) !== pat2[p]) return false;
      return true;
    }
    for (y = 0; y < size; y++) {
      var rowGet = (function (yy) { return function (i) { return i < 0 || i >= size ? 0 : m.modules[yy][i]; }; }(y));
      for (x = 0; x <= size - 11; x++) {
        if (matches(rowGet, x)) score += 40;
        if (matches2(rowGet, x)) score += 40;
      }
    }
    for (x = 0; x < size; x++) {
      var colGet = (function (xx) { return function (i) { return i < 0 || i >= size ? 0 : m.modules[i][xx]; }; }(x));
      for (y = 0; y <= size - 11; y++) {
        if (matches(colGet, y)) score += 40;
        if (matches2(colGet, y)) score += 40;
      }
    }

    var dark = 0;
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) dark += m.modules[y][x];
    var ratio = dark * 100 / (size * size);
    score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
    return score;
  }

  /* ------------------------------------------------------------ interface */

  /**
   * Construit la matrice d'un QR code.
   * @param {string} text      contenu à encoder
   * @param {string} [ecl]     niveau de correction : 'L', 'M', 'Q' ou 'H'
   * @returns {{size:number, modules:Uint8Array[], version:number}}
   */
  function encode(text, ecl) {
    ecl = ecl || 'M';
    if (!ECC_PER_BLOCK[ecl]) throw new Error('Niveau de correction inconnu : ' + ecl);
    var bytes = utf8Bytes(String(text));

    var ver = 0;
    for (var v = 1; v <= 40; v++) {
      var header = 4 + (v < 10 ? 8 : 16);
      if (header + bytes.length * 8 <= dataCodewords(v, ecl) * 8) { ver = v; break; }
    }
    if (!ver) throw new Error('Contenu trop long pour un QR code (' + bytes.length + ' octets)');

    var codewords = interleave(buildCodewords(bytes, ver, ecl), ver, ecl);

    var best = null;
    for (var mask = 0; mask < 8; mask++) {
      var m = new Matrix(ver * 4 + 17);
      drawFunctionPatterns(m, ver, ecl);
      drawCodewords(m, codewords);
      drawFormat(m, ecl, mask);
      applyMask(m, mask);
      var p = penalty(m);
      if (!best || p < best.penalty) best = { matrix: m, penalty: p };
    }
    return { size: best.matrix.size, modules: best.matrix.modules, version: ver };
  }

  /**
   * Rend un QR code sous forme de chemin SVG unique, normalisé dans un carré
   * de `extent` unités (marge silencieuse de 4 modules comprise).
   */
  function toSvgPath(text, ecl, extent, quiet) {
    var qr = encode(text, ecl);
    quiet = quiet == null ? 4 : quiet;
    var total = qr.size + quiet * 2;
    var unit = extent / total;
    var d = [];
    for (var y = 0; y < qr.size; y++) {
      var x = 0;
      while (x < qr.size) {
        if (!qr.modules[y][x]) { x++; continue; }
        var run = 1;
        while (x + run < qr.size && qr.modules[y][x + run]) run++;
        var px = (x + quiet) * unit, py = (y + quiet) * unit;
        d.push('M' + px.toFixed(3) + ' ' + py.toFixed(3) +
               'h' + (run * unit).toFixed(3) + 'v' + unit.toFixed(3) +
               'h' + (-run * unit).toFixed(3) + 'z');
        x += run;
      }
    }
    return { path: d.join(''), version: qr.version, size: qr.size };
  }

  global.QRCode = { encode: encode, toSvgPath: toSvgPath };
}(typeof window !== 'undefined' ? window : globalThis));
