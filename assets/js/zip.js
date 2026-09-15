/*!
 * zip.js — écriture d'archives ZIP dans le navigateur, sans compression.
 *
 * L'éditeur s'en sert pour livrer d'un coup le dossier d'un employé, prêt à
 * être déposé dans le dépôt. Les fichiers sont stockés tels quels : quelques
 * kilo-octets de texte ne valent pas d'embarquer un compresseur.
 */
(function (global) {
  'use strict';

  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  }());

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /** Date et heure au format MS-DOS, seul format que porte l'en-tête ZIP. */
  function dosStamp(date) {
    var time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    var day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time: time, date: day };
  }

  function pack(parts) {
    var size = parts.reduce(function (n, p) { return n + p.length; }, 0);
    var out = new Uint8Array(size), at = 0;
    parts.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  }

  function u16(v) { return new Uint8Array([v & 255, (v >>> 8) & 255]); }
  function u32(v) { return new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]); }

  /**
   * Construit l'archive à partir d'un objet { "chemin/fichier": contenu }.
   * @returns {Blob}
   */
  function create(files) {
    var enc = new TextEncoder();
    var stamp = dosStamp(new Date());
    var local = [], central = [], offset = 0;

    Object.keys(files).forEach(function (path) {
      var name = enc.encode(path);
      var body = enc.encode(files[path]);
      var sum = crc32(body);
      // 0x0800 : le nom de fichier est en UTF-8.
      var head = pack([u32(0x04034B50), u16(20), u16(0x0800), u16(0),
                       u16(stamp.time), u16(stamp.date), u32(sum),
                       u32(body.length), u32(body.length),
                       u16(name.length), u16(0), name]);
      local.push(head, body);
      central.push(pack([u32(0x02014B50), u16(20), u16(20), u16(0x0800), u16(0),
                         u16(stamp.time), u16(stamp.date), u32(sum),
                         u32(body.length), u32(body.length),
                         u16(name.length), u16(0), u16(0), u16(0), u16(0),
                         u32(0), u32(offset), name]));
      offset += head.length + body.length;
    });

    var dir = pack(central);
    var end = pack([u32(0x06054B50), u16(0), u16(0),
                    u16(central.length), u16(central.length),
                    u32(dir.length), u32(offset), u16(0)]);
    return new Blob([pack(local), dir, end], { type: 'application/zip' });
  }

  global.Zip = { create: create };
}(window));
