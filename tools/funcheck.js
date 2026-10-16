// 楽しさチェック：スマホ画面で一生を自動で遊び、楽しさの基準を測る。
// 使い方: node tools/funcheck.js [回数=2] [出力フォルダ]
// 合否は終了コード（0=合格, 1=不合格）。結果は JSON と スクリーンショット。
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const path = require('path'), fs = require('fs');
const LIVES = +(process.argv[2] || 2);
const OUT = process.argv[3] || path.join(require('os').tmpdir(), 'funcheck');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

// 基準（WEB_BACKLOG.md「毎回の楽しさチェック」と同じ数字）
const LIMIT = { choices: 6, resultMs: 2000, surprises: 1, firstMs: 10000, taps: 16 };

(async () => {
  const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now();
  await p.goto(URL);
  await p.waitForSelector('#go');
  const loadMs = Date.now() - t0;
  const t1 = Date.now();
  await p.click('#go'); await p.waitForTimeout(400);
  if (await p.$('#ok')) await p.click('#ok');
  await p.waitForSelector('.ch[data-k]', { timeout: 15000 });
  const firstMs = Date.now() - t1;

  const snap = () => p.evaluate(() => (document.getElementById('stats') || {}).textContent + '|' + (document.getElementById('talk') || {}).textContent + '|' + (document.getElementById('think') || {}).textContent + '|' + (document.getElementById('age') || {}).textContent);
  async function waitChange(before) {
    const s = Date.now();
    while (Date.now() - s < 4000) { if ((await snap()) !== before) return Date.now() - s; await p.waitForTimeout(50); }
    return 4000;
  }
  const lives = [];
  for (let L = 0; L < LIVES; L++) {
    const r = { choices: 0, cards: 0, taps: 0, resultMs: [], moments: 0, hook: false };
    for (let i = 0; i < 40; i++) {
      if (await p.$('#again')) { r.hook = true; break; }
      if (await p.$eval('#swipe', e => e.classList.contains('on')).catch(() => false)) {
        const bb = await (await p.$('#sc')).boundingBox();
        const dir = (r.cards % 2) ? -1 : 1;
        await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down();
        await p.mouse.move(bb.x + bb.width / 2 + dir * 160, bb.y + bb.height / 2, { steps: 8 }); await p.mouse.up();
        r.cards++; r.choices++; r.taps++;
        if (lives.length === 0 && r.cards === 1) await p.screenshot({ path: path.join(OUT, 'card.png') });
        await p.waitForTimeout(2200); continue;
      }
      const ks = await p.$$eval('.ch[data-k]:not([disabled])', a => a.map(e => e.dataset.k));
      if (!ks.length) { await p.waitForTimeout(500); continue; }
      const el = await p.$('.ch[data-k="' + ks[i % ks.length] + '"]');
      const bb = await el.boundingBox();
      const before = await snap();
      await p.mouse.move(bb.x + 20, bb.y + 20); await p.mouse.down(); await p.waitForTimeout(420); await p.mouse.up();
      r.choices++; r.taps++;
      r.resultMs.push(await waitChange(before));
      if (lives.length === 0 && r.choices === 3) await p.screenshot({ path: path.join(OUT, 'play.png') });
      await p.waitForTimeout(1600);
    }
    await p.waitForTimeout(1200);
    r.moments = await p.$$eval('#moments > *', a => a.length).catch(() => 0);
    if (!r.hook) r.hook = !!(await p.$('#again'));
    await p.screenshot({ path: path.join(OUT, 'end' + L + '.png') });
    r.surprises = r.cards + (r.moments > 0 ? 1 : 0);
    r.resultMs.sort((a, c) => a - c);
    r.resultMedian = r.resultMs[Math.floor(r.resultMs.length / 2)] || 0;
    lives.push(r);
    if (L < LIVES - 1 && (await p.$('#again'))) {
      await p.click('#again'); await p.waitForTimeout(500);
      if (await p.$('#ok')) await p.click('#ok');
      await p.waitForTimeout(800);
    }
  }
  const scrollW = await p.evaluate(() => document.documentElement.scrollWidth);
  await b.close();

  const fails = [];
  if (errs.length) fails.push('エラー ' + errs.length + '件');
  if (scrollW > 390) fails.push('横スクロール');
  if (firstMs > LIMIT.firstMs) fails.push('最初のささやきまで ' + firstMs + 'ms');
  lives.forEach((r, i) => {
    const n = (i + 1) + '回目の一生: ';
    if (r.choices < LIMIT.choices) fails.push(n + '選択 ' + r.choices + '回（' + LIMIT.choices + '回以上）');
    if (r.resultMedian > LIMIT.resultMs) fails.push(n + '結果が見えるまで ' + r.resultMedian + 'ms');
    if (r.surprises < LIMIT.surprises) fails.push(n + '驚き 0回');
    if (!r.hook) fails.push(n + '終わりに「次の命」がない');
    if (r.taps > LIMIT.taps) fails.push(n + 'タップ ' + r.taps + '回（多すぎ）');
  });
  const out = { pass: !fails.length, fails, loadMs, firstMs, scrollW, errs, lives: lives.map(r => ({ choices: r.choices, cards: r.cards, taps: r.taps, resultMedian: r.resultMedian, surprises: r.surprises, moments: r.moments, hook: r.hook })), shots: OUT };
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  process.exit(out.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
