export function setupFullscreen(button, onError, doc = document) {
  const supported = doc.fullscreenEnabled === true && typeof doc.documentElement?.requestFullscreen === 'function' && typeof doc.exitFullscreen === 'function';
  button.hidden = !supported;
  if (!supported) return;
  const update = () => { button.textContent = doc.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'; };
  doc.addEventListener('fullscreenchange', update);
  button.onclick = async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      if (doc.fullscreenElement) await doc.exitFullscreen();
      else await doc.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch { onError(); }
    finally { button.disabled = false; update(); }
  };
  update();
}
