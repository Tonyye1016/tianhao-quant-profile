const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const code = readFileSync(require('node:path').join(__dirname, '../analytics.js'), 'utf8');
const ID = 'G-K95ZZV60ER';
const KEY = 'tony-profile-analytics-v1';
const SITE = 'https://tonyye1016.github.io/tianhao-quant-profile/';
const ids = ['analytics-notice', 'privacy-settings', 'privacy-status', 'analytics-title', 'analytics-accept', 'analytics-reject', 'analytics-close'];

function setup(options = {}) {
  const events = {}, windowEvents = {}, scripts = [], deleted = [];
  const elements = Object.fromEntries(ids.map(id => [id, {
    hidden: true, disabled: false, textContent: '', listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    focus() { this.focused = true; }
  }]));
  let stored = options.stored ?? null;
  let reloaded = 0;
  const location = new URL(options.url || SITE);
  location.reload = () => { reloaded++; };
  const document = {
    referrer: options.referrer || '',
    getElementById: id => elements[id],
    createElement: name => ({ tagName: name }),
    head: { appendChild: element => scripts.push(element) },
    addEventListener: (name, fn) => { events[name] = fn; },
    get cookie() { return options.cookies || ''; },
    set cookie(value) { deleted.push(value); }
  };
  const window = { addEventListener: (name, fn) => { windowEvents[name] = fn; } };
  const localStorage = {
    getItem: key => { assert.equal(key, KEY); if (options.blockRead) throw Error('blocked'); return stored; },
    setItem: (key, value) => { assert.equal(key, KEY); if (options.blockWrite) throw Error('blocked'); stored = value; }
  };
  vm.runInNewContext(code, { window, document, location, navigator: options.navigator || {}, localStorage, URL, URLSearchParams, Date });
  return {
    elements, scripts, deleted, window,
    commands: () => Array.from(window.dataLayer || [], args => Array.from(args)),
    click: id => elements[id].listeners.click(),
    choice: () => stored && JSON.parse(stored).choice,
    reloads: () => reloaded,
    link: (href, type = 'click', button = 0, defaultPrevented = false) => events[type]({ type, button, defaultPrevented, target: { closest: () => ({ href }) } }),
    changeStorage: value => { stored = value; windowEvents.storage({ key: KEY }); }
  };
}
const saved = (choice, age = 0) => JSON.stringify({ choice, time: Date.now() - age });

test('no Google tag or commands before explicit consent; decline stays off', () => {
  const s = setup();
  assert.equal(s.elements['analytics-notice'].hidden, false);
  assert.equal(s.scripts.length, 0);
  assert.equal(s.commands().length, 0);
  s.click('analytics-reject');
  assert.equal(s.choice(), 'denied');
  assert.equal(s.scripts.length, 0);
  assert.equal(s.elements['analytics-notice'].hidden, true);
});

test('accept loads once with ad features disabled and sanitized context', () => {
  const s = setup({ url: `${SITE}?utm_source=jpmc&utm_medium=email&utm_campaign=quant_2027&email=private@example.com#secret`, referrer: 'https://www.linkedin.com/in/private-person/?token=secret' });
  s.click('analytics-accept');
  s.click('analytics-accept');
  assert.equal(s.scripts.length, 1);
  assert.equal(s.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${ID}`);
  assert.equal(s.scripts[0].referrerPolicy, 'no-referrer');
  const commands = s.commands();
  assert.equal(commands[0][0], 'consent');
  assert.equal(commands[0][2].analytics_storage, 'denied');
  assert.equal(commands[0][2].ad_storage, 'denied');
  assert.equal(commands[0][2].ad_user_data, 'denied');
  assert.equal(commands[1][2].analytics_storage, 'granted');
  const config = commands.find(c => c[0] === 'config')[2];
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.cookie_domain, 'none');
  assert.equal(config.cookie_path, '/tianhao-quant-profile/');
  assert.equal(config.page_referrer, 'https://www.linkedin.com/');
  assert.equal(config.page_location, `${SITE}?utm_source=jpmc&utm_medium=email&utm_campaign=quant_2027`);
  assert.ok(!JSON.stringify(commands).includes('private'));
});

test('unapproved campaign labels and PII-like values are stripped', () => {
  const s = setup({ url: `${SITE}?utm_source=alice_smith&utm_medium=email&utm_campaign=private@example.com&gclid=secret` });
  s.click('analytics-accept');
  const config = s.commands().find(c => c[0] === 'config')[2];
  assert.equal(config.page_location, `${SITE}?utm_medium=email`);
});

test('only resume and LinkedIn clicks are collected; never mailto/tel/contact data', () => {
  const s = setup();
  s.link(`${SITE}resume.pdf`);
  assert.equal(s.commands().length, 0);
  s.click('analytics-accept');
  s.link(`${SITE}resume.pdf?v=123`);
  s.link('https://www.linkedin.com/in/tony-ye-11b54b263/', 'auxclick', 1);
  s.link('mailto:private@example.com');
  s.link('tel:+18572102852');
  s.link('https://www.instagram.com/tonyyth_/');
  s.link(`${SITE}resume.pdf`, 'auxclick', 2);
  s.link(`${SITE}resume.pdf`, 'click', 0, true);
  const events = s.commands().filter(c => c[0] === 'event');
  assert.deepEqual(events.map(e => e[1]), ['resume_click', 'linkedin_click']);
  assert.ok(!JSON.stringify(events).includes('private@example'));
  assert.ok(events.every(e => !('link_url' in e[2])));
});

test('persisted grant starts analytics; denial, corrupt and expired choices do not', () => {
  assert.equal(setup({ stored: saved('granted') }).scripts.length, 1);
  for (const stored of [saved('denied'), '{broken', saved('granted', 181 * 86400000), saved('granted', -86400000)]) {
    assert.equal(setup({ stored }).scripts.length, 0);
  }
});

test('withdrawal disables analytics, clears only its cookies, and reloads', () => {
  const s = setup({ stored: saved('granted'), cookies: `_ga=one; _ga_K95ZZV60ER=two; unrelated=keep; _ga_OTHER=keep` });
  s.click('privacy-settings');
  assert.equal(s.elements['analytics-notice'].hidden, false);
  assert.equal(s.elements['analytics-title'].focused, true);
  s.click('analytics-reject');
  assert.equal(s.choice(), 'denied');
  assert.equal(s.window[`ga-disable-${ID}`], true);
  assert.equal(s.reloads(), 1);
  assert.equal(s.deleted.length, 2);
  assert.ok(s.deleted.every(c => c.includes('Max-Age=0; Path=/tianhao-quant-profile/')));
  s.link(`${SITE}resume.pdf`);
  assert.equal(s.commands().filter(c => c[0] === 'event').length, 0);
});

test('blocked storage is safe and cannot re-enable analytics by reloading a stale grant', () => {
  const s = setup({ blockRead: true, blockWrite: true });
  assert.equal(s.scripts.length, 0);
  s.click('analytics-accept');
  assert.equal(s.scripts.length, 1);
  s.click('analytics-reject');
  assert.equal(s.window[`ga-disable-${ID}`], true);
  assert.equal(s.reloads(), 0);
});

test('GPC and Do Not Track override a remembered grant', () => {
  for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: '1' }]) {
    const s = setup({ navigator, stored: saved('granted') });
    assert.equal(s.scripts.length, 0);
    assert.equal(s.elements['analytics-accept'].disabled, true);
    s.click('analytics-accept');
    assert.equal(s.scripts.length, 0);
  }
});

test('preview hosts and unrelated paths never load production analytics', () => {
  for (const url of ['http://localhost:8765/', 'https://tianhao-quant-profile.ty2569.chatgpt.site/', `${SITE}fonts.html`]) {
    assert.equal(setup({ url, stored: saved('granted') }).scripts.length, 0);
  }
});

test('withdrawal in another tab stops collection', () => {
  const s = setup({ stored: saved('granted') });
  s.changeStorage(saved('denied'));
  assert.equal(s.window[`ga-disable-${ID}`], true);
  assert.equal(s.reloads(), 1);
});

test('close leaves analytics off and returns keyboard focus to settings', () => {
  const s = setup();
  s.click('privacy-settings');
  s.click('analytics-close');
  assert.equal(s.elements['privacy-settings'].focused, true);
  assert.equal(s.scripts.length, 0);
  assert.equal(s.choice(), null);
});
