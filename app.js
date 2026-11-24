/* Figures, tooltips, "show data" tables, navigation highlight and print button.
   Every figure is drawn as SVG at the real width of its container, so chart text stays at 13-14 px on any screen. */
(function () {
  'use strict';

  var FS = 16;          // base chart font size (px)
  var LH = 22;          // line height for wrapped chart text
  var uid = 0;
  var PRINT = false;    // compact layout while printing

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var SUB_RE = /([A-Za-z])_(g|exo|ind)\b/g;
  function richSvg(s) {
    return esc(s).replace(SUB_RE, '$1<tspan dy="4" font-size="14">$2</tspan><tspan dy="-4">\u200b</tspan>');
  }
  function richHtml(s) { return esc(s).replace(SUB_RE, '$1<sub>$2</sub>'); }
  function plain(s) { return String(s).replace(SUB_RE, '$1$2'); }
  function tw(s, fs) { return plain(s).length * (fs || FS) * 0.56; }
  function wrap(s, maxW, fs) {
    var words = String(s).split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (cur && tw(t, fs) > maxW) { lines.push(cur); cur = w; } else { cur = t; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function lines(arr, x, y, attrs) {
    return arr.map(function (l, i) {
      return '<text x="' + x + '" y="' + (y + i * LH) + '" ' + (attrs || '') + '>' + richSvg(l) + '</text>';
    }).join('');
  }
  function svg(W, H, label, inner) {
    return '<svg class="fig-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Math.ceil(H) +
      '" width="' + W + '" height="' + Math.ceil(H) + '" role="img" aria-label="' + esc(label) + '" font-size="' + FS + '">' +
      inner + '</svg>';
  }
  function badge(text, W, align, sim) {
    var w = tw(text, 13) + 18, x = align === 'right' ? W - w - 1 : 1;
    return '<g class="badge' + (sim ? ' sim' : '') + '"><rect x="' + x + '" y="1" width="' + w + '" height="24" rx="12"/>' +
      '<text x="' + (x + 9) + '" y="18" font-size="13" font-weight="' + (sim ? 700 : 400) + '">' + esc(text) + '</text></g>';
  }
  function hatchDef(id) {
    return '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">' +
      '<rect width="7" height="7" class="c-ind"/><line x1="0" y1="0" x2="0" y2="7" stroke="rgba(255,255,255,.5)" stroke-width="2.5"/></pattern>';
  }
  /* vertical legend: one item per row, labels wrapped */
  function legend(items, W, y0) {
    var s = '', y = y0;
    items.forEach(function (it) {
      var ls = wrap(it.label, W - 26, FS);
      s += '<rect x="0" y="' + (y + 1) + '" width="15" height="15" rx="3" ' + (it.fill ? 'fill="' + it.fill + '"' : 'class="' + it.cls + '"') + '/>';
      s += lines(ls, 23, y + 13);
      y += ls.length * LH + 5;
    });
    return { svg: s, h: y - y0 };
  }
  function tipAttr(html) { return ' tabindex="0" data-tip="' + esc(html) + '"'; }

  /* ---------- Figure A: two subspecies, not two breeds (schematic) ---------- */

  /* a tinted banner behind a block of text; tone is "tau" or "ind" */
  function banner(ls, xRight, yBase, tone, anchor) {
    var w = Math.max.apply(null, ls.map(function (l) { return tw(l, FS); })) + 32;
    var h = ls.length * LH + 16;
    var x = anchor === 'middle' ? xRight - w / 2 : xRight - w;
    var tx = anchor === 'middle' ? xRight : xRight - 16;
    return { svg: '<rect x="' + x + '" y="' + (yBase - 20) + '" width="' + w + '" height="' + h + '" rx="11" class="banner-' + tone + '"/>' +
      lines(ls, tx, yBase, 'text-anchor="' + anchor + '"' + (tone === 'ind' ? ' font-weight="700"' : '')), bottom: yBase - 20 + h };
  }
  function pill(text, x, y, tone) {
    var w = tw(text, FS) + 22;
    return '<rect x="' + x + '" y="' + (y - 18) + '" width="' + w + '" height="26" rx="13" class="c-' + tone + '"/>' +
      '<text x="' + (x + 11) + '" y="' + y + '" fill="#fff" font-weight="700">' + esc(text) + '</text>';
  }

  function figA(W) {
    var narrow = W < 560;
    var labelW = narrow ? 112 : 132;
    var x0 = 6, xSplit = narrow ? 40 : 64;
    var xLeaf = W - labelW;
    var xTwig = xLeaf - Math.max(30, (xLeaf - xSplit) * 0.13);
    var s = badge('Schematic · not to scale', W, 'left');

    var smallL = wrap('European crossbreeding (Holstein × Jersey): breeds of one subspecies', narrow ? W - 44 : Math.min(460, W - 48), FS);
    var ban1 = banner(smallL, W - 8, 52, 'tau', 'end');
    s += ban1.svg;
    var yb1 = ban1.bottom + 16;
    s += '<path d="M' + xTwig + ' ' + (yb1 + 9) + ' V' + yb1 + ' H' + xLeaf + ' V' + (yb1 + 9) + '" fill="none" stroke-width="2" class="k-neutral"/>';

    var yH = yb1 + (PRINT ? 30 : 36), yJ = yH + (PRINT ? 30 : 34), yTau = (yH + yJ) / 2;
    var yB = yJ + (PRINT ? 62 : narrow ? 72 : 84), yRoot = (yTau + yB) / 2;
    var st = 'fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"';
    s += '<path d="M' + x0 + ' ' + yRoot + ' H' + xSplit + '" ' + st + ' class="k-neutral"/>';
    s += '<path d="M' + xSplit + ' ' + yRoot + ' V' + yTau + ' H' + xTwig + ' M' + xTwig + ' ' + yH + ' V' + yJ +
      ' M' + xTwig + ' ' + yH + ' H' + xLeaf + ' M' + xTwig + ' ' + yJ + ' H' + xLeaf + '" ' + st + ' class="k-tau"/>';
    s += '<path d="M' + xSplit + ' ' + yRoot + ' V' + yB + ' H' + xLeaf + '" ' + st + ' class="k-ind"/>';

    s += pill('Holstein', xLeaf + 10, yH + 5, 'tau');
    s += pill('Jersey', xLeaf + 10, yJ + 5, 'tau');
    s += pill('Boran', xLeaf + 10, yB + 5, 'ind');
    s += '<text x="' + (xSplit + 14) + '" y="' + (yTau - 11) + '"><tspan font-style="italic" font-weight="700">Bos taurus</tspan>' +
      (narrow ? '' : '<tspan class="t-muted"> · taurine</tspan>') + '</text>';
    s += '<text x="' + (xSplit + 14) + '" y="' + (yB - 11) + '"><tspan font-style="italic" font-weight="700">Bos indicus</tspan>' +
      (narrow ? '' : '<tspan class="t-muted"> · indicine</tspan>') + '</text>';

    var yb2 = yB + 30;
    s += '<path d="M' + xSplit + ' ' + (yb2 - 9) + ' V' + yb2 + ' H' + xLeaf + ' V' + (yb2 - 9) + '" fill="none" stroke-width="2" class="k-neutral"/>';
    var bigL = wrap('African crossbreeding (Holstein × Boran): two subspecies', W - 48, FS);
    var cx = narrow ? W / 2 : (xSplit + xLeaf) / 2;
    var ban2 = banner(bigL, cx, yb2 + 30, 'ind', 'middle');
    s += ban2.svg;
    var H = ban2.bottom + 12;

    return svg(W, H, 'Schematic, not to scale. A tree: one trunk splits deep into Bos taurus (blue) and Bos indicus (orange). ' +
      'Holstein and Jersey are two short twigs of Bos taurus; Boran sits on Bos indicus. A small bracket marks European ' +
      'crossbreeding (Holstein × Jersey) as breeds of one subspecies; a much larger bracket marks African crossbreeding ' +
      '(Holstein × Boran) as two subspecies.', s);
  }

  /* ---------- Figure B: each cow is a mosaic (schematic) ---------- */

  var COWS = [ // segment lengths are illustrative only; exotic share per cow matches its label
    { name: 'Cow 1', share: 'about 20 % exotic', segs: [['i', 25], ['t', 8], ['i', 35], ['t', 12], ['i', 20]] },
    { name: 'Cow 2', share: 'about 50 % exotic', segs: [['t', 15], ['i', 20], ['t', 20], ['i', 10], ['t', 15], ['i', 20]] },
    { name: 'Cow 3', share: 'about 90 % exotic', segs: [['t', 40], ['i', 6], ['t', 30], ['i', 4], ['t', 20]] }
  ];

  function mosaicBar(segs, x, y, w, h, hatchId, clipId) {
    var s = '<clipPath id="' + clipId + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + h / 2 + '"/></clipPath>';
    s += '<g clip-path="url(#' + clipId + ')">';
    var cx = x;
    segs.forEach(function (sg) {
      var sw = w * sg[1] / 100;
      s += '<rect x="' + cx + '" y="' + y + '" width="' + (sw + 0.5) + '" height="' + h + '" ' +
        (sg[0] === 't' ? 'class="c-tau"' : 'fill="url(#' + hatchId + ')"') + '/>';
      cx += sw;
    });
    return s + '</g>';
  }

  function figB(W) {
    var narrow = W < 560, id = 'b' + (++uid);
    var s = '<defs>' + hatchDef(id + 'h') + '</defs>' + badge('Schematic', W, 'right');
    var lg = legend([
      { cls: 'c-tau', label: 'Taurine (exotic) segment' },
      { fill: 'url(#' + id + 'h)', label: 'Indicine (indigenous) segment' }
    ], W - 110, 4);
    s += lg.svg;
    var y = 4 + lg.h + 14, barH = 26;
    COWS.forEach(function (c, i) {
      if (narrow) {
        s += '<text x="0" y="' + (y + 14) + '"><tspan font-weight="700">' + c.name + '</tspan> · ' + c.share + '</text>';
        s += mosaicBar(c.segs, 0, y + 22, W, barH, id + 'h', id + 'c' + i);
        y += 22 + barH + 16;
      } else {
        var bx = 70, bw = W - bx - 160;
        s += '<text x="0" y="' + (y + 18) + '" font-weight="700">' + c.name + '</text>';
        s += mosaicBar(c.segs, bx, y, bw, barH, id + 'h', id + 'c' + i);
        s += '<text x="' + (bx + bw + 14) + '" y="' + (y + 18) + '">' + c.share + '</text>';
        y += barH + 20;
      }
    });
    return svg(W, y, 'Schematic. Three cows drawn as chromosome-like bars split into blue taurine and hatched orange ' +
      'indicine segments: about 20 %, about 50 % and about 90 % exotic.', s);
  }

  /* ---------- Figure C: one matrix vs ancestry-aware (schematic) ---------- */

  function matrix(x, y, size, cls) {
    var n = 6, c = size / n, s = '';
    for (var r = 0; r < n; r++) {
      for (var k = 0; k < n; k++) {
        s += '<rect x="' + (x + k * c) + '" y="' + (y + r * c) + '" width="' + c + '" height="' + c + '" class="' + cls + '" ' +
          'fill-opacity="' + (r === k ? 0.9 : 0.22) + '"/>';
      }
    }
    s += '<rect x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" fill="none" stroke-width="1.5" class="k-neutral"/>';
    for (var g = 1; g < n; g++) {
      s += '<line x1="' + (x + g * c) + '" y1="' + y + '" x2="' + (x + g * c) + '" y2="' + (y + size) + '" class="k-card" stroke-width="1"/>';
      s += '<line x1="' + x + '" y1="' + (y + g * c) + '" x2="' + (x + size) + '" y2="' + (y + g * c) + '" class="k-card" stroke-width="1"/>';
    }
    return s;
  }
  function arrow(x1, y1, x2, y2, mk) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke-width="2" class="k-neutral" marker-end="url(#' + mk + ')"/>';
  }

  function figC(W) {
    var two = W >= 620, gap = 22, id = 'c' + (++uid);
    var pw = two ? (W - gap) / 2 : W, pad = 16;
    var segs = [['t', 15], ['i', 20], ['t', 20], ['i', 10], ['t', 15], ['i', 20]];
    var P = [
      { title: 'Standard genomic evaluation', desc: 'One relationship matrix G for all segments' },
      { title: 'Ancestry-aware', desc: 'Separate matrices for taurine (G_exo) and indicine (G_ind) segments, each with its own variance' }
    ];
    P.forEach(function (p) {
      p.tl = wrap(p.title, pw - 2 * pad, FS);
      p.dl = wrap(p.desc, pw - 2 * pad, FS);
      p.n = p.tl.length + p.dl.length;
    });
    var titleN = two ? Math.max(P[0].n, P[1].n) : null;
    var size = Math.min(PRINT ? 72 : 96, (pw - 2 * pad - 40) / 2);
    var s = '<defs>' + hatchDef(id + 'h') +
      '<marker id="' + id + 'm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" class="c-neutral"/></marker></defs>';
    s += badge('Schematic', W, 'right');

    var top = 34;
    function panel(p, i, x, y) {
      var n = titleN || p.n, out = '';
      var yt = y + pad + 14;
      out += lines(p.tl, x + pad, yt, 'font-weight="700"');
      out += lines(p.dl, x + pad, yt + p.tl.length * LH, 'class="t-muted"');
      var yBar = yt + n * LH + 4;
      var bw = Math.min(pw - 2 * pad, 280), bx = x + (pw - bw) / 2;
      out += mosaicBar(segs, bx, yBar, bw, 16, id + 'h', id + 'clip' + i);
      var yA = yBar + 22, yG = yA + (PRINT ? 26 : 36);
      var mid = x + pw / 2;
      if (i === 0) {
        out += arrow(mid, yA, mid, yG - 6, id + 'm');
        out += matrix(mid - size / 2, yG, size, 'cell-neutral');
        out += '<text x="' + mid + '" y="' + (yG + size + 22) + '" text-anchor="middle" font-weight="700">G</text>';
        out += '<text x="' + mid + '" y="' + (yG + size + 22 + LH) + '" text-anchor="middle" class="t-muted">all segments</text>';
      } else {
        var xl = mid - size - 16, xr = mid + 16;
        out += arrow(mid - 10, yA, xl + size / 2, yG - 6, id + 'm');
        out += arrow(mid + 10, yA, xr + size / 2, yG - 6, id + 'm');
        out += matrix(xl, yG, size, 'cell-tau');
        out += matrix(xr, yG, size, 'cell-ind');
        out += '<text x="' + (xl + size / 2) + '" y="' + (yG + size + 22) + '" text-anchor="middle" font-weight="700">' + richSvg('G_exo') + '</text>';
        out += '<text x="' + (xr + size / 2) + '" y="' + (yG + size + 22) + '" text-anchor="middle" font-weight="700">' + richSvg('G_ind') + '</text>';
        out += '<text x="' + (xl + size / 2) + '" y="' + (yG + size + 22 + LH) + '" text-anchor="middle" class="t-muted">own variance</text>';
        out += '<text x="' + (xr + size / 2) + '" y="' + (yG + size + 22 + LH) + '" text-anchor="middle" class="t-muted">own variance</text>';
      }
      var h = (yG + size + 22 + LH + pad) - y;
      out = '<rect x="' + (x + 0.5) + '" y="' + (y + 0.5) + '" width="' + (pw - 1) + '" height="' + h + '" rx="12" fill="none" stroke-width="1" class="k-border"/>' + out;
      return { svg: out, h: h };
    }
    var a = panel(P[0], 0, 0, top);
    var b = two ? panel(P[1], 1, pw + gap, top) : panel(P[1], 1, 0, top + a.h + 16);
    s += a.svg + b.svg;
    var H = two ? top + Math.max(a.h, b.h) + 2 : top + a.h + 16 + b.h + 2;
    return svg(W, H, 'Schematic, two panels. Left: standard genomic evaluation, one grey relationship matrix G for all ' +
      'segments. Right: ancestry-aware evaluation, separate matrices for taurine segments (G exo, blue) and indicine ' +
      'segments (G ind, orange), each with its own variance.', s);
  }

  /* ---------- Figures D and E: grouped horizontal bars ---------- */

  function hbar(W, cfg) {
    var wide = W >= 640;
    var s = badge('Simulated data · interim results', W, 'right', true);
    var lg = legend(cfg.series.map(function (se, i) { return { cls: 'c-s' + (i + 1), label: se.name }; }), W, 36);
    s += lg.svg;
    var y = 36 + lg.h + 12 + (cfg.ref ? 22 : 0);
    var plotTop = y;
    var leftW = wide ? 250 : 0;
    var maxLab = 0;
    cfg.series.forEach(function (se) {
      se.values.forEach(function (v) { maxLab = Math.max(maxLab, tw(cfg.fmt(v) + ' · ' + se.short, FS)); });
    });
    var x0 = wide ? leftW + 14 : 0, x1 = W - maxLab - 14;
    function sx(v) { return x0 + (v - cfg.min) / (cfg.max - cfg.min) * (x1 - x0); }

    var barH = PRINT ? 16 : 19, sGap = PRINT ? 3 : 4, gGap = PRINT ? 11 : wide ? 20 : 16, bars = '', labs = '';
    cfg.cats.forEach(function (c, ci) {
      var cl = wrap(c, wide ? leftW : W, FS);
      if (!wide) { labs += lines(cl, 0, y + 14, 'font-weight="700" class="halo"'); y += cl.length * LH + 4; }
      var g0 = y;
      cfg.series.forEach(function (se, si) {
        var v = se.values[ci];
        bars += '<rect x="' + x0 + '" y="' + y + '" width="' + Math.max(1, sx(v) - x0) + '" height="' + barH + '" rx="3" class="c-s' + (si + 1) + '"' +
          tipAttr('<b>' + richHtml(se.name) + '</b><br>' + esc(c) + ': ' + esc(cfg.fmt(v))) + '/>';
        labs += '<text class="halo" x="' + (sx(v) + 7) + '" y="' + (y + 14) + '"><tspan font-weight="700">' + esc(cfg.fmt(v)) +
          '</tspan><tspan class="t-muted"> · ' + richSvg(se.short) + '</tspan></text>';
        y += barH + sGap;
      });
      if (wide) {
        var gm = (g0 + y - sGap) / 2;
        labs += lines(cl, leftW, gm + 5 - (cl.length - 1) * LH / 2, 'text-anchor="end"');
      }
      y += gGap;
    });
    var plotBottom = y - gGap + 6;
    var grid = '', step = 1;
    while ((sx(cfg.ticks[step]) - sx(cfg.ticks[0])) < 44 && step < cfg.ticks.length - 1) step++;
    cfg.ticks.forEach(function (t, ti) {
      grid += '<line x1="' + sx(t) + '" x2="' + sx(t) + '" y1="' + (plotTop - 4) + '" y2="' + plotBottom + '" class="gridline" stroke-width="1"/>';
      if (ti % step === 0) grid += '<text x="' + sx(t) + '" y="' + (plotBottom + 18) + '" text-anchor="middle" font-size="14" class="t-muted">' + cfg.tickFmt(t) + '</text>';
    });
    grid += '<line x1="' + x0 + '" x2="' + x0 + '" y1="' + (plotTop - 4) + '" y2="' + plotBottom + '" class="axis" stroke-width="1.5"/>';
    var ref = '';
    if (cfg.ref) {
      var rx = sx(cfg.ref.x);
      ref += '<line x1="' + rx + '" x2="' + rx + '" y1="' + (plotTop - 8) + '" y2="' + plotBottom + '" class="ref" stroke-width="2"/>';
      ref += '<text x="' + rx + '" y="' + (plotTop - 13) + '" text-anchor="middle" font-size="13" font-weight="700">' + esc(cfg.ref.label) + '</text>';
    }
    var at = wrap(cfg.axisTitle, W - 8, 15);
    var half = Math.max.apply(null, at.map(function (l) { return tw(l, 15); })) / 2;
    var ax = Math.min(Math.max((x0 + x1) / 2, half + 4), W - half - 4);
    var axisT = lines(at, ax, plotBottom + 42, 'text-anchor="middle" class="t-muted"');
    var H = plotBottom + 42 + (at.length - 1) * LH + 10;
    return svg(W, H, cfg.label, s + grid + bars + ref + labs + axisT);
  }

  function cfgD() {
    return {
      cats: FIG_D.categories,
      series: FIG_D.series.map(function (se, i) { return { name: se.name, values: se.values, short: ['r_g = 1', 'r_g = 0.5'][i] }; }),
      min: 0, max: 0.11, ticks: [0, 0.02, 0.04, 0.06, 0.08, 0.10],
      fmt: function (v) { return '+' + v.toFixed(3); },
      tickFmt: function (t) { return t.toFixed(2); },
      axisTitle: 'Gain in accuracy of breeding values (correlation with true values)',
      label: 'Simulated data, interim results. Horizontal grouped bar chart of gains in accuracy of breeding values for ' +
        'four model comparisons, with same allele effects in both origins and with different allele effects.'
    };
  }
  function cfgE() {
    return {
      cats: FIG_E.categories,
      series: FIG_E.series.map(function (se, i) { return { name: se.name, values: se.values, short: ['one matrix', 'ancestry-aware'][i] }; }),
      min: 0, max: 1.2, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2],
      fmt: function (v) { return v.toFixed(2); },
      tickFmt: function (t) { return t.toFixed(1); },
      ref: { x: 1, label: 'correct scale' },
      axisTitle: 'Slope of true on estimated breeding values (1 = correct scale)',
      label: 'Simulated data, interim results. Horizontal grouped bar chart of the slope of true on estimated breeding ' +
        'values in four breed classes, for one matrix and for the ancestry-aware model; dashed line at 1 marks the correct scale.'
    };
  }

  /* ---------- Figure H: budget ---------- */

  function gbp(v) { return '£' + v.toLocaleString('en-GB'); }

  function figH(W) {
    var s = '', total = FIG_H.total;
    s += '<text x="0" y="16" font-weight="700">Total requested: ' + gbp(total) + '</text>';
    var y = 28, h = 38, x = 0;
    FIG_H.items.forEach(function (it, i) {
      var w = W * it[1] / total;
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" class="c-b' + (i + 1) + ' k-card" stroke-width="2"' +
        tipAttr('<b>' + esc(it[0]) + '</b><br>' + gbp(it[1])) + '/>';
      x += w;
    });
    s += '<text x="0" y="' + (y + h + 18) + '" font-size="13" class="t-muted">£0</text>';
    s += '<text x="' + W + '" y="' + (y + h + 18) + '" font-size="13" text-anchor="end" class="t-muted">' + gbp(total) + '</text>';
    y += h + 52;
    FIG_H.items.forEach(function (it, i) {
      s += '<rect x="0" y="' + (y - 13) + '" width="15" height="15" rx="3" class="c-b' + (i + 1) + '"/>';
      s += '<text x="24" y="' + y + '">' + esc(it[0]) + '</text>';
      s += '<text x="' + W + '" y="' + y + '" text-anchor="end" font-weight="700">' + gbp(it[1]) + '</text>';
      s += '<line x1="24" x2="' + W + '" y1="' + (y + 8) + '" y2="' + (y + 8) + '" class="gridline" stroke-width="1"/>';
      y += 28;
    });
    return svg(W, y - 6, 'Budget requested from the Award, total ' + gbp(total) + ', shown as one stacked bar: ' +
      FIG_H.items.map(function (it) { return it[0] + ' ' + gbp(it[1]); }).join('; ') + '.', s);
  }

  /* ---------- show-data tables ---------- */

  function tableGrouped(fig, fmt) {
    var h = '<table><thead><tr><th></th>' + fig.series.map(function (se) { return '<th class="num">' + richHtml(se.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
    fig.categories.forEach(function (c, i) {
      h += '<tr><td>' + esc(c) + '</td>' + fig.series.map(function (se) { return '<td class="num">' + fmt(se.values[i]) + '</td>'; }).join('') + '</tr>';
    });
    return h + '</tbody></table>';
  }
  function tableH() {
    var h = '<table><thead><tr><th>Item</th><th class="num">Cost (£)</th></tr></thead><tbody>';
    FIG_H.items.forEach(function (it, i) {
      h += '<tr><td><span class="swatch" style="background:var(--b' + (i + 1) + ')"></span>' + esc(it[0]) + '</td><td class="num">' + it[1].toLocaleString('en-GB') + '</td></tr>';
    });
    return h + '<tr class="total"><td>Total</td><td class="num">' + FIG_H.total.toLocaleString('en-GB') + '</td></tr></tbody></table>';
  }
  function fillDataSlots() {
    var T = {
      D: tableGrouped(FIG_D, function (v) { return '+' + v.toFixed(3); }),
      E: tableGrouped(FIG_E, function (v) { return v.toFixed(2); }),
      H: tableH()
    };
    document.querySelectorAll('.data-slot').forEach(function (el) {
      var t = T[el.getAttribute('data-for')];
      if (t) el.innerHTML = '<details class="showdata"><summary>Show data</summary><div class="table-scroll">' + t + '</div></details>';
    });
  }

  /* ---------- rendering ---------- */

  var FIGS = {
    A: figA, B: figB, C: figC,
    D: function (W) { return hbar(W, cfgD()); },
    E: function (W) { return hbar(W, cfgE()); },
    H: figH
  };
  var MAX_PRINT_W = 660;

  function renderAll(printMode) {
    PRINT = !!printMode;
    document.querySelectorAll('.fig-canvas').forEach(function (el) {
      var W = Math.floor(el.clientWidth);
      if (printMode) W = MAX_PRINT_W;
      if (W < 260) W = 260;
      if (el._w === W) return;
      el._w = W;
      try { el.innerHTML = FIGS[el.getAttribute('data-fig')](W); }
      catch (e) { el.textContent = 'Figure could not be drawn.'; if (window.console) console.error(e); }
    });
  }

  /* ---------- tooltip ---------- */

  var tip = document.getElementById('tooltip');
  function showTip(el, x, y) {
    tip.innerHTML = el.getAttribute('data-tip');
    tip.hidden = false;
    var r = tip.getBoundingClientRect();
    var left = Math.min(x + 14, window.innerWidth - r.width - 8);
    var top = y - r.height - 12;
    if (top < 60) top = y + 18;
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { tip.hidden = true; }
  document.addEventListener('mousemove', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) showTip(t, e.clientX, e.clientY); else if (!tip.hidden) hideTip();
  });
  document.addEventListener('focusin', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) { var r = t.getBoundingClientRect(); showTip(t, r.right, r.top); }
  });
  document.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- navigation highlight ---------- */

  function navHighlight() {
    var links = {};
    document.querySelectorAll('.topnav li a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.toggle('active', k === en.target.id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(links).forEach(function (k) { var s = document.getElementById(k); if (s) obs.observe(s); });
  }

  /* ---------- start ---------- */

  document.querySelectorAll('[data-key]').forEach(function (el) {
    var k = el.getAttribute('data-key');
    if (KEY_NUMBERS[k]) el.textContent = KEY_NUMBERS[k];
  });
  var alt = document.getElementById('budget-alt');
  if (alt) alt.textContent = FIG_H.alternative;

  fillDataSlots();
  renderAll(false);
  navHighlight();

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { renderAll(false); }, 120); });
  window.addEventListener('beforeprint', function () { hideTip(); renderAll(true); });
  window.addEventListener('afterprint', function () { renderAll(false); });
  if (window.matchMedia) {
    var mq = window.matchMedia('print');
    var onPrint = function (m) { renderAll(m.matches); };
    if (mq.addEventListener) mq.addEventListener('change', onPrint);
  }
  document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
})();
