const field = document.getElementById('field'), details = document.getElementById('details');
function update() {
  const rect = field.getBoundingClientRect(), area = getComputedStyle(document.getElementById('safe')), vv = window.visualViewport;
  field.width = Math.max(1, Math.round(rect.width)); field.height = Math.max(1, Math.round(rect.height));
  let ctx = null; try { ctx = field.getContext('2d'); } catch { /* Report geometry even if drawing is unavailable. */ }
  if (ctx) {
  for (let y = 0; y < field.height; y += 40) for (let x = 0; x < field.width; x += 40) { ctx.fillStyle = (x / 40 + y / 40) % 2 ? '#00794f' : '#0b9b68'; ctx.fillRect(x, y, 40, 40); }
  ctx.fillStyle = '#ff3477'; ctx.fillRect(field.width - 24, 0, 24, field.height);
  ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, field.width - 8, field.height - 8);
  }
  details.textContent = JSON.stringify({ test: document.documentElement.dataset.variant, installed: navigator.standalone === true || matchMedia('(display-mode:standalone), (display-mode:fullscreen)').matches,
    viewport: [innerWidth, innerHeight], visualViewport: vv ? [vv.width, vv.height, vv.scale] : null,
    screen: [screen.width, screen.height], canvas: [rect.width, rect.height], canvasPainted: !!ctx, orientation: matchMedia('(orientation:landscape)').matches ? 'landscape' : 'portrait',
    safeArea: [area.paddingTop, area.paddingRight, area.paddingBottom, area.paddingLeft], fullscreenEnabled: document.fullscreenEnabled === true,
    elementFullscreen: typeof document.documentElement.requestFullscreen === 'function', prefixedFullscreen: typeof document.documentElement.webkitRequestFullscreen === 'function' }, null, 2);
}
addEventListener('resize', update); window.visualViewport?.addEventListener('resize', update); addEventListener('orientationchange', update); update();
document.getElementById('copy').onclick = async () => {
  const status = document.getElementById('status');
  try { if (!navigator.clipboard?.writeText) throw Error('Unavailable'); await navigator.clipboard.writeText(details.textContent); status.textContent = 'Screen details copied.'; }
  catch { status.textContent = 'Select the details below to copy them.'; details.focus(); }
};
