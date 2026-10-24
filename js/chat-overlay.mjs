const chatUrl = new URL('../chat/', import.meta.url);

if (!document.querySelector('#tonyChatOverlay')) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('../css/chat-overlay.css', import.meta.url).href;
  document.head.append(stylesheet);

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'findAskLauncher';
  launcher.setAttribute('aria-label', 'Open AI Engineering Lab chat');
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.innerHTML = `<img src="${new URL('../images/portfolio/tonykoo.png', import.meta.url)}" alt="" width="50" height="50"><span>Ask me<small>in the lab</small></span>`;

  const dialog = document.createElement('dialog');
  dialog.id = 'tonyChatOverlay';
  dialog.className = 'chatOverlay';
  dialog.setAttribute('aria-label', 'AI Engineering Lab chat');
  dialog.innerHTML = `<div class="chatOverlayPanel">
    <div class="chatOverlayBar"><span>AI Engineering Lab</span><div class="chatOverlayActions"><a href="${chatUrl.href}">Expand chat</a><button type="button" aria-label="Close chat"><svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div></div>
    <iframe title="AI Engineering Lab conversation" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>`;
  document.body.append(launcher, dialog);

  const frame = dialog.querySelector('iframe');
  let previousFocus = launcher;
  let frameLoaded = false;

  function focusComposer() {
    try { frame.contentDocument?.querySelector('#chatInput')?.focus({ preventScroll: true }); } catch {}
  }
  frame.addEventListener('load', () => { frameLoaded = true; if (dialog.open) focusComposer(); });

  function open(trigger) {
    if (dialog.open || document.querySelector('dialog[open]')) return;
    previousFocus = trigger || document.activeElement || launcher;
    if (!frame.src) frame.src = new URL('chat/?embed=1', new URL('../', import.meta.url)).href;
    dialog.showModal();
    if (frameLoaded) focusComposer();
    else dialog.querySelector('button').focus({ preventScroll: true });
  }

  launcher.addEventListener('click', () => open(launcher));
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); });

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || url.pathname !== chatUrl.pathname) return;
    if (anchor.closest('#tonyChatOverlay')) return;
    event.preventDefault();
    anchor.closest('dialog[open]')?.close();
    open(anchor);
  });

  window.addEventListener('message', (event) => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'tony-chat-close' && dialog.open) dialog.close();
  });
}
