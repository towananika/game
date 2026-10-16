// BGM と効果音（WebAudio で毎回その場で鳴らす。音のファイルなし）。window.BGM
(function(){
  var ctx = null, master = null, bus = null, timer = null, mode = 'utsutsu', step = 0, on = true, next = 0;
  try{ on = localStorage.getItem('tri-sound') !== 'off'; }catch(e){}
  var SONG = {
    // ルート（MIDI）とコード。うつつ：あたたかい長調、ゆめ：きらきらした短調、とこよ：まばらな鐘
    utsutsu:{bpm:84, chords:[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]], lead:[0,2,4,7,4,2,9,7], wave:'triangle', drum:true},
    yume:   {bpm:96, chords:[[57,60,64,67],[53,57,60,64],[50,53,57,60],[52,56,59,62]], lead:[0,3,7,10,12,10,7,3], wave:'square', drum:true},
    toko:   {bpm:60, chords:[[62,66,69,73],[59,62,66,69],[55,59,62,66],[57,61,64,68]], lead:[12,7,0,7,12,14,7,0], wave:'sine', drum:false}};
  function hz(m){ return 440 * Math.pow(2, (m - 69) / 12); }
  function init(){
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? .5 : 0; master.connect(ctx.destination);
    // かんたんな残響（ディレイ）
    bus = ctx.createGain(); var d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    d.delayTime.value = .33; fb.gain.value = .35; lp.type = 'lowpass'; lp.frequency.value = 2200;
    bus.connect(master); bus.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(master);
  }
  function note(f, t, len, type, vol, dest){
    var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = type === 'square' ? 1400 : 3000;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + len);
    o.connect(lp); lp.connect(g); g.connect(dest || bus); o.start(t); o.stop(t + len + .05);
  }
  function kick(t){ var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + .18);
    g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g); g.connect(master); o.start(t); o.stop(t + .3); }
  function hat(t){ var b = ctx.createBuffer(1, 2205, 44100), a = b.getChannelData(0); for (var i = 0; i < a.length; i++) a[i] = (Math.random()*2-1) * (1 - i/a.length);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = .06;
    s.connect(f); f.connect(g); g.connect(master); s.start(t); }
  function tick(){
    var S = SONG[mode], beat = 60 / S.bpm / 2; // 8分音符
    while (next < ctx.currentTime + .25){
      var bar = Math.floor(step / 8) % 4, ch = S.chords[bar], k = step % 8;
      if (k === 0) ch.forEach(function(m){ note(hz(m - 12), next, beat * 7.5, 'sine', .05); });
      if (k === 0 || k === 4) note(hz(ch[0] - 24), next, beat * 3, 'triangle', .12);
      var m = ch[0] + S.lead[(step + bar * 3) % 8];
      if (mode !== 'toko' || k % 2 === 0) note(hz(m + 12), next, beat * (mode === 'toko' ? 6 : 1.6), S.wave, mode === 'yume' ? .035 : .05);
      if (S.drum){ if (k === 0 || k === 5) kick(next); if (k % 2 === 1) hat(next); }
      step++; next += beat;
    }
  }
  var SFX = {
    tap:   function(t){ note(880, t, .08, 'sine', .15, master); },
    hold:  function(t){ note(660, t, .12, 'triangle', .12, master); },
    whisper:function(t){ [72,76,79,84].forEach(function(m,i){ note(hz(m), t + i*.06, .5, 'sine', .12); }); },
    up:    function(t){ note(hz(84), t, .15, 'square', .06, master); note(hz(91), t + .07, .2, 'square', .06, master); },
    down:  function(t){ note(hz(60), t, .2, 'triangle', .1, master); },
    gacha: function(t){ for (var i = 0; i < 8; i++) note(hz(72 + i*2), t + i*.05, .3, 'triangle', .08); note(hz(96), t + .45, 1.2, 'sine', .15); },
    fanfare:function(t){ [[72,0],[76,.12],[79,.24],[84,.36],[79,.6],[84,.72]].forEach(function(x){ note(hz(x[0]), t + x[1], .5, 'square', .07); note(hz(x[0]-12), t + x[1], .5, 'triangle', .08); }); }
  };
  window.BGM = {
    start: function(m){ init(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume(); if (m) mode = m;
      if (!timer){ next = ctx.currentTime + .1; timer = setInterval(tick, 100); } },
    mode: function(m){ if (SONG[m] && m !== mode){ mode = m; step = 0; } },
    sfx: function(k){ if (!ctx || !on) return; try{ SFX[k] && SFX[k](ctx.currentTime + .01); }catch(e){} },
    toggle: function(){ on = !on; try{ localStorage.setItem('tri-sound', on ? 'on' : 'off'); }catch(e){}
      if (master) master.gain.setTargetAtTime(on ? .5 : 0, ctx.currentTime, .05); return on; },
    isOn: function(){ return on; }
  };
  document.addEventListener('visibilitychange', function(){ if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
})();
