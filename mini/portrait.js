// アニメ風の胸像（SVG）。キャラの性別・年齢・出身・色・職業から決まる。window.Portrait(h, uid) → SVG文字列
(function(){
  function hash(s){ var x = 2166136261; for (var i = 0; i < s.length; i++){ x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  var HAIR = ['#2b2230','#4a2e24','#c99a5e','#8c2f39','#2f4f7a','#e9e4dc','#6a4a8a','#2f5f55','#d46a3a','#1c2a3a'];
  var SKIN = {tokyo:'#f8e0cc',seoul:'#f8e0cc',taipei:'#f6dcc6',porto:'#f3d4bd',berlin:'#f6dccb',newyork:'#eecbb0',
              manila:'#e2b48e',saopaulo:'#dcae88',mumbai:'#c9946e',lagos:'#9a6644'};
  var EYE = {R:['#ff6b7f','#a3203a'], G:['#6fe0a8','#1f7a52'], B:['#7fb8ff','#2a4fb0']};
  function shade(hex, f){ var n = parseInt(hex.slice(1),16), r = n>>16, g = n>>8&255, b = n&255;
    function c(v){ return Math.max(0, Math.min(255, Math.round(f < 0 ? v*(1+f) : v + (255-v)*f))); }
    return '#' + ((1<<24) + (c(r)<<16) + (c(g)<<8) + c(b)).toString(16).slice(1); }
  function dom(h){ var b = h.battle, r = b.atk+b.def+b.hp, g = b.ran+b.ats+b.spd, bl = b.mag+b.res+b.mp;
    return r >= g && r >= bl ? 'R' : g >= bl ? 'G' : 'B'; }

  var BACK = {
    m0:'M56 92 C48 40 78 16 104 18 C136 18 156 46 146 94 Z',
    m1:'M56 92 C46 38 80 14 106 18 C140 22 156 50 146 96 Z',
    m2:'M54 96 C44 36 82 12 106 16 C142 20 160 52 148 104 L140 120 L60 120 Z',
    f0:'M54 84 C44 28 156 28 146 84 L160 214 C130 226 70 226 40 214 Z',
    f1:'M50 86 C42 30 158 30 150 86 L154 150 C142 160 126 154 122 140 L78 140 C74 154 58 160 46 150 Z',
    f2:'M56 90 C48 36 152 36 144 90 Z M138 50 C184 58 186 150 160 196 C160 160 152 116 132 86 Z'
  };
  var FRONT = {
    m0:'M58 88 C58 46 82 28 104 28 C130 28 146 50 142 90 L134 66 L126 84 L118 58 L108 80 L98 56 L88 80 L80 60 L70 84 L64 70 Z',
    m1:'M56 92 C54 44 86 24 112 28 C138 32 148 56 142 92 C138 74 130 62 120 56 C112 72 90 84 64 88 C62 92 60 96 56 92 Z',
    m2:'M56 96 C52 46 82 24 106 26 C134 28 150 52 144 98 L138 76 L130 92 L124 70 L114 90 L106 66 L94 90 L86 68 L76 92 L68 74 Z',
    f0:'M58 92 C56 44 84 28 100 28 C118 28 144 44 142 92 L134 72 L124 88 L114 68 L104 86 L96 68 L86 86 L76 70 L66 88 Z',
    f1:'M56 92 C54 42 86 26 100 26 C116 26 146 42 144 92 C134 84 126 74 122 64 C114 78 92 86 70 86 C64 88 60 92 56 92 Z',
    f2:'M58 90 C56 46 84 28 102 28 C122 28 146 46 142 90 L134 70 L124 86 L112 64 L100 84 L90 66 L78 84 L68 70 Z'
  };

  function eye(x, y, f, col, big, uid, cool){
    var rx = (f ? 12 : 11) * big, ry = (f ? 13 : 9.5) * big * (cool ? 0.62 : 1), ir = f ? 9 : 8, id = 'i' + uid + Math.round(x);
    var s = '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="#fff"/>';
    s += '<ellipse cx="'+x+'" cy="'+(y+1)+'" rx="'+(ir*big)+'" ry="'+(ry-1.5)+'" fill="url(#'+id+')"/>';
    s += '<ellipse cx="'+x+'" cy="'+(y+1)+'" rx="'+(3.6*big)+'" ry="'+(ry*0.5)+'" fill="#120c18"/>';
    s += '<circle cx="'+(x-3.5*big)+'" cy="'+(y-ry*0.4)+'" r="'+(3.4*big)+'" fill="#fff"/><circle cx="'+(x+3*big)+'" cy="'+(y+ry*0.35)+'" r="'+(1.6*big)+'" fill="#fff" opacity=".9"/>';
    var tilt = x < 100 ? -1 : 1, lx = rx + 2;
    s += '<path d="M'+(x-lx)+' '+(y-ry*0.35+(f?0:tilt*-1))+' Q'+x+' '+(y-ry-4)+' '+(x+lx)+' '+(y-ry*0.35+(f?0:tilt*1))+'" stroke="#1a1220" stroke-width="'+(f?4:3.6)+'" fill="none" stroke-linecap="round"/>';
    if (f) s += '<path d="M'+(x+tilt*lx)+' '+(y-ry*0.35)+' l'+(tilt*4)+' -3" stroke="#1a1220" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<path d="M'+(x-rx*0.7)+' '+(y+ry+1)+' Q'+x+' '+(y+ry+3)+' '+(x+rx*0.7)+' '+(y+ry+1)+'" stroke="#1a122055" stroke-width="1.4" fill="none"/>';
    return '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+col[1]+'"/><stop offset="1" stop-color="'+col[0]+'"/></linearGradient></defs>' + s;
  }

  function outfit(h, kind, skin){
    var body = 'M26 244 C30 202 60 184 100 182 C140 184 170 202 174 244 Z', s = '';
    if (kind === 'R') s = '<path d="'+body+'" fill="#4b5262"/><path d="M76 186 L100 214 L124 186" fill="#2b303a"/>' +
      '<ellipse cx="44" cy="206" rx="26" ry="16" fill="#8a93a6" stroke="#c43a4a" stroke-width="4"/><ellipse cx="156" cy="206" rx="26" ry="16" fill="#8a93a6" stroke="#c43a4a" stroke-width="4"/>' +
      '<path d="M88 214 L100 232 L112 214 Z" fill="#c43a4a"/>';
    else if (kind === 'G') s = '<path d="M40 190 C60 170 140 170 160 190 L176 244 L24 244 Z" fill="#284a35"/><path d="'+body+'" fill="#3f6b4a"/>' +
      '<path d="M78 184 L100 210 L122 184" fill="'+skin+'"/><path d="M60 196 L150 244" stroke="#7a5230" stroke-width="7"/><circle cx="100" cy="208" r="5" fill="#e0b07c"/>';
    else if (kind === 'B') s = '<path d="'+body+'" fill="#28306a"/><path d="M70 178 L100 200 L130 178 L128 192 L100 214 L72 192 Z" fill="#e0b07c"/>' +
      '<path d="M100 214 L100 244" stroke="#e0b07c" stroke-width="3"/><circle cx="100" cy="206" r="6" fill="#b48cf0" stroke="#fff" stroke-width="1.5"/>';
    else if (kind === 'sm') s = '<path d="'+body+'" fill="#1e2333"/><path d="M84 182 L100 196 L116 182 L116 190 L100 204 L84 190 Z" fill="#141826"/>' +
      '<circle cx="100" cy="214" r="3" fill="#e0b07c"/><circle cx="100" cy="230" r="3" fill="#e0b07c"/>';
    else if (kind === 'sf') s = '<path d="'+body+'" fill="#f4f2ee"/><path d="M60 188 L100 222 L140 188 L150 204 L100 240 L50 204 Z" fill="#26346a"/>' +
      '<path d="M54 200 L146 200" stroke="#fff" stroke-width="2" opacity=".6"/><path d="M90 222 L100 230 L110 222 L106 240 L100 234 L94 240 Z" fill="#d23a4a"/>';
    else if (kind === 'old') s = '<path d="'+body+'" fill="#7a6a5a"/><path d="M80 182 L100 212 L120 182" fill="#ece5dd"/><path d="M100 212 L100 244" stroke="#5a4a3e" stroke-width="3"/>';
    else if (kind === 'kid') s = '<path d="'+body+'" fill="#e0b07c"/><path d="M84 184 Q100 196 116 184" stroke="#fff" stroke-width="5" fill="none"/>';
    else s = '<path d="'+body+'" fill="#23262c"/><path d="M80 182 L100 222 L120 182" fill="#eef0f2"/><path d="M80 182 L94 236 M120 182 L106 236" stroke="#3a3e46" stroke-width="5"/>';
    return '<rect x="88" y="150" width="24" height="40" fill="'+shade(skin,-0.12)+'"/>' + s;
  }

  window.Portrait = function(h, uid, opt){
    opt = opt || {}; var cool = opt.style === 'cool', chibi = opt.style === 'chibi';
    var age = h.alive ? h.age : (h.diedAt || h.age), f = h.sex === 'f', seed = hash(h.id + h.name);
    var fam = h.name.split(' ')[0], hair = age >= 62 ? '#d9d9e0' : HAIR[hash(fam) % HAIR.length];
    var skin = SKIN[h.birthCity] || '#f3d4bd', d = dom(h), col = EYE[d], style = (f ? 'f' : 'm') + (seed % 3);
    var kid = age < 13, big = kid ? 1.12 : 1;
    var kind = h.life && h.life.avatar && h.life.job && age >= 19 && age < 62 ? h.life.job.color
      : kid ? 'kid' : age < 19 ? (f ? 'sf' : 'sm') : age >= 62 ? 'old' : 'suit';
    var mood = h.life ? h.life.mood : .5;
    var mouth = mood > .55 ? 'M92 136 Q100 143 108 136' : mood < .25 ? 'M93 139 Q100 135 107 139' : 'M94 137 Q100 139 106 137';
    var gid = 'g' + (uid || ''), s = '';
    s += '<defs><radialGradient id="'+gid+'h" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="'+shade(hair,.35)+'"/><stop offset=".55" stop-color="'+hair+'"/><stop offset="1" stop-color="'+shade(hair,-.35)+'"/></radialGradient></defs>';
    s += '<path d="'+BACK[style]+'" fill="'+shade(hair,-.25)+'"/>';
    s += outfit(h, kind, skin);
    var head = '<ellipse cx="62" cy="100" rx="6" ry="10" fill="'+shade(skin,-.06)+'"/><ellipse cx="138" cy="100" rx="6" ry="10" fill="'+shade(skin,-.06)+'"/>';
    head += '<path d="M62 80 C62 122 74 146 100 160 C126 146 138 122 138 80 C138 50 122 36 100 36 C78 36 62 50 62 80 Z" fill="'+skin+'"/>';
    head += '<path d="M66 96 C68 70 132 70 134 96 C126 84 74 84 66 96Z" fill="'+shade(skin,-.1)+'" opacity=".5"/>';
    head += eye(82, 106, f, col, big, gid, cool) + eye(118, 106, f, col, big, gid, cool);
    var bw = f ? 2.2 : 3.6, by = f ? 86 : 88;
    head += '<path d="M70 '+(by+2)+' Q80 '+(by-3)+' 92 '+(by+(f?0:2))+'" stroke="'+shade(hair,-.4)+'" stroke-width="'+bw+'" fill="none" stroke-linecap="round"/>';
    head += '<path d="M130 '+(by+2)+' Q120 '+(by-3)+' 108 '+(by+(f?0:2))+'" stroke="'+shade(hair,-.4)+'" stroke-width="'+bw+'" fill="none" stroke-linecap="round"/>';
    head += '<path d="M101 120 l-2 6 l3 0" stroke="'+shade(skin,-.3)+'" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    head += '<path d="'+mouth+'" stroke="#8a3a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    if (f || kid) head += '<ellipse cx="76" cy="126" rx="7" ry="3.5" fill="#ff8a9a" opacity=".35"/><ellipse cx="124" cy="126" rx="7" ry="3.5" fill="#ff8a9a" opacity=".35"/>';
    if (cool) head += '<path d="M62 80 C64 96 70 100 80 94 C92 88 108 88 120 94 C130 100 136 96 138 80 C130 70 70 70 62 80Z" fill="#1a1030" opacity=".22"/><path d="M118 150 C130 140 136 122 138 100 L138 130 C134 146 124 156 100 160Z" fill="#1a1030" opacity=".15"/>';
    head += '<path d="'+FRONT[style]+'" fill="url(#'+gid+'h)"/>';
    if (cool) head += '<path d="'+FRONT[style]+'" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="1.5"/>';
    head += '<path d="M76 46 Q100 36 124 46" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>';
    if (age >= 62) head += '<circle cx="82" cy="106" r="15" fill="none" stroke="#c9a86a" stroke-width="2"/><circle cx="118" cy="106" r="15" fill="none" stroke="#c9a86a" stroke-width="2"/><path d="M97 106 L103 106" stroke="#c9a86a" stroke-width="2"/>';
    if (h.life && h.life.avatar) head += '<path d="M134 74 l5 -10 l5 10 l-5 4 Z" fill="#b48cf0" stroke="#fff" stroke-width="1"/>';
    var tf = chibi ? 'translate(100 128) scale(1.42) translate(-100 -100)' : kid ? 'translate(100 100) scale(1.1) translate(-100 -96)' : 'translate(0 0)';
    var bodyTf = chibi ? 'translate(100 244) scale(.62) translate(-100 -244)' : '';
    var back = s.slice(0, s.indexOf('<rect')), body = s.slice(s.indexOf('<rect'));
    var flt = cool ? '<defs><filter id="'+gid+'rim"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#7fc4ff" flood-opacity=".7"/></filter></defs>' : '';
    return '<svg viewBox="0 0 200 244" xmlns="http://www.w3.org/2000/svg">' + flt + '<g' + (cool ? ' filter="url(#'+gid+'rim)"' : '') + '><g transform="'+tf+'">' + back + '</g><g transform="'+bodyTf+'">' + body + '</g><g transform="'+tf+'">' + head + '</g></g></svg>';
  };
})();
