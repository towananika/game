// TRIATHLON engine (自動生成: engine/webbuild.js)
(function(){
var M={},D={};
function req(n){n=n.replace("./","");if(!M[n]){var m={exports:{}};M[n]=m;D[n](m,m.exports,req);}return M[n].exports;}
D["core"]=function(module,exports,require){
'use strict';
// M0 土台：種つき乱数と季節の時計（SPEC 8章）。Node 標準だけで動く。

// mulberry32。同じ種なら同じ列になる。
function rng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), // lo〜hi を含む
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    normal: (mean, sd) => { // Box-Muller
      const u = Math.max(next(), 1e-12), v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}

// 文字列から種を派生させる（キャラごと・用途ごとに別の列を持つため）。
function derive(seed, label) {
  let h = (seed >>> 0) ^ 0x811C9DC5;
  for (const ch of String(label)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

// 季節の時計。年号は持たない。世界の経過は「季節の通し番号」だけで表す。
const SEASONS = ['春', '夏', '秋', '冬'];
const SEASONS_PER_YEAR = 4;

function clock(startSeason = 0) {
  let tick = 0; // 世界が始まってから何季節たったか
  return {
    get tick() { return tick; },
    season: () => SEASONS[(startSeason + tick) % SEASONS_PER_YEAR],
    advance: (n = 1) => { tick += n; return tick; },
  };
}

// 生まれた季節の番号から、年齢と季節の表示を作る（例「8歳・秋」）。
function ageAt(bornTick, tick) {
  return Math.floor((tick - bornTick) / SEASONS_PER_YEAR);
}
function label(bornTick, tick, startSeason = 0) {
  return `${ageAt(bornTick, tick)}歳・${SEASONS[(startSeason + tick) % SEASONS_PER_YEAR]}`;
}

module.exports = { rng, derive, clock, ageAt, label, SEASONS, SEASONS_PER_YEAR };

};
D["cities"]=function(module,exports,require){
'use strict';
// M1-1 うつつの都市10個（SPEC 3章）。gamePopulation は第1世代の出生地の重み（仮）。wage は賃金係数（仮）。
// names は背景の人と一族の名前の候補（姓, 名）。
const CITIES = [
  { id: 'porto', name: 'ポルト', country: 'ポルトガル', latitude: 41.15, longitude: -8.61, gamePopulation: 6, wageMultiplier: 0.8,
    names: { family: ['シルヴァ', 'ソウザ', 'コスタ', 'ペレイラ'], given: ['ルイス', 'イネス', 'ティアゴ', 'マリアナ', 'ジョアン', 'ベアトリス', 'ラファエル', 'カタリナ', 'ディオゴ', 'レオノール', 'マルティン', 'マティルデ'] } },
  { id: 'tokyo', name: '東京', country: '日本', latitude: 35.68, longitude: 139.69, gamePopulation: 16, wageMultiplier: 1.1,
    names: { family: ['佐藤', '鈴木', '高橋', '田中'], given: ['蓮', '陽菜', '湊', '葵', '悠真', '結衣', '大翔', '紬', '颯太', '凛', '樹', '芽依'] } },
  { id: 'seoul', name: 'ソウル', country: '韓国', latitude: 37.57, longitude: 126.98, gamePopulation: 14, wageMultiplier: 1.0,
    names: { family: ['キム', 'イ', 'パク', 'チェ'], given: ['ミンジュン', 'ソヨン', 'ジフ', 'ハユン', 'ドヒョン', 'スア', 'イェジュン', 'ジウ', 'シウ', 'ハウン', 'ジホ', 'ユナ'] } },
  { id: 'taipei', name: '台北', country: '台湾', latitude: 25.03, longitude: 121.57, gamePopulation: 8, wageMultiplier: 0.9,
    names: { family: ['陳', '林', '黄', '張'], given: ['家豪', '怡君', '冠廷', '雅婷', '承恩', '詩涵', '宇翔', '欣妤', '品睿', '子晴', '柏宇', '語彤'] } },
  { id: 'manila', name: 'マニラ', country: 'フィリピン', latitude: 14.60, longitude: 120.98, gamePopulation: 9, wageMultiplier: 0.5,
    names: { family: ['サントス', 'レイエス', 'クルス', 'バウティスタ'], given: ['ミゲル', 'アンジェル', 'ホセ', 'ジャスミン', 'カルロ', 'ビア', 'ジョシュア', 'ニコール', 'パオロ', 'カミーユ', 'ラファエル', 'アリッサ'] } },
  { id: 'saopaulo', name: 'サンパウロ', country: 'ブラジル', latitude: -23.55, longitude: -46.63, gamePopulation: 11, wageMultiplier: 0.6,
    names: { family: ['オリヴェイラ', 'サントス', 'リマ', 'ゴメス'], given: ['ガブリエル', 'ジュリア', 'ルーカス', 'アナ', 'ペドロ', 'ラリッサ', 'マテウス', 'ベアトリス', 'エンゾ', 'ソフィア', 'ダヴィ', 'ヘレナ'] } },
  { id: 'newyork', name: 'ニューヨーク', country: 'アメリカ', latitude: 40.71, longitude: -74.01, gamePopulation: 12, wageMultiplier: 1.4,
    names: { family: ['スミス', 'ジョンソン', 'ガルシア', 'ブラウン'], given: ['イーサン', 'エマ', 'ノア', 'オリヴィア', 'リアム', 'エイヴァ', 'メイソン', 'ソフィア', 'ジェームズ', 'イザベラ', 'ルーカス', 'ミラ'] } },
  { id: 'berlin', name: 'ベルリン', country: 'ドイツ', latitude: 52.52, longitude: 13.40, gamePopulation: 8, wageMultiplier: 1.2,
    names: { family: ['ミュラー', 'シュミット', 'シュナイダー', 'フィッシャー'], given: ['ルーカス', 'ミア', 'フィン', 'ハンナ', 'ヨナス', 'レア', 'エリアス', 'エマ', 'パウル', 'ソフィー', 'レオン', 'クララ'] } },
  { id: 'lagos', name: 'ラゴス', country: 'ナイジェリア', latitude: 6.52, longitude: 3.38, gamePopulation: 7, wageMultiplier: 0.4,
    names: { family: ['オコンクォ', 'アデバヨ', 'ベロ', 'エゼ'], given: ['チディ', 'アマラ', 'トゥンデ', 'ンゴジ', 'エメカ', 'フォラケ', 'オルワセウン', 'ケミ', 'イフェアニ', 'チオマ', 'ババトゥンデ', 'アダエゼ'] } },
  { id: 'mumbai', name: 'ムンバイ', country: 'インド', latitude: 19.08, longitude: 72.88, gamePopulation: 9, wageMultiplier: 0.45,
    names: { family: ['シャルマ', 'パテル', 'デサイ', 'ナイル'], given: ['アーラヴ', 'アナニャ', 'ヴィハーン', 'ディヤ', 'アルジュン', 'サーンヴィ', 'カビール', 'イシャ', 'レヤンシュ', 'キアラ', 'アヤーン', 'ミラ'] } },
];

// 重みで都市を1つ選ぶ。r は core.rng の戻り値。
function pickCity(r) {
  const total = CITIES.reduce((s, c) => s + c.gamePopulation, 0);
  let x = r.next() * total;
  for (const c of CITIES) { x -= c.gamePopulation; if (x < 0) return c; }
  return CITIES[CITIES.length - 1];
}
const byId = id => CITIES.find(c => c.id === id);

module.exports = { CITIES, pickCity, byId };

};
D["character"]=function(module,exports,require){
'use strict';
// M1-2・M1-3 キャラ生成（SPEC 5章）。素質・能力・RGB9・気質・夢と恐れ・家族。親に似せない（完全ランダム）。
const core = require('./core');
const cities = require('./cities');

const APT = ['body', 'mind', 'hands', 'sense', 'voice'];        // 素質：体・頭・手先・感性・声
const ABI = ['body', 'know', 'craft', 'people', 'heart'];       // 能力：体・知・技・人・心
const BAT = ['atk', 'def', 'hp', 'ran', 'ats', 'spd', 'mag', 'res', 'mp'];
const TEMPER = ['curiosity', 'caution', 'sociability', 'grit', 'devotion'];
const DREAMS = ['遠くの国で暮らす', '自分の店を持つ', '誰かの命を救う', '本を一冊書く', 'ゆめで名の知れた狩人になる',
  '家族を楽にさせる', '海を渡る', '先生になる', '大きな舞台に立つ', '霧の島を見つける'];
const FEARS = ['ひとりになること', '高い所', '暗い水', '大事な人を失望させること', '病気', 'お金が尽きること', '人前で話すこと', '忘れられること'];
const WEALTH = ['tight', 'ok', 'comfortable'];

const clamp01 = x => Math.min(1, Math.max(0, x));
const round = x => Math.round(x * 1000) / 1000;

// 能力の初期値：素質を上限に、年齢に応じて少しずつ（M2 で本格的に伸ばす）。
function initialAbility(r, aptitude, age) {
  const map = { body: 'body', know: 'mind', craft: 'hands', people: 'voice', heart: 'sense' };
  const grown = Math.min(1, age / 25);
  const out = {};
  for (const k of ABI) out[k] = round(clamp01(aptitude[map[k]] * (0.05 + 0.75 * grown) * (0.8 + 0.4 * r.next())));
  return out;
}

function pickSome(r, list, lo, hi) {
  const pool = list.slice(), out = [];
  for (let n = r.int(lo, hi); n > 0; n--) out.push(pool.splice(Math.floor(r.next() * pool.length), 1)[0]);
  return out;
}

// 1人を作る。seed は世界の種、id はキャラID、opts で年齢・世代・出生地・姓・親を渡す。
function create(seed, id, opts = {}) {
  const r = core.rng(core.derive(seed, 'char:' + id));
  const city = opts.cityId ? cities.byId(opts.cityId) : cities.pickCity(r);
  const age = opts.age || 0;
  const aptitude = {}; for (const k of APT) aptitude[k] = round(clamp01(r.normal(0.5, 0.18)));
  const battle = {}; for (const k of BAT) battle[k] = r.int(10, 100);
  const temper = {}; for (const k of TEMPER) temper[k] = round(clamp01(r.normal(0.5, 0.2)));
  const avoid = opts.avoid || [];
  const free = city.names.given.filter(g => !avoid.includes(g));
  return {
    id, name: `${opts.familyName || r.pick(city.names.family)} ${r.pick(free.length ? free : city.names.given)}`,
    generation: opts.generation || 1, owner: opts.owner || 'local',
    birthSeason: ['Spring', 'Summer', 'Fall', 'Winter'][r.int(0, 3)],
    birthCity: city.id, currentCity: city.id,
    age, alive: true, currentWorld: 'tria',
    family: { parentIds: opts.parentIds || [], siblingIds: [], childrenIds: [], wealthClass: opts.wealthClass || r.pick(WEALTH) },
    temper, aptitude, ability: initialAbility(r, aptitude, age), battle,
    skills: [], bonds: [], memories: [],
    dreams: pickSome(r, DREAMS, 1, 2).map(text => ({ text, deadline: -1 })),
    fears: pickSome(r, FEARS, 1, 2),
    voice: { trust: 0.3, independence: round(clamp01(r.normal(0.5, 0.2))) },
  };
}

// 第1世代の一家：主人公（0歳）＋両親＋きょうだい0〜3人。両親は背景の人として軽く作る。
function createFamily(seed, prefix = 'g1') {
  const r = core.rng(core.derive(seed, 'family:' + prefix));
  const hero = create(seed, prefix + '-0');
  const familyName = hero.name.split(' ')[0];
  const base = { cityId: hero.birthCity, familyName, wealthClass: hero.family.wealthClass };
  const all = [hero], given = () => all.map(c => c.name.split(' ')[1]); // 家族の中で名前が重ならないように
  const add = (id, o) => { const c = create(seed, id, { ...base, ...o, avoid: given() }); all.push(c); return c; };
  const parents = [1, 2].map(i => add(`${prefix}-p${i}`, { age: r.int(24, 40), generation: 0 }));
  const sibs = [];
  for (let i = 1, n = r.int(0, 3); i <= n; i++) sibs.push(add(`${prefix}-s${i}`, { age: r.int(1, 12), parentIds: parents.map(p => p.id) }));
  hero.family.parentIds = parents.map(p => p.id);
  for (const c of [hero, ...sibs]) c.family.siblingIds = [hero, ...sibs].filter(x => x !== c).map(x => x.id);
  for (const p of parents) p.family.childrenIds = [hero, ...sibs].map(c => c.id);
  parents[0].family.spouseId = parents[1].id; parents[1].family.spouseId = parents[0].id;
  return { heroId: hero.id, members: [hero, ...parents, ...sibs] };
}

module.exports = { create, createFamily, APT, ABI, BAT, TEMPER };

};
D["stats"]=function(module,exports,require){
'use strict';
// M3 ステータスを整える（SPEC 5章）。素質→能力の伸び、戦闘9ステータスの伸び、数値→様子の文章。
const r3 = x => Math.round(x * 1000) / 1000;

// ---- M3-1 素質→能力 ----
const APT_OF = { body: 'body', know: 'mind', craft: 'hands', people: 'voice', heart: 'sense' };
const PEAK = { body: [8, 22], know: [8, 30], craft: [16, 55], people: [14, 55], heart: [18, 75] }; // 体は10代、技と人は20代以降も伸びる
const GROW = { work: { craft: 0.6, people: 0.4 }, study: { know: 1 }, play: { body: 0.5, people: 0.5 }, yume: { heart: 0.4, body: 0.1 }, rest: { heart: 0.3 } };

const cap = (c, k) => 0.3 + 0.7 * c.aptitude[APT_OF[k]];              // 上限は素質で決まる
const ageCurve = (k, age) => { const [lo, hi] = PEAK[k]; return age >= lo && age <= hi ? 1 : age < lo ? 0.4 : 0.2; };

// 1季節ぶんの伸びと鈍り。act はその季節の主な行動。
function growAbility(c, act) {
  const used = GROW[act] || {};
  for (const k of Object.keys(APT_OF)) {
    const apt = c.aptitude[APT_OF[k]], top = cap(c, k);
    let v = c.ability[k];
    if (used[k]) v += 0.04 * used[k] * (0.5 + apt) * ageCurve(k, c.age) * Math.max(0, 1 - v / top); // 素質が高いほど伸びやすい
    else if (c.age >= 20 && v > 0.5 * top) v -= 0.0006;                                              // 使わないと少し鈍る
    if (k === 'body' && c.age > 35) v -= c.age > 60 ? 0.0015 : 0.0005;                               // 老いでの低下
    if ((k === 'know' || k === 'craft') && c.age > 70) v -= 0.002;
    c.ability[k] = r3(Math.min(top, Math.max(0, v)));
  }
}

// ---- M3-2 戦闘9ステータス ----
const COLORS = { R: ['atk', 'def', 'hp'], G: ['ran', 'ats', 'spd'], B: ['mag', 'res', 'mp'] };
const JOBS = { R: { id: 'warrior', ja: '戦士' }, G: { id: 'archer', ja: '弓使い' }, B: { id: 'mage', ja: '魔法使い' } };

function color(c) {
  const out = {};
  for (const [k, keys] of Object.entries(COLORS)) out[k] = Math.round(keys.reduce((s, x) => s + c.battle[x], 0) / 3);
  return out;
}
const rgb = c => { const o = color(c); return `rgb(${o.R}, ${o.G}, ${o.B})`; };

// 職業：一番高い色を選びやすい（7割）。残りは好奇心で別の色を試す。
function chooseJob(c, r) {
  const o = color(c), order = Object.keys(o).sort((a, b) => o[b] - o[a]);
  const k = r.next() < 0.7 - 0.2 * c.temper.curiosity ? order[0] : r.pick(order.slice(1).concat(order[0]));
  return { color: k, ...JOBS[k] };
}

// 1季節の狩り。職業の組がよく伸び、ほかは少し。うつつの疲れ・気分が少しだけ効く。
function hunt(c, job, life, r) {
  const cond = Math.max(0.5, Math.min(1.2, 1 - 0.3 * life.fatigue + 0.3 * (life.mood - 0.5)));
  for (const [k, keys] of Object.entries(COLORS)) {
    const base = k === job.color ? 3 : 1;
    for (const x of keys) {
      const room = (255 - c.battle[x]) / 255;
      c.battle[x] = Math.min(255, c.battle[x] + Math.round(base * cond * room * (0.5 + r.next())));
    }
  }
  return cond;
}

// ---- M3-3 数値→様子の文章（数字は出さない） ----
const step = (v, n) => Math.min(n - 1, Math.floor(v * n));
const APT_TEXT = {
  body: ['体はあまり丈夫ではない', 'ふつうの体つき', '生まれつき体が強い'],
  mind: ['考えるより先に動くたち', '人並みに物覚えがいい', '一度聞いたことを忘れない'],
  hands: ['手先は少し不器用', '手先は人並み', '指先が驚くほど器用'],
  sense: ['物事に動じにくい', '人並みに心が動く', '小さな変化によく気づく'],
  voice: ['口数が少ない', '人並みに話せる', '声がよく通り、話すと人が集まる'],
};
const ABI_TEXT = {
  body: ['少し歩くと息が上がる', '人並みに動ける', '走っても、あまり息が上がらない', '体を使う仕事なら誰にも負けない'],
  know: ['本を開くとすぐ眠くなる', '机に向かう時間が苦にならないらしい', '難しい話にもついていける', '人に教えを請われることが多い'],
  craft: ['道具の扱いがおぼつかない', '簡単な修理なら自分でできる', '父の工具を、名前で呼べるようになった', '作ったものを人が欲しがる'],
  people: ['人と話すと疲れてしまう', '知り合いとなら気楽に話せる', '初めて会う人とも、すぐに話せる', 'いつも誰かに頼られている'],
  heart: ['小さなことで落ちこみやすい', 'へこんでも、しばらくすれば戻る', '悔しいときに、一晩で戻ってこられる', 'どんなときも周りを落ち着かせる'],
};
const COLOR_TEXT = {
  R: ['打たれると、すぐ倒れてしまう', '人並みに打ち合える', '仲間の前に立って攻撃を受けとめる', '一撃で大きな魔物を沈める'],
  G: ['足が遅く、遠くの的に当たらない', '人並みに動き回れる', '遠くの的を素早く射抜く', '風のように駆け、誰より遠くまで届く'],
  B: ['魔法はほとんど使えない', '小さな魔法なら扱える', '強い魔法を何度も放てる', '魔法の嵐を呼ぶと言われる'],
};

function describe(c) {
  const out = [];
  for (const k of Object.keys(APT_TEXT)) out.push(APT_TEXT[k][step(c.aptitude[k], 3)]);
  for (const k of Object.keys(ABI_TEXT)) out.push(ABI_TEXT[k][step(c.ability[k], 4)]);
  const o = color(c);
  for (const k of Object.keys(COLOR_TEXT)) out.push(COLOR_TEXT[k][step(o[k] / 256, 4)]);
  return out;
}

module.exports = { growAbility, cap, color, rgb, chooseJob, hunt, describe, COLORS, JOBS, APT_TEXT, ABI_TEXT, COLOR_TEXT, APT_OF };

};
D["economy"]=function(module,exports,require){
'use strict';
// M5 経済（SPEC 7章）。お金はすべて整数（T3）。1季節＝1回の決算。
// 修繕の腕は本来スキル（S1、保留中）。それまでは能力「技」で代わりに計算する。
const cities = require('./cities');

const START = { tight: 300, ok: 1000, comfortable: 3000 };          // 一族の蔵の初期値（仮）
const ALLOWANCE = { none: 0, low: 20, normal: 40, high: 70 };      // 仕送り（1季節、賃金係数をかける）（仮）
const ITEMS = [                                                    // 暮らしの物（仮）。price は買い直しの値段
  { id: 'clothes', ja: '服', price: 150, wear: 0.06 },
  { id: 'tools', ja: '道具', price: 300, wear: 0.04 },
  { id: 'bike', ja: '自転車', price: 500, wear: 0.03 },
  { id: 'kitchen', ja: '台所の道具', price: 400, wear: 0.03 },
];

function createVault(wealthClass) { return { money: START[wealthClass] || START.ok, policy: { allowance: 'normal', voice: 'adventure' } }; }

// 世代交代：蔵は残すが1割が消える（12章9番）。
function carryVault(v) { return { money: Math.floor(Math.max(0, v.money) * 0.9), policy: { ...v.policy } }; }

function initEconomy(c) {
  c.life.items = ITEMS.map(it => ({ id: it.id, dur: 1 }));
  c.life.books = { income: 0, living: 0, learn: 0, repair: 0, buy: 0, allowance: 0 };
}

// 1季節の決算。自分で暮らすのは進路が決まってから（19歳〜）。それまでは親の家計で、ここでは数えない。
function settle(c, act, vault, r) {
  const L = c.life;
  if (!L.path) return { need: 0 };
  if (!L.items) initEconomy(c);
  const wage = cities.byId(c.currentCity).wageMultiplier, A = c.ability, B = L.books;
  const inc = [], out = [];
  // 入り
  if (act === 'work') inc.push(Math.round(240 * wage * (0.5 + 0.5 * (A.craft + A.people + A.know) / 3)));
  if (c.age >= 65) inc.push(Math.round(50 * wage)); // 年金（仮）
  // 出：暮らし（消費）と学び
  const living = Math.round(80 * wage * (L.money < 0 ? 0.8 : 1)); // 苦しいときは切り詰める
  out.push(living); B.living += living;
  if (act === 'study' && L.path === 'school') { const fee = Math.round(30 * wage); out.push(fee); B.learn += fee; }
  // 物の傷みと修繕：技が高いほど傷みにくく、直すのも安い。壊れたら買い直し（消費）。
  for (const it of L.items) {
    const def = ITEMS.find(x => x.id === it.id);
    it.dur = Math.round((it.dur - def.wear * (1.4 - A.craft) * (0.5 + r.next())) * 1000) / 1000;
    if (it.dur <= 0) { const p = Math.round(def.price * wage); out.push(p); B.buy += p; it.dur = 1; }
    else if (it.dur < 0.5 && r.next() < 0.3 + 0.6 * A.craft) {
      const p = Math.round(def.price * wage * 0.25 * (1 - 0.7 * A.craft)); out.push(p); B.repair += p; it.dur = 0.9;
    }
  }
  const got = inc.reduce((a, b) => a + b, 0), spent = out.reduce((a, b) => a + b, 0);
  B.income += got;
  L.money = L.money + got - spent;
  // 仕送り：方針に沿った自動。若いうち（〜25歳）と、手元が足りないとき。蔵が空なら出せない（止まらない）。
  const want = (c.age <= 25 ? ALLOWANCE[vault.policy.allowance] * wage : 0) + (L.money < 0 ? -L.money : 0);
  const send = Math.max(0, Math.min(Math.round(want), vault.money));
  vault.money -= send; L.money += send; B.allowance += send;
  // 家に入れる：働く大人は、手元に余裕があれば一部を一族の蔵へ（情の深い人ほど多い）（仮）
  if (c.age >= 23 && L.money > 300 * wage) {
    const put = Math.round((L.money - 300 * wage) * 0.3 * (0.5 + c.temper.devotion));
    L.money -= put; vault.money += put; B.deposit = (B.deposit || 0) + put;
  }
  const need = Math.min(1, Math.max(0, (200 * wage - L.money) / (200 * wage)));
  return { need, got, spent, send };
}

// 死んだら手元のお金は蔵へ戻る（借りは消える）。
function closeLife(c, vault) { if (c.life && c.life.money > 0) vault.money += c.life.money; if (c.life) c.life.money = 0; }

// 一生の暮らしの費用（消費＋修繕＋買い直し）を1季節あたりで。
function costPerSeason(c) {
  const B = c.life.books, n = Math.max(1, c.life.econSeasons || 1);
  return (B.living + B.repair + B.buy) / n;
}

module.exports = { createVault, carryVault, settle, closeLife, costPerSeason, ITEMS, ALLOWANCE, START };

};
D["yume"]=function(module,exports,require){
'use strict';
// M6 ゆめ（SPEC 3章・7章）。自動の狩りでゴールドを得て、装備の修理と渡し札でゴールドを吸い込む。
// ゴールドはアバターのもの。死ねば消える（継がれるのはスキルだけ）。数値はすべて仮で、整数で持つ。
const stats = require('./stats');

const CARD = { goldPerCard: 100, moneyPerCard: 35, buyMoney: 60, buyGold: 70 }; // 渡し札の交換（賃金係数をかける側は money）
const GEAR = { wear: 0.08, repairAt: 0.4, repairGold: 40 };

function initYume(L) {
  L.gold = 0; L.gear = 1;
  L.goldBooks = { hunt: 0, repair: 0, cardOut: 0, cardIn: 0 };
}

// 1季節の狩り：職業の色が強いほど稼げる。装備が壊れていると半分。
function huntSeason(c, r) {
  const L = c.life; if (L.gold === undefined) initYume(L);
  const power = stats.color(c)[L.job.color] / 100;
  const gain = Math.round(25 * power * (L.gear > 0 ? 1 : 0.5) * (0.5 + r.next()));
  L.gold += gain; L.goldBooks.hunt += gain;
  L.gear = Math.max(0, Math.round((L.gear - GEAR.wear * (0.5 + r.next())) * 1000) / 1000);
  if (L.gear < GEAR.repairAt && L.gold >= GEAR.repairGold) { L.gold -= GEAR.repairGold; L.goldBooks.repair += GEAR.repairGold; L.gear = 1; }
  return gain;
}

// 渡し札：一人一季節に1枚まで。換えるかはキャラが決める（家計が苦しければ売る、余裕があれば少し買う）。
function exchange(c, wage, r) {
  const L = c.life; if (!L.avatar || !L.path || L.gold === undefined) return null;
  if (L.need > 0.3 && L.gold >= CARD.goldPerCard) {
    L.gold -= CARD.goldPerCard; L.goldBooks.cardOut += CARD.goldPerCard;
    L.money += Math.round(CARD.moneyPerCard * wage);
    return 'sell';
  }
  if (L.need === 0 && L.gold < 40 && L.money > 500 * wage && r.next() < 0.1 + 0.2 * c.temper.curiosity) {
    L.money -= Math.round(CARD.buyMoney * wage);
    L.gold += CARD.buyGold; L.goldBooks.cardIn += CARD.buyGold;
    return 'buy';
  }
  return null;
}

module.exports = { huntSeason, exchange, CARD, GEAR };

};
D["life"]=function(module,exports,require){
'use strict';
// M2 一生（SPEC 5章・8章）。1季節ごとに時間配分を決め、能力を伸ばし、寿命が来たら死ぬ。日記は生の一行（磨き込みは M7）。
const core = require('./core');
const cities = require('./cities');
const stats = require('./stats');
const economy = require('./economy');
const yume = require('./yume');
const text = require('./text');

const ACTS = ['work', 'study', 'play', 'yume', 'rest'];
const ACT_JA = { work: '働く', study: '学ぶ', play: '遊ぶ', yume: 'ゆめで狩る', rest: '休む' };

// ライフステージと基本の配分（仮）
function stage(age, life) {
  if (age < 6) return { id: 'infancy', base: { play: 0.6, rest: 0.4 } };
  if (age < 13) return { id: 'childhood', base: { study: 0.5, play: 0.4, rest: 0.2 } };
  if (age < 19) return { id: 'adolescence', base: { study: 0.45, play: 0.3, yume: 0.35, rest: 0.2, work: 0.05 } };
  if (age < 23 && life.path === 'school') return { id: 'youngAdult', base: { study: 0.45, play: 0.2, yume: 0.3, rest: 0.15, work: 0.15 } };
  if (age < 65) return { id: age < 40 ? 'youngAdult' : 'middleAge', base: { work: 0.6, play: 0.15, yume: 0.25, rest: 0.15, study: 0.05 } };
  return { id: 'oldAge', base: { rest: 0.4, play: 0.25, yume: 0.1, work: age < 72 ? 0.1 : 0, study: 0.05 } };
}

// 夢がどの行動に近いか（仮）
const DREAM_ACT = { '先生になる': 'study', '本を一冊書く': 'study', '誰かの命を救う': 'study', 'ゆめで名の知れた狩人になる': 'yume',
  '霧の島を見つける': 'yume', '自分の店を持つ': 'work', '家族を楽にさせる': 'work', '遠くの国で暮らす': 'work', '海を渡る': 'play', '大きな舞台に立つ': 'play' };

const PUSH = { adventure: ['yume', 'play'], family: ['work', 'rest'], study: ['study'] };
const clamp01 = x => Math.min(1, Math.max(0, x));
const r3 = x => Math.round(x * 1000) / 1000;

// 生まれたときに一度だけ：寿命と暮らしの状態
function init(c, seed, tick = 0) {
  const r = core.rng(core.derive(seed, 'lifespan:' + c.id));
  const deathAge = r.next() < 0.03 ? r.int(1, 40) : Math.round(Math.min(105, Math.max(40, r.normal(80, 11))));
  c.life = { bornTick: tick - c.age * 4, deathAge, fatigue: 0.2, mood: 0.6, money: 0, path: null, avatar: false, job: null, counts: {}, year: {}, diary: [] };
  return c;
}

function write(c, tick, t) { const line = `${core.label(c.life.bornTick, tick)}　${t}`; c.life.diary.push(line); return line; }

// 名場面の候補として書く（2b章）。日記にも一行のこる。
function scene(c, tick, kind, t, noise = 0.5) {
  const line = write(c, tick, t);
  (c.life.scenes || (c.life.scenes = [])).push({ tick, kind, text: t, line, score: text.sceneScore(kind, noise) });
  return line;
}

// 声の一言（2b章3番）：山場で一度だけ。方針に沿ってAIの声が選び、従うかは信頼しだい。
const VOICE = { adventure: { school: '学べ', work: '外に出て働け' }, family: { school: '学べ', work: '家のために働け' } };
function whisper(c, tick, r, policy, own, options) {
  const pick = policy === 'family' ? options[1] : options[0];
  if (policy === 'watch') return own;
  const follow = r.next() < c.voice.trust + 0.3 * (1 - c.voice.independence);
  const said = (VOICE[policy] || VOICE.adventure)[pick] || pick;
  c.life.voice = { age: c.age, said, followed: follow, tick };
  c.voice.trust = Math.round(Math.min(1, Math.max(0, c.voice.trust + (follow ? 0.05 : -0.03))) * 1000) / 1000;
  scene(c, tick, 'voice', `どこからか声が「${said}」とささやいた。${follow ? '従うことにした。' : 'けれど、自分で決めた。'}`, r.next());
  return follow ? pick : own;
}

// 年齢の節目の出来事（季節の初めに確かめる）
function milestones(c, tick, r, policy) {
  const L = c.life, a = c.age, first = (tick - L.bornTick) % 4 === 0;
  if (!first) return;
  if (a === 6) write(c, tick, '小学校に入った。');
  if (a === 13) {
    L.avatar = r.next() < 0.55 + 0.3 * c.temper.curiosity;
    if (L.avatar) scene(c, tick, 'firstYume', 'ゆめに初めてログインした。アバターが自分の町のあった場所に降り立った。', r.next());
    else write(c, tick, 'ゆめには興味がわかなかった。');
  }
  if (a === 19) {
    const p = 0.2 + 0.5 * c.ability.know + 0.2 * c.temper.curiosity - (c.family.wealthClass === 'tight' ? 0.2 : 0);
    const own = r.next() < p ? 'school' : 'work';
    L.path = whisper(c, tick, r, policy, own, ['school', 'work']);
    const hard = L.path === 'school' && c.family.wealthClass === 'tight';
    scene(c, tick, 'path', L.path === 'school' ? (hard ? '家は楽ではなかったが、進学した。' : '進学した。') : '働きはじめた。', hard ? 1 : r.next() * 0.5);
  }
  if (a === 23 && L.path === 'school') { L.path = 'work'; scene(c, tick, 'job', '学校を出て働きはじめた。', r.next()); }
  if (a === 65) scene(c, tick, 'retire', '仕事を退いた。', r.next());
  if (a > 13 && !L.avatar && r.next() < 0.012 * c.temper.curiosity) { L.avatar = true; scene(c, tick, 'firstYume', '思い立って、ゆめを始めてみた。', r.next()); }
  // 声のこだま：従った声を、のちに思い出す
  if (a === 30 && L.voice && r.next() < 0.6) scene(c, tick, 'voiceEcho', `ふと、${L.voice.age}歳の春に声が「${L.voice.said}」と言ったのを思い出した。${L.voice.followed ? 'あれに従ったから、いまの自分がいる。' : 'あのとき従っていたら、と少しだけ思う。'}`, r.next());
  // 夢がかなったか（45歳でふり返る）
  if (a === 45 && !L.dreamDone) {
    for (const d of c.dreams) {
      const act = DREAM_ACT[d.text];
      if (d.text !== '霧の島を見つける' && (L.counts[act] || 0) >= 40 && r.next() < 0.7) {
        L.dreamDone = d.text;
        scene(c, tick, 'dreamDone', `「${d.text}」という夢が、かなっていたことに気づいた。${L.voice && L.voice.followed ? `あの春、声は「${L.voice.said}」と言った。` : ''}`, r.next());
        break;
      }
    }
  }
}

// 判断の式（5章のうち 気質・状態・夢・お金 の項）。各行動の点数と、一番効いた理由を返す。
function decide(c, st, r, policy) {
  const L = c.life, t = c.temper;
  const need = L.need || 0;
  const dreamActs = c.age < 6 ? [] : c.dreams.map(d => [DREAM_ACT[d.text], d.text]);
  const best = { act: null, score: -1, why: 'いつもどおり' };
  for (const a of ACTS) {
    if (!(a in st.base)) continue;
    if (a === 'yume' && !L.avatar) continue;
    const mods = [['いつもどおり', st.base[a]]];
    if (a === 'study' || a === 'yume') mods.push(['知りたいことがあった', 0.2 * t.curiosity]);
    if (a === 'yume') mods.push(['ゆめの仲間に呼ばれた', 0.15 * t.sociability], ['うつつを忘れたかった', 0.2 * (1 - L.mood)]);
    if (a === 'play') mods.push(['友だちに誘われた', 0.2 * t.sociability], ['気分が沈んでいた', 0.35 * (1 - L.mood)]);
    if (a === 'work' || a === 'study') mods.push(['決めたことはやる性分', 0.15 * t.grit]);
    if (a === 'work') mods.push(['家族のため', 0.12 * t.devotion], ['家計が苦しい', 0.6 * need]);
    if (a === 'rest') mods.push(['無理をしない性分', 0.12 * t.caution], ['疲れがたまっていた', 0.7 * L.fatigue]);
    for (const [act, text] of dreamActs) if (act === a) mods.push([`「${text}」という夢のため`, 0.15]);
    // ミニ版：10年ごとの声の方針が、信頼のぶんだけ背中を押す（5章の「声の後押し」）
    if (policy && PUSH[policy] && PUSH[policy].includes(a)) mods.push(['声に背中を押された', 0.35 * (c.voice.trust + 0.2)]);
    const score = mods.reduce((s, m) => s + m[1], 0) * (0.5 + r.next());
    if (score > best.score) {
      // 理由は効いた項から重みつきで1つ選ぶ（毎回同じ理由にならないように）
      const cand = mods.slice(1).filter(m => m[1] > 0.06);
      let x = r.next() * cand.reduce((s, m) => s + m[1], 0), why = 'いつもどおり';
      for (const m of cand) { x -= m[1]; if (x < 0) { why = m[0]; break; } }
      best.act = a; best.score = score; best.why = why;
    }
  }
  return best;
}

// 1季節ぶん生きる。c を書き換える（state.step が複製を渡す）。
function season(c, tick, seed, vault) {
  if (!c.alive) return c;
  const L = c.life, r = core.rng(core.derive(seed, `life:${c.id}:${tick}`));
  if (c.age >= L.deathAge) {
    c.alive = false; c.diedAt = c.age; c.stage = 'deceased'; c.currentWorld = 'aslon';
    if (vault) economy.closeLife(c, vault);
    write(c, tick, `${c.age}歳で亡くなった。`);
    return c;
  }
  milestones(c, tick, r, vault && vault.policy ? vault.policy.voice || 'adventure' : 'adventure');
  const st = stage(c.age, L); c.stage = st.id;
  const d = decide(c, st, r, vault && vault.policy && vault.policy.decade ? vault.policy.voice : null);
  L.counts[d.act] = (L.counts[d.act] || 0) + 1;
  const y = L.year[d.act] || (L.year[d.act] = { n: 0, why: {} });
  y.n++; y.why[d.why] = (y.why[d.why] || 0) + 1;
  // 状態の変化
  const df = { work: 0.15, study: 0.1, yume: 0.08, play: -0.05, rest: -0.3 }[d.act];
  const dm = { work: -0.05, study: -0.02, yume: 0.1, play: 0.15, rest: 0.1 }[d.act];
  L.fatigue = r3(clamp01(L.fatigue + df));
  L.mood = r3(clamp01(L.mood + dm + (L.fatigue > 0.7 ? -0.1 : 0) + (0.5 - L.mood) * 0.1));
  // 季節の決算（M5 economy.js）。vault がなければ（古い呼び方）その場の空の蔵で計算する。
  const e = economy.settle(c, d.act, vault || { money: 0, policy: { allowance: 'none' } }, r);
  L.need = Math.round(e.need * 1000) / 1000;
  if (L.path) L.econSeasons = (L.econSeasons || 0) + 1;
  const ex = yume.exchange(c, cities.byId(c.currentCity).wageMultiplier, r);
  if (ex && !L.cardUsed) { L.cardUsed = true; scene(c, tick, 'card', ex === 'sell' ? '初めて渡し札をうつつで売り、家計の足しにした。' : '初めて渡し札を買い、ゆめのゴールドに換えた。', r.next()); }
  // 能力の伸びと鈍り（M3 stats.js）、ゆめの狩り
  stats.growAbility(c, d.act);
  // 能力の段階が上がったら、様子の文章で一行（数字は出さない）
  if (c.age >= 6) {
    L.abiStep = L.abiStep || {};
    for (const [k, arr] of Object.entries(stats.ABI_TEXT)) {
      const st2 = Math.min(3, Math.floor(c.ability[k] * 4));
      if (L.abiStep[k] === undefined) L.abiStep[k] = st2;
      else if (st2 > L.abiStep[k]) { L.abiStep[k] = st2; scene(c, tick, 'ability', `${arr[st2]}、と言われるようになった。`, st2 / 3); }
    }
  }
  if (d.act === 'yume') {
    if (!L.job) { L.job = stats.chooseJob(c, r); write(c, tick, `ゆめで${L.job.ja}になった。`); }
    stats.hunt(c, L.job, L, r);
    yume.huntSeason(c, r);
    // めったにない出来事（2b章の名場面の種）
    const dreamKiri = c.dreams.some(x => x.text === '霧の島を見つける');
    if (!L.kiri && r.next() < 0.0015 + (dreamKiri ? 0.004 : 0)) {
      L.kiri = true; if (dreamKiri) L.dreamDone = '霧の島を見つける';
      scene(c, tick, 'kiri', 'ゆめの海で、霧の中に地図にない島を見た。近づくと、霧ごと消えた。', 1);
    }
    if (!L.friend && c.age >= 18 && r.next() < 0.006 * c.temper.sociability) {
      L.friend = true; scene(c, tick, 'friend', 'ゆめで長く一緒に狩ってきた仲間と、初めてうつつで会った。思っていたより遠い国の人だった。', r.next());
    }
  }
  // 年の終わり（冬）に、その年いちばん多かった行動を日記に一行
  if ((tick - L.bornTick) % 4 === 3) {
    const top = o => Object.entries(o).sort((x, y) => (y[1].n ?? y[1]) - (x[1].n ?? x[1]))[0][0];
    const main = top(L.year), rest = Object.keys(L.year).filter(a => a !== main);
    write(c, tick, text.yearLine(r, c.age, main, top(L.year[main].why), rest.length ? r.pick(rest) : null));
    L.year = {};
  }
  return c;
}

module.exports = { init, season, write, scene, stage, ACTS, ACT_JA };

};
D["family"]=function(module,exports,require){
'use strict';
// M4 世代交代（SPEC 10章・2b章）。結婚・子・継ぐ人・次の主人公・世代の転機の記録。
// 相手は Phase 1 では同じ町に生成した仮の人（背景の人、年をとるだけ）。スキルの継承は S1（保留）で足す。
// 弟子（10章3番）はスキルが要るので S1 まで飛ばす。
const core = require('./core');
const character = require('./character');
const life = require('./life');
const economy = require('./economy');
const cities = require('./cities');

const chron = (s, kind, text) => s.chronicle.push({ tick: s.tick, gen: s.chars[s.heroId].generation, kind, text });
const alive = (s, id) => s.chars[id] && s.chars[id].alive;
const canHaveKids = (s, c) => c.id === s.heroId || c.id === s.heirId;

function addChild(s, parent, r) {
  const k = parent.family.childrenIds.length + 1;
  const sp = s.chars[parent.family.spouseId];
  const child = character.create(s.seed, `${parent.id}-c${k}`, {
    cityId: parent.currentCity, familyName: parent.name.split(' ')[0], age: 0, generation: parent.generation + 1,
    parentIds: [parent.id, sp.id], wealthClass: parent.family.wealthClass,
    avoid: [parent, sp, ...parent.family.childrenIds.map(id => s.chars[id])].map(c => c.name.split(' ')[1]),
  });
  for (const sib of parent.family.childrenIds) { s.chars[sib].family.siblingIds.push(child.id); child.family.siblingIds.push(sib); }
  parent.family.childrenIds.push(child.id); sp.family.childrenIds.push(child.id);
  life.init(child, s.seed, s.tick);
  s.chars[child.id] = child; s.line.push(child.id);
  life.scene(parent, s.tick, k === 1 ? 'birth' : 'birthMore', `子が生まれた。${child.name.split(' ')[1]}と名づけた。`, r.next());
  if (parent.id === s.heroId) chron(s, 'birth', `${parent.name}に子 ${child.name} が生まれた。`);
  return child;
}

// 年に一度（春）の家族の出来事。
function yearly(s) {
  for (const id of s.line.slice()) {
    const c = s.chars[id]; if (!c.alive) continue;
    const r = core.rng(core.derive(s.seed, `family:${id}:${s.tick}`));
    // 夢が子に引き継がれる（13歳で、親の夢を自分の夢にすることがある）
    if (c.age === 13 && c.family.parentIds.length && r.next() < 0.25) {
      const p = s.chars[c.family.parentIds[0]];
      if (p && p.dreams.length) {
        const d = r.pick(p.dreams).text;
        if (!c.dreams.some(x => x.text === d)) {
          c.dreams[0] = { text: d, deadline: -1 };
          life.scene(c, s.tick, 'dream', `親と同じ「${d}」という夢を持つようになった。`, r.next());
          chron(s, 'dream', `${c.name}は親の夢「${d}」を自分の夢にした。`);
        }
      }
    }
    if (!canHaveKids(s, c)) continue;
    // 出会いと結婚
    if (!c.family.spouseId && c.age >= 22 && c.age <= 40 && r.next() < 0.10 + 0.15 * c.temper.sociability) {
      const fams = cities.byId(c.currentCity).names.family.filter(f => f !== c.name.split(' ')[0]); // 同じ姓（家族）とは結婚しない
      const sp = character.create(s.seed, c.id + '-sp', { cityId: c.currentCity, familyName: r.pick(fams), age: Math.max(18, c.age + r.int(-4, 4)), generation: c.generation, avoid: [c.name.split(' ')[1]] });
      sp.family.spouseId = c.id; c.family.spouseId = sp.id; s.chars[sp.id] = sp;
      life.scene(c, s.tick, 'marriage', `${sp.name}と結婚した。`, r.next());
      chron(s, 'marriage', `${c.name}が${sp.name}と結婚した。`);
    }
    // 子の誕生
    const n = c.family.childrenIds.length;
    if (c.family.spouseId && alive(s, c.family.spouseId) && c.age >= 23 && c.age <= 42 && n < 4 && r.next() < (n === 0 ? 0.3 : 0.18)) addChild(s, c, r);
  }
  // 継ぐ人：主人公の子が18歳になったら、家に残りそうな子が自然に選ばれる（10章1番）
  const hero = s.chars[s.heroId];
  if (!alive(s, s.heirId)) s.heirId = null;
  if (!s.heirId) {
    const kids = hero.family.childrenIds.map(id => s.chars[id]).filter(k => k.alive && k.age >= 18);
    if (kids.length) {
      const r = core.rng(core.derive(s.seed, `heir:${hero.id}:${s.tick}`));
      kids.sort((a, b) => score(b, r) - score(a, r));
      s.heirId = kids[0].id;
      life.scene(kids[0], s.tick, 'heir', '家を継ぐのは自分だろう、と思うようになった。', r.next());
    }
  }
  // 蔵の危機（その世代で初めて空になったとき）
  if (s.vault.money === 0 && s.crisisGen !== hero.generation) {
    s.crisisGen = hero.generation; chron(s, 'crisis', `一族の蔵が空になった。${hero.name}の代。`);
    life.scene(hero, s.tick, 'crisis', '一族の蔵が空になった。これからは自分の稼ぎだけが頼りだ。', 0.5);
  }
}
const score = (k, r) => k.temper.devotion + 0.5 * k.voice.trust - 0.3 * k.temper.curiosity + 0.2 * r.next();

// 主人公が亡くなったら、次の主人公を決める（10章）。ゲームオーバーはない。
function succession(s) {
  const old = s.chars[s.heroId];
  chron(s, 'death', `${old.name}が${old.diedAt}歳で亡くなった。`);
  const r = core.rng(core.derive(s.seed, `succession:${old.id}`));
  let next = null, how = '';
  const kids = old.family.childrenIds.map(id => s.chars[id]).filter(k => k.alive);
  if (alive(s, s.heirId)) { next = s.chars[s.heirId]; how = '子'; }
  else if (kids.length) { kids.sort((a, b) => score(b, r) - score(a, r)); next = kids[0]; how = '子'; }
  else if (old.family.siblingIds.some(id => alive(s, id))) {
    const sib = s.chars[old.family.siblingIds.find(id => alive(s, id))];
    next = character.create(s.seed, old.id + '-nephew', { cityId: old.currentCity, familyName: sib.name.split(' ')[0], age: r.int(8, 25), generation: old.generation + 1, parentIds: [sib.id] });
    how = 'きょうだいの子';
  } else {
    next = character.create(s.seed, old.id + '-kin', { cityId: old.currentCity, familyName: old.name.split(' ')[0], age: r.int(5, 20), generation: old.generation + 1 }); // 縁者は一族の名を名乗る（仮）
    how = '縁者';
  }
  if (!s.chars[next.id]) { life.init(next, s.seed, s.tick); s.chars[next.id] = next; s.line.push(next.id); }
  next.generation = old.generation + 1;
  s.heroId = next.id; s.heirId = null; s.heroIds.push(next.id);
  s.vault = economy.carryVault(s.vault);
  life.scene(next, s.tick, 'succession', `${old.name}が亡くなり、一族を継いだ。`, 0.5);
  chron(s, 'succession', `${how}の${next.name}（${next.age}歳）が第${next.generation}代になった。`);
  return next;
}

// 亡くなった人の子（一族の筋にいる人）に知らせる。
function onDeaths(s, deadIds) {
  for (const id of deadIds) {
    const d = s.chars[id];
    for (const kid of d.family.childrenIds || []) {
      const k = s.chars[kid];
      if (k && k.alive && k.life) life.scene(k, s.tick, 'parentDeath', `親の${d.name.split(' ')[1]}が${d.diedAt}歳で亡くなった。`, 0.5);
    }
  }
}

module.exports = { yearly, succession, onDeaths };

};
D["state"]=function(module,exports,require){
'use strict';
// M0-4 世界の状態。JSON にそのまま書ける1つのオブジェクトで、step(state) → 新しい state（SPEC 8章・T2）。
const character = require('./character');
const life = require('./life');
const economy = require('./economy');
const family = require('./family');

function createWorld(seed, vault, opts = {}) {
  const fam = character.createFamily(seed);
  const chars = {}; for (const c of fam.members) chars[c.id] = c;
  const hero = life.init(chars[fam.heroId], seed);
  const s = { version: 1, seed, tick: 0, heroId: fam.heroId, chars, vault: vault || economy.createVault(hero.family.wealthClass), log: [] };
  // 世代交代あり（M4）。なしのときは主人公ひとりの一生だけ（M2〜M8 のテストと同じ動き）。
  if (opts.lineage) Object.assign(s, { lineage: true, line: [fam.heroId], heroIds: [fam.heroId], heirId: null, chronicle: [], crisisGen: 0 });
  return s;
}

// 1季節進める。主人公は一生を生きる（M2）。ほかの家族はまだ年をとるだけ。元の state は変えない。
function stepInPlace(s) {
  if (s.lineage) {
    if (s.tick % 4 === 0) family.yearly(s);
    for (const id of s.line) life.season(s.chars[id], s.tick, s.seed, s.vault);
    const dead = s.line.filter(id => !s.chars[id].alive);
    if (dead.length) family.onDeaths(s, dead);
    s.line = s.line.filter(id => s.chars[id].alive);
    if (!s.chars[s.heroId].alive) family.succession(s);
  } else life.season(s.chars[s.heroId], s.tick, s.seed, s.vault);
  s.tick += 1;
  if (s.tick % 4 === 0) for (const c of Object.values(s.chars)) if (c.alive) c.age += 1;
  return s;
}
const clone = x => JSON.parse(JSON.stringify(x));
function step(state) { return stepInPlace(clone(state)); }

// M8 放置の計算：n季節をまとめて進める（複製は1回だけ）。主人公が亡くなったらそこで止まる。
// 結果は step を n回 くり返したのと同じ JSON になる（乱数は「種・キャラ・季節」から毎回作るため）。
function advance(state, n) {
  const s = clone(state);
  for (let i = 0; i < n && s.chars[s.heroId].alive; i++) stepInPlace(s);
  return s;
}

// 「留守のあいだに」の要約。before と after の state を比べて、数行の文にする（数字は家計簿の分だけ）。
function awaySummary(before, after) {
  const h0 = before.chars[before.heroId], h1 = after.chars[after.heroId];
  const passed = after.tick - before.tick;
  const lines = [`留守のあいだに${passed}季節が過ぎました。`];
  const news = h1.life.diary.slice(h0.life.diary.length);
  if (news.length) lines.push(`日記に${news.length}行ふえました。最後の一行：「${news[news.length - 1]}」`);
  const dv = after.vault.money - before.vault.money;
  lines.push(`一族の蔵：${before.vault.money} → ${after.vault.money}（${dv >= 0 ? '+' : ''}${dv}）`);
  if (!h1.alive) lines.push(`${h1.name}は${h1.diedAt}歳で亡くなりました。`);
  return lines;
}

// 主人公が死ぬまで回す（検証用の速さ）。
function runLife(seed, vault, maxSeasons = 4 * 120) {
  return advance(createWorld(seed, vault), maxSeasons);
}

// M4 世代交代つきで n 世代回す（第 n＋1 代が立つまで）。
function runGenerations(seed, gens = 10, maxSeasons = 4 * 120 * (gens + 1)) {
  const s = clone(createWorld(seed, null, { lineage: true }));
  while (s.chars[s.heroId].generation <= gens && s.tick < maxSeasons) stepInPlace(s);
  return s;
}

module.exports = { createWorld, step, advance, awaySummary, runLife, runGenerations };

};
D["text"]=function(module,exports,require){
'use strict';
// M7 文章（SPEC 2b章・9章）。日記の一行の言い回し、名場面の選び方、一生のカード、年代記、家系図、家計簿。
// 数字を見せてよいのは家計簿だけ。年号は出さない。
const core = require('./core');
const cities = require('./cities');
const stats = require('./stats');

const YEAR = {
  work: ['働くことが多かった。', '仕事に追われる一年だった。', 'よく働いた。', '職場と家を行き来する毎日だった。'],
  study: ['学ぶことが多かった。', '机に向かう一年だった。', 'よく学んだ。', '本を開く時間が長かった。'],
  play: ['遊ぶことが多かった。', 'よく出かけ、よく笑った。', '友だちと過ごす時間が長かった。', '好きなことに時間を使った。'],
  yume: ['ゆめで狩ることが多かった。', '夜ごとゆめにログインした。', 'ゆめの野を駆けまわった一年だった。', 'ゆめの仲間と狩りに出た。'],
  rest: ['休むことが多かった。', 'ゆっくり過ごした一年だった。', '家で静かに過ごした。', '体を休める時間が長かった。'],
};
const SMALL = ['よく眠り、よく泣いた。', '家の中を歩きまわった。', '新しい言葉をいくつか覚えた。', '外で砂遊びをした。', '家族の膝の上で過ごした。', '絵本を何度も読んでもらった。'];
const ALSO = { work: '少し働いた', study: '少し学んだ', play: 'ときどき遊んだ', yume: 'ときどきゆめにも行った', rest: 'ときどき休んだ' };

// 一年の終わりの一行。main はいちばん多かった行動、why はその理由、other は合間の行動。
function yearLine(r, age, main, why, other) {
  if (age < 6) return r.pick(SMALL);
  let t = r.pick(YEAR[main]);
  if (why && why !== 'いつもどおり') t += why + '。';
  if (other && r.next() < 0.6) t += `合間に${ALSO[other]}。`;
  return t;
}

// 名場面の種類ごとの「めずらしさ×気持ちの振れ幅」（仮）
const WEIGHT = {
  kiri: [1.0, 1.0], voice: [0.5, 0.6], dreamDone: [0.8, 0.9], voiceEcho: [0.6, 0.8], friend: [0.7, 0.6], parentDeath: [0.5, 0.9],
  marriage: [0.5, 0.8], birth: [0.4, 0.8], birthMore: [0.25, 0.5], succession: [0.5, 0.7], path: [0.4, 0.6], crisis: [0.5, 0.6], heir: [0.4, 0.5],
  firstYume: [0.3, 0.5], job: [0.3, 0.4], retire: [0.3, 0.4], card: [0.3, 0.3], ability: [0.2, 0.4], dream: [0.4, 0.6],
};
const sceneScore = (kind, noise) => { const [a, b] = WEIGHT[kind] || [0.2, 0.2]; return Math.round((a * b + 0.05 * noise) * 1000) / 1000; };

// 一生の名場面：点の高い順に最大8個（候補が少なければその数）、時間の順に並べ直す。
function highlights(c) {
  const sc = (c.life && c.life.scenes) || [];
  const n = Math.min(8, sc.length);
  return sc.map((x, i) => ({ ...x, i })).sort((a, b) => b.score - a.score || a.i - b.i).slice(0, n).sort((a, b) => a.i - b.i);
}

// 日記を名場面の印（★）つきで返す。
function markedDiary(c) {
  const hl = new Set(highlights(c).map(x => x.line));
  return c.life.diary.map(l => (hl.has(l) ? '★ ' : '　 ') + l);
}

// 一生のカード（5行）：名前・生まれた町・色・夢・名場面
function card(c) {
  const L = c.life, hl = highlights(c);
  const best = hl.slice().sort((a, b) => b.score - a.score)[0];
  const dream = c.dreams[0] ? c.dreams[0].text : 'なし';
  const done = L.dreamDone ? `夢「${L.dreamDone}」はかなった` : `夢「${dream}」はかなわなかった`;
  return [
    `【${c.name}】第${c.generation}代`,
    `${cities.byId(c.birthCity).name}生まれ、${c.alive ? `いま${c.age}歳` : `${c.diedAt}歳で生涯を閉じた`}`,
    `色 ${stats.rgb(c)}${L.job ? `（ゆめでは${L.job.ja}）` : '（ゆめには行かなかった）'}`,
    done,
    `名場面：${best ? best.text : '静かな一生だった'}`,
  ];
}

// 一族の主人公を世代順に（年代記の章立て用）
function heroes(s) { return (s.heroIds || [s.heroId]).map(id => s.chars[id]); }

// 年代記（転機ごとの章、名場面だけを残す）
function chronicle(s) {
  const out = [`# ${heroes(s)[0].name.split(' ')[0]}家の年代記`, ''];
  for (const h of heroes(s)) {
    out.push(`## 第${h.generation}代　${h.name}（${h.alive ? `いま${h.age}歳` : `${h.diedAt}歳まで`}）`);
    const how = s.chronicle.find(e => e.kind === 'succession' && e.gen === h.generation);
    if (how) out.push(`- 継承：${how.text}`);
    for (const e of s.chronicle.filter(e => e.gen === h.generation && e.kind !== 'succession')) out.push(`- 転機：${e.text}`);
    for (const x of highlights(h)) out.push(`- ★ ${x.line}`);
    out.push('');
  }
  return out;
}

// 家系図（テキスト）。主人公の筋を太字の印「◎」で示す。
function tree(s) {
  const lines = [], seen = new Set();
  const root = heroes(s)[0];
  const walk = (c, depth) => {
    if (!c || seen.has(c.id) || depth > 12) return; seen.add(c.id);
    const sp = c.family.spouseId && s.chars[c.family.spouseId];
    const mark = heroes(s).some(h => h.id === c.id) ? '◎' : '・';
    lines.push(`${'　'.repeat(depth)}${mark}${c.name}${sp ? ` ＝ ${sp.name}` : ''}${c.alive ? '' : `（${c.diedAt}歳没）`}`);
    for (const id of c.family.childrenIds || []) walk(s.chars[id], depth + 1);
  };
  walk(root, 0);
  // 子のない代のあとは、きょうだいの子や縁者が継ぐので、そこから新しい枝を始める
  for (const h of heroes(s)) if (!seen.has(h.id)) { lines.push(`（第${h.generation}代から別の枝）`); walk(h, 0); }
  return lines;
}

// 家計簿（数字を見せてよい唯一の場所）：世代ごとの入りと出
function ledger(s) {
  const out = ['世代　主人公　稼ぎ　暮らし　学び　修繕・買い直し　家に入れた　仕送り'];
  for (const h of heroes(s)) {
    const B = h.life.books; if (!B) { out.push(`第${h.generation}代　${h.name}　（自分の家計を持つ前に亡くなった）`); continue; }
    out.push(`第${h.generation}代　${h.name}　${B.income}　${B.living}　${B.learn}　${B.repair + B.buy}　${B.deposit || 0}　${B.allowance}`);
  }
  out.push(`いまの一族の蔵：${s.vault.money}`);
  return out;
}

module.exports = { yearLine, sceneScore, highlights, markedDiary, card, chronicle, tree, ledger, heroes, WEIGHT };

};
window.TRI={state:req("state"),text:req("text"),core:req("core"),cities:req("cities")};
})();