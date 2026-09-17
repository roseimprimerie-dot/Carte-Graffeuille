/*!
 * icons.js — pictogrammes de la carte.
 *
 * Les trois premiers sont les contours exacts extraits de la fonte d'icônes
 * embarquée dans les fichiers d'impression fournis : un téléphone mobile, un
 * avion en papier et une épingle. Ils sont exprimés dans le repère de la fonte
 * (1024 unités par cadratin, axe y vers le haut, origine sur la ligne de base),
 * ce qui permet de les poser exactement comme le fait le PDF d'origine.
 *
 * Le globe n'apparaît sur aucune carte fournie : il ne sert qu'à la ligne
 * « site internet », facultative, et est redessiné dans le même repère.
 */
window.Icons = (function () {
  'use strict';

  var UPEM = 1024;

  var GLYPHS = {
    phone: { d: 'M352.0 768.0Q313.0 768.0 284.5 739.5Q256.0 711.0 256.0 672.0V96.0Q256.0 57.0 284.5 28.5Q313.0 0.0 352.0 0.0H672.0Q711.0 0.0 739.5 28.5Q768.0 57.0 768.0 96.0V672.0Q768.0 711.0 739.5 739.5Q711.0 768.0 672.0 768.0ZM352.0 704.0H672.0Q685.0 704.0 694.5 694.5Q704.0 685.0 704.0 672.0V96.0Q704.0 83.0 694.5 73.5Q685.0 64.0 672.0 64.0H352.0Q339.0 64.0 329.5 73.5Q320.0 83.0 320.0 96.0V672.0Q320.0 685.0 329.5 694.5Q339.0 704.0 352.0 704.0ZM512.0 160.0Q499.0 160.0 489.5 150.5Q480.0 141.0 480.0 128.0Q480.0 115.0 489.5 105.5Q499.0 96.0 512.0 96.0Q525.0 96.0 534.5 105.5Q544.0 115.0 544.0 128.0Q544.0 141.0 534.5 150.5Q525.0 160.0 512.0 160.0Z',
            box: [256, 0, 768, 768] },
    mail: { d: 'M115.0 725.0 129.0 665.0 191.0 384.0 129.0 103.0 115.0 43.0 949.0 384.0 172.0 702.0ZM204.0 619.0 701.0 416.0H249.0ZM249.0 352.0H701.0L204.0 149.0Z',
            box: [115, 43, 949, 725] },
    pin: { d: 'M512.0 800.0Q434.0 800.0 367.0 761.0Q302.0 722.0 263.0 657.0Q224.0 590.0 224.0 512.0Q224.0 481.0 236.0 440.0Q246.0 406.0 267.0 359.0Q301.0 282.0 356.0 187.0Q396.0 117.0 445.0 43.0Q470.0 5.0 486.0 -18.0L512.0 -56.0L579.0 43.0Q628.0 117.0 668.0 187.0Q723.0 282.0 757.0 359.0Q778.0 406.0 788.0 440.0Q800.0 481.0 800.0 512.0Q800.0 590.0 761.0 657.0Q722.0 722.0 657.0 761.0Q590.0 800.0 512.0 800.0ZM512.0 736.0Q573.0 736.0 624.5 706.0Q676.0 676.0 706.0 624.5Q736.0 573.0 736.0 512.0Q736.0 493.0 726.0 458.5Q716.0 424.0 699.0 385.0Q670.0 319.0 612.0 219.0Q563.0 135.0 514.0 61.0L512.0 59.0L510.0 61.0Q461.0 135.0 412.0 219.0Q354.0 319.0 325.0 385.0Q308.0 424.0 298.0 458.5Q288.0 493.0 288.0 512.0Q288.0 573.0 318.0 624.5Q348.0 676.0 399.5 706.0Q451.0 736.0 512.0 736.0ZM512.0 576.0Q485.0 576.0 466.5 557.5Q448.0 539.0 448.0 512.0Q448.0 485.0 466.5 466.5Q485.0 448.0 512.0 448.0Q539.0 448.0 557.5 466.5Q576.0 485.0 576.0 512.0Q576.0 539.0 557.5 557.5Q539.0 576.0 512.0 576.0Z',
            box: [224, -56, 800, 800] },
    globe: { d: 'M512 160a352 352 0 1 0 0 704 352 352 0 1 0 0-704Z'
                  + 'M512 160c-97 0-176 158-176 352s79 352 176 352 176-158 176-352-79-352-176-352Z'
                  + 'M184 384h656M184 640h656',
             stroke: 64, box: [128, 128, 896, 896] }
  };

  /**
   * Les contours extraits de la fonte se remplissent ; le globe, redessiné,
   * est un filet, pour rester dans la même graisse que les autres.
   */
  function paint(name, color) {
    var g = GLYPHS[name];
    if (!g.stroke) return '<path d="' + g.d + '" fill="' + color + '"/>';
    return '<path d="' + g.d + '" fill="none" stroke="' + color + '" stroke-width="'
         + g.stroke + '" stroke-linecap="round"/>';
  }

  /**
   * Pictogramme posé sur une ligne de base, dans un repère en millimètres.
   * `size` est le corps du texte voisin : le pictogramme s'y cale comme un
   * caractère, exactement comme dans le fichier d'impression.
   */
  function group(name, x, baseline, size) {
    var k = size / UPEM;
    return '<g transform="translate(' + x + ' ' + baseline + ') scale('
         + k.toFixed(6) + ' ' + (-k).toFixed(6) + ')">'
         + paint(name, arguments[4] || 'currentColor') + '</g>';
  }

  /** Élément SVG autonome dimensionné en pixels, pour la page publique. */
  return { UPEM: UPEM, glyphs: GLYPHS, group: group };
}());
