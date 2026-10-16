// BGM と効果音（WebAudio でその場で演奏。音のファイルなし）。window.BGM
// 3つの世界に1曲ずつ、オリジナルのテーマ曲（A→A'→B→A' をくり返す）。
// うつつ＝なつかしいハ長調のフルート、ゆめ＝冒険のニ短調、とこよ＝静かな鐘。
(function(){
  var ctx = null, master = null, dry = null, wet = null, timer = null, on = true;
  var mode = 'utsutsu', want = 'utsutsu', song = null, pos = 0, next = 0, noteIdx = 0, mel = [], beatAt = 0;
  try{ on = localStorage.getItem('tri-sound') !== 'off'; }catch(e){}
  function hz(m){ return 440 * Math.pow(2, (m - 69) / 12); }

  // コード（MIDI番号）
  var C = {C:[48,52,55,60,64], G_B:[47,50,55,59,62], Am:[45,52,57,60,64], F:[41,48,53,57,60], G:[43,50,55,59,62], Em:[40,47,52,55,59], Dm:[38,45,50,53,57],
           Dm2:[50,57,62,65,69], Cy:[48,55,60,64,67], Bb:[46,53,58,62,65], A:[45,52,57,61,64], Fy:[41,53,57,60,65], Gm:[43,50,55,58,62],
           Fmaj7:[41,53,57,60,64], G_F:[41,55,59,62,67], Em7:[40,52,55,59,62], Am7:[45,55,60,64,67], Dm7:[38,53,57,60,65], Cmaj7:[36,55,59,64,67], Cc:[36,52,55,60,64]};
  var SONGS = {
    utsutsu:{bpm:88, lead:'flute', acc:'piano', drums:'soft',
      A1:{ch:['C','G_B','Am','F'], m:[[76,1],[79,1],[81,1],[79,1],[76,2],[74,1],[72,1],[72,1],[74,1],[76,1],[81,1],[79,4]]},
      A2:{ch:['C','F','G','C'],    m:[[76,1],[79,1],[81,1],[84,1],[83,2],[81,1],[79,1],[77,1],[76,1],[74,1],[79,1],[72,4]]},
      B: {ch:['F','G','Em','Am','Dm','G','C','C'], m:[[77,2],[81,2],[79,2],[74,2],[76,1],[79,1],[83,1],[81,1],[81,4],[74,2],[77,2],[79,1],[77,1],[76,1],[74,1],[72,3],[76,1],[72,4]]}},
    yume:{bpm:104, lead:'brass', acc:'arp', drums:'march',
      A1:{ch:['Dm2','Cy','Bb','A'], m:[[74,1.5],[77,.5],[76,1],[74,1],[72,1],[74,1],[76,2],[77,1],[76,1],[74,1],[70,1],[73,4]]},
      A2:{ch:['Dm2','Fy','Cy','A'], m:[[74,1.5],[77,.5],[81,1],[79,1],[77,1],[76,1],[72,2],[74,1],[76,1],[77,1],[79,1],[81,4]]},
      B: {ch:['Bb','Cy','Am','Dm2','Gm','A','Dm2','Dm2'], m:[[82,2],[81,1],[79,1],[79,2],[77,1],[76,1],[76,1],[77,1],[79,1],[81,1],[74,4],[79,2],[82,2],[81,1],[79,1],[77,1],[76,1],[74,3],[73,1],[74,4]]}},
    toko:{bpm:66, lead:'bell', acc:'pad', drums:'',
      A1:{ch:['Fmaj7','G_F','Em7','Am7'], m:[[81,2],[79,1],[76,1],[79,3],[74,1],[76,2],[72,1],[74,1],[72,4]]},
      A2:{ch:['Dm7','G','Cmaj7','Cc'],    m:[[81,2],[84,1],[83,1],[79,3],[81,1],[77,2],[76,1],[74,1],[76,4]]},
      B: {ch:['Fmaj7','G_F','Am7','Em7','Dm7','G','Cmaj7','Cmaj7'], m:[[84,3],[83,1],[81,2],[79,2],[77,3],[76,1],[76,4],[74,2],[77,2],[79,2],[83,2],[84,4],[84,4]]}}
  };
  var ORDER = ['A1','A2','B','A2'];

  function init(){
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? .55 : 0;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = .8; dry.connect(master);
    // 残響（雑音から作るホールの響き）
    var len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++){ var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2.6); }
    var conv = ctx.createConvolver(); conv.buffer = ir; wet = ctx.createGain(); wet.gain.value = .35; wet.connect(conv); conv.connect(master);
  }
  function out(node, rev){ node.connect(dry); if (rev) { var g = ctx.createGain(); g.gain.value = rev; node.connect(g); g.connect(wet); } }
  function env(g, t, a, peak, d, sus, rel, end){
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sus, t + a, d); g.gain.setTargetAtTime(0.0001, end, rel);
  }
  function osc(type, f, t, end, det){ var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.start(t); o.stop(end + 1.5); return o; }

  // 楽器
  var INST = {
    flute: function(m, t, len, v){ var g = ctx.createGain(), f = hz(m), end = t + len * .95;
      var o = osc('sine', f, t, end), o2 = osc('triangle', f * 2, t, end), g2 = ctx.createGain(); g2.gain.value = .12;
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = f * .006; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + .25); lfo.stop(end + 1);
      o.connect(g); o2.connect(g2); g2.connect(g); env(g, t, .06, .2 * v, .3, .8, .12, end); out(g, .5); },
    brass: function(m, t, len, v){ var g = ctx.createGain(), lp = ctx.createBiquadFilter(), f = hz(m), end = t + len * .9;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(2600, t + .08); lp.frequency.setTargetAtTime(1500, t + .1, .2);
      osc('sawtooth', f, t, end, -6).connect(lp); osc('sawtooth', f, t, end, 6).connect(lp); lp.connect(g);
      env(g, t, .04, .09 * v, .2, .75, .1, end); out(g, .4); },
    bell: function(m, t, len, v){ var f = hz(m), end = t + len;
      [[1, .22], [2.76, .07], [5.4, .03]].forEach(function(p){ var g = ctx.createGain(); osc('sine', f * p[0], t, end + 2).connect(g);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(p[1] * v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 2.8 / p[0] + .4); out(g, .9); }); },
    piano: function(m, t, len, v){ var g = ctx.createGain(), f = hz(m), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      osc('triangle', f, t, t + len, 0).connect(lp); osc('sine', f * 2, t, t + len, 3).connect(lp); lp.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07 * v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + Math.min(2.2, len + 1)); out(g, .35); },
    pad: function(m, t, len, v){ var g = ctx.createGain(), lp = ctx.createBiquadFilter(), f = hz(m); lp.type = 'lowpass'; lp.frequency.value = 900;
      osc('sawtooth', f, t, t + len, -9).connect(lp); osc('sawtooth', f, t, t + len, 9).connect(lp); lp.connect(g);
      env(g, t, len * .35, .022 * v, .5, .9, .6, t + len); out(g, .8); },
    bass: function(m, t, len, v){ var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      osc('triangle', hz(m), t, t + len).connect(lp); osc('sine', hz(m), t, t + len).connect(lp); lp.connect(g);
      env(g, t, .01, .22 * v, .25, .6, .08, t + len * .9); out(g, 0); }
  };
  function noise(t, len, hp, v, rev){ var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), a = b.getChannelData(0);
    for (var i = 0; i < a.length; i++) a[i] = (Math.random()*2-1) * (1 - i/a.length);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = v;
    s.connect(f); f.connect(g); out(g, rev || 0); s.start(t); }
  function kick(t, v){ var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .16);
    g.gain.setValueAtTime(.4 * v, t); g.gain.exponentialRampToValueAtTime(.001, t + .28); o.connect(g); g.connect(dry); o.start(t); o.stop(t + .3); }

  // 1小節ぶんの伴奏とメロディを予約する
  function bar(S, sec, b, t, spb){
    var ch = C[sec.ch[b]], last = b === sec.ch.length - 1;
    INST.bass(ch[0] - 12 + 12, t, spb * 2, 1); INST.bass(ch[0], t + spb * 2, spb * 2, .9);
    if (S.acc === 'piano'){ var pat = [0, 2, 3, 4, 3, 2, 1, 2]; for (var i = 0; i < 8; i++) INST.piano(ch[pat[i]] + 12, t + i * spb / 2, spb, i % 2 ? .7 : 1); }
    if (S.acc === 'arp'){ var ap = [0, 2, 4, 2, 3, 4, 3, 2]; for (var j = 0; j < 16; j++) INST.piano(ch[ap[j % 8]] + 12 + (j > 7 ? 0 : 0), t + j * spb / 4, spb / 2, j % 4 ? .5 : .9);
      ch.slice(1, 4).forEach(function(m){ INST.pad(m + 12, t, spb * 4, .7); }); }
    if (S.acc === 'pad'){ ch.slice(1).forEach(function(m){ INST.pad(m + 12, t, spb * 4.2, 1); });
      [2, 3, 4].forEach(function(k, q){ INST.bell(ch[k] + 12, t + spb * (q + 1), spb, .25); }); }
    if (S.drums === 'soft'){ kick(t, .7); kick(t + spb * 2.5, .5); for (var h2 = 0; h2 < 4; h2++) noise(t + spb * (h2 + .5), .04, 8000, .025); if (last) noise(t + spb * 3, .2, 3000, .04, .3); }
    if (S.drums === 'march'){ for (var k2 = 0; k2 < 4; k2++){ kick(t + spb * k2, k2 % 2 ? .5 : .9); if (k2 % 2) noise(t + spb * k2, .12, 1800, .09, .2); noise(t + spb * (k2 + .5), .03, 9000, .03); }
      if (last) for (var r = 0; r < 4; r++) noise(t + spb * (3 + r / 4), .08, 1800, .05 + r * .02, .2); }
  }
  function tick(){
    while (next < ctx.currentTime + .4){
      if (!song || (pos % 32 === 0 && want !== mode)){ mode = want; song = SONGS[mode]; pos = 0; }
      var S = song, spb = 60 / S.bpm, si = Math.floor(pos / 4) , sec, b, name;
      // セクションの並び：A1(4小節) A2(4) B(8) A2(4) = 20小節
      var map = [], k; ORDER.forEach(function(n){ for (k = 0; k < S[n].ch.length; k++) map.push([n, k]); });
      var m = map[pos % map.length]; name = m[0]; sec = S[name]; b = m[1];
      bar(S, sec, b, next, spb);
      if (b === 0){ var tt = next; sec.m.forEach(function(x){ var lead = INST[S.lead];
        lead(x[0], tt, x[1] * spb, 1); if (name === 'B' && S.lead !== 'bell') lead(x[0] - (S.lead === 'brass' ? 5 : 3), tt, x[1] * spb, .45); tt += x[1] * spb; }); }
      pos++; next += spb * 4;
    }
  }
  var SFX = {
    tap:    function(t){ INST.piano(84, t, .1, .8); },
    hold:   function(t){ INST.piano(79, t, .15, .9); },
    whisper:function(t){ [72,76,79,84].forEach(function(m,i){ INST.bell(m, t + i*.07, .5, .6); }); },
    up:     function(t){ INST.piano(84, t, .12, 1); INST.piano(91, t + .07, .2, 1); },
    down:   function(t){ INST.piano(60, t, .2, 1); INST.piano(56, t + .08, .3, 1); },
    gacha:  function(t){ for (var i = 0; i < 8; i++) INST.piano(72 + i*2, t + i*.05, .3, 1); INST.bell(96, t + .45, 1.2, 1); },
    fanfare:function(t){ [[72,0],[76,.14],[79,.28],[84,.42],[79,.7],[84,.84]].forEach(function(x){ INST.brass(x[0], t + x[1], .45, 1.2); INST.bass(x[0]-24, t + x[1], .45, .8); }); }
  };
  window.BGM = {
    start: function(m){ init(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume(); if (m) want = m;
      if (!timer){ next = ctx.currentTime + .15; timer = setInterval(tick, 120); } },
    mode: function(m){ if (SONGS[m]) want = m; },
    sfx: function(k){ if (!ctx || !on) return; try{ SFX[k] && SFX[k](ctx.currentTime + .01); }catch(e){} },
    toggle: function(){ on = !on; try{ localStorage.setItem('tri-sound', on ? 'on' : 'off'); }catch(e){}
      if (master) master.gain.setTargetAtTime(on ? .55 : 0, ctx.currentTime, .05); return on; },
    isOn: function(){ return on; }
  };
  document.addEventListener('visibilitychange', function(){ if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
})();
