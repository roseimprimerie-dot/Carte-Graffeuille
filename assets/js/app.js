/*!
 * app.js — pilotage de l'éditeur : formulaire, annuaire, partage et exports.
 */
(function () {
  'use strict';

  var STORE_KEY = 'graffeuille.cards.v1';
  var LAST_KEY = 'graffeuille.cards.last';

  var DEFAULTS = Contact.DEFAULTS;

  // Le rouge de la charte, et lui seul : orange #ff1900, RVB 255 25 0,
  // CMJN 0 95 95 0, Pantone 805U. La pastille sert à y revenir après un essai.
  var SWATCHES = ['#ff1900'];

  var FIELDS = Contact.FIELDS.concat(['siteBase']);

  var $ = function (sel) { return document.querySelector(sel); };
  var form = $('#form');
  var state = null;
  var roster = [];
  var currentId = null;

  /* --------------------------------------------------------------- stockage */

  function loadRoster() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveRoster() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(roster)); }
    catch (e) { toast('Impossible d’enregistrer localement (stockage indisponible).'); }
  }

  function rememberLast() {
    try { localStorage.setItem(LAST_KEY, currentId || ''); } catch (e) { /* sans effet */ }
  }

  /* --------------------------------------------- lien de partage (fragment) */

  function encodeState(d) {
    var json = JSON.stringify(d);
    var bytes = new TextEncoder().encode(json);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeState(str) {
    try {
      var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------- formulaire */

  function readForm() {
    var d = {};
    FIELDS.forEach(function (k) {
      var el = form.elements[k];
      if (!el) return;
      d[k] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return d;
  }

  function writeForm(d) {
    FIELDS.forEach(function (k) {
      var el = form.elements[k];
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!d[k];
      else el.value = d[k] == null ? '' : d[k];
    });
  }

  /** Racine du site publié : celle qu'a saisie l'utilisateur, sinon celle d'où
   *  l'éditeur est servi — ce qui suffit dès que le site est en ligne. */
  function siteRoot(d) {
    return String(d.siteBase || '').trim() || Contact.SITE;
  }

  function normalise(d) {
    var out = Contact.normalise(d);
    out.siteBase = (d && d.siteBase) || '';
    out.slug = Contact.slugify(out.slug);
    return out;
  }

  /* ----------------------------------------------------------------- rendu */

  function render() {
    var url = Contact.cardUrl(siteRoot(state), state);
    var view = Object.assign({}, state, { qrPayload: url });

    var front = $('#preview-front'), back = $('#preview-back');
    Card.frontInto(front, view, { bleed: state.bleed, marks: state.bleed });
    Card.backInto(back, view, { bleed: state.bleed, marks: state.bleed });

    // Le format de page suit l'option de fond perdu, et laisse la place aux
    // traits de coupe quand ils sont demandés.
    var page = Card.pageSize({ bleed: state.bleed, marks: state.bleed });
    $('#print-page').textContent =
      '@page { margin: 0; size: ' + page.w + 'mm ' + page.h + 'mm; }';

    describeQr(url);

    $('#meta').innerHTML =
      'Format coupé <code>54 × 85 mm</code>'
      + (state.bleed ? ' · fond perdu <code>3 mm</code> · traits de coupe · page <code>'
          + page.w + ' × ' + page.h + ' mm</code>' : '')
      + '. Le QR mène à la page publique, pas à une fiche figée : corriger un '
      + 'numéro sur le site met à jour toutes les cartes déjà distribuées.';
  }

  /**
   * Un QR imprimé à 24 mm n'est lisible que si ses modules restent assez gros.
   * En dessous de 0,3 mm environ, les téléphones peinent ; on le dit plutôt
   * que de laisser découvrir le problème après le tirage.
   */
  function describeQr(url) {
    var box = $('#qr-target');
    var line = '<strong>' + esc(url) + '</strong><br>';
    try {
      var qr = QRCode.encode(url, state.qrLevel || 'M');
      var module = 24.19 / (qr.size + 8);
      var verdict = module >= 0.40 ? 'très confortable à scanner'
                  : module >= 0.30 ? 'confortable à scanner'
                  : module >= 0.25 ? 'lisible, mais sans marge : préférez un identifiant court'
                  : 'trop dense pour un tirage à cette taille - renseignez un identifiant court';
      box.innerHTML = line + url.length + ' caractères · version ' + qr.version
        + ' · module de ' + module.toFixed(2) + ' mm une fois imprimé - ' + verdict + '.';
    } catch (err) {
      box.innerHTML = line + 'Adresse trop longue pour tenir dans un QR code.';
    }
  }

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function update() {
    state = normalise(readForm());
    render();
  }

  /* --------------------------------------------------------------- annuaire */

  function personLabel(d) {
    return Contact.fullName(d) || 'Sans nom';
  }

  function drawRoster() {
    var box = $('#roster');
    box.innerHTML = '';
    if (!roster.length) {
      box.innerHTML = '<p class="roster-empty">Aucune carte enregistrée. '
        + 'Renseignez le formulaire puis cliquez sur « Enregistrer ».</p>';
      return;
    }
    roster.forEach(function (entry) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'roster-item';
      item.setAttribute('aria-current', String(entry.id === currentId));
      item.innerHTML = '<span class="who"><strong></strong><span></span></span>';
      item.querySelector('strong').textContent = personLabel(entry.data);
      item.querySelector('.who span').textContent =
        [entry.data.role, entry.data.email].filter(Boolean).join(' · ');

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'ghost danger';
      del.textContent = 'Supprimer';
      del.addEventListener('click', function (ev) {
        ev.stopPropagation();
        roster = roster.filter(function (r) { return r.id !== entry.id; });
        if (currentId === entry.id) currentId = null;
        saveRoster(); drawRoster();
        toast('Carte supprimée.');
      });

      item.addEventListener('click', function () {
        currentId = entry.id;
        writeForm(entry.data);
        update();
        drawRoster();
        rememberLast();
      });

      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '6px';
      row.style.alignItems = 'center';
      row.appendChild(item);
      row.appendChild(del);
      box.appendChild(row);
    });
  }

  /* --------------------------------------------------------------- exports */

  function download(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function slug(d) {
    return (personLabel(d) || 'carte')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'carte';
  }

  /** Fiche d'une personne, débarrassée de ce qui appartient à ce poste. */
  function cardRecord(folder) {
    var record = Object.assign({}, state, { slug: folder });
    delete record.siteBase;   // propre à ce poste, pas à la fiche
    delete record.bleed;      // réglage d'impression, pas une coordonnée
    return record;
  }

  /**
   * Fontes incorporées au SVG exporté. Sans elles, un poste qui n'a ni Author
   * ni Montserrat compose le fichier dans une fonte de substitution : les
   * largeurs changent, et la mise en page relevée au millimètre ne tient plus.
   *
   * Elles viennent de fontes.js plutôt que du disque : le navigateur refuse
   * fetch() sur file://, et l'éditeur doit marcher par simple double-clic.
   */
  function inlineFont() {
    return Promise.resolve(window.CARD_FONTS_CSS || null);
  }

  /* Tout ce qui sort d'ici part à l'impression : le noir du verso doit y être
     pur, et non le gris très sombre confortable à l'écran. */
  function sideSvg(side, withFont) {
    var opts = { bleed: state.bleed, marks: state.bleed, print: true };
    var view = Object.assign({}, state, { qrPayload: Contact.cardUrl(siteRoot(state), state) });
    var markup;
    var host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:200mm';
    document.body.appendChild(host);
    if (side === 'front') {
      Card.frontInto(host, view, opts);
      markup = host.innerHTML;
      host.remove();
    } else {
      // Les deux faces se composent à partir du texte mesuré : on les pose
      // hors écran, puis on resérialise le résultat.
      Card.backInto(host, view, opts);
      markup = host.innerHTML;
      host.remove();
    }
    if (withFont) markup = markup.replace('>', '><style>' + withFont + '</style>');
    return markup;
  }

  function exportSvg() {
    inlineFont().then(function (css) {
      ['front', 'back'].forEach(function (side) {
        var name = slug(state) + '-' + (side === 'front' ? 'recto' : 'verso') + '.svg';
        download(name, new Blob([sideSvg(side, css)], { type: 'image/svg+xml;charset=utf-8' }));
      });
      toast(css ? 'SVG exportés (fonte incorporée).' : 'SVG exportés.');
    });
  }

  function exportPng() {
    var dpi = 600;
    var page = Card.pageSize({ bleed: state.bleed, marks: state.bleed });
    var px = Math.round(page.w / 25.4 * dpi), py = Math.round(page.h / 25.4 * dpi);

    inlineFont().then(function (css) {
      var chain = Promise.resolve();
      ['front', 'back'].forEach(function (side) {
        chain = chain.then(function () {
          return new Promise(function (resolve, reject) {
            var blob = new Blob([sideSvg(side, css)], { type: 'image/svg+xml;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var img = new Image();
            img.onload = function () {
              var canvas = document.createElement('canvas');
              canvas.width = px; canvas.height = py;
              var ctx = canvas.getContext('2d');
              ctx.fillStyle = '#fff';
              ctx.fillRect(0, 0, px, py);
              ctx.drawImage(img, 0, 0, px, py);
              URL.revokeObjectURL(url);
              canvas.toBlob(function (out) {
                download(slug(state) + '-' + (side === 'front' ? 'recto' : 'verso') + '.png', out);
                resolve();
              }, 'image/png');
            };
            img.onerror = function () { URL.revokeObjectURL(url); reject(); };
            img.src = url;
          });
        });
      });
      chain.then(function () { toast('PNG exportés en ' + px + ' × ' + py + ' px (600 dpi).'); })
           .catch(function () { toast('Export PNG impossible sur ce navigateur.'); });
    });
  }

  function exportVcf() {
    download(slug(state) + '.vcf',
      new Blob([Contact.vcard(state)], { type: 'text/vcard;charset=utf-8' }));
    toast('Fiche contact téléchargée.');
  }

  function print() {
    var area = $('#print-area');
    area.innerHTML = sideSvg('front') + sideSvg('back');
    window.print();
  }

  /* ------------------------------------------------------------------- divers */

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function buildSwatches() {
    var box = $('#swatches');
    SWATCHES.forEach(function (color) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = color;
      b.title = 'Rouge de la charte ' + color;
      b.setAttribute('aria-label', 'Rouge de la charte ' + color);
      b.addEventListener('click', function () {
        form.elements.accent.value = color;
        update();
      });
      box.appendChild(b);
    });
  }

  /* ------------------------------------------------------------- démarrage */

  function init() {
    buildSwatches();
    roster = loadRoster();

    var shared = location.hash.length > 1 ? decodeState(location.hash.slice(1)) : null;
    var last = null;
    try { last = localStorage.getItem(LAST_KEY); } catch (e) { /* sans effet */ }
    var entry = last && roster.filter(function (r) { return r.id === last; })[0];

    if (shared) {
      writeForm(normalise(shared));
      toast('Carte chargée depuis le lien partagé.');
      // Le fragment est consommé, puis retiré de l'adresse. Laissé en place il
      // se recharge à chaque F5 et reprend la main sur l'annuaire comme sur
      // les valeurs par défaut : vider le stockage n'y change rien, et rien
      // dans la page ne permet d'en sortir.
      try { history.replaceState(null, '', location.pathname + location.search); }
      catch (e) { location.hash = ''; }
    }
    else if (entry) { currentId = entry.id; writeForm(entry.data); }
    else writeForm(DEFAULTS);

    update();
    drawRoster();

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    $('#btn-save').addEventListener('click', function () {
      var existing = currentId && roster.filter(function (r) { return r.id === currentId; })[0];
      if (existing) existing.data = state;
      else {
        currentId = 'c' + Date.now().toString(36);
        roster.push({ id: currentId, data: state });
      }
      saveRoster(); rememberLast(); drawRoster();
      toast('Carte enregistrée dans l’annuaire.');
    });

    $('#btn-new').addEventListener('click', function () {
      currentId = null;
      // Tout ce qui appartient à une personne repart à zéro — l'identifiant
      // surtout : conservé, il ferait écraser le dossier du précédent.
      writeForm(Object.assign({}, DEFAULTS, {
        firstName: '', lastName: '', role: '', department: '', phone: '',
        email: '', email2: '', slug: '', photo: '',
        siteBase: form.elements.siteBase.value
      }));
      update(); drawRoster(); rememberLast();
      location.hash = '';
      toast('Nouvelle carte : l’entreprise et l’identité visuelle sont conservées.');
    });

    $('#btn-share').addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + encodeState(state);
      history.replaceState(null, '', '#' + encodeState(state));
      var done = function () { toast('Lien copié dans le presse-papiers.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () {
          window.prompt('Lien de la carte :', url);
        });
      } else window.prompt('Lien de la carte :', url);
    });

    $('#btn-open-public').addEventListener('click', function (ev) {
      ev.preventDefault();
      window.open(Contact.cardUrl(siteRoot(state), state), '_blank', 'noopener');
    });

    $('#btn-print').addEventListener('click', print);
    $('#btn-vcf').addEventListener('click', exportVcf);
    $('#btn-svg').addEventListener('click', exportSvg);
    $('#btn-png').addEventListener('click', exportPng);

    // Fiche d'une personne, telle que la page en ligne la lira. Le dépôt ne
    // porte plus que l'éditeur : ce fichier part vers l'hébergement qui sert
    // l'adresse visée par le QR.
    $('#btn-export-card').addEventListener('click', function () {
      var folder = state.slug || slug(state);
      if (!state.slug) {
        form.elements.slug.value = folder;
        update();
      }
      download('carte.json',
        new Blob([JSON.stringify(cardRecord(folder), null, 2) + '\n'],
                 { type: 'application/json' }));
      toast('À déposer dans equipe/' + folder + '/carte.json sur le site '
        + 'qui sert l’adresse visée par le QR.');
    });

    $('#btn-export-json').addEventListener('click', function () {
      download('annuaire-graffeuille.json',
        new Blob([JSON.stringify(roster, null, 2)], { type: 'application/json' }));
    });

    $('#btn-import-json').addEventListener('click', function () { $('#file-json').click(); });
    $('#file-json').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      file.text().then(function (txt) {
        var incoming;
        try { incoming = JSON.parse(txt); } catch (err) { return toast('Fichier JSON illisible.'); }
        if (!Array.isArray(incoming)) return toast('Format d’annuaire inattendu.');
        incoming.forEach(function (row, i) {
          if (!row || !row.data) return;
          roster.push({ id: 'i' + Date.now().toString(36) + i, data: normalise(row.data) });
        });
        saveRoster(); drawRoster();
        toast(incoming.length + ' carte(s) importée(s).');
      });
      e.target.value = '';
    });

    // Dans un aperçu intégré, le navigateur bloque l'impression et les
    // téléchargements déclenchés par la page : on le dit plutôt que de laisser
    // les boutons rester sans effet.
    if (window.top !== window.self) {
      var notice = $('#embedded-notice');
      notice.textContent = 'Aperçu intégré : la saisie et l’aperçu fonctionnent, '
        + 'mais le navigateur y bloque l’impression et les téléchargements. '
        + 'Ouvrez la page dans un onglet pour récupérer le PDF, le SVG, le PNG ou la fiche .vcf.';
      notice.hidden = false;
    }

    // Les fontes web décalent la largeur du bandeau : on recalcule au chargement.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
