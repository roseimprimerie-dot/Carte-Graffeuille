/*!
 * carte.js — page publique : affiche les coordonnées d'une personne et rien
 * d'autre. Elle est ouverte depuis le QR code du dos de la carte imprimée,
 * donc presque toujours sur un téléphone.
 *
 * La page est construite entièrement ici, à partir d'un gabarit vide. Les
 * dossiers d'employés ne contiennent donc qu'un index.html de quelques lignes
 * qui n'a jamais à être remis à jour quand la mise en page évolue.
 *
 * Deux façons de désigner la personne à afficher :
 *   window.CARTE = { source: 'carte.json' }   dossier d'employé, adresse propre
 *   fragment d'URL                            #identifiant, ou #c=<coordonnées>
 */
(function () {
  'use strict';

  var DEFAULT_SLUG = 'jerome-goumard';

  // Emplacements où chercher la fiche d'un identifiant court. Le premier est
  // l'organisation actuelle ; le second garde valides les QR déjà imprimés.
  var LOOKUP = ['equipe/{slug}/carte.json', 'cartes/{slug}.json'];

  var CHEVRON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" '
              + 'focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" '
              + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------- structure */

  function scaffold() {
    var root = document.createElement('div');
    root.innerHTML =
        '<main class="sheet" id="card" hidden>'
      +   '<header class="crest" id="crest"></header>'
      +   '<section class="identity" id="identity"></section>'
      +   '<nav class="links" id="links" aria-label="Coordonnées"></nav>'
      +   '<div class="actions">'
      +     '<a class="cta" id="btn-vcf" href="#">Ajouter à mes contacts</a>'
      +     '<button type="button" class="secondary" id="btn-share">Partager cette carte</button>'
      +   '</div>'
      +   '<footer class="foot" id="foot"></footer>'
      + '</main>'
      + '<section class="sheet missing" id="missing" hidden>'
      +   '<h1>Carte introuvable</h1><p id="missing-text"></p>'
      + '</section>'
      + '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
    while (root.firstChild) document.body.appendChild(root.firstChild);
  }

  var $ = function (s) { return document.querySelector(s); };

  /* ------------------------------------------------------------------ rendu */

  function renderCrest(d) {
    var pitch = String(d.tagline || '').trim();
    $('#crest').innerHTML =
        '<svg class="crest-watermark" viewBox="3.75 22.76 21.04 17.88" aria-hidden="true">'
      +   '<path d="' + LOGO.mark + '" fill="none" stroke="#fff" stroke-width="0.35"/>'
      + '</svg>'
      + '<svg class="crest-logo" viewBox="3.55 22.56 46.9 28.31" role="img" '
      +   'aria-label="' + esc(d.company || 'GRAFFEUILLE') + '">'
      +   '<path d="' + LOGO.mark + '" fill="#fff"/>'
      +   '<path d="' + LOGO.wordmark + '" fill="#fff"/>'
      +   (d.showBaseline !== false ? '<path d="' + LOGO.tagline + '" fill="#fff"/>' : '')
      + '</svg>'
      + (pitch ? '<p class="crest-pitch">' + esc(pitch) + '</p>' : '');
  }

  function renderIdentity(d) {
    var name = Contact.fullName(d);
    $('#identity').innerHTML =
        (d.photoUrl
          ? '<img class="portrait" src="' + esc(d.photoUrl) + '" alt="Portrait de '
            + esc(name) + '" width="96" height="96" loading="eager">'
          : '')
      + '<h1 class="name">' + esc(name) + '</h1>'
      + (d.role ? '<p class="role">' + esc(d.role) + '</p>' : '');
  }

  function row(icon, label, value, href, attrs) {
    return '<a class="link" href="' + esc(href) + '"' + (attrs || '') + '>'
         + '<span class="ico">' + Icons.inline(icon, 18) + '</span>'
         + '<span class="body"><span class="value">' + esc(value) + '</span>'
         + '<span class="label">' + esc(label) + '</span></span>'
         + '<span class="chev">' + CHEVRON + '</span></a>';
  }

  function renderLinks(d) {
    var out = [];
    if (d.phone) {
      out.push(row('phone', 'Téléphone', d.phone, 'tel:' + d.phone.replace(/\s+/g, '')));
    }
    if (d.email) {
      out.push(row('mail', 'Courriel', d.email, 'mailto:' + d.email));
    }
    if (d.website) {
      out.push(row('globe', 'Site internet', d.website, Contact.websiteUrl(d),
                   ' target="_blank" rel="noopener"'));
    }
    var address = Contact.addressQuery(d);
    if (address) {
      out.push(row('pin', 'Adresse',
                   [d.street, Contact.cityLine(d)].filter(Boolean).join(', '),
                   'https://www.google.com/maps/search/?api=1&query='
                     + encodeURIComponent(address),
                   ' target="_blank" rel="noopener"'));
    }
    $('#links').innerHTML = out.join('');
  }

  function renderFoot(d) {
    var site = Contact.websiteUrl(d);
    $('#foot').innerHTML =
        '<p style="margin:0"><span class="org">' + esc(d.company || 'GRAFFEUILLE') + '</span>'
      + (d.showBaseline !== false ? ' · Turgis Gaillard' : '')
      + '<br>Carte de visite numérique'
      + (site ? ' · <a href="' + esc(site) + '" target="_blank" rel="noopener">'
              + esc(d.website) + '</a>' : '')
      + '</p>';
  }

  function render(d) {
    document.title = Contact.fullName(d) + ' — ' + (d.company || 'GRAFFEUILLE');
    var accent = d.accent || Contact.DEFAULTS.accent;
    document.documentElement.style.setProperty('--accent', accent);
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', accent);

    renderCrest(d);
    renderIdentity(d);
    renderLinks(d);
    renderFoot(d);
    $('#card').classList.toggle('with-portrait', !!d.photoUrl);
    $('#card').hidden = false;
    $('#missing').hidden = true;
    wireActions(d);
  }

  function showMissing(message) {
    $('#card').hidden = true;
    $('#missing').hidden = false;
    $('#missing-text').textContent = message;
  }

  /* ---------------------------------------------------------------- actions */

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  var shareHandler = null;
  function wireActions(d) {
    var vcf = $('#btn-vcf');
    if (vcf.dataset.url) URL.revokeObjectURL(vcf.dataset.url);
    var url = URL.createObjectURL(new Blob([Contact.vcard(d)],
                                           { type: 'text/vcard;charset=utf-8' }));
    vcf.href = url;
    vcf.dataset.url = url;
    vcf.download = (Contact.slugify(Contact.fullName(d)) || 'contact') + '.vcf';

    var share = $('#btn-share');
    if (shareHandler) share.removeEventListener('click', shareHandler);
    shareHandler = function () {
      var payload = {
        title: Contact.fullName(d),
        text: Contact.fullName(d) + (d.role ? ' — ' + d.role : ''),
        url: location.href
      };
      if (navigator.share) {
        navigator.share(payload).catch(function () { /* partage annulé */ });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(
          function () { toast('Lien copié.'); },
          function () { window.prompt('Lien de la carte :', location.href); });
      } else {
        window.prompt('Lien de la carte :', location.href);
      }
    };
    share.addEventListener('click', shareHandler);
  }

  /* ------------------------------------------------------------- chargement */

  /** Charge une fiche et résout sa photo relativement au dossier de la fiche. */
  function loadJson(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' sur ' + path);
      return r.json();
    }).then(function (json) {
      var d = Contact.normalise(json);
      if (d.photo) d.photoUrl = path.replace(/[^/]*$/, '') + d.photo;
      return d;
    });
  }

  /** Essaie chaque emplacement connu, dans l'ordre, pour un identifiant. */
  function loadSlug(slug) {
    var attempts = LOOKUP.map(function (tpl) { return tpl.replace('{slug}', slug); });
    return attempts.reduce(function (chain, path) {
      return chain.catch(function () { return loadJson(path); });
    }, Promise.reject());
  }

  function start() {
    var configured = window.CARTE && window.CARTE.source;
    if (configured) {
      return loadJson(configured).then(render, function () {
        showMissing('La fiche de ce dossier est absente ou illisible '
          + '(' + configured + ').');
      });
    }

    var frag = Contact.readFragment(location.hash);
    if (frag.kind === 'inline') return render(frag.data);
    if (frag.kind === 'invalid') {
      return showMissing('Ce lien est incomplet ou abîmé. Scannez de nouveau le '
        + 'QR code au dos de la carte.');
    }

    loadSlug(frag.kind === 'slug' ? frag.slug : DEFAULT_SLUG).then(render, function () {
      showMissing('Aucune carte ne correspond à ce lien. Vérifiez l’adresse ou '
        + 'scannez de nouveau le QR code au dos de la carte.');
    });
  }

  function boot() {
    scaffold();
    start();
    // Seules les pages pilotées par le fragment réagissent à sa modification.
    if (!(window.CARTE && window.CARTE.source)) {
      window.addEventListener('hashchange', start);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
