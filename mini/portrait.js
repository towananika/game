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
    var of = opt.outfit && OUTFIT[opt.outfit];
    if (of && of.back) s += of.back;
    s += of ? '<rect x="88" y="150" width="24" height="40" fill="'+shade(skin,-0.12)+'"/>' + of.b(skin, h) : outfit(h, kind, skin);
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
    if (of && of.hat) head += of.hat;
    if (age >= 62) head += '<circle cx="82" cy="106" r="15" fill="none" stroke="#c9a86a" stroke-width="2"/><circle cx="118" cy="106" r="15" fill="none" stroke="#c9a86a" stroke-width="2"/><path d="M97 106 L103 106" stroke="#c9a86a" stroke-width="2"/>';
    if (h.life && h.life.avatar) head += '<path d="M134 74 l5 -10 l5 10 l-5 4 Z" fill="#b48cf0" stroke="#fff" stroke-width="1"/>';
    var tf = chibi ? 'translate(100 128) scale(1.42) translate(-100 -100)' : kid ? 'translate(100 100) scale(1.1) translate(-100 -96)' : 'translate(0 0)';
    var bodyTf = chibi ? 'translate(100 244) scale(.62) translate(-100 -244)' : '';
    var back = s.slice(0, s.indexOf('<rect')), body = s.slice(s.indexOf('<rect'));
    var flt = cool ? '<defs><filter id="'+gid+'rim"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#7fc4ff" flood-opacity=".7"/></filter></defs>' : '';
    return '<svg viewBox="0 0 200 244" xmlns="http://www.w3.org/2000/svg">' + flt + '<g' + (cool ? ' filter="url(#'+gid+'rim)"' : '') + '><g transform="'+tf+'">' + back + '</g><g transform="'+bodyTf+'">' + body + '</g><g transform="'+tf+'">' + head + '</g></g></svg>';
  };

  // キャラデザ（職業ごとの服・帽子・小物）。back＝髪の後ろ、b＝体、hat＝前髪の上
  var BODY = 'M26 244 C30 202 60 184 100 182 C140 184 170 202 174 244 Z';
  function bd(fill){ return '<path d="'+BODY+'" fill="'+fill+'"/>'; }
  var CAP = function(c, band, visor, badge){ return '<path d="M56 56 C56 26 144 26 144 56 Z" fill="'+c+'"/><path d="M58 50 L142 50 L142 60 L58 60 Z" fill="'+band+'"/>' +
    '<path d="M62 60 Q100 74 138 60 L134 68 Q100 80 66 68 Z" fill="'+visor+'"/><circle cx="100" cy="44" r="6" fill="'+badge+'"/>'; };
  var OUTFIT = {
    archer:   {b: function(){ return bd('#3f6b4a') + '<path d="M78 184 L100 208 L122 184" fill="#2b4a33"/><path d="M60 196 L150 244" stroke="#7a5230" stroke-width="7"/><circle cx="100" cy="206" r="4" fill="#e0b07c"/>'; },
               back: '<path d="M136 120 L170 40" stroke="#7a5230" stroke-width="10" stroke-linecap="round"/><path d="M164 44 l6 -14 l4 16 M156 48 l4 -14 l6 14" stroke="#e8e2d0" stroke-width="3" fill="none"/>'},
    ranger:   {b: function(){ return '<path d="M30 200 C60 170 140 170 170 200 L180 244 L20 244 Z" fill="#2f4f38"/>' + bd('#556b3a') + '<path d="M70 182 Q100 204 130 182" stroke="#2f4f38" stroke-width="10" fill="none"/><path d="M96 196 l4 -8 l4 8 l-4 6 Z" fill="#9dbd97"/>'; },
               back: '<path d="M52 150 C40 120 46 168 60 180 L140 180 C154 168 160 120 148 150 Z" fill="#2f4f38"/>'},
    assassin: {b: function(){ return bd('#22202e') + '<path d="M84 182 L100 230 L116 182" fill="#3a2a4a"/><path d="M40 214 L160 214" stroke="#5a3a7a" stroke-width="5"/>'; },
               back: '<path d="M44 120 C34 20 166 20 156 120 L164 200 L36 200 Z" fill="#2a2638"/>',
               hat: '<path d="M54 110 C50 30 150 30 146 110 C142 66 120 50 100 50 C80 50 58 66 54 110 Z" fill="#2a2638"/><path d="M72 124 C86 132 114 132 128 124 L126 152 Q100 166 74 152 Z" fill="#1b1926"/>'},
    scout:    {b: function(){ return bd('#8a6a44') + '<path d="M70 184 L86 244 M130 184 L114 244" stroke="#5a4028" stroke-width="8"/><path d="M84 186 L100 200 L116 186" fill="#e8dcc0"/><rect x="118" y="214" width="20" height="14" rx="3" fill="#5a4028"/>'; },
               hat: '<path d="M58 62 Q100 50 142 62" stroke="#3a2a1a" stroke-width="6" fill="none"/><circle cx="84" cy="56" r="10" fill="#7fc4ff" stroke="#c9a86a" stroke-width="4"/><circle cx="116" cy="56" r="10" fill="#7fc4ff" stroke="#c9a86a" stroke-width="4"/><circle cx="81" cy="53" r="3" fill="#fff" opacity=".8"/><circle cx="113" cy="53" r="3" fill="#fff" opacity=".8"/>'},
    fighter:  {b: function(skin){ return bd(skin) + '<path d="M60 200 C70 186 130 186 140 200 L146 244 L54 244 Z" fill="#b8323e"/><path d="M40 222 l24 -6 M136 216 l24 6" stroke="#e8e2d0" stroke-width="6"/>'; },
               hat: '<path d="M60 74 Q100 62 140 74 L140 84 Q100 72 60 84 Z" fill="#c43a4a"/><path d="M138 76 q16 6 22 22 M138 80 q12 10 14 26" stroke="#c43a4a" stroke-width="5" fill="none" stroke-linecap="round"/>'},
    warrior:  {b: function(){ return bd('#5a3a2a') + '<ellipse cx="44" cy="204" rx="30" ry="18" fill="#8a6a4a"/><ellipse cx="156" cy="204" rx="30" ry="18" fill="#8a6a4a"/><path d="M24 200 q20 -14 40 0 M136 200 q20 -14 40 0" stroke="#d8c8a8" stroke-width="6" fill="none"/><path d="M60 196 L140 244" stroke="#3a2418" stroke-width="10"/><circle cx="100" cy="220" r="8" fill="#c43a4a"/>'; }},
    knight:   {b: function(){ return bd('#9aa3b5') + '<path d="M70 190 L130 190 L124 244 L76 244 Z" fill="#26346a"/><path d="M92 204 L108 204 L108 236 L92 236 Z" fill="#e0b07c"/><path d="M84 214 L116 214" stroke="#e0b07c" stroke-width="6"/>' +
               '<ellipse cx="42" cy="206" rx="26" ry="15" fill="#c8cfdb" stroke="#6a7385" stroke-width="3"/><ellipse cx="158" cy="206" rx="26" ry="15" fill="#c8cfdb" stroke="#6a7385" stroke-width="3"/>'; },
               hat: '<path d="M64 70 Q100 58 136 70" stroke="#e0b07c" stroke-width="4" fill="none"/><circle cx="100" cy="62" r="4" fill="#7fc4ff"/>'},
    wizard:   {b: function(){ return bd('#28306a') + '<path d="M70 178 L100 200 L130 178 L128 192 L100 214 L72 192 Z" fill="#e0b07c"/><circle cx="100" cy="206" r="6" fill="#7fc4ff" stroke="#fff" stroke-width="1.5"/>'; },
               hat: '<ellipse cx="100" cy="46" rx="66" ry="13" fill="#1e2456"/><path d="M62 46 L132 2 L140 46 Z" fill="#28306a"/><path d="M64 44 L138 44" stroke="#e0b07c" stroke-width="5"/><path d="M110 24 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 Z" fill="#ffcf6e"/>'},
    cleric:   {b: function(){ return bd('#f4f2ee') + '<path d="M86 182 L100 244 L114 182" fill="#e0b07c" opacity=".9"/><circle cx="100" cy="212" r="9" fill="none" stroke="#e0b07c" stroke-width="3"/><path d="M100 200 L100 224 M88 212 L112 212" stroke="#e0b07c" stroke-width="2"/>'; },
               back: '<path d="M48 90 C40 30 160 30 152 90 L160 200 L40 200 Z" fill="#eef0f4"/>',
               hat: '<path d="M56 86 C54 36 146 36 144 86 C138 58 120 46 100 46 C80 46 62 58 56 86 Z" fill="#eef0f4"/><path d="M64 60 Q100 46 136 60" stroke="#e0b07c" stroke-width="3" fill="none"/>'},
    sorcerer: {b: function(){ return bd('#3a1e5a') + '<path d="M60 176 L76 200 L100 186 L124 200 L140 176 L132 214 L100 206 L68 214 Z" fill="#5a2e8a"/><circle cx="100" cy="222" r="7" fill="#c39bff" stroke="#fff" stroke-width="1.5"/>'; },
               hat: '<path d="M60 70 Q100 56 140 70" stroke="#c39bff" stroke-width="3" fill="none"/><path d="M100 56 l5 8 l-5 8 l-5 -8 Z" fill="#c39bff"/><circle cx="100" cy="64" r="10" fill="#c39bff" opacity=".25"/>'},
    driver:   {b: function(){ return bd('#1e2a4a') + '<path d="M82 182 L100 206 L118 182" fill="#eef0f2"/><path d="M96 190 L104 190 L106 224 L100 230 L94 224 Z" fill="#c43a4a"/><circle cx="74" cy="214" r="3" fill="#e0b07c"/><circle cx="126" cy="214" r="3" fill="#e0b07c"/><path d="M34 210 l26 -10" stroke="#e0b07c" stroke-width="3"/>'; },
               hat: CAP('#1e2a4a','#e0b07c','#111827','#e0b07c')},
    pilot:    {b: function(){ return bd('#f4f5f7') + '<path d="M88 182 L100 196 L112 182" fill="#d8dce2"/><path d="M96 190 L104 190 L106 226 L100 232 L94 226 Z" fill="#1e2a4a"/><path d="M34 204 L64 194 M136 194 L166 204" stroke="#1e2a4a" stroke-width="8"/><path d="M38 202 L60 195 M140 195 L162 202" stroke="#e0b07c" stroke-width="2"/><path d="M118 210 l12 0 l6 -4" stroke="#e0b07c" stroke-width="3" fill="none"/>'; },
               hat: CAP('#14181f','#14181f','#0a0c10','#e0b07c') + '<path d="M84 52 L116 52" stroke="#e0b07c" stroke-width="3"/>'},
    captain:  {b: function(){ return bd('#f4f5f7') + '<path d="M84 182 L100 204 L116 182" fill="#1e2a4a"/><circle cx="88" cy="214" r="3" fill="#e0b07c"/><circle cx="112" cy="214" r="3" fill="#e0b07c"/><circle cx="88" cy="232" r="3" fill="#e0b07c"/><circle cx="112" cy="232" r="3" fill="#e0b07c"/><path d="M36 204 L62 196 M138 196 L164 204" stroke="#e0b07c" stroke-width="5"/>'; },
               hat: CAP('#f4f5f7','#1e2a4a','#111827','#e0b07c')},
    soldier:  {b: function(){ return bd('#5a6a3a') + '<path d="M50 210 q14 -6 22 4 M120 222 q16 -8 26 2 M84 236 q10 -6 20 0" stroke="#3e4a28" stroke-width="7" fill="none"/><path d="M82 182 L100 200 L118 182" fill="#3e4a28"/><rect x="118" y="206" width="22" height="10" fill="#3e4a28"/>'; },
               hat: '<path d="M52 76 C48 24 152 24 148 76 L142 78 C140 46 60 46 58 78 Z" fill="#5a6a3a"/><path d="M52 70 L148 70" stroke="#3e4a28" stroke-width="4"/><path d="M62 78 L70 130 M138 78 L130 130" stroke="#2a2a1a" stroke-width="2.5"/>'},
    navy:     {b: function(){ return bd('#14203a') + '<path d="M84 182 L100 206 L116 182" fill="#eef0f2"/><path d="M96 190 L104 190 L105 220 L100 226 L95 220 Z" fill="#14203a"/><circle cx="84" cy="212" r="3" fill="#e0b07c"/><circle cx="116" cy="212" r="3" fill="#e0b07c"/><circle cx="84" cy="230" r="3" fill="#e0b07c"/><circle cx="116" cy="230" r="3" fill="#e0b07c"/><path d="M118 204 h16 M118 210 h16" stroke="#c43a4a" stroke-width="3"/>'; },
               hat: CAP('#f4f5f7','#14203a','#0a0c10','#e0b07c')},
    airforce: {b: function(){ return bd('#6a7a5a') + '<path d="M100 184 L100 244" stroke="#4a5640" stroke-width="4"/><rect x="58" y="206" width="22" height="16" rx="3" fill="#4a5640"/><circle cx="130" cy="212" r="9" fill="#26346a"/><path d="M124 212 l6 -4 l6 4" stroke="#fff" stroke-width="2" fill="none"/><path d="M82 182 Q100 196 118 182" stroke="#d8c8a8" stroke-width="6" fill="none"/>'; },
               hat: '<path d="M58 60 Q100 46 142 60" stroke="#3a3a3a" stroke-width="5" fill="none"/><ellipse cx="84" cy="58" rx="13" ry="8" fill="#222" opacity=".85"/><ellipse cx="116" cy="58" rx="13" ry="8" fill="#222" opacity=".85"/><path d="M97 58 L103 58" stroke="#c9a86a" stroke-width="2"/>'},
    student:  {b: function(skin, h){ return h.sex === 'f' ? '<path d="'+BODY+'" fill="#f4f2ee"/><path d="M60 188 L100 222 L140 188 L150 204 L100 240 L50 204 Z" fill="#26346a"/><path d="M90 222 L100 230 L110 222 L106 240 L100 234 L94 240 Z" fill="#d23a4a"/>'
               : bd('#1e2333') + '<path d="M84 182 L100 196 L116 182 L116 190 L100 204 L84 190 Z" fill="#141826"/><circle cx="100" cy="214" r="3" fill="#e0b07c"/><circle cx="100" cy="230" r="3" fill="#e0b07c"/>'; }},
    office:   {b: function(){ return bd('#2a2e36') + '<path d="M80 182 L100 222 L120 182" fill="#eef0f2"/><path d="M96 190 L104 190 L106 222 L100 228 L94 222 Z" fill="#3a5a8a"/><path d="M80 182 L94 236 M120 182 L106 236" stroke="#3a3e46" stroke-width="5"/><rect x="58" y="200" width="18" height="10" rx="2" fill="#eef0f2"/>'; }},
    cafe:     {b: function(){ return bd('#eef0f2') + '<path d="M66 194 L134 194 L140 244 L60 244 Z" fill="#6a4a32"/><path d="M66 194 L56 182 M134 194 L144 182" stroke="#6a4a32" stroke-width="5"/><circle cx="100" cy="216" r="7" fill="#e0b07c"/><path d="M96 214 q4 -6 8 0" stroke="#6a4a32" stroke-width="2" fill="none"/>'; },
               hat: '<ellipse cx="88" cy="36" rx="44" ry="13" fill="#6a4a32" transform="rotate(-10 88 36)"/><circle cx="82" cy="26" r="4" fill="#6a4a32"/>'},
    date:     {b: function(skin, h){ return bd(h.sex === 'f' ? '#f2b8c6' : '#8aa6c8') + '<path d="M80 182 Q100 206 120 182" fill="#f4f2ee"/><path d="M78 186 L70 244 M122 186 L130 244" stroke="' + (h.sex === 'f' ? '#e58aa2' : '#6a86a8') + '" stroke-width="5"/><path d="M88 200 Q100 212 112 200" stroke="#e0b07c" stroke-width="2" fill="none"/><circle cx="100" cy="210" r="4" fill="#ffcf6e"/>'; }}
  };
  window.Portrait.OUTFITS = OUTFIT;
})();
