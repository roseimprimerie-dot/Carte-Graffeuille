(function (global) {
  'use strict';

  var TRIM_W = 54, TRIM_H = 85, BLEED = 5, MARK_LEN = 5, MARK_GAP = 2;

  // Repères verticaux repris des anciennes cartes
  
  var GEO = {
    recto: {
      arrow:      { x: 5.62, y: 56.83, size: 5.22 },
      taglineX:   6.375,
      taglineY:   62.13,
      taglineLead: 3.53,
      taglineSize: 3.175
    },
    verso: {
      qr:         { x: 6.11, y: 5.83, size: 24.19 },
      // Le verso suit une grille régulière, relevée sur les cartes fournies :
      // 3,88 mm (11 pt) entre deux lignes du bloc identité, 5,88 mm entre la
      // dernière ligne du nom et la fonction, et un bloc de contact qui ne
      // descend que lorsque l'identité déborde sur lui.
      ident:      { x: 8.40, baseline: 35.39, lead: 3.88, gapToRole: 5.88,
                    nameSize: 4.233, roleSize: 3.528, departmentSize: 3.175,
                    band: { x: 7.40, height: 4.233, padding: 1.0, rise: 1.12 } },
      rows:       { iconX: 7.28, textX: 11.40, size: 3.175, lead: 4.24,
                    baseline: 53.66, clearance: 7.13, max: 3 },
      address:    { baseline: 70.00, lead: 2.822, size: 2.822, iconGap: 1.0,
                    pinSize: 3.175, pinDrop: 0.19 }
    }
  };

  // Roboto Condensed tient lieu d'Author, la fonte du fichier d'origine, qui
  // est sous licence commerciale. Ses largeurs la reproduisent à 0,4 % près sur
  // les chaînes des cartes fournies, alors qu'un grotesque de largeur normale
  // déborde de plus de 20 % — de quoi faire passer un nom sur deux lignes.
  var FONT = "'Roboto Condensed','Roboto Condensed Fallback',"
           + "'Helvetica Neue Condensed','Arial Narrow',Helvetica,Arial,sans-serif";

  // Les pictogrammes se posent sur la ligne de base comme un caractère : c'est
  // ainsi que le fichier d'origine les place, et leur repère le permet.
  function icon(name, x, baseline, size, fill) {
    return Icons.group(name, f(x), f(baseline), size, fill);
  }

  /* ------------------------------------------------------------------ outils */

  function f(n) { return (Math.round(n * 1000) / 1000).toString(); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function text(str, opts) {
    if (!str) return '';
    var a = [];
    a.push('x="' + f(opts.x) + '"', 'y="' + f(opts.y) + '"');
    a.push('font-family="' + FONT + '"');
    a.push('font-size="' + f(opts.size) + '"');
    a.push('fill="' + (opts.fill || '#111') + '"');
    if (opts.weight) a.push('font-weight="' + opts.weight + '"');
    if (opts.italic) a.push('font-style="italic"');
    if (opts.anchor) a.push('text-anchor="' + opts.anchor + '"');
    if (opts.spacing) a.push('letter-spacing="' + f(opts.spacing) + '"');
    if (opts.id) a.push('id="' + opts.id + '"');
    if (opts.cls) a.push('class="' + opts.cls + '"');
    if (opts.data) a.push(opts.data);
    return '<text ' + a.join(' ') + '>' + esc(str) + '</text>';
  }

  // Flèche diagonale du recto, redessinée en vectoriel (elle est un glyphe
  // dans le fichier d'origine, donc non reproductible sans la fonte).
  function arrow(g, color) {
    var s = g.size, th = s * 0.10, head = s * 0.30, half = s * 0.19;
    var d = 'M0 ' + f(-th / 2) + 'H' + f(s - head) + 'V' + f(-half)
          + 'L' + f(s) + ' 0L' + f(s - head) + ' ' + f(half)
          + 'V' + f(th / 2) + 'H0Z';
    return '<g transform="translate(' + f(g.x) + ' ' + f(g.y) + ') rotate(45)">'
         + '<path d="' + d + '" fill="' + color + '"/></g>';
  }

  function cropMarks(color) {
    var o = BLEED, L = MARK_LEN, G = MARK_GAP, p = [];
    function line(x1, y1, x2, y2) {
      p.push('M' + f(x1) + ' ' + f(y1) + 'L' + f(x2) + ' ' + f(y2));
    }
    [[0, 0], [TRIM_W, 0], [0, TRIM_H], [TRIM_W, TRIM_H]].forEach(function (c) {
      var sx = c[0] === 0 ? -1 : 1, sy = c[1] === 0 ? -1 : 1;
      line(c[0] + sx * G, c[1], c[0] + sx * (G + L), c[1]);
      line(c[0], c[1] + sy * G, c[0], c[1] + sy * (G + L));
    });
    return '<path d="' + p.join('') + '" fill="none" stroke="' + color
         + '" stroke-width="0.15"/>';
  }

  /* ------------------------------------------------------------------ rendu */

  function open(opts) {
    var bleed = opts.bleed ? BLEED : 0;
    var w = TRIM_W + bleed * 2, h = TRIM_H + bleed * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
         + ' viewBox="' + f(-bleed) + ' ' + f(-bleed) + ' ' + f(w) + ' ' + f(h) + '"'
         + ' width="' + f(w) + 'mm" height="' + f(h) + 'mm"'
         + ' class="' + (opts.className || '') + '" role="img"'
         + ' aria-label="' + esc(opts.label || '') + '">';
  }

  function background(opts, color) {
    var bleed = opts.bleed ? BLEED : 0;
    return '<rect x="' + f(-bleed) + '" y="' + f(-bleed) + '" width="' + f(TRIM_W + bleed * 2)
         + '" height="' + f(TRIM_H + bleed * 2) + '" fill="' + color + '"/>';
  }

  /** Recto : aplat de couleur, logo, accroche. */
  function renderFront(d, opts) {
    opts = opts || {};
    var g = GEO.recto, accent = d.accent || '#E63329', ink = d.frontInk || '#FFFFFF';
    var out = [open({ bleed: opts.bleed, className: 'card-svg card-front',
                      label: 'Recto : ' + (d.company || 'GRAFFEUILLE') })];

    out.push(background(opts, accent));
    out.push('<path d="' + LOGO.mark + '" fill="' + ink + '"/>');
    out.push('<path d="' + LOGO.wordmark + '" fill="' + ink + '"/>');
    if (d.showBaseline !== false) out.push('<path d="' + LOGO.tagline + '" fill="' + ink + '"/>');

    var lines = String(d.tagline || '').split('\n').filter(function (l) { return l.trim(); });
    if (lines.length) {
      out.push(arrow(g.arrow, ink));
      lines.forEach(function (line, i) {
        out.push(text(line, { x: g.taglineX, y: g.taglineY + i * g.taglineLead,
                              size: g.taglineSize, fill: ink, weight: 500, spacing: -0.01 }));
      });
    }

    if (opts.marks) out.push(cropMarks(ink));
    out.push('</svg>');
    return out.join('');
  }

  /**
   * Lignes du bloc identité, posées sur la grille du verso. `wrap` porte les
   * coupures décidées après mesure du texte ; sans lui, chaque champ tient sur
   * une seule ligne.
   */
  function identityLines(d, wrap) {
    var g = GEO.verso.ident;
    wrap = wrap || {};
    var parts = [];
    (wrap.name || [Contact.fullName(d)]).forEach(function (t) {
      if (t) parts.push({ kind: 'name', text: t, size: g.nameSize });
    });
    (wrap.role || String(d.role || '').split('\n')).forEach(function (t) {
      if (t && t.trim()) parts.push({ kind: 'role', text: t.trim(), size: g.roleSize });
    });
    if (d.department) {
      parts.push({ kind: 'department', text: d.department, size: g.departmentSize });
    }
    if (!parts.length) parts.push({ kind: 'name', text: '', size: g.nameSize });

    var y = g.baseline, previous = null;
    parts.forEach(function (line) {
      if (previous) y += (previous === 'name' && line.kind !== 'name') ? g.gapToRole : g.lead;
      line.baseline = y;
      previous = line.kind;
    });
    return parts;
  }

  /** Verso : filigrane, QR vCard, coordonnées. */
  function renderBack(d, opts) {
    opts = opts || {};
    var g = GEO.verso, accent = d.accent || '#E63329';
    var uid = 'c' + Math.random().toString(36).slice(2, 8);
    var bleed = opts.bleed ? BLEED : 0;
    var out = [open({ bleed: opts.bleed, className: 'card-svg card-back',
                      label: 'Verso : coordonnées de ' + [d.firstName, d.lastName].join(' ') })];

    out.push(background(opts, '#FFFFFF'));

    // Filigrane : le symbole agrandi, détouré, rogné au format de la carte.
    if (d.watermark !== false) {
      out.push('<defs><clipPath id="clip-' + uid + '"><rect x="' + f(-bleed) + '" y="' + f(-bleed)
             + '" width="' + f(TRIM_W + bleed * 2) + '" height="' + f(TRIM_H + bleed * 2) + '"/></clipPath></defs>');
      out.push('<g clip-path="url(#clip-' + uid + ')"><path d="' + LOGO.watermark
             + '" fill="none" stroke="' + accent + '" stroke-width="0.176"/></g>');
    }

    // QR code : il mène à la page publique, régénéré à chaque modification.
    try {
      var qr = QRCode.toSvgPath(d.qrPayload || '', d.qrLevel || 'M', g.qr.size, 4);
      out.push('<rect x="' + f(g.qr.x) + '" y="' + f(g.qr.y) + '" width="' + f(g.qr.size)
             + '" height="' + f(g.qr.size) + '" fill="#FFFFFF"/>');
      out.push('<g transform="translate(' + f(g.qr.x) + ' ' + f(g.qr.y) + ')">'
             + '<path d="' + qr.path + '" fill="' + (d.qrColor || '#111111') + '"/></g>');
    } catch (err) {
      out.push(text('QR indisponible', { x: g.qr.x, y: g.qr.y + 5, size: 2.5, fill: '#999' }));
    }

    // Bloc identité : chaque ligne de nom porte son propre bandeau rouge,
    // ajusté à sa largeur après rendu.
    var lines = identityLines(d, opts.wrap);
    lines.forEach(function (line, i) {
      if (line.kind === 'name') {
        out.push('<rect class="band-' + uid + '" data-line="' + i + '" x="' + f(g.ident.band.x)
               + '" y="' + f(line.baseline - g.ident.band.height + g.ident.band.rise)
               + '" width="' + f(TRIM_W - g.ident.band.x * 2)
               + '" height="' + f(g.ident.band.height) + '" fill="' + accent + '"/>');
      }
      out.push(text(line.text, {
        x: g.ident.x, y: line.baseline, size: line.size,
        fill: line.kind === 'name' ? '#FFFFFF' : '#111111',
        weight: line.kind === 'department' ? 400 : (line.kind === 'name' ? 600 : 500),
        italic: line.kind === 'role',
        cls: line.kind === 'name' ? 'name-' + uid : 'ident-' + uid,
        data: 'data-line="' + i + '"'
      }));
    });

    // Lignes de contact : elles ne descendent que si le bloc identité vient à
    // leur rencontre, comme sur les cartes à nom ou fonction longs.
    var lastIdent = lines[lines.length - 1].baseline;
    var firstRow = Math.max(g.rows.baseline, lastIdent + g.rows.clearance);
    var rows = [];
    if (d.phone) rows.push(['phone', d.phone]);
    Contact.emails(d).forEach(function (address) { rows.push(['mail', address]); });
    if (d.website && d.websiteInContacts) rows.push(['globe', d.website]);
    rows.slice(0, g.rows.max).forEach(function (row, i) {
      var base = firstRow + i * g.rows.lead;
      out.push(icon(row[0], g.rows.iconX, base, g.rows.size, accent));
      out.push(text(row[1], { x: g.rows.textX, y: base, size: g.rows.size,
                              fill: '#111111', weight: 500, cls: 'row-' + uid }));
    });

    // Bloc adresse centré, pictogramme inclus dans le centrage de la 1re ligne.
    var a = g.address, cx = TRIM_W / 2;
    var addr = [];
    if (d.company) addr.push({ str: d.company, weight: 700, pin: true });
    if (d.street) addr.push({ str: d.street, weight: 400 });
    var cityLine = [d.postalCode, d.city].filter(Boolean).join(' ')
                 + (d.country ? ' - ' + d.country : '');
    if (cityLine.trim()) addr.push({ str: cityLine.trim(), weight: 400 });
    if (d.website) addr.push({ str: d.website, weight: 500 });

    addr.forEach(function (line, i) {
      var y = a.baseline + i * a.lead;
      if (line.pin) {
        // La ligne est décalée pour laisser place au pictogramme à sa gauche.
        out.push(text(line.str, { x: cx + a.size * 0.45, y: y, size: a.size,
                                  fill: '#111111', weight: line.weight, anchor: 'middle',
                                  id: 'org-' + uid }));
        out.push('<g id="pin-' + uid + '">'
               + icon('pin', cx - a.size * 0.45, y + a.pinDrop, a.pinSize, accent) + '</g>');
      } else {
        out.push(text(line.str, { x: cx, y: y, size: a.size, fill: '#111111',
                                  weight: line.weight, anchor: 'middle' }));
      }
    });

    if (opts.marks) out.push(cropMarks(accent));
    out.push('</svg>');
    return out.join('');
  }

  /* ------------------------------------------------- mise en page mesurée */

  /** Place de coupure d'une chaîne trop large, cherchée sur les espaces. */
  function breakPoint(el, room) {
    var str = el.textContent, best = 0;
    for (var i = 0; i < str.length; i++) {
      if (str.charAt(i) !== ' ') continue;
      if (el.getSubStringLength(0, i) <= room) best = i;
      else break;
    }
    if (!best) return null;
    return [str.slice(0, best), str.slice(best + 1)];
  }

  /**
   * Décide les coupures du bloc identité à partir du texte réellement rendu.
   * Renvoie null si tout tient déjà sur une ligne.
   */
  function measureWrap(svgEl) {
    var g = GEO.verso.ident, wrap = null;
    // Seuils relevés sur les cartes fournies : le bandeau du nom va jusqu'au
    // bord du format coupé, et la plus longue adresse courriel s'arrête à
    // 1,6 mm de ce bord.
    var nameRoom = TRIM_W - g.band.x - g.band.padding * 2 - 0.5;
    var roleRoom = TRIM_W - g.x - 1.6;

    var names = svgEl.querySelectorAll('[class^="name-"]');
    if (names.length === 1) {
      try {
        if (names[0].getComputedTextLength() > nameRoom) {
          var split = breakPoint(names[0], nameRoom);
          if (split) wrap = { name: split };
        }
      } catch (e) { return null; }
    }

    var role = svgEl.querySelector('[class^="ident-"]');
    if (role) {
      try {
        if (role.getComputedTextLength() > roleRoom) {
          var rsplit = breakPoint(role, roleRoom);
          if (rsplit) (wrap = wrap || {}).role = rsplit;
        }
      } catch (e) { /* mesure indisponible */ }
    }
    return wrap;
  }

  /**
   * Ajuste, une fois le SVG dans le document, ce qui demande de mesurer le
   * texte : largeur des bandeaux rouges, resserrement des lignes de contact
   * trop longues, et centrage du pictogramme de l'adresse.
   */
  function fitBand(svgEl) {
    if (!svgEl) return;
    var g = GEO.verso;

    // Chaque bandeau épouse la ligne de nom qu'il porte.
    var names = svgEl.querySelectorAll('[class^="name-"]');
    Array.prototype.forEach.call(names, function (el) {
      var band = svgEl.querySelector('rect[class^="band-"][data-line="'
                                     + el.getAttribute('data-line') + '"]');
      if (!band) return;
      var w = 0;
      try { w = el.getComputedTextLength(); } catch (e) { return; }
      band.setAttribute('width', Math.max(w + g.ident.band.padding * 2, 4));
      band.setAttribute('x', g.ident.x - g.ident.band.padding);
    });

    // Les lignes de contact se resserrent quand l'une d'elles déborde, comme
    // le fait la carte d'origine pour les adresses les plus longues.
    var rows = svgEl.querySelectorAll('[class^="row-"]');
    if (rows.length) {
      var widest = 0;
      try {
        Array.prototype.forEach.call(rows, function (el) {
          widest = Math.max(widest, el.getComputedTextLength());
        });
      } catch (e) { widest = 0; }
      var room = TRIM_W - g.rows.textX - 1.6;
      if (widest > room) {
        var size = Math.max(g.rows.size * room / widest, g.rows.size * 0.8);
        Array.prototype.forEach.call(rows, function (el) {
          el.setAttribute('font-size', f(size));
        });
      }
    }

    var org = svgEl.querySelector('[id^="org-"]');
    var pin = svgEl.querySelector('[id^="pin-"] path');
    if (org && pin) {
      var ow = 0;
      try { ow = org.getComputedTextLength(); } catch (e) { return; }
      var a = g.address, cx = TRIM_W / 2;
      var glyph = Icons.glyphs.pin.box;
      var drawn = (glyph[2] - glyph[0]) / Icons.UPEM * a.pinSize;
      var left = cx + a.size * 0.45 - ow / 2 - a.iconGap - drawn;
      var k = a.pinSize / Icons.UPEM;
      pin.parentNode.setAttribute('transform', 'translate(' + f(left) + ' '
        + f(a.baseline + a.pinDrop) + ') scale(' + k.toFixed(6) + ' ' + (-k).toFixed(6) + ')');
    }
  }

  /**
   * Pose le verso dans un élément du document : un premier rendu sert à
   * mesurer le texte, un second applique les coupures qui en découlent, puis
   * les ajustements de détail. C'est le seul chemin qui produit une mise en
   * page juste — le rendu direct ne sait pas ce que mesure le texte.
   */
  function backInto(host, d, opts) {
    opts = opts || {};
    host.innerHTML = renderBack(d, opts);
    var wrap = measureWrap(host.firstElementChild);
    if (wrap) {
      host.innerHTML = renderBack(d, Object.assign({}, opts, { wrap: wrap }));
    }
    fitBand(host.firstElementChild);
    return host.firstElementChild;
  }

  global.Card = {
    TRIM_W: TRIM_W, TRIM_H: TRIM_H, BLEED: BLEED,
    front: renderFront, back: renderBack, backInto: backInto, fitBand: fitBand
  };
}(window));
