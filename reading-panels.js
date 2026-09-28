(() => {
  const root = document.documentElement;
  const panels = [...document.querySelectorAll('.reading-panel')];
  const navigation = [...document.querySelectorAll('.profile-nav a')];
  const navigationGroups = [...document.querySelectorAll('.nav-group')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smoothstep = value => value * value * (3 - 2 * value);
  let frame = 0;
  let navigationFocus = null;

  function update() {
    frame = 0;
    const height = window.innerHeight;
    const bounds = panels.map(panel => panel.querySelector('.panel-content').getBoundingClientRect());
    let focusY = height * .46;
    const edgeRange = height * .3;
    const remaining = Math.max(0, root.scrollHeight - height - window.scrollY);
    const topBlend = smoothstep(1 - clamp(window.scrollY / edgeRange));
    const bottomBlend = smoothstep(1 - clamp(remaining / edgeRange));
    const firstCenter = bounds[0].top + bounds[0].height / 2;
    const lastCenter = bounds.at(-1).top + bounds.at(-1).height / 2;
    focusY += (Math.min(height, firstCenter) - focusY) * topBlend;
    focusY += (Math.max(0, Math.min(height, lastCenter)) - focusY) * bottomBlend;
    // An explicit jump takes precedence over the page-bottom focus adjustment.
    // Keep the requested entry selected until the reader resumes manual scrolling.
    if (navigationFocus) {
      const rect = navigationFocus.getBoundingClientRect();
      focusY = Math.max(0, Math.min(height, rect.top + rect.height / 2));
    }

    // Only the sidebar selection follows the reading position. Content remains
    // fully visible and unfiltered at every scroll position.
    const distances = bounds.map(rect => {
      const clearRadius = Math.max(0, (rect.height - height * .4) / 2);
      return Math.max(0, Math.abs(rect.top + rect.height / 2 - focusY) - clearRadius);
    });
    const nearest = Math.min(...distances);
    const requestedPanel = navigationFocus?.closest('.reading-panel');
    const currentPanel = requestedPanel || panels[distances.indexOf(nearest)];
    const current = currentPanel.closest('section');
    let activeEntryId = currentPanel.id;
    if (current.id === 'education' || current.id === 'project') {
      const entries = [...current.querySelectorAll('.education-entry, .project-entry')];
      activeEntryId = navigationFocus?.matches('.education-entry, .project-entry') ? navigationFocus.id : entries.reduce((best, entry) => {
        const rect = entry.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - focusY);
        return distance < best.distance ? { id: entry.id, distance } : best;
      }, { id: '', distance: Infinity }).id;
    }

    // Batch layout reads above and navigation writes below, once per frame.
    for (const link of navigation) {
      if (link.hash === `#${current.id}` || link.hash === `#${activeEntryId}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
    navigationGroups.forEach(group => {
      group.toggleAttribute('data-current', group.dataset.section === current.id);
    });
  }

  function scheduleUpdate() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  function navigateToEntry(hash, behavior, moveFocus = false) {
    const target = document.getElementById(hash.slice(1));
    if (!target || !document.querySelector('main').contains(target)) return;
    const entry = target.id === 'experience' ? target.querySelector('.reading-panel') : target;
    const content = entry.querySelector(':scope > .panel-content') || entry;
    navigationFocus = content;
    const rect = content.getBoundingClientRect();
    // Center short entries in the viewport; long ones start near the top.
    const offset = Math.max(window.innerHeight * .12, window.innerHeight * .46 - rect.height / 2);
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - offset), behavior });
    if (moveFocus) {
      const heading = entry.querySelector('h2, h3') || entry;
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    scheduleUpdate();
  }

  navigation.forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
      navigateToEntry(link.hash, reducedMotion.matches ? 'auto' : 'smooth', event.detail === 0);
    });
  });
  window.addEventListener('hashchange', () => navigateToEntry(window.location.hash, 'auto'));

  function resumeReading(event) {
    if (event.target instanceof Element && event.target.closest('.profile-panel')) return;
    navigationFocus = null;
    scheduleUpdate();
  }
  window.addEventListener('wheel', resumeReading, { passive: true });
  window.addEventListener('touchstart', resumeReading, { passive: true });
  window.addEventListener('pointerdown', resumeReading, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) resumeReading(event);
  });

  // Native scrolling, with no wheel interception, snapping, or stop/start timer.
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('pageshow', scheduleUpdate);
  reducedMotion.addEventListener('change', scheduleUpdate);
  const resizeObserver = new ResizeObserver(scheduleUpdate);
  panels.forEach(panel => resizeObserver.observe(panel));
  document.fonts.ready.then(() => {
    if (window.location.hash) navigateToEntry(window.location.hash, 'auto');
    else scheduleUpdate();
  });
  update();
})();
