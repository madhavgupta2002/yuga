// Top-level tabs shared by every page.
(function () {
  const here = location.pathname.split('/').pop() || 'index.html';
  const tabs = [['Yuga cycles', 'index.html', ['index.html', 'visualizer.html']], ['Mahabharata dating', 'mahabharata.html', ['mahabharata.html']], ['Ramayana dating', 'ramayana.html', ['ramayana.html']]];
  const el = document.getElementById('topnav');
  el.innerHTML = '<div style="background:#2b2b33;"><div style="max-width:1100px;margin:auto;padding:0 20px;display:flex;gap:2px">' +
    tabs.map(([t, href, pages]) => `<a href="${href}" style="padding:10px 16px;color:${pages.includes(here) ? '#fff' : '#bbb'};text-decoration:none;font-weight:${pages.includes(here) ? 600 : 400};border-bottom:3px solid ${pages.includes(here) ? '#e0a060' : 'transparent'}">${t}</a>`).join('') +
    '</div></div>';
})();
