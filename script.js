// ══════════════════════════════════════════════════════════════════
//  STORMLAB — SCIENCE SHOWDOWN
//  script.js  (shared by host.html and player.html)
// ══════════════════════════════════════════════════════════════════
//
//  HOW TO RUN:
//  ─────────────────────────────────────────────────────────────────
//  Option 1 — VS Code Live Server:
//    Install "Live Server" extension → right-click host.html → "Open with Live Server"
//
//  Option 2 — Python:
//    cd into this folder, then:
//    Python 3: python -m http.server 8080
//    Open: http://localhost:8080/host.html
//
//  Option 3 — GitHub Pages:
//    Push files to a repo → enable GitHub Pages → share the URL
//
//  PeerJS NOTE: PeerJS needs a real URL (not file:///). Use one of the above.
// ══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
//  GLOBAL CONFIG
//  Edit these values to customise the game
// ─────────────────────────────────────────────────────────────────
const GAME_CONFIG = {
  gameTitle:    'StormLab',
  subtitle:     'Science Showdown',
  mythText:     'Tornadoes cannot cross bodies of water.',

  // PeerJS broker config — uses free public broker by default
  // To use your own: peerConfig: { host:'yourhost.com', port:443, path:'/peerjs' }
  peerConfig: {},

  // Leaderboard entries shown mid-game
  leaderboardSize: 8,
};

// ─────────────────────────────────────────────────────────────────
//  QUESTION BANK
//  Each question object:
//  {
//    type:        'mc' | 'tf' | 'poll' | 'prediction'   (mc = multiple choice)
//    question:    string
//    answers:     string[]   (2–4 options)
//    correct:     number     (0-based index; -1 for polls with no "correct")
//    explanation: string
//    timer:       seconds
//    points:      base points for correct answer (speed bonus added on top)
//  }
// ─────────────────────────────────────────────────────────────────
const QUESTIONS = [
  // ── Round 1: Fact or Fiction vote ───────────────────────────
  {
    type:        'poll',
    question:    '🌪️ MYTH OR FACT? "Tornadoes cannot cross bodies of water."',
    answers:     ['MYTH — They totally can!', 'FACT — Water stops them!'],
    correct:     -1,
    explanation: "This is a MYTH! Tornadoes absolutely CAN cross rivers, lakes, and even oceans. Waterspouts are essentially tornadoes over water. Let's prove it!",
    timer:       15,
    points:      0,
  },

  // ── Round 2: Trivia rounds ───────────────────────────────────
  {
    type:        'mc',
    question:    'What is a WATERSPOUT?',
    answers:     [
      'A drain in a swimming pool',
      'A tornado that forms over or moves onto water',
      'A geyser that shoots water upward',
      'A type of hurricane storm surge',
    ],
    correct:     1,
    explanation: 'A waterspout is a tornado over water! They form the same way as land tornadoes and can be just as dangerous. Hundreds occur off the Florida Keys every year.',
    timer:       20,
    points:      1000,
  },

  {
    type:        'tf',
    question:    'TRUE or FALSE: The 1896 St. Louis tornado crossed the Mississippi River (over ½ mile wide) without losing strength.',
    answers:     ['TRUE', 'FALSE'],
    correct:     0,
    explanation: 'TRUE! The Great Cyclone of 1896 crossed the Mississippi River and remained powerful enough to kill hundreds of people. Water provides virtually zero resistance to a tornado vortex.',
    timer:       15,
    points:      800,
  },

  {
    type:        'mc',
    question:    'Why do many people BELIEVE tornadoes can\'t cross water?',
    answers:     [
      'Because water absorbs the tornado\'s energy',
      'Old folktales and misunderstood weather stories',
      'Tornadoes are repelled by moisture',
      'It\'s scientifically proven they can\'t',
    ],
    correct:     1,
    explanation: "It's mostly folklore! The myth likely started because people rarely *witnessed* tornadoes crossing large bodies of water — not because it couldn't happen. Documentation was just harder before modern cameras.",
    timer:       20,
    points:      1000,
  },

  {
    type:        'mc',
    question:    'What makes a tornado dangerous over water compared to land?',
    answers:     [
      'Nothing — they\'re equally dangerous both places',
      'Water cools the tornado making it stronger',
      'Less friction = can sometimes maintain or gain speed',
      'Tornadoes always weaken over water',
    ],
    correct:     2,
    explanation: "Over water, there's LESS surface friction than over rough land. This means a tornado can sometimes maintain its intensity longer. A waterspout can also move onto shore as a full land tornado!",
    timer:       20,
    points:      1000,
  },

  // ── Speed Round ──────────────────────────────────────────────
  {
    type:        'mc',
    question:    '⚡ SPEED ROUND! What wind speed qualifies as an EF5 tornado?',
    answers:     ['Over 100 mph', 'Over 150 mph', 'Over 200 mph', 'Over 250 mph'],
    correct:     2,
    explanation: 'EF5 tornadoes have winds OVER 200 mph (322 km/h) — the most destructive category. An EF5 crossing a lake would be just as devastating as on land.',
    timer:       10,
    points:      1500,
  },

  {
    type:        'tf',
    question:    '⚡ SPEED ROUND! Waterspouts are always weaker than land tornadoes.',
    answers:     ['TRUE', 'FALSE'],
    correct:     1,
    explanation: 'FALSE! While FAIR-WEATHER waterspouts tend to be weaker, TORNADIC waterspouts are full-strength tornadoes that just happen to be over water. They can be extremely dangerous.',
    timer:       10,
    points:      1500,
  },

  // ── Prediction Round ─────────────────────────────────────────
  {
    type:        'prediction',
    question:    '🔮 PREDICTION: If a tornado hits a small lake (1 mile wide), what happens?',
    answers:     [
      'Instantly disappears into water',
      'Slows down but keeps going',
      'Crosses with little change and continues on land',
      'Turns into a rainstorm',
    ],
    correct:     2,
    explanation: "Crosses with little change! Water provides almost no meaningful resistance to a tornado vortex. The spinning column of air doesn't care what's beneath it — land, water, or ice.",
    timer:       20,
    points:      1200,
  },

  // ── Final Question ───────────────────────────────────────────
  {
    type:        'mc',
    question:    '🏆 FINAL QUESTION! Which of these is the BEST evidence that tornadoes cross water?',
    answers:     [
      'Computer simulations',
      'Hundreds of documented waterspout events + photos/video worldwide',
      'Eyewitness accounts from 1800s',
      'Laboratory tornado machines',
    ],
    correct:     1,
    explanation: "Hundreds of documented, photographed, and filmed events worldwide — including famous crossings of the Mississippi River, the Great Lakes, and countless ocean waterspouts — prove conclusively that tornadoes cross water. MYTH: BUSTED! 🌪️💧",
    timer:       20,
    points:      2000,
  },
];

// ─────────────────────────────────────────────────────────────────
//  NAME MODERATION SYSTEM
//  Add words to BANNED_WORDS to block them.
//  Edit the spam regex patterns below.
// ─────────────────────────────────────────────────────────────────

// Add any words you want to ban (case-insensitive)
const BANNED_WORDS = [
  'admin','null','undefined','test','hack',
  // Add more words here: 'word1', 'word2'
  // Profanity list omitted for brevity — add as needed
];

// Names that are just repeated characters (aaaa, 1234, !!!!)
const SPAM_REGEX = /^(.)\1{3,}$|^[^a-zA-Z0-9 ]{2,}$|^\d+$/;

/**
 * Validate a display name.
 * @param {string} name — the proposed name
 * @param {string[]} existingNames — names already taken
 * @returns {{ valid: boolean, reason: string }}
 */
function validateName(name, existingNames = []) {
  const trimmed = name.trim();

  if (!trimmed)
    return { valid: false, reason: 'Please enter a name.' };

  if (trimmed.length < 2)
    return { valid: false, reason: 'Name must be at least 2 characters.' };

  if (trimmed.length > 20)
    return { valid: false, reason: 'Name must be 20 characters or less.' };

  if (SPAM_REGEX.test(trimmed))
    return { valid: false, reason: 'That looks like spam. Choose a real name!' };

  const lower = trimmed.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word.toLowerCase()))
      return { valid: false, reason: 'That name isn\'t allowed. Please pick a classroom-appropriate name.' };
  }

  if (existingNames.map(n => n.toLowerCase()).includes(lower))
    return { valid: false, reason: 'That name is already taken! Pick a different one.' };

  return { valid: true, reason: '' };
}

// ─────────────────────────────────────────────────────────────────
//  RANK TITLES
// ─────────────────────────────────────────────────────────────────
const RANK_TITLES = [
  'Lead Meteorologist 🌪️',
  'Storm Chaser ⚡',
  'Junior Scientist 🔬',
  'Weather Watcher 🌦️',
  'Apprentice Analyst 📊',
  'Storm Scout 🌩️',
];

function getRankTitle(index) {
  return RANK_TITLES[Math.min(index, RANK_TITLES.length - 1)] || 'Myth Buster 🔍';
}

// ─────────────────────────────────────────────────────────────────
//  ANSWER SHAPES / COLOURS  (Kahoot-style)
// ─────────────────────────────────────────────────────────────────
const SHAPES = ['▲', '◆', '●', '■'];
const ANSWER_COLORS = ['#e21b3c','#1368ce','#26890c','#ffa602'];

// ─────────────────────────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────

/** Format large numbers with commas */
function formatNumber(n) {
  return Math.round(n).toLocaleString();
}

/** Calculate speed bonus: faster = more points */
function calcPoints(basePoints, timeRemaining, totalTime) {
  if (basePoints <= 0) return 0;
  const speedRatio = timeRemaining / totalTime;
  return Math.round(basePoints * (0.5 + 0.5 * speedRatio));
}

/** Return a question-type badge HTML string */
function getTypeBadge(type) {
  const badges = {
    mc:         '<span class="q-badge mc">Multiple Choice</span>',
    tf:         '<span class="q-badge tf">True / False</span>',
    poll:       '<span class="q-badge poll">⚡ VOTE</span>',
    prediction: '<span class="q-badge pred">🔮 Prediction</span>',
  };
  return badges[type] || '';
}

// ─────────────────────────────────────────────────────────────────
//  AUDIO ENGINE  (Web Audio API — no files needed)
// ─────────────────────────────────────────────────────────────────
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
    toggle()      { enabled = !enabled; return enabled; },
    isEnabled()   { return enabled; },
    // Unlock audio on first user gesture
    unlock()      { const c = getCtx(); if (c && c.state === 'suspended') c.resume(); },

    intro()       {
      [523,659,784,1047].forEach((f,i) => beep(f, 0.18, 'triangle', 0.25, i*0.12));
      noise(0.3, 0.08, 0.5);
    },
    countdown()   { beep(880, 0.12, 'square', 0.2); },
    countdownEnd(){ beep(1760, 0.4, 'square', 0.35); },
    questionStart(){ beep(440, 0.08,'sine',0.2); beep(660,0.12,'sine',0.2,0.1); },
    correct()     { beep(880,0.15,'sine',0.3); beep(1100,0.3,'sine',0.25,0.15); },
    wrong()       { beep(200,0.4,'sawtooth',0.25); },
    suspense()    {
      for (let i = 0; i < 8; i++) beep(110+i*10, 0.12, 'sine', 0.18, i*0.15);
    },
    reveal()      {
      [523,659,784,880,1047].forEach((f,i) => beep(f,0.2,'triangle',0.3,i*0.1));
    },
    winner()      {
      const m = [523,523,523,523,415,466,523,0,466,523];
      m.forEach((f,i) => { if(f) beep(f,0.18,'triangle',0.3,i*0.13); });
    },
    applause()    { for(let i=0;i<20;i++) noise(0.05,0.08,i*0.04); },
    tick()        { beep(660,0.05,'square',0.12); },
  };
})();

// ─────────────────────────────────────────────────────────────────
//  VISUAL FX
// ─────────────────────────────────────────────────────────────────
const FX = (() => {
  // Lightning bolt
  function lightning() {
    const container = document.querySelector('.lightning-container');
    if (!container) return;
    const bolt = document.createElement('div');
    bolt.className = 'lightning-bolt';
    bolt.style.left = Math.random() * 100 + 'vw';
    container.appendChild(bolt);
    setTimeout(() => bolt.remove(), 600);
  }

  // Rain drops
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

  // Screen flash
  function flashScreen(color = 'rgba(0,212,255,0.15)') {
    const fl = document.createElement('div');
    fl.style.cssText = `position:fixed;inset:0;background:${color};pointer-events:none;z-index:9999;animation:flashFade 0.4s ease forwards`;
    document.body.appendChild(fl);
    setTimeout(() => fl.remove(), 500);
  }

  // Confetti
  function launchConfetti(count = 80) {
    const colors = ['#e21b3c','#1368ce','#26890c','#ffa602','#00d4ff','#ffe600'];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const c = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 12;
        c.style.cssText = `
          position:fixed;
          top:-20px;
          left:${Math.random()*100}vw;
          width:${size}px;height:${size}px;
          background:${color};
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

  // Periodic lightning
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

// ─────────────────────────────────────────────────────────────────
//  FACT TICKER
// ─────────────────────────────────────────────────────────────────
const FACTS = [
  '⚡ Waterspouts are tornadoes that form over or move onto water.',
  '🌪️ The 1896 St. Louis tornado crossed the half-mile-wide Mississippi River!',
  '💧 Fair-weather waterspouts form in calm conditions and spiral upward.',
  '🔬 The Enhanced Fujita Scale rates tornado intensity from EF0 to EF5.',
  '🌊 Hundreds of waterspouts form near the Florida Keys every year.',
  '⚡ An EF5 tornado has wind speeds exceeding 200 mph (322 km/h).',
  '🌪️ A tornado over water can transition back to a land tornado instantly.',
  '📡 Doppler radar can detect tornadic rotation 20+ minutes before touchdown.',
  '🌦️ The USA averages over 1,000 tornadoes per year — more than any other country.',
];

function initFactTicker() {
  const el = document.getElementById('fact-ticker-inner');
  if (!el) return;
  el.innerHTML = FACTS.map(f => `<span class="fact-item">${f}</span>`).join('');
}
