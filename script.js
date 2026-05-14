// ======================================================
//  STORMLAB - SCIENCE SHOWDOWN
//  script.js (shared by host.html and player.html)
// ======================================================
//
//  HOW TO RUN:
//  -----------------------------------------------------
//  Option 1 - VS Code Live Server:
//    Install "Live Server" extension, right-click host.html,
//    then "Open with Live Server"
//
//  Option 2 - Python:
//    cd into this folder, then:
//    Python 3: python -m http.server 8080
//    Open: http://localhost:8080/host.html
//
//  Option 3 - GitHub Pages:
//    Push files to a repo, enable GitHub Pages, share the URL
//
//  NOTE: PeerJS needs a real URL (not file://). Use one of the above.
// ======================================================

// -------------------------------------------------------
//  GLOBAL CONFIG
// -------------------------------------------------------
const GAME_CONFIG = {
  gameTitle:    'StormLab',
  subtitle:     'Science Showdown',
  mythText:     'Tornadoes cannot cross bodies of water.',
  peerConfig:   {},
  leaderboardSize: 8,
};

// -------------------------------------------------------
//  NAME MODERATION
// -------------------------------------------------------
const BANNED_WORDS = [
  'admin','null','undefined','test','hack',
];

const SPAM_REGEX = /^(.)\1{3,}$|^[^a-zA-Z0-9 ]{2,}$|^\d+$/;

function validateName(name, existingNames = []) {
  const trimmed = name.trim();

  if (!trimmed)
    return { valid: false, reason: 'Please enter a name.' };

  if (trimmed.length < 2)
    return { valid: false, reason: 'Name must be at least 2 characters.' };

  if (trimmed.length > 20)
    return { valid: false, reason: 'Name must be 20 characters or less.' };

  if (SPAM_REGEX.test(trimmed))
    return { valid: false, reason: "That looks like spam. Choose a real name!" };

  const lower = trimmed.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word.toLowerCase()))
      return { valid: false, reason: "That name isn't allowed. Please pick a classroom-appropriate name." };
  }

  if (existingNames.map(n => n.toLowerCase()).includes(lower))
    return { valid: false, reason: 'That name is already taken! Pick a different one.' };

  return { valid: true, reason: '' };
}

// -------------------------------------------------------
//  RANK TITLES
// -------------------------------------------------------
const RANK_TITLES = [
  'Lead Meteorologist',
  'Storm Chaser',
  'Junior Scientist',
  'Weather Watcher',
  'Apprentice Analyst',
  'Storm Scout',
];

function getRankTitle(index) {
  return RANK_TITLES[Math.min(index, RANK_TITLES.length - 1)] || 'Myth Buster';
}

// -------------------------------------------------------
//  ANSWER SHAPES / COLOURS
// -------------------------------------------------------
const SHAPES = ['▲', '◆', '●', '■'];
const ANSWER_COLORS = ['#e21b3c','#1368ce','#26890c','#ffa602'];

// -------------------------------------------------------
//  UTILITY HELPERS
// -------------------------------------------------------
function formatNumber(n) {
  return Math.round(n).toLocaleString();
}

function calcPoints(basePoints, timeRemaining, totalTime) {
  if (basePoints <= 0) return 0;
  const speedRatio = timeRemaining / totalTime;
  return Math.round(basePoints * (0.5 + 0.5 * speedRatio));
}

function getTypeBadge(type) {
  const badges = {
    mc:         '<span class="q-badge mc">Multiple Choice</span>',
    tf:         '<span class="q-badge tf">True / False</span>',
    poll:       '<span class="q-badge poll">Vote</span>',
    prediction: '<span class="q-badge pred">Prediction</span>',
  };
  return badges[type] || '';
}

// -------------------------------------------------------
//  AUDIO ENGINE (Web Audio API, no files needed)
// -------------------------------------------------------
const AudioEngine = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  function beep(freq, dur, type = 'sine', vol = 0.3, delay = 0) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime + delay);
      g.gain.setValueAtTime(vol, c.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      o.start(c.currentTime + delay);
      o.stop(c.currentTime + delay + dur + 0.05);
    } catch(e) {}
  }

  function noise(dur, vol = 0.15, delay = 0) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    try {
      const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const g = c.createGain();
      src.buffer = buf;
      src.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(vol, c.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      src.start(c.currentTime + delay);
    } catch(e) {}
  }

  return {
    toggle()       { enabled = !enabled; return enabled; },
    isEnabled()    { return enabled; },
    unlock()       { const c = getCtx(); if (c && c.state === 'suspended') c.resume(); },
    intro()        { [523,659,784,1047].forEach((f,i) => beep(f, 0.18, 'triangle', 0.25, i*0.12)); noise(0.3, 0.08, 0.5); },
    countdown()    { beep(880, 0.12, 'square', 0.2); },
    countdownEnd() { beep(1760, 0.4, 'square', 0.35); },
    questionStart(){ beep(440, 0.08,'sine',0.2); beep(660,0.12,'sine',0.2,0.1); },
    correct()      { beep(880,0.15,'sine',0.3); beep(1100,0.3,'sine',0.25,0.15); },
    wrong()        { beep(200,0.4,'sawtooth',0.25); },
    suspense()     { for (let i = 0; i < 8; i++) beep(110+i*10, 0.12, 'sine', 0.18, i*0.15); },
    reveal()       { [523,659,784,880,1047].forEach((f,i) => beep(f,0.2,'triangle',0.3,i*0.1)); },
    winner()       { const m = [523,523,523,523,415,466,523,0,466,523]; m.forEach((f,i) => { if(f) beep(f,0.18,'triangle',0.3,i*0.13); }); },
    applause()     { for(let i=0;i<20;i++) noise(0.05,0.08,i*0.04); },
    tick()         { beep(660,0.05,'square',0.12); },
  };
})();

// -------------------------------------------------------
//  VISUAL FX
// -------------------------------------------------------
const FX = (() => {
  function lightning() {
    const container = document.querySelector('.lightning-container');
    if (!container) return;
    const bolt = document.createElement('div');
    bolt.className = 'lightning-bolt';
    bolt.style.left = Math.random() * 100 + 'vw';
    container.appendChild(bolt);
    setTimeout(() => bolt.remove(), 600);
  }

  function initRain() {
    const container = document.querySelector('.rain-container');
    if (!container) return;
    for (let i = 0; i < 60; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = Math.random() * 100 + 'vw';
      drop.style.animationDelay = Math.random() * 2 + 's';
      drop.style.animationDuration = (0.6 + Math.random() * 0.6) + 's';
      container.appendChild(drop);
    }
  }

  function flashScreen(color = 'rgba(0,212,255,0.15)') {
    const fl = document.createElement('div');
    fl.style.cssText = `position:fixed;inset:0;background:${color};pointer-events:none;z-index:9999;animation:flashFade 0.4s ease forwards`;
    document.body.appendChild(fl);
    setTimeout(() => fl.remove(), 500);
  }

  function launchConfetti(count = 80) {
    const colors = ['#e21b3c','#1368ce','#26890c','#ffa602','#00d4ff','#ffe600'];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const c = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 12;
        c.style.cssText = `
          position:fixed;top:-20px;left:${Math.random()*100}vw;
          width:${size}px;height:${size}px;background:${color};
          border-radius:${Math.random()>0.5?'50%':'2px'};
          pointer-events:none;z-index:9998;
          animation:confettiFall ${1.5+Math.random()*2}s ease-in forwards;
          transform:rotate(${Math.random()*360}deg);
        `;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3500);
      }, i * 30);
    }
  }

  function startLightning() {
    setInterval(() => {
      if (Math.random() < 0.3) {
        lightning();
        setTimeout(lightning, 80);
      }
    }, 3000);
  }

  return { lightning, initRain, flashScreen, launchConfetti, startLightning };
})();

// -------------------------------------------------------
//  FACT TICKER
// -------------------------------------------------------
const FACTS = [
  'Waterspouts are tornadoes that form over or move onto water.',
  'The 1896 St. Louis tornado crossed the half-mile-wide Mississippi River!',
  'Fair-weather waterspouts form in calm conditions and spiral upward.',
  'The Enhanced Fujita Scale rates tornado intensity from EF0 to EF5.',
  'Hundreds of waterspouts form near the Florida Keys every year.',
  'An EF5 tornado has wind speeds exceeding 200 mph (322 km/h).',
  'A tornado over water can transition back to a land tornado instantly.',
  'Doppler radar can detect tornadic rotation 20+ minutes before touchdown.',
  'The USA averages over 1,000 tornadoes per year, more than any other country.',
];

function initFactTicker() {
  const el = document.getElementById('fact-ticker-inner');
  if (!el) return;
  el.innerHTML = FACTS.map(f => `<span class="fact-item">${f}</span>`).join('');
}
