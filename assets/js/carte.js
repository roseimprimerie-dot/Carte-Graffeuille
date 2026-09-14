/*!
 * carte.js — page publique : affiche les coordonnées d'une personne et rien
 * d'autre. Elle est ouverte depuis le QR code du dos de la carte imprimée,
 * donc presque toujours sur un téléphone.
 *
 * La personne à afficher vient du fragment d'URL :
 *   #jerome-goumard  → fiche cartes/jerome-goumard.json déposée sur le site
 *   #c=<données>     → coordonnées portées par l'URL elle-même
 *   (aucun fragment) → fiche par défaut
 */
(function () {
  'use strict';

  var DEFAULT_SLUG = 'jerome-goumard';
  var $ = function (s) { return document.querySelector(s); };

  var CHEVRON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" '
              + 'focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" '
              + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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
    $('#identity').innerHTML =
        '<h1 class="name">' + esc(Contact.fullName(d)) + '</h1>'
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
      var lines = [d.street, Contact.cityLine(d)].filter(Boolean).join(', ');
      out.push(row('pin', 'Adresse', lines,
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

  function wireActions(d) {
    var vcf = $('#btn-vcf');
    var blob = new Blob([Contact.vcard(d)], { type: 'text/vcard;charset=utf-8' });
    var name = (Contact.slugify(Contact.fullName(d)) || 'contact') + '.vcf';
    vcf.href = URL.createObjectURL(blob);
    vcf.download = name;

    $('#btn-share').addEventListener('click', function () {
      var payload = {
        title: Contact.fullName(d),
        text: Contact.fullName(d) + (d.role ? ' — ' + d.role : ''),
        url: location.href
      };
      if (navigator.share) {
        navigator.share(payload).catch(function () { /* partage annulé */ });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href)
          .then(function () { toast('Lien copié.'); },
                function () { window.prompt('Lien de la carte :', location.href); });
      } else {
        window.prompt('Lien de la carte :', location.href);
      }
    }, { once: false });
  }

  /* ------------------------------------------------------------- chargement */

  function loadSlug(slug) {
    return fetch('cartes/' + slug + '.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('introuvable');
        return r.json();
      })
      .then(function (json) { return Contact.normalise(json); });
  }

  function start() {
    var frag = Contact.readFragment(location.hash);

    if (frag.kind === 'inline') return render(frag.data);
    if (frag.kind === 'invalid') {
      return showMissing('Ce lien est incomplet ou abîmé. Scannez de nouveau le '
        + 'QR code au dos de la carte.');
    }

    var slug = frag.kind === 'slug' ? frag.slug : DEFAULT_SLUG;
    loadSlug(slug).then(render, function () {
      showMissing('Aucune carte ne correspond à ce lien. Vérifiez l’adresse ou '
        + 'scannez de nouveau le QR code au dos de la carte.');
    });
  }

  window.addEventListener('hashchange', start);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
