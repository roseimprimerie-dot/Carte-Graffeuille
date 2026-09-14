/*!
 * card.js — rendu vectoriel de la carte de visite GRAFFEUILLE.
 *
 * La carte est produite en SVG dans un repère en millimètres calqué sur le
 * fichier d'impression d'origine : format coupé 54 × 85 mm, fond perdu 5 mm.
 * Le même rendu sert à l'aperçu écran, à l'impression PDF et aux exports.
 */
(function (global) {
  'use strict';

  var TRIM_W = 54, TRIM_H = 85, BLEED = 5, MARK_LEN = 5, MARK_GAP = 2;

  // Repères verticaux repris au millimètre près du fichier d'origine.
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
      band:       { x: 7.40, top: 32.16, height: 4.233, padding: 1.0 },
      name:       { x: 8.40, baseline: 35.39, size: 4.233 },
      role:       { x: 8.40, baseline: 41.27, size: 3.528 },
      rows:       { iconX: 7.28, textX: 11.40, size: 3.175,
                    baselines: [53.66, 57.90, 62.14] },
      address:    { baseline: 70.00, lead: 2.822, size: 2.822, iconGap: 1.2 }
    }
  };

  var FONT = "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif";

  /* ------------------------------------------------------------ pictogrammes
   * Chacun est décrit dans un carré de 1 × 1 puis mis à l'échelle : la
   * définition est ainsi indépendante de la taille de rendu.
   */
  var ICONS = {
    phone: 'M0.29 0.04 C0.25 -0.02 0.17 -0.01 0.12 0.04 L0.05 0.12'
         + 'C0.00 0.17 -0.01 0.25 0.02 0.32 C0.15 0.62 0.38 0.85 0.68 0.98'
         + 'C0.75 1.01 0.83 1.00 0.88 0.95 L0.96 0.88 C1.01 0.83 1.02 0.75 0.96 0.71'
         + 'L0.78 0.58 C0.73 0.54 0.66 0.55 0.62 0.60 L0.54 0.69'
         + 'C0.40 0.60 0.28 0.48 0.19 0.34 L0.28 0.26 C0.33 0.22 0.34 0.15 0.30 0.10 Z',
    mail:  'M0.02 0.18 C0.02 0.12 0.07 0.07 0.13 0.07 L0.87 0.07 C0.93 0.07 0.98 0.12 0.98 0.18'
         + 'L0.98 0.22 L0.50 0.55 L0.02 0.22 Z M0.02 0.35 L0.46 0.66 C0.49 0.68 0.51 0.68 0.54 0.66'
         + 'L0.98 0.35 L0.98 0.79 C0.98 0.85 0.93 0.90 0.87 0.90 L0.13 0.90 C0.07 0.90 0.02 0.85 0.02 0.79 Z',
    pin:   'M0.50 0.02 C0.29 0.02 0.12 0.19 0.12 0.40 C0.12 0.66 0.42 0.94 0.46 0.97'
         + 'C0.48 0.99 0.52 0.99 0.54 0.97 C0.58 0.94 0.88 0.66 0.88 0.40 C0.88 0.19 0.71 0.02 0.50 0.02 Z'
         + 'M0.50 0.53 C0.43 0.53 0.37 0.47 0.37 0.40 C0.37 0.33 0.43 0.27 0.50 0.27'
         + 'C0.57 0.27 0.63 0.33 0.63 0.40 C0.63 0.47 0.57 0.53 0.50 0.53 Z',
    globe: 'M0.50 0.02 C0.23 0.02 0.02 0.23 0.02 0.50 C0.02 0.77 0.23 0.98 0.50 0.98'
         + 'C0.77 0.98 0.98 0.77 0.98 0.50 C0.98 0.23 0.77 0.02 0.50 0.02 Z'
         + 'M0.50 0.12 C0.60 0.12 0.70 0.28 0.73 0.45 L0.27 0.45 C0.30 0.28 0.40 0.12 0.50 0.12 Z'
         + 'M0.50 0.88 C0.40 0.88 0.30 0.72 0.27 0.55 L0.73 0.55 C0.70 0.72 0.60 0.88 0.50 0.88 Z'
         + 'M0.12 0.45 C0.14 0.30 0.24 0.18 0.37 0.14 C0.30 0.24 0.25 0.34 0.23 0.45 Z'
         + 'M0.77 0.45 C0.75 0.34 0.70 0.24 0.63 0.14 C0.76 0.18 0.86 0.30 0.88 0.45 Z'
         + 'M0.23 0.55 C0.25 0.66 0.30 0.76 0.37 0.86 C0.24 0.82 0.14 0.70 0.12 0.55 Z'
         + 'M0.88 0.55 C0.86 0.70 0.76 0.82 0.63 0.86 C0.70 0.76 0.75 0.66 0.77 0.55 Z'
  };

  function icon(name, x, baseline, size, fill) {
    // `baseline` cale le pictogramme sur la ligne de base du texte voisin.
    var y = baseline - size * 0.82;
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(size) + ')">'
         + '<path d="' + ICONS[name] + '" fill="' + fill + '"/></g>';
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

  /* ------------------------------------------------------------- vCard / QR */

  /** Construit la vCard 3.0 encodée dans le QR code et proposée au téléchargement. */
  function vcard(d) {
    var lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:' + (d.lastName || '') + ';' + (d.firstName || '') + ';;;',
      'FN:' + [d.firstName, d.lastName].filter(Boolean).join(' ')
    ];
    if (d.company) lines.push('ORG:' + d.company);
    if (d.role) lines.push('TITLE:' + d.role);
    if (d.phone) lines.push('TEL;TYPE=CELL:' + d.phone.replace(/\s+/g, ''));
    if (d.street || d.city) {
      lines.push('ADR;TYPE=WORK:;;' + (d.street || '') + ';' + (d.city || '') + ';;'
                 + (d.postalCode || '') + ';' + (d.country || ''));
    }
    if (d.email) lines.push('EMAIL;TYPE=WORK,INTERNET:' + d.email);
    if (d.website) lines.push('URL:' + d.website);
    lines.push('END:VCARD');
    return lines.join('\r\n');
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

    // QR code : la vCard est régénérée à chaque modification du formulaire.
    var payload = vcard(d);
    try {
      var qr = QRCode.toSvgPath(payload, d.qrLevel || 'M', g.qr.size, 4);
      out.push('<rect x="' + f(g.qr.x) + '" y="' + f(g.qr.y) + '" width="' + f(g.qr.size)
             + '" height="' + f(g.qr.size) + '" fill="#FFFFFF"/>');
      out.push('<g transform="translate(' + f(g.qr.x) + ' ' + f(g.qr.y) + ')">'
             + '<path d="' + qr.path + '" fill="' + (d.qrColor || '#111111') + '"/></g>');
    } catch (err) {
      out.push(text('QR indisponible', { x: g.qr.x, y: g.qr.y + 5, size: 2.5, fill: '#999' }));
    }

    // Bandeau du nom : sa largeur est ajustée après rendu (voir fitBand).
    var fullName = [d.firstName, (d.lastName || '').toUpperCase()].filter(Boolean).join(' ');
    out.push('<rect id="band-' + uid + '" x="' + f(g.band.x) + '" y="' + f(g.band.top)
           + '" width="' + f(TRIM_W - g.band.x * 2) + '" height="' + f(g.band.height)
           + '" fill="' + accent + '"/>');
    out.push(text(fullName, { x: g.name.x, y: g.name.baseline, size: g.name.size,
                              fill: '#FFFFFF', weight: 600, id: 'name-' + uid }));
    out.push(text(d.role, { x: g.role.x, y: g.role.baseline, size: g.role.size,
                            fill: '#111111', weight: 500, italic: true }));

    // Lignes de contact : seules les valeurs renseignées occupent une ligne.
    var rows = [];
    if (d.phone) rows.push(['phone', d.phone]);
    if (d.email) rows.push(['mail', d.email]);
    if (d.website && d.websiteInContacts) rows.push(['globe', d.website]);
    rows.slice(0, g.rows.baselines.length).forEach(function (row, i) {
      var base = g.rows.baselines[i];
      out.push(icon(row[0], g.rows.iconX, base, g.rows.size * 0.95, accent));
      out.push(text(row[1], { x: g.rows.textX, y: base, size: g.rows.size, fill: '#111111', weight: 500 }));
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
               + icon('pin', cx - a.size * 0.45, y, a.size * 0.95, accent) + '</g>');
      } else {
        out.push(text(line.str, { x: cx, y: y, size: a.size, fill: '#111111',
                                  weight: line.weight, anchor: 'middle' }));
      }
    });

    if (opts.marks) out.push(cropMarks(accent));
    out.push('</svg>');
    return out.join('');
  }

  /**
   * Ajuste, une fois le SVG dans le document, le bandeau rouge à la largeur
   * réelle du nom et recentre le pictogramme de l'adresse. Ces deux réglages
   * demandent de mesurer le texte, ce qui n'est possible qu'après rendu.
   */
  function fitBand(svgEl) {
    if (!svgEl) return;
    var g = GEO.verso;
    var name = svgEl.querySelector('[id^="name-"]');
    var band = svgEl.querySelector('[id^="band-"]');
    if (name && band) {
      var w = 0;
      try { w = name.getComputedTextLength(); } catch (e) { return; }
      band.setAttribute('width', Math.max(w + g.band.padding * 2, 4));
      band.setAttribute('x', g.name.x - g.band.padding);
    }
    var org = svgEl.querySelector('[id^="org-"]');
    var pin = svgEl.querySelector('[id^="pin-"] path');
    if (org && pin) {
      var ow = 0;
      try { ow = org.getComputedTextLength(); } catch (e) { return; }
      var a = GEO.verso.address, cx = TRIM_W / 2, size = a.size * 0.95;
      var left = cx + a.size * 0.45 - ow / 2 - a.iconGap - size;
      var group = pin.parentNode;
      group.setAttribute('transform', 'translate(' + f(left) + ' '
        + f(a.baseline - size * 0.82) + ') scale(' + f(size) + ')');
    }
  }

  global.Card = {
    TRIM_W: TRIM_W, TRIM_H: TRIM_H, BLEED: BLEED,
    front: renderFront, back: renderBack, vcard: vcard, fitBand: fitBand
  };
}(window));
