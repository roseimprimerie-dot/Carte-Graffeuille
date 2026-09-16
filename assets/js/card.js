(function (global) {
  'use strict';

  // Fond perdu de 3 mm, conforme à la BleedBox du fichier d'impression fourni
  // (60 x 91 mm pour un format coupé de 54 x 85). Les traits de coupe partent
  // du bord coupé et traversent ce fond perdu : la page doit donc être plus
  // grande que lui, d'où une marge propre aux traits.
  var TRIM_W = 54, TRIM_H = 85, BLEED = 3;
  // Les deux traits d'un même coin partent à MARK_GAP du bord coupé, donc ne
  // se rejoignent pas : un angle fermé désigne mal le point de coupe, et c'est
  // un angle ouvert que porte le fichier de référence.
  var MARK_GAP = 2, MARK_LEN = 5, MARK_PAD = 1;

  /** Marge de la page : le fond perdu seul, ou de quoi loger les traits. */
  function margin(opts) {
    if (!opts.bleed) return 0;
    return opts.marks ? MARK_GAP + MARK_LEN + MARK_PAD : BLEED;
  }

  /** Format de la page produite, en millimètres, traits de coupe compris. */
  function pageSize(opts) {
    var m = margin(opts || {});
    return { w: TRIM_W + m * 2, h: TRIM_H + m * 2, margin: m };
  }

  var GEO = {
    // Recto, relevé sur CDV-Graffeuille-Recto.pdf. Il ne porte que le fond
    // rouge, la diagonale, le logo, la flèche et l'accroche : ni bloc adresse
    // ni filet, contrairement à la maquette précédente. Sa composition ne
    // varie pas d'une personne à l'autre, hors accroche.
    recto: {
      font:       "'Author','Helvetica Neue',Helvetica,Arial,sans-serif",
      // Les tracés du logo sont déjà dans le repère de cette maquette : le
      // bloc les reprend tel quel, sans mise à l'échelle.
      logo:       { x: 3.748, y: 22.773, width: 46.503 },
      // Diagonale blanche, d'un bord à l'autre, tracée à 0,262 pt.
      diagonal:   { x1: -3.113, y1: 52.383, x2: 41.585, y2: -3.219, width: 0.0924 },
      // Coin haut-gauche du carré de la flèche, et son côté.
      arrow:      { x: 6.510, y: 55.748, size: 2.6525 },
      // Accroche en Author Medium 9 pt, interligne 11,111 pt. Le fichier
      // resserre l'approche de 0,009 cadratin par signe et la rend aux
      // espaces : sans cela les deux lignes sortent 2 % trop larges.
      tagline:    { x: 6.357, baseline: 62.136, lead: 3.528, size: 3.175,
                    weight: 500, tracking: -0.009 }
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
      // Le bloc adresse est aligné à droite sur 46,11 mm, avec un filet
      // vertical rouge à 47,41 mm — relevés sur le fichier d'impression.
      address:    { right: 46.11, baseline: 70.00, lead: 2.822, size: 2.822,
                    iconGap: 1.69, pinSize: 3.175, pinDrop: 0.19,
                    ruleGap: 1.30, ruleRise: 2.34, ruleWidth: 0.176 },
      // Caches blancs : le filigrane ne doit pas passer sous le texte.
      mask:       { pad: 0.8, rise: 0.85, drop: 0.30 }
    }
  };

  // Author, la fonte du fichier d'impression, désormais servie par le site :
  // les largeurs du verso sont donc exactes, et non plus approchées.
  var FONT = "'Author','Helvetica Neue',Helvetica,Arial,sans-serif";

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
    a.push('font-family="' + (opts.font || FONT) + '"');
    a.push('font-size="' + f(opts.size) + '"');
    a.push('fill="' + (opts.fill || '#111') + '"');
    if (opts.weight) a.push('font-weight="' + opts.weight + '"');
    if (opts.italic) a.push('font-style="italic"');
    if (opts.anchor) a.push('text-anchor="' + opts.anchor + '"');
    if (opts.spacing) a.push('letter-spacing="' + f(opts.spacing) + '"');
    if (opts.wordSpacing) a.push('word-spacing="' + f(opts.wordSpacing) + '"');
    if (opts.id) a.push('id="' + opts.id + '"');
    if (opts.cls) a.push('class="' + opts.cls + '"');
    if (opts.data) a.push(opts.data);
    return '<text ' + a.join(' ') + '>' + esc(str) + '</text>';
  }

  /**
   * Flèche du recto, pointant vers le bas-droite. Le tracé est relevé tel quel
   * dans le flux du fichier d'impression, ramené à un carré unité : le
   * reconstruire à partir de règles donnerait une forme approchante, alors que
   * ses barres n'ont pas tout à fait la même épaisseur que sa diagonale.
   *
   * `g.x` et `g.y` désignent le coin haut-gauche du carré, `g.size` son côté.
   */
  var ARROW = 'M0.99867 0.17662L1 0.99867L0.17941 0.99867L0.17941 0.79558'
            + 'L0.62867 0.79412L0 0.16545L0.16558 0L0.79558 0.63L0.79558 0.17662Z';

  function arrow(g, color) {
    return '<g transform="translate(' + f(g.x) + ' ' + f(g.y) + ') scale('
         + (g.size).toFixed(5) + ')">'
         + '<path d="' + ARROW + '" fill="' + color + '"/></g>';
  }

  /**
   * Traits de coupe, noirs sur un petit fond blanc. Ils partent du bord coupé
   * et traversent le fond perdu : sur l'aplat rouge du recto un trait noir
   * serait invisible, le fond blanc l'en détache. C'est ainsi que les porte le
   * fichier de référence.
   */
  function cropMarks() {
    var G = MARK_GAP, L = MARK_LEN, w = 0.15, pad = 0.25, fonds = [], traits = [];
    function fond(x, y, bw, bh) {
      fonds.push('<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(bw)
               + '" height="' + f(bh) + '" fill="#FFFFFF"/>');
    }
    [[0, 0], [TRIM_W, 0], [0, TRIM_H], [TRIM_W, TRIM_H]].forEach(function (c) {
      var sx = c[0] === 0 ? -1 : 1, sy = c[1] === 0 ? -1 : 1;
      // Trait horizontal, posé sur la ligne de coupe haute ou basse.
      var x1 = c[0] + sx * G, x2 = c[0] + sx * (G + L);
      fond(Math.min(x1, x2), c[1] - w / 2 - pad, L, w + pad * 2);
      traits.push('M' + f(x1) + ' ' + f(c[1]) + 'H' + f(x2));
      // Trait vertical, posé sur la ligne de coupe gauche ou droite.
      var y1 = c[1] + sy * G, y2 = c[1] + sy * (G + L);
      fond(c[0] - w / 2 - pad, Math.min(y1, y2), w + pad * 2, L);
      traits.push('M' + f(c[0]) + ' ' + f(y1) + 'V' + f(y2));
    });
    return fonds.join('') + '<path d="' + traits.join('') + '" fill="none" '
         + 'stroke="#000000" stroke-width="' + f(w) + '"/>';
  }

  /* ------------------------------------------------------------------ rendu */

  function open(opts) {
    var m = margin(opts);
    var w = TRIM_W + m * 2, h = TRIM_H + m * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
         + ' viewBox="' + f(-m) + ' ' + f(-m) + ' ' + f(w) + ' ' + f(h) + '"'
         + ' width="' + f(w) + 'mm" height="' + f(h) + 'mm"'
         + ' class="' + (opts.className || '') + '" role="img"'
         + ' aria-label="' + esc(opts.label || '') + '">';
  }

  /**
   * Fond : le papier blanc sur toute la page quand elle déborde du fond perdu
   * pour loger les traits de coupe, puis l'aplat de couleur sur le format
   * coupé augmenté du seul fond perdu.
   */
  function background(opts, color) {
    var m = margin(opts), bleed = opts.bleed ? BLEED : 0, out = '';
    if (m > bleed) {
      out += '<rect x="' + f(-m) + '" y="' + f(-m) + '" width="' + f(TRIM_W + m * 2)
           + '" height="' + f(TRIM_H + m * 2) + '" fill="#FFFFFF"/>';
    }
    return out + '<rect x="' + f(-bleed) + '" y="' + f(-bleed) + '" width="'
         + f(TRIM_W + bleed * 2) + '" height="' + f(TRIM_H + bleed * 2)
         + '" fill="' + color + '"/>';
  }

  /** Recto : aplat rouge, diagonale, logo, flèche et accroche. */
  function renderFront(d, opts) {
    opts = opts || {};
    var g = GEO.recto, accent = d.accent || '#FF1900', ink = d.frontInk || '#FFFFFF';
    var bleed = opts.bleed ? BLEED : 0;
    var uid = 'r' + Math.random().toString(36).slice(2, 8);
    var out = [open({ bleed: opts.bleed, marks: opts.marks,
                      className: 'card-svg card-front',
                      label: 'Recto : ' + (d.company || 'GRAFFEUILLE') })];

    out.push(background(opts, accent));

    // Tout le dessin est rogné au fond perdu : la page peut être plus grande
    // que lui pour loger les traits de coupe, rien ne doit y déborder.
    out.push('<defs><clipPath id="clipr-' + uid + '"><rect x="' + f(-bleed)
           + '" y="' + f(-bleed) + '" width="' + f(TRIM_W + bleed * 2)
           + '" height="' + f(TRIM_H + bleed * 2) + '"/></clipPath></defs>');
    out.push('<g clip-path="url(#clipr-' + uid + ')">');

    var dg = g.diagonal;
    out.push('<path d="M' + f(dg.x1) + ' ' + f(dg.y1) + 'L' + f(dg.x2) + ' ' + f(dg.y2)
           + '" fill="none" stroke="' + ink + '" stroke-width="' + f(dg.width) + '"/>');

    // Les tracés du logo sont déjà dans le repère de cette maquette.
    var src = { x: 3.748, y: 22.773, w: 46.503 };
    var k = g.logo.width / src.w;
    out.push('<g transform="translate(' + f(g.logo.x) + ' ' + f(g.logo.y) + ') scale('
           + k.toFixed(6) + ') translate(' + f(-src.x) + ' ' + f(-src.y) + ')">'
           + '<path d="' + LOGO.mark + '" fill="' + ink + '"/>'
           + '<path d="' + LOGO.wordmark + '" fill="' + ink + '"/>'
           + (d.showBaseline !== false ? '<path d="' + LOGO.tagline + '" fill="' + ink + '"/>' : '')
           + '</g>');

    // Accroche, surmontée de sa flèche.
    var lines = String(d.tagline || '').split('\n')
                  .map(function (l) { return l.trim(); })
                  .filter(Boolean);
    if (lines.length) {
      out.push(arrow(g.arrow, ink));
      lines.forEach(function (line, i) {
        out.push(text(line, { x: g.tagline.x, y: g.tagline.baseline + i * g.tagline.lead,
                              size: g.tagline.size, fill: ink, weight: g.tagline.weight,
                              font: g.font,
                              spacing: g.tagline.tracking * g.tagline.size,
                              wordSpacing: -g.tagline.tracking * g.tagline.size }));
      });
    }

    out.push('</g>');
    if (opts.marks) out.push(cropMarks());
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

  /**
   * Verso : filigrane, QR, coordonnées.
   *
   * Le noir du texte dépend de la destination. À l'écran un gris très sombre
   * fatigue moins l'œil ; sur le fichier destiné à l'imprimeur il faut un noir
   * pur, seule valeur qu'un RIP puisse convertir en 100 % de noir sans y
   * mêler de cyan, de magenta ni de jaune.
   */
  function renderBack(d, opts) {
    opts = opts || {};
    var g = GEO.verso, accent = d.accent || '#FF1900';
    var noir = opts.print ? '#000000' : '#111111';
    var uid = 'c' + Math.random().toString(36).slice(2, 8);
    var bleed = opts.bleed ? BLEED : 0;
    var out = [open({ bleed: opts.bleed, marks: opts.marks, className: 'card-svg card-back',
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
      var qr = QRCode.toSvgPath(d.qrPayload || '', d.qrLevel || 'M', g.qr.size, 4,
                                d.qrStyle || 'dots');
      out.push('<rect x="' + f(g.qr.x) + '" y="' + f(g.qr.y) + '" width="' + f(g.qr.size)
             + '" height="' + f(g.qr.size) + '" fill="#FFFFFF"/>');
      out.push('<g transform="translate(' + f(g.qr.x) + ' ' + f(g.qr.y) + ')">'
             + '<path d="' + qr.path + '" fill="' + (d.qrColor || noir) + '"/></g>');
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
        fill: line.kind === 'name' ? '#FFFFFF' : noir,
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
    if (rows.length) {
      out.push('<rect class="mask-rows-' + uid + '" x="0" y="0" width="0" height="0" fill="#FFFFFF"/>');
    }
    rows.slice(0, g.rows.max).forEach(function (row, i) {
      var base = firstRow + i * g.rows.lead;
      out.push(icon(row[0], g.rows.iconX, base, g.rows.size, accent));
      out.push(text(row[1], { x: g.rows.textX, y: base, size: g.rows.size,
                              fill: noir, weight: 500, cls: 'row-' + uid }));
    });

    // Bloc adresse, aligné à droite. Son cache blanc et la place du
    // pictogramme dépendent de la largeur du texte : ajustés après rendu.
    var a = g.address;
    var addr = [];
    if (d.company) addr.push({ str: d.company, weight: 700, pin: true });
    if (d.street) addr.push({ str: d.street, weight: 400 });
    var cityLine = [d.postalCode, d.city].filter(Boolean).join(' ')
                 + (d.country ? ' - ' + d.country : '');
    if (cityLine.trim()) addr.push({ str: cityLine.trim(), weight: 400 });
    if (d.website) addr.push({ str: d.website, weight: 500 });

    if (addr.length) {
      out.push('<rect class="mask-addr-' + uid + '" x="0" y="0" width="0" height="0" fill="#FFFFFF"/>');
      addr.forEach(function (line, i) {
        var y = a.baseline + i * a.lead;
        out.push(text(line.str, { x: a.right, y: y, size: a.size, fill: noir,
                                  weight: line.weight, anchor: 'end',
                                  cls: 'addr-' + uid,
                                  id: line.pin ? 'org-' + uid : null }));
        if (line.pin) {
          out.push('<g id="pin-' + uid + '">'
                 + icon('pin', 0, y + a.pinDrop, a.pinSize, accent) + '</g>');
        }
      });
      var lastY = a.baseline + (addr.length - 1) * a.lead;
      out.push('<path d="M' + f(a.right + a.ruleGap) + ' ' + f(a.baseline - a.ruleRise)
             + 'V' + f(lastY) + '" fill="none" stroke="' + accent
             + '" stroke-width="' + f(a.ruleWidth) + '"/>');
    }

    if (opts.marks) out.push(cropMarks());
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

    // L'épingle se pose à gauche de la raison sociale, dont la largeur n'est
    // connue qu'une fois le texte rendu.
    var g2 = GEO.verso.address;
    var org = svgEl.querySelector('[id^="org-"]');
    var pin = svgEl.querySelector('[id^="pin-"] path');
    if (org && pin) {
      var ow = 0;
      try { ow = org.getComputedTextLength(); } catch (e) { return; }
      var k = g2.pinSize / Icons.UPEM;
      var left = g2.right - ow - g2.iconGap - Icons.glyphs.pin.box[2] * k;
      pin.parentNode.setAttribute('transform', 'translate(' + f(left) + ' '
        + f(g2.baseline + g2.pinDrop) + ') scale(' + k.toFixed(6) + ' ' + (-k).toFixed(6) + ')');
    }

    // Caches blancs : ils couvrent exactement le texte qu'ils protègent.
    fitMask(svgEl, 'mask-rows-', 'row-', g.rows.size, g.rows.iconX);
    fitMask(svgEl, 'mask-addr-', 'addr-', g2.size, null);
  }

  /**
   * Étend un cache blanc sous un groupe de lignes de texte, à partir de leur
   * position et de leur largeur réelles.
   */
  function fitMask(svgEl, maskPrefix, textPrefix, size, leftEdge) {
    var mask = svgEl.querySelector('rect[class^="' + maskPrefix + '"]');
    var items = svgEl.querySelectorAll('[class^="' + textPrefix + '"]');
    if (!mask || !items.length) return;
    var m = GEO.verso.mask;
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    try {
      Array.prototype.forEach.call(items, function (el) {
        var w = el.getComputedTextLength();
        var anchor = el.getAttribute('text-anchor');
        var x = parseFloat(el.getAttribute('x'));
        var y = parseFloat(el.getAttribute('y'));
        var s = parseFloat(el.getAttribute('font-size')) || size;
        var left = anchor === 'end' ? x - w : x;
        x0 = Math.min(x0, left); x1 = Math.max(x1, left + w);
        y0 = Math.min(y0, y - s * m.rise); y1 = Math.max(y1, y + s * m.drop);
      });
    } catch (e) { return; }
    if (leftEdge != null) x0 = Math.min(x0, leftEdge);
    mask.setAttribute('x', f(x0 - m.pad));
    mask.setAttribute('y', f(y0));
    mask.setAttribute('width', f(x1 - x0 + m.pad * 2));
    mask.setAttribute('height', f(y1 - y0));
  }

  /** Place l'épingle du recto à gauche de la raison sociale, une fois mesurée. */
  /* Le recto ne porte plus de bloc mesuré : rien à réajuster après rendu. */

  function frontInto(host, d, opts) {
    host.innerHTML = renderFront(d, opts || {});
    return host.firstElementChild;
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
    TRIM_W: TRIM_W, TRIM_H: TRIM_H, BLEED: BLEED, pageSize: pageSize,
    front: renderFront, back: renderBack,
    frontInto: frontInto, backInto: backInto, fitBand: fitBand
  };
}(window));
