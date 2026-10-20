// Shared renderer for mahabharata.html and ramayana.html. Expects window.EPIC and window.EPICS (epics-data.js).
(function () {
  const EPIC = window.EPIC, DATA = window.EPICS || { datings: [], analysis: {} };
  const ALL = DATA.datings.filter(d => d.epic === EPIC);
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtN = n => Math.round(Math.abs(n)).toLocaleString('en-US');
  const fmtY = y => y == null ? '—' : y < 0 ? fmtN(y) + ' BCE' : fmtN(y) + ' CE';
  const li = a => (a || []).length ? '<ul>' + a.map(x => `<li>${esc(x).replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')}</li>`).join('') + '</ul>' : '<p class="note">—</p>';

  const METHODS = {
    'Astronomical (planetarium software)': '#c0392b', 'Astronomical (classical / siddhantic)': '#e67e22',
    'Genealogical / Puranic king-lists': '#8e44ad', 'Era / epigraphic reckoning': '#2980b9', 'Archaeological': '#27ae60',
    'Textual / linguistic': '#16a085', 'Traditional yuga chronology': '#b8860b', 'Geological / other science claim': '#7f8c8d', 'Other': '#95a5a6' };
  const BANDS = EPIC === 'Mahabharata' ? [] : [{ from: -10900, to: -9700, label: 'Younger Dryas', c: 'rgba(80,120,200,.10)' }];
  BANDS.push(
    { from: -7000, to: -3300, label: 'Early farming (Mehrgarh)', c: 'rgba(120,120,120,.07)' },
    { from: -3300, to: -2600, label: 'Early Harappan', c: 'rgba(181,101,29,.10)' },
    { from: -2600, to: -1900, label: 'Mature Harappan', c: 'rgba(181,101,29,.20)' },
    { from: -1900, to: -1300, label: 'Late Harappan', c: 'rgba(181,101,29,.10)' },
    { from: -1500, to: -1000, label: 'Rigveda', c: 'rgba(40,140,90,.10)' },
    { from: -1200, to: -600, label: 'Painted Grey Ware / Kuru', c: 'rgba(40,140,90,.18)' },
    { from: -400, to: 400, label: 'Text composed (academic view)', c: 'rgba(22,160,133,.18)' });
  const LINES = [{ y: -3102, label: 'Kali epoch 3102 BCE' }, { y: -268, label: 'Ashoka' }];

  // filters
  const methodsPresent = Object.keys(METHODS).filter(m => ALL.some(d => d.method === m));
  $('#chips').innerHTML = methodsPresent.map(m => `<label class="chip"><input type="checkbox" value="${esc(m)}" checked><i style="background:${METHODS[m]}"></i>${esc(m)} (${ALL.filter(d => d.method === m).length})</label>`).join('');
  const active = () => [...document.querySelectorAll('#chips input:checked')].map(i => i.value);

  function rows() {
    const q = $('#q').value.toLowerCase(), ms = active(), ev = $('#ev').value;
    return ALL.filter(d => ms.includes(d.method) && (!q || JSON.stringify(d).toLowerCase().includes(q)) &&
      (!ev || (ev === 'text' ? /text|compos/i.test(d.event) : !/text|compos/i.test(d.event))))
      .sort((a, b) => (a.year ?? 1e9) - (b.year ?? 1e9));
  }

  function chart(list) {
    // Log-scale time axis ("years before 2600 CE") so 18-million-year traditional dates and 400 CE text dates both fit.
    const dated = list.filter(d => d.year != null), undated = list.filter(d => d.year == null);
    const REF = 2600, u = y => -Math.log10(REF - Math.min(y, 2000));
    const minY = Math.min(-6000, ...dated.map(d => d.yearLow ?? d.year)), maxY = 1600;
    const L = 250, W = 1000, R = 20, RH = 17, top = 64, H = top + dated.length * RH + 30;
    const x = y => L + (u(y) - u(minY)) / (u(maxY) - u(minY)) * (W - L - R);
    let s = '';
    const vis = BANDS.filter(b => b.to >= minY);
    vis.forEach(b => { const x0 = x(Math.max(b.from, minY)), x1 = x(b.to);
      s += `<rect x="${x0}" y="${top - 6}" width="${x1 - x0}" height="${H - top - 18}" fill="${b.c}"><title>${b.label}: ${fmtY(b.from)} – ${fmtY(b.to)}</title></rect>`; });
    vis.forEach((b, i) => s += `<text x="${(x(Math.max(b.from, minY)) + x(b.to)) / 2}" y="${9 + (i % 5) * 9}" font-size="9" text-anchor="middle" fill="var(--muted)">${b.label}</text>`);
    [1000, 0, -1000, -2000, -3000, -5000, -10000, -50000, -1e6, -1e7].filter(t => t >= minY && t <= maxY)
      .forEach(t => s += `<line x1="${x(t)}" x2="${x(t)}" y1="${top - 6}" y2="${H - 24}" stroke="var(--line)"/><text x="${x(t)}" y="${H - 10}" font-size="9.5" text-anchor="middle" fill="var(--muted)">${t === 0 ? '0' : Math.abs(t) >= 1e6 ? (Math.abs(t) / 1e6) + 'M BCE' : fmtY(t)}</text>`);
    LINES.forEach(l => s += `<line x1="${x(l.y)}" x2="${x(l.y)}" y1="${top - 8}" y2="${H - 24}" stroke="var(--fg)" stroke-dasharray="3 3" opacity=".6"/><text x="${x(l.y) - 3}" y="${top - 10}" font-size="9.5" text-anchor="end" fill="var(--fg)">${l.label}</text>`);
    s += `<text x="${W - R}" y="${H}" font-size="9" text-anchor="end" fill="var(--muted)">log-scale time axis</text>`;
    dated.forEach((d, i) => {
      const y = top + i * RH + RH / 2, c = METHODS[d.method] || '#999', lo = d.yearLow ?? d.year, hi = d.yearHigh ?? d.year, px = x(d.year), flip = px > W - 230;
      const lab = esc(d.dateLabel.length > 40 ? d.dateLabel.slice(0, 39) + '…' : d.dateLabel);
      s += `<g class="row" data-id="${esc(d.id)}"><rect x="0" y="${y - RH / 2}" width="${W}" height="${RH}" fill="transparent"/>
        <text x="${L - 8}" y="${y + 4}" font-size="11" text-anchor="end">${esc(d.proposer.length > 34 ? d.proposer.slice(0, 33) + '…' : d.proposer)}</text>
        ${hi > lo ? `<rect x="${x(lo)}" y="${y - 3}" width="${Math.max(x(hi) - x(lo), 2)}" height="6" rx="3" fill="${c}" opacity=".45"/>` : ''}
        <circle cx="${px}" cy="${y}" r="4.5" fill="${c}"/>
        <text x="${flip ? px - 8 : px + 8}" y="${y + 4}" font-size="10" text-anchor="${flip ? 'end' : 'start'}" fill="var(--muted)" style="paint-order:stroke" stroke="var(--card)" stroke-width="3">${lab}</text>
        <title>${esc(d.proposer)}: ${esc(d.dateLabel)} (${esc(d.event)}) · ${esc(d.method)} · ${esc(d.work)}</title></g>`;
    });
    $('#chart').setAttribute('viewBox', `0 0 ${W} ${H}`);
    $('#chart').innerHTML = s;
    $('#deep').innerHTML = '';
    $('#undated').innerHTML = undated.length ? `<h3>No single year</h3><ul>${undated.map(d => `<li><a href="#d-${esc(d.id)}">${esc(d.proposer)}</a>: ${esc(d.dateLabel)}</li>`).join('')}</ul>` : '';
    document.querySelectorAll('#chart .row').forEach(g => g.onclick = () => openCard(g.dataset.id));
  }

  function card(d) {
    return `<details class="card" id="d-${esc(d.id)}"><summary><span class="dot" style="background:${METHODS[d.method]}"></span><b>${esc(d.proposer)}</b>: ${esc(d.dateLabel)}
      <span class="tag">${esc(d.event)}</span>${d.verification !== 'Verified from sources' ? `<span class="tag">⚠ ${esc(d.verification)}</span>` : ''}<span class="score">${d.plausibility}/10</span></summary>
      <div class="body"><p class="note">${esc(d.proposerInfo)} · ${esc(d.method)} · ${esc(d.work)}</p><p>${esc(d.summary)}</p>
      <h4>Key evidence</h4>${li(d.keyEvidence)}<h4>Builds on / responds to</h4>${li(d.buildsOn)}<h4>Critiques</h4>${li(d.critiques)}<h4>References</h4>${li(d.references)}</div></details>`;
  }
  function openCard(id) { const el = document.getElementById('d-' + id); if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth' }); } }

  // lineage: who builds on whom, matched against proposers in this dataset
  function lineage() {
    const names = [...new Set(ALL.map(d => d.proposer))];
    const surname = n => n.replace(/\(.*?\)/g, '').trim().split(/[\s/&,]+/).filter(w => w.length > 3).pop()?.toLowerCase();
    const rowsL = ALL.map(d => ({ d, links: [...new Set((d.buildsOn || []).map(b => names.find(n => n !== d.proposer && surname(n) && b.toLowerCase().includes(surname(n)))).filter(Boolean))] }))
      .filter(r => r.links.length).sort((a, b) => (a.d.workYear ?? 0) - (b.d.workYear ?? 0));
    $('#lineage').innerHTML = rowsL.length ? '<table><thead><tr><th>Dater</th><th>Published</th><th>Builds on / responds to (also in this dataset)</th></tr></thead><tbody>' +
      rowsL.map(r => `<tr><td><a href="#d-${esc(r.d.id)}">${esc(r.d.proposer)}</a> <span class="note">${esc(r.d.dateLabel)}</span></td><td>${r.d.workYear ?? '—'}</td><td>${r.links.map(esc).join(', ')}</td></tr>`).join('') + '</tbody></table>' : '<p class="note">No links found.</p>';
  }

  function md(src) {
    const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    const L = (src || '').split('\n'); let out = '', i = 0;
    while (i < L.length) { const l = L[i];
      if (/^#{1,6}\s/.test(l)) { const n = l.match(/^#+/)[0].length; out += `<h${n + 1}>${inl(l.replace(/^#+\s*/, ''))}</h${n + 1}>`; i++; }
      else if (/^\s*\|/.test(l)) { const r = []; while (i < L.length && /^\s*\|/.test(L[i])) r.push(L[i++]); const cells = x => x.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        out += '<table><thead><tr>' + cells(r[0]).map(c => `<th>${inl(c)}</th>`).join('') + '</tr></thead><tbody>' + r.slice(2).map(x => '<tr>' + cells(x).map(c => `<td>${inl(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>'; }
      else if (/^\s*([-*]|\d+\.)\s/.test(l)) { const ord = /^\s*\d+\./.test(l), it = []; while (i < L.length && /^\s*([-*]|\d+\.)\s/.test(L[i])) it.push(L[i++].replace(/^\s*([-*]|\d+\.)\s/, '')); out += (ord ? '<ol>' : '<ul>') + it.map(x => `<li>${inl(x)}</li>`).join('') + (ord ? '</ol>' : '</ul>'); }
      else if (!l.trim() || /^---+\s*$/.test(l)) i++;
      else { const p = []; while (i < L.length && L[i].trim() && !/^(#|\s*\||\s*[-*]\s|\s*\d+\.\s|---)/.test(L[i])) p.push(L[i++]); out += `<p>${inl(p.join(' '))}</p>`; } }
    return out;
  }

  function render() { const list = rows(); chart(list); $('#cards').innerHTML = list.map(card).join(''); $('#count').textContent = `${list.length} of ${ALL.length} datings`; }
  $('#q').oninput = render; $('#ev').oninput = render; document.querySelectorAll('#chips input').forEach(i => i.onchange = render);
  $('#analysis').innerHTML = md(DATA.analysis[EPIC]) || '<p class="note">Analysis pending.</p>';
  lineage(); render();
  if (location.hash.startsWith('#d-')) openCard(location.hash.slice(3));
})();
