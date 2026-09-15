import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ---------------------------------------------------------
   ICONIC PAIRS — live web-based pairs-matching game platform
--------------------------------------------------------- */

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');";

const COLORS = { navy: "#14142B", navy2: "#1E1E42", gold: "#F2A93B", coral: "#FF6B5B", teal: "#2EC4B6", cream: "#F7F4EF" };
const CREAM_MUTED = "rgba(247,244,239,0.62)";
const CREAM_FAINT = "rgba(247,244,239,0.4)";
const PANEL_BG = "rgba(18,18,38,0.82)";
const PANEL_BORDER = "rgba(242,169,59,0.32)";
const INPUT_BG = "rgba(255,255,255,0.06)";
const INPUT_BORDER = "rgba(247,244,239,0.22)";

const MATCH_POINTS = 500;
const BONUS_POINTS = 1000;
const BONUS_INTERVAL_SECONDS = 6;
const DEFAULT_COUNTDOWN_SECONDS = 10;
const DEFAULT_TIMER_SECONDS = 0; // 0 = unlimited
const MOVES_BONUS_POINTS = 1000;
const DEFAULT_MOVES_BONUS_THRESHOLD = 15;

const BACKGROUND_PRESETS = [
  { id: "midnight", name: "Midnight indigo", css: `linear-gradient(135deg, #14142B 0%, #1E1E42 100%)` },
  { id: "coral", name: "Coral pop", css: `linear-gradient(135deg, #FF6B5B 0%, #F2A93B 100%)` },
  { id: "teal", name: "Teal dream", css: `linear-gradient(135deg, #0F3D3E 0%, #2EC4B6 100%)` },
  { id: "charcoal", name: "Charcoal", css: `linear-gradient(135deg, #1F1F1F 0%, #3A3A3A 100%)` },
  { id: "plum", name: "Plum", css: `linear-gradient(135deg, #2D1B4E 0%, #6C4AB6 100%)` },
];

/* 8 categories x 10 pairs each */
const CATEGORY_NAMES = ["Movies & TV", "Food & Drink", "Music", "Sports", "Nature", "Everyday Objects", "Classic Duos", "Office Life"];

const RAW_CATEGORY_PAIRS = {
  "Movies & TV": [
    ["Batman", "Robin"], ["Tom", "Jerry"], ["Mario", "Luigi"], ["Sherlock", "Watson"], ["Ross", "Rachel"],
    ["Wallace", "Gromit"], ["Hansel", "Gretel"], ["Thelma", "Louise"], ["Woody", "Buzz"], ["Shrek", "Donkey"],
  ],
  "Food & Drink": [
    ["Salt", "Pepper"], ["Peanut Butter", "Jelly"], ["Bread", "Butter"], ["Fish", "Chips"], ["Milk", "Cookies"],
    ["Tea", "Biscuit"], ["Burger", "Fries"], ["Macaroni", "Cheese"], ["Bacon", "Eggs"], ["Coffee", "Cream"],
  ],
  "Music": [
    ["Simon", "Garfunkel"], ["Guitar", "Amplifier"], ["Drum", "Cymbal"], ["Piano", "Bench"], ["Headphones", "Speaker"],
    ["Vinyl", "Turntable"], ["Violin", "Bow"], ["Microphone", "Stand"], ["Band", "Stage"], ["DJ", "Deck"],
  ],
  "Sports": [
    ["Bat", "Ball"], ["Racket", "Net"], ["Goal", "Post"], ["Bowling", "Pin"], ["Boxing Glove", "Ring"],
    ["Ski", "Snow"], ["Helmet", "Pad"], ["Jersey", "Number"], ["Whistle", "Referee"], ["Trophy", "Medal"],
  ],
  "Nature": [
    ["Sun", "Moon"], ["Thunder", "Lightning"], ["Rain", "Umbrella"], ["Bee", "Flower"], ["Earth", "Sky"],
    ["Ocean", "Wave"], ["Tree", "Leaf"], ["Fire", "Smoke"], ["Mountain", "Valley"], ["Day", "Night"],
  ],
  "Everyday Objects": [
    ["Lock", "Key"], ["Needle", "Thread"], ["Knife", "Fork"], ["Shoes", "Socks"], ["Pen", "Paper"],
    ["Soap", "Water"], ["Broom", "Dustpan"], ["Hammer", "Nail"], ["Nut", "Bolt"], ["Cup", "Saucer"],
  ],
  "Classic Duos": [
    ["Romeo", "Juliet"], ["Bonnie", "Clyde"], ["Yin", "Yang"], ["Beauty", "Beast"], ["Jack", "Jill"],
    ["Prince", "Princess"], ["Wizard", "Wand"], ["Pirate", "Treasure"], ["Dragon", "Knight"], ["King", "Queen"],
  ],
  "Office Life": [
    ["Coffee", "Mug"], ["Laptop", "Charger"], ["Stapler", "Paper"], ["Pen", "Notepad"], ["Team", "Trophy"],
    ["Idea", "Whiteboard"], ["Email", "Inbox"], ["Printer", "Paper"], ["Desk", "Chair"], ["Boss", "Employee"],
  ],
};

function buildDefaultCategories() {
  const out = {};
  CATEGORY_NAMES.forEach((cat) => {
    out[cat] = RAW_CATEGORY_PAIRS[cat].map((p, i) => ({ id: cat.replace(/\s+/g, "") + "-" + i, a: p[0], b: p[1] }));
  });
  return out;
}
const DEFAULT_CATEGORIES = buildDefaultCategories();

const EMOJI_DICTIONARY = {
  salt: "🧂", pepper: "🌶️", tom: "🐱", jerry: "🐭", batman: "🦇", robin: "🐦",
  bonnie: "💃", clyde: "🤵", "peanut butter": "🥜", jelly: "🍇", mario: "🍄", luigi: "👻",
  sherlock: "🕵️", watson: "📓", thunder: "⛈️", lightning: "⚡", romeo: "🌹", juliet: "🌙",
  ross: "🦖", rachel: "☕", wallace: "🧀", gromit: "🐶", simon: "🎤", garfunkel: "🎸",
  chips: "🍟", cream: "🍦", hansel: "👦", gretel: "👧", yin: "☯️", yang: "☯️",
  saucer: "🛸", thelma: "🚗", louise: "🛣️", woody: "🤠", buzz: "🚀", shrek: "🟢", donkey: "🐴",
  biscuit: "🍪", macaroni: "🍝", bacon: "🥓", eggs: "🥚", amplifier: "🔊", cymbal: "🥁",
  bench: "🪑", turntable: "💿", bow: "🎀", deck: "💿", stand: "🎤", stage: "🏟️",
  racket: "🎾", net: "🥅", post: "🥅", pin: "📌", glove: "🧤", ring: "💍", pad: "🛡️",
  number: "🔢", referee: "🦺", valley: "🏞️", smoke: "💨", dustpan: "🧹", bolt: "🔩",
  beast: "🐺", treasure: "💰", knight: "♞", king: "🤴", queen: "👸", mug: "☕",
  charger: "🔌", notepad: "📝", whiteboard: "📋", inbox: "📥", employee: "🧑‍💼", stapler: "📎",
  cat: "🐱", dog: "🐶", mouse: "🐭", rat: "🐀", rabbit: "🐰", fox: "🦊", bear: "🐻",
  panda: "🐼", koala: "🐨", tiger: "🐯", lion: "🦁", cow: "🐮", pig: "🐷", frog: "🐸",
  monkey: "🐵", chicken: "🐔", penguin: "🐧", bird: "🐦", eagle: "🦅", owl: "🦉", bat: "🦇",
  wolf: "🐺", horse: "🐴", unicorn: "🦄", bee: "🐝", bug: "🐛", butterfly: "🦋", snail: "🐌",
  snake: "🐍", lizard: "🦎", turtle: "🐢", octopus: "🐙", squid: "🦑", shrimp: "🦐", crab: "🦀",
  fish: "🐟", dolphin: "🐬", whale: "🐳", shark: "🦈", giraffe: "🦒", zebra: "🦓", elephant: "🐘",
  rhino: "🦏", hippo: "🦛", camel: "🐫", kangaroo: "🦘", sheep: "🐑", goat: "🐐", deer: "🦌",
  dragon: "🐉", dinosaur: "🦖", spider: "🕷️", scorpion: "🦂", peacock: "🦚", parrot: "🦜",
  flamingo: "🦩", rooster: "🐓", duck: "🦆", swan: "🦢",
  pizza: "🍕", burger: "🍔", fries: "🍟", hotdog: "🌭", taco: "🌮", burrito: "🌯", sandwich: "🥪",
  salad: "🥗", popcorn: "🍿", pancake: "🥞", waffle: "🧇", cheese: "🧀",
  bread: "🍞", croissant: "🥐", baguette: "🥖", pretzel: "🥨", donut: "🍩", cookie: "🍪",
  cake: "🎂", cupcake: "🧁", pie: "🥧", chocolate: "🍫", candy: "🍬", lollipop: "🍭", honey: "🍯",
  icecream: "🍦", sundae: "🍨", apple: "🍎", banana: "🍌", grapes: "🍇", watermelon: "🍉",
  strawberry: "🍓", pineapple: "🍍", mango: "🥭", peach: "🍑", cherries: "🍒", lemon: "🍋",
  orange: "🍊", avocado: "🥑", carrot: "🥕", corn: "🌽", potato: "🥔", tomato: "🍅",
  mushroom: "🍄", garlic: "🧄", onion: "🧅", nut: "🥜", rice: "🍚", noodles: "🍜", sushi: "🍣",
  dumpling: "🥟", curry: "🍛", soup: "🍲", butter: "🧈", milk: "🥛", coffee: "☕", tea: "🍵",
  juice: "🧃", beer: "🍺", wine: "🍷", cocktail: "🍸",
  key: "🔑", lock: "🔒", phone: "📱", laptop: "💻", camera: "📷", clock: "⏰", watch: "⌚",
  book: "📖", pencil: "✏️", pen: "🖊️", scissors: "✂️", hammer: "🔨", wrench: "🔧",
  screwdriver: "🪛", needle: "🪡", thread: "🧵", lightbulb: "💡", candle: "🕯️",
  flashlight: "🔦", umbrella: "☔", suitcase: "🧳", backpack: "🎒", wallet: "👛", purse: "👜",
  glasses: "👓", crown: "👑", gem: "💎", gift: "🎁", balloon: "🎈", flag: "🚩",
  map: "🗺️", compass: "🧭", telescope: "🔭", microscope: "🔬", sword: "⚔️", shield: "🛡️",
  anchor: "⚓", magnet: "🧲", battery: "🔋", plug: "🔌",
  sun: "☀️", moon: "🌛", star: "⭐", cloud: "☁️", rain: "🌧️", snow: "❄️", rainbow: "🌈",
  fire: "🔥", water: "💧", wave: "🌊", mountain: "⛰️", volcano: "🌋", desert: "🏜️",
  island: "🏝️", tree: "🌳", flower: "🌸", rose: "🌹", sunflower: "🌻", cactus: "🌵",
  leaf: "🍃", earth: "🌍", sky: "🌌", wind: "🌬️", day: "🌤️", night: "🌃",
  car: "🚗", taxi: "🚕", bus: "🚌", truck: "🚚", train: "🚆", airplane: "✈️",
  helicopter: "🚁", boat: "⛵", ship: "🚢", rocket: "🚀", bicycle: "🚲", motorcycle: "🏍️",
  scooter: "🛴", tractor: "🚜",
  guitar: "🎸", piano: "🎹", drum: "🥁", violin: "🎻", trumpet: "🎺", microphone: "🎤",
  headphones: "🎧", saxophone: "🎷", vinyl: "💿",
  football: "⚽", basketball: "🏀", baseball: "⚾", tennis: "🎾", golf: "⛳", bowling: "🎳",
  hockey: "🏒", rugby: "🏉", ski: "🎿", boxing: "🥊", medal: "🏅", trophy: "🏆",
  robot: "🤖", computer: "🖥️", keyboard: "⌨️", printer: "🖨️", satellite: "🛰️",
  house: "🏠", castle: "🏰", church: "⛪", hospital: "🏥", school: "🏫", factory: "🏭",
  bank: "🏦", hotel: "🏨", tent: "⛺",
  shirt: "👕", pants: "👖", shoe: "👟", boot: "🥾", hat: "🎩", scarf: "🧣", dress: "👗", tie: "👔",
  doctor: "🩺", police: "👮", chef: "👨‍🍳", farmer: "👨‍🌾", pirate: "🏴‍☠️", ghost: "👻",
  alien: "👽", zombie: "🧟", vampire: "🧛", wizard: "🧙", fairy: "🧚", mermaid: "🧜",
  superhero: "🦸", ninja: "🥷", clown: "🤡", jack: "🃏", jill: "👧", prince: "🤴", princess: "👸",
  heart: "❤️", skull: "💀", bomb: "💣", diamond: "💎", bell: "🔔", puzzle: "🧩",
  dice: "🎲", target: "🎯", paint: "🎨", mask: "🎭", gamepad: "🎮", knife: "🔪", fork: "🍴",
  cup: "🍵", cookies: "🍪", jersey: "👕", team: "🤝", idea: "💡", email: "📧", desk: "🗄️",
  chair: "🪑", boss: "🧑‍💼", soap: "🧼", broom: "🧹",
};
function normalizeWord(w) { return w.trim().toLowerCase(); }
function singularize(w) {
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("es")) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}
const AUTO_ICON_PALETTE = [
  "🎈", "🎯", "🎲", "🧩", "🎨", "🎵", "🔥", "⭐", "✨", "🌈",
  "🍀", "🎁", "🏆", "🥳", "🎪", "🎭", "🎢", "🎳", "🎮", "🕹️",
  "🎺", "🥁", "🎷", "🎸", "💎", "🔮", "🧸", "🪄", "💫", "⚡️",
  "🍭", "🍬", "🧁", "🍩", "🥇", "🏅", "🌟", "🦄", "🐉", "🎠",
];
function hashCode(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return Math.abs(h); }
function iconFor(label) {
  const norm = normalizeWord(label);
  if (EMOJI_DICTIONARY[norm]) return EMOJI_DICTIONARY[norm];
  const sing = singularize(norm);
  if (EMOJI_DICTIONARY[sing]) return EMOJI_DICTIONARY[sing];
  const words = norm.split(/\s+/);
  if (words.length > 1) {
    for (const w of words) {
      if (EMOJI_DICTIONARY[w]) return EMOJI_DICTIONARY[w];
      const sw = singularize(w);
      if (EMOJI_DICTIONARY[sw]) return EMOJI_DICTIONARY[sw];
    }
  }
  return AUTO_ICON_PALETTE[hashCode(norm) % AUTO_ICON_PALETTE.length];
}

const ACCENTS = [COLORS.gold, COLORS.coral, COLORS.teal];

function uid(n = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function fmtTime(sec) { const s = Math.max(0, sec); const m = Math.floor(s / 60); const r = s % 60; return `${m}:${String(r).padStart(2, "0")}`; }

async function loadJSON(key, fallback) {
  try {
    const { data, error } = await supabase.from("kv_store").select("value").eq("key", key).maybeSingle();
    if (error || !data) return fallback;
    return data.value;
  } catch (e) { return fallback; }
}
async function saveJSON(key, value) {
  try { const { error } = await supabase.from("kv_store").upsert({ key, value }); return !error; } catch (e) { return false; }
}

/* ---------------------------------------------------------
   AUDIO
--------------------------------------------------------- */

function useGameAudio(musicConfig) {
  const nodesRef = useRef([]);
  const synthRef = useRef(null);
  const startedRef = useRef(false);
  const audioElRef = useRef(null);
  const [muted, setMuted] = useState(false);

  const boot = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      await Tone.start();
      const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.25, sustain: 0.05, release: 0.6 } }).toDestination();
      synth.volume.value = -3;
      synthRef.current = synth;

      if (musicConfig && musicConfig.type === "custom" && musicConfig.url) {
        // Custom background track supplied by the admin (pasted URL or uploaded file)
        try {
          const el = new Audio(musicConfig.url);
          el.loop = true;
          el.volume = 0.35;
          el.play().catch(() => {});
          audioElRef.current = el;
        } catch (e) {}
      } else if (musicConfig && musicConfig.type === "youtube" && musicConfig.videoId) {
        // Handled separately by useYouTubeBackgroundMusic — nothing to do here.
      } else {
        // Built-in generated soundtrack (always available as the default)
        Tone.Transport.bpm.value = 118;
        const kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 5, envelope: { attack: 0.001, decay: 0.35, sustain: 0 } }).toDestination();
        kick.volume.value = -6;
        const kickLoop = new Tone.Loop((t) => kick.triggerAttackRelease("C2", "8n", t), "4n").start(0);
        const hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 } }).toDestination();
        hat.volume.value = -18;
        const hatLoop = new Tone.Loop((t) => hat.triggerAttackRelease("16n", t), "8n").start("8n");
        const bass = new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.25, release: 0.25 } }).toDestination();
        bass.volume.value = -12;
        const bassNotes = ["C3", "A2", "F2", "G2"];
        let bi = 0;
        const bassLoop = new Tone.Loop((t) => { bass.triggerAttackRelease(bassNotes[bi % 4], "2n", t); bi++; }, "1m").start(0);
        const arp = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.004, decay: 0.18, sustain: 0.05, release: 0.15 } }).toDestination();
        arp.volume.value = -9;
        const arpPattern = ["C5", "E5", "G5", "E5", "A4", "C5", "E5", "C5", "F4", "A4", "C5", "A4", "G4", "B4", "D5", "B4"];
        const arpSeq = new Tone.Sequence((t, note) => arp.triggerAttackRelease(note, "8n", t), arpPattern, "8n").start(0);
        Tone.Transport.start();
        nodesRef.current = [kick, kickLoop, hat, hatLoop, bass, bassLoop, arp, arpSeq];
      }
    } catch (e) {}
  };
  const stop = () => {
    try {
      nodesRef.current.forEach((n) => { n.stop?.(); n.dispose?.(); });
      nodesRef.current = [];
      Tone.Transport.stop(); Tone.Transport.cancel();
      if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
      synthRef.current?.dispose();
      startedRef.current = false;
    } catch (e) {}
  };
  const playMatch = () => { try { synthRef.current?.triggerAttackRelease(["C5", "E5", "G5"], "8n"); } catch (e) {} };
  const playBonus = () => { try { synthRef.current?.triggerAttackRelease(["C5", "E5", "G5", "C6"], "4n"); } catch (e) {} };
  const playDoubleMatch = () => { try { synthRef.current?.triggerAttackRelease(["E5", "G5", "C6", "E6"], "4n"); } catch (e) {} };
  const playWin = () => { try { synthRef.current?.triggerAttackRelease(["C5", "E5", "G5", "C6", "E6"], "2n"); } catch (e) {} };
  const playStreak = () => { try { synthRef.current?.triggerAttackRelease(["G5", "B5"], "16n"); } catch (e) {} };
  const playHighScore = () => { try { synthRef.current?.triggerAttackRelease(["C5", "E5", "G5", "C6", "E6", "G6"], "1n"); } catch (e) {} };
  const playWarning = () => {
    try {
      synthRef.current?.triggerAttackRelease("A4", "16n");
      setTimeout(() => { try { synthRef.current?.triggerAttackRelease("A4", "16n"); } catch (e) {} }, 220);
    } catch (e) {}
  };
  const toggleMute = () => {
    const next = !muted; setMuted(next);
    Tone.Destination.mute = next;
    if (audioElRef.current) audioElRef.current.muted = next;
  };
  return { boot, stop, playMatch, playBonus, playDoubleMatch, playWin, playStreak, playHighScore, playWarning, muted, toggleMute };
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function useYouTubeBackgroundMusic(music) {
  const playerRef = useRef(null);
  const containerIdRef = useRef("yt-bg-" + Math.random().toString(36).slice(2));
  const active = !!(music && music.type === "youtube" && music.videoId);
  const [ytMuted, setYtMuted] = useState(true);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    function createPlayer() {
      if (cancelled) return;
      try {
        playerRef.current = new window.YT.Player(containerIdRef.current, {
          height: "0", width: "0", videoId: music.videoId,
          playerVars: { autoplay: 1, loop: 1, playlist: music.videoId, controls: 0, disablekb: 1, fs: 0, modestbranding: 1 },
          events: {
            onReady: (e) => {
              // Always start muted — this is the one combination every
              // browser reliably allows to autoplay inside an iframe.
              // Real unmuting happens later, directly inside a click handler.
              e.target.setVolume(45);
              e.target.mute();
              e.target.playVideo();
              setYtMuted(true);
            },
          },
        });
      } catch (err) {}
    }
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prevCb = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prevCb && prevCb(); createPlayer(); };
      if (!document.getElementById("youtube-iframe-api-script")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }
    return () => {
      cancelled = true;
      try { playerRef.current?.destroy(); } catch (e) {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, music?.videoId]);

  // Call this directly from a click handler — never from a useEffect —
  // so the browser sees it as a genuine user gesture and actually allows
  // unmuted playback.
  const toggleMute = () => {
    if (!playerRef.current || typeof playerRef.current.isMuted !== "function") return;
    try {
      const currentlyMuted = playerRef.current.isMuted();
      if (currentlyMuted) { playerRef.current.unMute(); playerRef.current.playVideo(); setYtMuted(false); }
      else { playerRef.current.mute(); setYtMuted(true); }
    } catch (e) {}
  };

  return { containerId: containerIdRef.current, active, toggleMute, ytMuted };
}

/* ---------------------------------------------------------
   Confetti + celebration graphics
--------------------------------------------------------- */

function Confetti({ burstKey, colors, count = 16, spread = 140, originTop = 0 }) {
  if (!burstKey) return null;
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI - Math.PI;
    const dist = spread * (0.5 + Math.random() * 0.7);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - spread * 0.3;
    const rot = Math.random() * 360 - 180;
    const dur = 700 + Math.random() * 500;
    const delay = Math.random() * 80;
    const size = 5 + Math.random() * 5;
    const color = colors[i % colors.length];
    const shape = Math.random() > 0.5 ? "50%" : "3px";
    return (
      <span key={burstKey + "-" + i} className="ip-confetti-particle" style={{
        "--dx": `${dx}px`, "--dy": `${dy}px`, left: "50%", top: originTop,
        width: size, height: size, background: color, borderRadius: shape,
        animationDuration: `${dur}ms`, animationDelay: `${delay}ms`,
      }} />
    );
  });
  return <div key={burstKey} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", zIndex: 30 }}>{particles}</div>;
}

const CELEBRATION_ICONS = ["🎉", "⭐", "🔥", "✨", "🥳", "🏆"];
function MatchCelebration({ triggerKey }) {
  if (!triggerKey) return null;
  const icon = CELEBRATION_ICONS[hashCode(triggerKey) % CELEBRATION_ICONS.length];
  return (
    <div key={triggerKey} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 28 }}>
      <span className="ip-celebrate-pop" style={{ fontSize: 92, filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.4))" }}>{icon}</span>
    </div>
  );
}
function GoldFlash({ triggerKey }) {
  if (!triggerKey) return null;
  return <div key={triggerKey} className="ip-gold-flash" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 27, background: "radial-gradient(circle, rgba(242,169,59,0.55), transparent 65%)" }} />;
}

/* ---------------------------------------------------------
   Shared shell chrome
--------------------------------------------------------- */

function Shell({ background, children }) {
  return (
    <div style={{
      minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden",
      background: background || BACKGROUND_PRESETS[0].css, fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 64px", boxSizing: "border-box",
    }}>
      <style>{`
        ${FONT_IMPORT}
        .ip-display { font-family: 'Sora', sans-serif; }
        .ip-gradient-text { background: linear-gradient(90deg, ${COLORS.gold}, ${COLORS.coral}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
        .ip-bg-decor { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
        .ip-dotgrid { position: absolute; inset: 0; opacity: 0.35; pointer-events: none; background-image: radial-gradient(rgba(247,244,239,0.16) 1px, transparent 1px); background-size: 26px 26px; }
        @keyframes ip-drift { 0%,100% { transform: translate(0,0); } 50% { transform: translate(16px,-12px); } }
        .ip-drift-slow { animation: ip-drift 9s ease-in-out infinite; }
        @keyframes ip-glow-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        .ip-glow-pulse { animation: ip-glow-pulse 3s ease-in-out infinite; }
        .ip-card-outer { perspective: 1000px; }
        .ip-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.45s cubic-bezier(.4,.2,.2,1); transform-style: preserve-3d; }
        .ip-card-inner.flipped { transform: rotateY(180deg); }
        .ip-card-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6px; box-sizing: border-box; }
        .ip-card-back { background: repeating-linear-gradient(45deg, rgba(242,169,59,0.08) 0px, rgba(242,169,59,0.08) 2px, transparent 2px, transparent 12px), linear-gradient(145deg, #26265a, #14142B); border: 1px solid rgba(242,169,59,0.45); box-shadow: 0 0 0 4px rgba(247,244,239,0.04) inset, 0 6px 14px rgba(0,0,0,0.3); }
        .ip-card-front { transform: rotateY(180deg); border: 1px solid rgba(20,20,43,0.08); box-shadow: 0 8px 20px rgba(20,20,43,0.28), 0 0 0 2px rgba(255,255,255,0.4) inset; }
        .ip-card-outer:not(.ip-locked):hover .ip-card-inner:not(.flipped) { transform: translateY(-4px) rotateY(0deg) scale(1.03); }
        .ip-card-matched { animation: ip-pop-out 0.5s ease forwards; }
        @keyframes ip-pop-out { 0% { opacity: 1; transform: scale(1); } 55% { transform: scale(1.16) rotate(-4deg); } 100% { opacity: 0; transform: scale(0) rotate(8deg); } }
        .ip-fade-in { animation: ip-fade-in 0.35s ease both; }
        @keyframes ip-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .ip-toast-in { animation: ip-toast-in 0.3s ease both; }
        @keyframes ip-toast-in { from { opacity: 0; transform: translate(-50%, 8px) scale(0.9); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        .ip-banner-in { animation: ip-banner-in 0.4s cubic-bezier(.2,.9,.3,1.3) both; }
        @keyframes ip-banner-in { from { opacity: 0; transform: translate(-50%, -16px) scale(0.8); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        .ip-celebrate-pop { display: inline-block; animation: ip-celebrate-pop 0.9s cubic-bezier(.2,.8,.3,1.15) both; }
        @keyframes ip-celebrate-pop { 0% { opacity: 0; transform: scale(0.2) rotate(-15deg); } 35% { opacity: 1; transform: scale(1.3) rotate(6deg); } 55% { transform: scale(1) rotate(-3deg); } 80% { opacity: 1; transform: scale(1.05) rotate(0deg); } 100% { opacity: 0; transform: scale(1.15) rotate(0deg); } }
        .ip-gold-flash { animation: ip-gold-flash 0.5s ease-out forwards; }
        @keyframes ip-gold-flash { 0% { opacity: 0.9; } 100% { opacity: 0; } }
        @keyframes ip-confetti-fall { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--dx), calc(var(--dy) + 90px)) rotate(var(--rot)); opacity: 0; } }
        .ip-confetti-particle { position: absolute; animation-name: ip-confetti-fall; animation-timing-function: ease-out; animation-fill-mode: forwards; }
        .ip-btn { cursor: pointer; border: none; font-family: 'Inter', sans-serif; font-weight: 600; transition: transform 0.15s ease, opacity 0.15s ease; }
        .ip-btn:active { transform: scale(0.97); }
        .ip-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .ip-input { font-family: 'Inter', sans-serif; }
        .ip-input::placeholder { color: rgba(247,244,239,0.35); }
        .ip-progress-track { height: 8px; border-radius: 999px; background: rgba(247,244,239,0.14); overflow: hidden; }
        .ip-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, ${COLORS.gold}, ${COLORS.coral}); transition: width 0.4s ease; }
        .ip-ticker-in { animation: ip-ticker-in 0.35s ease both; }
        @keyframes ip-ticker-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        .ip-countdown-pop { animation: ip-countdown-pop 1s cubic-bezier(.2,.8,.3,1.1) both; }
        @keyframes ip-countdown-pop { 0% { opacity: 0; transform: scale(0.4); } 30% { opacity: 1; transform: scale(1.15); } 100% { opacity: 0; transform: scale(1.4); } }
        .ip-instructions-highlight { animation: ip-instructions-glow 2.2s ease-in-out infinite; }
        @keyframes ip-instructions-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(242,169,59,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(242,169,59,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ip-card-inner, .ip-card-matched, .ip-fade-in, .ip-drift-slow, .ip-glow-pulse, .ip-confetti-particle, .ip-toast-in, .ip-banner-in, .ip-celebrate-pop, .ip-gold-flash, .ip-ticker-in, .ip-countdown-pop, .ip-instructions-highlight { animation: none !important; transition: none !important; }
        }
      `}</style>
      <div className="ip-dotgrid" />
      <div className="ip-bg-decor ip-drift-slow" style={{ width: 360, height: 360, top: -110, right: -90, background: "rgba(242,169,59,0.22)" }} />
      <div className="ip-bg-decor ip-drift-slow" style={{ width: 320, height: 320, bottom: -110, left: -90, background: "rgba(255,107,91,0.18)", animationDelay: "3s" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function Panel({ children, maxWidth = 480, style }) {
  return (
    <div className="ip-fade-in" style={{
      width: "100%", maxWidth, background: PANEL_BG, backdropFilter: "blur(16px)", borderRadius: 20, boxSizing: "border-box",
      position: "relative", overflow: "hidden", border: `1px solid ${PANEL_BORDER}`,
      boxShadow: `0 0 60px rgba(242,169,59,0.1), 0 30px 70px rgba(0,0,0,0.55)`, ...style,
    }}>
      <div style={{ height: 4, width: "100%", background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.coral}, ${COLORS.teal})` }} />
      <div style={{ padding: "30px 32px" }}>{children}</div>
    </div>
  );
}
function inputStyle(hasError) {
  return { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16, borderRadius: 10, background: INPUT_BG, border: `1px solid ${hasError ? COLORS.coral : INPUT_BORDER}`, color: COLORS.cream };
}
function PrimaryButton({ children, onClick, disabled, color = COLORS.gold, full, style, type = "button" }) {
  return (
    <button type={type} className="ip-btn" onClick={onClick} disabled={disabled} style={{
      background: color, color: COLORS.navy, border: "none", borderRadius: 12, padding: "13px 22px", fontSize: 15,
      width: full ? "100%" : undefined, boxShadow: `0 8px 20px ${color}55, inset 0 1px 0 rgba(255,255,255,0.45)`, ...style,
    }}>{children}</button>
  );
}
function GhostButton({ children, onClick, style }) {
  return <button className="ip-btn" onClick={onClick} style={{ background: "rgba(247,244,239,0.06)", color: COLORS.cream, border: "1px solid rgba(247,244,239,0.28)", borderRadius: 10, padding: "9px 16px", fontSize: 13, ...style }}>{children}</button>;
}

/* ---------------------------------------------------------
   INSTRUCTIONS
--------------------------------------------------------- */

function InstructionsContent({ game }) {
  const countdownSeconds = game.countdownSeconds ?? DEFAULT_COUNTDOWN_SECONDS;
  const timerSeconds = game.timerSeconds ?? 0;
  const movesBonusThreshold = game.movesBonusThreshold ?? DEFAULT_MOVES_BONUS_THRESHOLD;
  const rows = [
    { icon: "🃏", text: `Tap two cards to flip them. Find each card's iconic other half — like Salt & Pepper, or Batman & Robin.` },
    { icon: "✨", text: `Every correct pair is worth ${MATCH_POINTS} points.` },
    { icon: "⚡", text: `Watch for the gold "Double Points" banner — it pops up regularly. Whatever pair you find while it's active scores ${BONUS_POINTS} instead.` },
    { icon: "🎯", text: `Finish the whole board in ${movesBonusThreshold} moves or fewer for a flat +${MOVES_BONUS_POINTS} bonus at the end.` },
    { icon: "⏱️", text: `The board unlocks after a ${countdownSeconds}-second countdown — cards will shuffle on screen while you wait.` },
  ];
  if (timerSeconds > 0) rows.push({ icon: "⏳", text: `You have ${fmtTime(timerSeconds)} to find as many pairs as you can before time's up.` });
  else rows.push({ icon: "🎯", text: `No overall time limit — take your time and try to keep your move count low.` });
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{r.icon}</span>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.cream, lineHeight: 1.5 }}>{r.text}</p>
        </div>
      ))}
    </div>
  );
}

function InstructionsScreen({ game, onStart }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "7vh" }}>
      <p className="ip-display" style={{ color: CREAM_MUTED, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 8px" }}>Before you start</p>
      <h1 className="ip-display ip-gradient-text" style={{ fontSize: 34, fontWeight: 800, margin: "0 0 28px", textAlign: "center" }}>How to play</h1>
      <Panel maxWidth={440}>
        <InstructionsContent game={game} />
        <PrimaryButton onClick={onStart} full style={{ marginTop: 8 }}>I'm ready — start the countdown</PrimaryButton>
      </Panel>
    </div>
  );
}

function InstructionsButton({ onClick }) {
  return (
    <button className="ip-btn ip-instructions-highlight" onClick={onClick} title="View instructions" style={{
      position: "fixed", top: 18, left: 18, zIndex: 40, background: "rgba(242,169,59,0.16)", backdropFilter: "blur(8px)",
      border: `1.5px solid ${COLORS.gold}`, borderRadius: 999, padding: "9px 18px", color: COLORS.gold, fontSize: 13, fontWeight: 700,
      display: "flex", alignItems: "center", gap: 6,
    }}>Instructions</button>
  );
}

function InstructionsOverlay({ game, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,10,20,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <Panel maxWidth={440}>
          <p className="ip-display" style={{ color: COLORS.gold, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 14px" }}>How to play</p>
          <InstructionsContent game={game} />
          <PrimaryButton onClick={onClose} full style={{ marginTop: 8 }}>Got it</PrimaryButton>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   JOIN / LOGIN
--------------------------------------------------------- */

function CardFan() {
  const cards = [{ t: -22, x: -64, c: COLORS.gold }, { t: -8, x: -22, c: COLORS.coral }, { t: 8, x: 22, c: COLORS.teal }, { t: 22, x: 64, c: COLORS.gold }];
  return (
    <div style={{ position: "relative", height: 100, width: 260, margin: "0 auto 20px" }}>
      <div className="ip-glow-pulse" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(242,169,59,0.35), transparent 70%)", filter: "blur(20px)" }} />
      {cards.map((c, i) => (
        <div key={i} style={{
          position: "absolute", left: "50%", top: 6, width: 58, height: 80, transform: `translateX(-50%) translateX(${c.x}px) rotate(${c.t}deg)`,
          background: "linear-gradient(145deg, #2a2a5e, #14142B)", border: `1.5px solid ${c.c}88`, borderRadius: 9,
          boxShadow: `0 12px 26px rgba(0,0,0,0.4)`, zIndex: 2 - Math.abs(i - 1.5), display: "flex", alignItems: "center", justifyContent: "center",
        }}><div style={{ width: 20, height: 20, borderRadius: "50%", background: `${c.c}33`, border: `1px solid ${c.c}` }} /></div>
      ))}
    </div>
  );
}

function JoinScreen({ onJoin }) {
  const [code, setCode] = useState(""); const [error, setError] = useState("");
  const submit = () => { const clean = code.trim().toUpperCase(); if (!clean) { setError("Enter a game code to continue."); return; } setError(""); onJoin(clean); };
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "7vh" }}>
      <CardFan />
      <p className="ip-display" style={{ color: COLORS.gold, fontSize: 13, letterSpacing: 2, opacity: 0.9, margin: "0 0 8px", textTransform: "uppercase" }}>Iconic pairs</p>
      <h1 className="ip-display ip-gradient-text" style={{ fontSize: 40, fontWeight: 800, margin: "0 0 28px", textAlign: "center" }}>Enter your game code</h1>
      <Panel maxWidth={380}>
        <label style={{ display: "block", fontSize: 13, color: CREAM_MUTED, marginBottom: 8 }}>Game code</label>
        <input className="ip-input" value={code} onChange={(e) => { setCode(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. FX92K" style={{ ...inputStyle(error), fontSize: 18, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }} />
        {error && <p style={{ color: COLORS.coral, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        <PrimaryButton onClick={submit} full style={{ marginTop: 8 }}>Continue</PrimaryButton>
      </Panel>
    </div>
  );
}

function PlayerLogin({ game, onPlay, onBack }) {
  const [name, setName] = useState(""); const [team, setTeam] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name.trim()) { setError("Enter your name to play."); return; }
    setBusy(true); await Tone.start().catch(() => {}); onPlay(name.trim(), team.trim());
  };
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "8vh" }}>
      <CardFan />
      <p className="ip-display" style={{ color: CREAM_MUTED, fontSize: 14, margin: "0 0 6px" }}>You're invited to play</p>
      <h1 className="ip-display ip-gradient-text" style={{ fontSize: 40, fontWeight: 800, margin: "0 0 32px", textAlign: "center", maxWidth: 520 }}>{game.name}</h1>
      <Panel maxWidth={380}>
        <label style={{ display: "block", fontSize: 13, color: CREAM_MUTED, marginBottom: 8 }}>Your name</label>
        <input className="ip-input" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Jordan Lee" autoFocus style={{ ...inputStyle(error), marginBottom: 16 }} />
        <label style={{ display: "block", fontSize: 13, color: CREAM_MUTED, marginBottom: 8 }}>Team (optional)</label>
        <input className="ip-input" value={team} onChange={(e) => setTeam(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Falcons" style={{ ...inputStyle(false), marginBottom: 8 }} />
        {error && <p style={{ color: COLORS.coral, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
        <PrimaryButton onClick={submit} disabled={busy} full style={{ marginTop: 8 }}>🔊 Click to play</PrimaryButton>
        <p style={{ fontSize: 11, color: CREAM_FAINT, textAlign: "center", margin: "10px 0 0" }}>Turns on sound for this game — you can mute anytime.</p>
      </Panel>
      <button className="ip-btn" onClick={onBack} style={{ background: "none", border: "none", color: CREAM_FAINT, fontSize: 13, marginTop: 24 }}>Wrong game? Enter a different code</button>
    </div>
  );
}

/* ---------------------------------------------------------
   COUNTDOWN (with real-time card shuffle)
--------------------------------------------------------- */

function CountdownScreen({ game, onDone, onShowInstructions }) {
  const seconds = game.countdownSeconds ?? DEFAULT_COUNTDOWN_SECONDS;
  const [count, setCount] = useState(seconds);
  const [order, setOrder] = useState(() => shuffle(Array.from({ length: Math.min(game.cardCount, 30) }, (_, i) => i)));

  useEffect(() => {
    const shuffleId = setInterval(() => setOrder((o) => shuffle(o)), 480);
    const countId = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(countId); clearInterval(shuffleId); setTimeout(onDone, 350); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { clearInterval(shuffleId); clearInterval(countId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cols = Math.max(4, Math.min(8, Math.ceil(Math.sqrt(order.length * 1.4))));

  return (
    <div style={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <InstructionsButton onClick={onShowInstructions} />
      <p className="ip-display" style={{ color: CREAM_MUTED, fontSize: 13, margin: "0 0 4px" }}>Get ready</p>
      <h2 className="ip-display" style={{ color: COLORS.cream, fontSize: 22, fontWeight: 700, margin: "0 0 20px", textAlign: "center" }}>{game.name}</h2>
      <div style={{ position: "relative", width: "100%" }}>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, opacity: 0.55 }}>
          {order.map((id) => (
            <motion.div key={id} layout transition={{ type: "spring", stiffness: 260, damping: 22 }} style={{ aspectRatio: "3 / 4" }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: 10,
                background: "repeating-linear-gradient(45deg, rgba(242,169,59,0.08) 0px, rgba(242,169,59,0.08) 2px, transparent 2px, transparent 12px), linear-gradient(145deg, #26265a, #14142B)",
                border: "1px solid rgba(242,169,59,0.4)",
              }} />
            </motion.div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <span key={count} className="ip-display ip-countdown-pop" style={{
            fontSize: 110, fontWeight: 800, color: COLORS.gold, textShadow: "0 10px 40px rgba(0,0,0,0.6)",
          }}>{count > 0 ? count : "GO!"}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   GAME BOARD
--------------------------------------------------------- */

function buildBoard(pairs, cardCount) {
  const pairsNeeded = Math.max(2, Math.floor(cardCount / 2));
  const pool = pairs.length >= pairsNeeded ? shuffle(pairs).slice(0, pairsNeeded) : pairs;
  const colorFor = {};
  pool.forEach((p, i) => (colorFor[p.id] = ACCENTS[i % ACCENTS.length]));
  const cards = [];
  pool.forEach((p) => { cards.push({ uid: p.id + "-a", pairId: p.id, label: p.a, color: colorFor[p.id] }); cards.push({ uid: p.id + "-b", pairId: p.id, label: p.b, color: colorFor[p.id] }); });
  return shuffle(cards);
}

function LiveSidebar({ code }) {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      const feed = await loadJSON("activity-" + code, []);
      if (!stop) setEvents(feed.slice(-8).reverse());
    };
    poll();
    const id = setInterval(poll, 2500);
    return () => { stop = true; clearInterval(id); };
  }, [code]);

  return (
    <div style={{
      position: "fixed", top: 100, right: 14, width: 230, maxHeight: "58vh", overflowY: "auto",
      background: "rgba(18,18,38,0.7)", backdropFilter: "blur(12px)", border: `1px solid ${PANEL_BORDER}`,
      borderRadius: 14, padding: "12px 14px", zIndex: 22, boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span className="ip-glow-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.teal, boxShadow: `0 0 8px ${COLORS.teal}` }} />
        <span className="ip-display" style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: CREAM_MUTED }}>Live in this game</span>
      </div>
      {events.length === 0 && <p style={{ fontSize: 12, color: CREAM_FAINT, margin: 0 }}>Waiting for the first move…</p>}
      {events.map((e, i) => (
        <div key={e.at + "-" + i} className="ip-fade-in" style={{
          fontSize: 12, color: COLORS.cream, padding: "7px 0", lineHeight: 1.4,
          borderBottom: i < events.length - 1 ? "1px solid rgba(247,244,239,0.08)" : "none",
        }}>
          <strong>{e.name}</strong>{e.team ? <span style={{ color: COLORS.teal }}> ({e.team})</span> : null} <span style={{ color: CREAM_MUTED }}>{e.text}</span>
        </div>
      ))}
    </div>
  );
}
async function pushActivity(code, name, text, team) {
  try {
    const key = "activity-" + code;
    const current = (await loadJSON(key, [])) || [];
    const updated = [...current, { name, team: team || "", text, at: Date.now() }].slice(-30);
    await saveJSON(key, updated);
  } catch (e) {}
}

function GameBoard({ game, playerName, team, onExit }) {
  const [cards] = useState(() => buildBoard(game.pairs, game.cardCount));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState({});
  const [popping, setPopping] = useState({});
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [isTopScore, setIsTopScore] = useState(false);
  const [movesBonusAwarded, setMovesBonusAwarded] = useState(false);
  const [layoutMode, setLayoutMode] = useState(() => (typeof window !== "undefined" && window.innerWidth < 700 ? "mobile" : "laptop"));
  const [burst, setBurst] = useState(null);
  const [burstColors, setBurstColors] = useState([COLORS.gold]);
  const [toast, setToast] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [doubleActive, setDoubleActive] = useState(false);
  const [showBonusBanner, setShowBonusBanner] = useState(false);
  const [show20Warning, setShow20Warning] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [goldFlash, setGoldFlash] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);
  const startedRef = useRef(false);
  const lastBonusSecondRef = useRef(0);
  const warned20Ref = useRef(false);
  const audio = useGameAudio(game.music);
  const ytMusic = useYouTubeBackgroundMusic(game.music);
  const [showYtHint, setShowYtHint] = useState(ytMusic.active);

  const timerSeconds = game.timerSeconds || 0;
  const totalPairs = cards.length / 2;
  const matchedCount = Object.keys(matched).length / 2;
  const remaining = timerSeconds > 0 ? Math.max(0, timerSeconds - seconds) : null;

  useEffect(() => {
    audio.boot();
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { clearInterval(timerRef.current); audio.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seconds > 0 && seconds % BONUS_INTERVAL_SECONDS === 0 && seconds !== lastBonusSecondRef.current && !finished) {
      lastBonusSecondRef.current = seconds;
      setDoubleActive(true); setShowBonusBanner(true); audio.playBonus();
      setTimeout(() => setShowBonusBanner(false), 2600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  useEffect(() => {
    if (timerSeconds > 0 && remaining === 20 && !warned20Ref.current && !finished) {
      warned20Ref.current = true;
      setShow20Warning(true);
      audio.playWarning();
      setTimeout(() => setShow20Warning(false), 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    if (matchedCount === totalPairs && totalPairs > 0 && !finished && !startedRef.current) {
      startedRef.current = true;
      clearInterval(timerRef.current);
      audio.playWin();
      finishGame(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCount]);

  useEffect(() => {
    if (timerSeconds > 0 && remaining === 0 && !finished && !startedRef.current) {
      startedRef.current = true;
      clearInterval(timerRef.current);
      setTimedOut(true);
      finishGame(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  async function finishGame(outOfTime) {
    const movesBonusEligible = !outOfTime && moves <= (game.movesBonusThreshold || DEFAULT_MOVES_BONUS_THRESHOLD);
    const finalScore = score + (movesBonusEligible ? MOVES_BONUS_POINTS : 0);
    if (movesBonusEligible) { setScore(finalScore); setMovesBonusAwarded(true); audio.playHighScore(); }
    setFinished(true);
    const entry = { name: playerName, team: team || "", moves, seconds, score: finalScore, at: Date.now() };
    const key = "leaderboard-" + game.code;
    const current = (await loadJSON(key, [])) || [];
    const updated = [...current, entry].sort((a, b) => (a.seconds - b.seconds) || (b.score - a.score) || (a.moves - b.moves)).slice(0, 50);
    await saveJSON(key, updated);
    setLeaderboard(updated);
    const top = updated[0];
    if (top && top.at === entry.at && top.name === entry.name && top.score === entry.score) {
      setIsTopScore(true);
      audio.playHighScore();
      pushActivity(game.code, playerName, `just topped the leaderboard — ${finalScore} pts!`, team);
    } else if (movesBonusEligible) {
      pushActivity(game.code, playerName, `finished in just ${moves} moves for a ${MOVES_BONUS_POINTS}pt efficiency bonus!`, team);
    } else {
      pushActivity(game.code, playerName, outOfTime ? `ran out of time with ${finalScore} pts` : `finished with ${finalScore} pts`, team);
    }
  }

  const handleClick = (idx) => {
    if (locked || finished) return;
    const card = cards[idx];
    if (matched[card.uid] || flipped.includes(idx)) return;
    if (flipped.length === 2) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setLocked(true);
      const [i1, i2] = next;
      const c1 = cards[i1], c2 = cards[i2];
      setMoves((m) => m + 1);
      if (c1.pairId === c2.pairId) {
        const earnDouble = doubleActive;
        const points = earnDouble ? BONUS_POINTS : MATCH_POINTS;
        setTimeout(() => {
          setPopping((p) => ({ ...p, [c1.uid]: true, [c2.uid]: true }));
          setBurstColors([c1.color, COLORS.gold, COLORS.cream]);
          setBurst(c1.uid + "-" + Date.now());
          setCelebration(c1.uid + "-" + Date.now());
          setScore((s) => s + points);
          setStreak((st) => { const nx = st + 1; if (nx >= 2) audio.playStreak(); return nx; });
          if (earnDouble) { setDoubleActive(false); audio.playDoubleMatch(); setGoldFlash(c1.uid + "-flash-" + Date.now()); }
          else audio.playMatch();
          pushActivity(game.code, playerName, `matched ${c1.label} & ${c2.label}${earnDouble ? " for a double!" : ""}`, team);
          setToast(`${earnDouble ? "⚡ DOUBLE! " : "✓ "}${c1.label} + ${c2.label}  +${points}${streak + 1 >= 2 ? `  ·  🔥${streak + 1} streak` : ""}`);
          setTimeout(() => setToast(null), 1500);
          setTimeout(() => { setMatched((m) => ({ ...m, [c1.uid]: true, [c2.uid]: true })); setFlipped([]); setLocked(false); }, 480);
        }, 380);
      } else {
        setStreak(0);
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  };

  const autoCols = Math.max(4, Math.min(10, Math.ceil(Math.sqrt(cards.length * 1.4))));
  const cols = layoutMode === "mobile" ? Math.min(4, autoCols) : autoCols;
  const progressPct = totalPairs ? Math.round((matchedCount / totalPairs) * 100) : 0;

  if (finished) {
    const efficiency = totalPairs / Math.max(moves, 1);
    const tier = timedOut ? "Time's up" : efficiency >= 0.8 ? "Lightning fast" : efficiency >= 0.5 ? "Great pace" : "Nailed it";
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "6vh", position: "relative" }}>
        <FinishConfetti big={isTopScore} />
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(145deg, ${COLORS.gold}, ${COLORS.coral})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 12px 30px rgba(242,169,59,0.4)" }}>
          <span style={{ fontSize: 28 }}>{isTopScore ? "👑" : timedOut ? "⏱️" : "🎉"}</span>
        </div>
        {isTopScore && <p className="ip-display" style={{ color: COLORS.gold, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px", fontWeight: 800 }}>Top of the leaderboard!</p>}
        <p className="ip-display" style={{ color: COLORS.gold, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 8px" }}>{tier}</p>
        <h1 className="ip-display ip-gradient-text" style={{ fontSize: 40, fontWeight: 800, margin: "0 0 6px", textAlign: "center" }}>{score} points</h1>
        <p style={{ color: CREAM_MUTED, fontSize: 15, margin: "0 0 12px" }}>{timedOut ? `Time ran out, ${playerName.split(" ")[0]} — ` : "Nice work, "}{!timedOut && playerName.split(" ")[0]}{timedOut && `${matchedCount}/${totalPairs} pairs found`}</p>
        {movesBonusAwarded && (
          <div className="ip-fade-in" style={{ background: "rgba(46,196,182,0.15)", border: `1px solid ${COLORS.teal}`, borderRadius: 999, padding: "6px 16px", fontSize: 13, color: COLORS.teal, fontWeight: 600, margin: "0 0 20px" }}>
            🎯 Finished in {moves} moves — +{MOVES_BONUS_POINTS} efficiency bonus!
          </div>
        )}
        <Panel maxWidth={420}>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <StatBlock label="Time" value={fmtTime(seconds)} />
            <StatBlock label="Moves" value={moves} />
            <StatBlock label="Pairs" value={`${matchedCount}/${totalPairs}`} />
          </div>
          <p style={{ fontSize: 13, color: CREAM_MUTED, margin: "0 0 10px", fontWeight: 600 }}>Leaderboard</p>
          <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 20 }}>
            {(leaderboard || []).map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: e.name === playerName && e.score === score && e.seconds === seconds ? "rgba(242,169,59,0.18)" : "transparent", fontSize: 14 }}>
                <span style={{ color: COLORS.cream, fontWeight: 500 }}>{i === 0 ? "👑 " : `${i + 1}. `}{e.name}{e.team ? <span style={{ color: COLORS.teal }}> ({e.team})</span> : null}</span>
                <span style={{ color: CREAM_MUTED }}>{e.score} pts · {fmtTime(e.seconds)}</span>
              </div>
            ))}
          </div>
          <PrimaryButton onClick={onExit} full>Back to start</PrimaryButton>
        </Panel>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 980, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <GoldFlash triggerKey={goldFlash} />
      {ytMusic.active && <div id={ytMusic.containerId} style={{ position: "fixed", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }} />}
      <LiveSidebar code={game.code} />
      <InstructionsButton onClick={() => setShowInstructions(true)} />
      {showInstructions && <InstructionsOverlay game={game} onClose={() => setShowInstructions(false)} />}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12, marginTop: 22 }}>
        <div>
          <p className="ip-display" style={{ color: COLORS.cream, fontSize: 12, opacity: 0.65, margin: 0 }}>{game.name}</p>
          <p style={{ color: COLORS.cream, fontSize: 14, margin: "2px 0 0", opacity: 0.85 }}>Playing as {playerName}{team ? ` · ${team}` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <MiniStat label="Score" value={score} highlight />
          <MiniStat label={timerSeconds > 0 ? "Time left" : "Time"} value={timerSeconds > 0 ? fmtTime(remaining) : fmtTime(seconds)} warn={timerSeconds > 0 && remaining <= 20} />
          <MiniStat label="Moves" value={moves} />
          <div style={{ display: "flex", gap: 4, background: "rgba(247,244,239,0.06)", borderRadius: 8, padding: 3 }}>
            <button className="ip-btn" onClick={() => setLayoutMode("mobile")} title="Mobile layout" style={{
              background: layoutMode === "mobile" ? COLORS.gold : "transparent", color: layoutMode === "mobile" ? COLORS.navy : COLORS.cream,
              border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12,
            }}>📱</button>
            <button className="ip-btn" onClick={() => setLayoutMode("laptop")} title="Laptop layout" style={{
              background: layoutMode === "laptop" ? COLORS.gold : "transparent", color: layoutMode === "laptop" ? COLORS.navy : COLORS.cream,
              border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12,
            }}>💻</button>
          </div>
          <button className="ip-btn" onClick={() => { audio.toggleMute(); ytMusic.toggleMute(); setShowYtHint(false); }} title={audio.muted ? "Unmute" : "Mute"} style={{ background: "rgba(247,244,239,0.08)", border: "1px solid rgba(247,244,239,0.25)", borderRadius: 8, width: 34, height: 34, color: COLORS.cream, fontSize: 15 }}>{audio.muted ? "🔇" : "🔊"}</button>
        </div>
      </div>

      <div style={{ width: "100%", marginBottom: 18 }}><div className="ip-progress-track"><div className="ip-progress-fill" style={{ width: `${progressPct}%` }} /></div></div>

      {showYtHint && (
        <div className="ip-fade-in" style={{
          position: "absolute", top: 44, right: 14, zIndex: 24, background: "rgba(20,20,43,0.85)", border: `1px solid ${PANEL_BORDER}`,
          color: COLORS.gold, fontSize: 12, padding: "7px 14px", borderRadius: 999, whiteSpace: "nowrap",
        }}>🔈 Music starts muted — tap the speaker icon to turn it on</div>
      )}

      {showBonusBanner && (
        <div className="ip-banner-in" style={{ position: "absolute", top: -6, left: "50%", zIndex: 26, background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.coral})`, color: COLORS.navy, padding: "12px 26px", borderRadius: 14, fontWeight: 700, fontSize: 15, textAlign: "center", boxShadow: "0 16px 40px rgba(242,169,59,0.5)", whiteSpace: "nowrap" }}>
          ⚡ Double points! Your next match is worth {BONUS_POINTS}
        </div>
      )}
      {show20Warning && !showBonusBanner && (
        <div className="ip-banner-in" style={{ position: "absolute", top: -6, left: "50%", zIndex: 26, background: `linear-gradient(135deg, ${COLORS.coral}, #c0392b)`, color: COLORS.cream, padding: "12px 26px", borderRadius: 14, fontWeight: 700, fontSize: 15, textAlign: "center", boxShadow: "0 16px 40px rgba(255,107,91,0.5)", whiteSpace: "nowrap" }}>
          ⏰ Only 20 seconds left!
        </div>
      )}
      {toast && !showBonusBanner && !show20Warning && (
        <div className="ip-toast-in" style={{ position: "absolute", top: 60, left: "50%", zIndex: 25, background: COLORS.navy, color: COLORS.gold, padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, boxShadow: "0 10px 26px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>{toast}</div>
      )}
      <Confetti burstKey={burst} colors={burstColors} originTop={70} />
      <MatchCelebration triggerKey={celebration} />

      <div style={{ width: "100%", display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched[card.uid];
          const isPopping = popping[card.uid];
          const icon = iconFor(card.label);
          return (
            <div key={card.uid} className={`ip-card-outer ${locked ? "ip-locked" : ""}`} onClick={() => handleClick(idx)} style={{ aspectRatio: "3 / 4", cursor: matched[card.uid] ? "default" : "pointer" }}>
              <div className={`ip-card-inner ${isFlipped ? "flipped" : ""} ${isPopping ? "ip-card-matched" : ""}`}>
                <div className="ip-card-face ip-card-back">
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(242,169,59,0.15)", border: "1px solid rgba(242,169,59,0.5)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                    <span className="ip-display" style={{ color: COLORS.gold, fontSize: 13, fontWeight: 700 }}>{game.name.trim().charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="ip-display" style={{ color: COLORS.gold, fontSize: 10, fontWeight: 700, lineHeight: 1.3, opacity: 0.85, padding: "0 4px" }}>{game.name}</span>
                </div>
                <div className="ip-card-face ip-card-front" style={{ background: `${card.color}22`, borderTop: `4px solid ${card.color}` }}>
                  {icon && <span style={{ fontSize: 22, marginBottom: 4 }}>{icon}</span>}
                  <span style={{ color: COLORS.navy, fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>{card.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <GhostButton onClick={onExit} style={{ marginTop: 28 }}>Leave game</GhostButton>
    </div>
  );
}

function FinishConfetti({ big }) {
  const [key] = useState(() => "finish-" + Date.now());
  return <Confetti burstKey={key} colors={[COLORS.gold, COLORS.coral, COLORS.teal, COLORS.cream]} count={big ? 80 : 46} spread={big ? 300 : 220} originTop={-10} />;
}
function StatBlock({ label, value }) {
  return (
    <div style={{ flex: 1, background: "rgba(247,244,239,0.06)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
      <p className="ip-display" style={{ fontSize: 22, fontWeight: 700, color: COLORS.cream, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: CREAM_MUTED, margin: "2px 0 0" }}>{label}</p>
    </div>
  );
}
function MiniStat({ label, value, highlight, warn }) {
  return (
    <div style={{ textAlign: "right" }}>
      <p className="ip-display" style={{ fontSize: 18, fontWeight: 700, color: warn ? COLORS.coral : highlight ? COLORS.gold : COLORS.cream, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 10, color: "rgba(247,244,239,0.55)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   ADMIN CONSOLE
--------------------------------------------------------- */

const ADMIN_TABS = [
  { id: "create", label: "Create link" }, { id: "links", label: "Your links" },
  { id: "pairs", label: "Pairs library" }, { id: "background", label: "Background" }, { id: "music", label: "Music" },
  { id: "count", label: "Card count" }, { id: "countdown", label: "Countdown" }, { id: "timer", label: "Game timer" },
  { id: "movesbonus", label: "Moves bonus" },
];

function AdminPanel({ onExit }) {
  const [tab, setTab] = useState("create");
  const [categories, setCategories] = useState(null);
  const [background, setBackground] = useState(null);
  const [cardCount, setCardCount] = useState(20);
  const [countdownSeconds, setCountdownSeconds] = useState(DEFAULT_COUNTDOWN_SECONDS);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const [movesBonusThreshold, setMovesBonusThreshold] = useState(DEFAULT_MOVES_BONUS_THRESHOLD);
  const [music, setMusic] = useState({ type: "builtin", url: "" });
  const [games, setGames] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cats = await loadJSON("pairs-categories", DEFAULT_CATEGORIES);
      const bg = await loadJSON("background-settings", BACKGROUND_PRESETS[0]);
      const cc = await loadJSON("card-count-setting", 20);
      const cd = await loadJSON("countdown-seconds", DEFAULT_COUNTDOWN_SECONDS);
      const gt = await loadJSON("game-timer-seconds", DEFAULT_TIMER_SECONDS);
      const mb = await loadJSON("moves-bonus-threshold", DEFAULT_MOVES_BONUS_THRESHOLD);
      const mu = await loadJSON("music-settings", { type: "builtin", url: "" });
      const idx = await loadJSON("games-index", []);
      setCategories(cats); setBackground(bg); setCardCount(cc); setCountdownSeconds(cd); setTimerSeconds(gt); setMovesBonusThreshold(mb); setMusic(mu); setGames(idx); setLoading(false);
    })();
  }, []);

  if (loading) return <p style={{ color: COLORS.cream }}>Loading admin panel…</p>;

  const totalPairs = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div style={{ width: "100%", maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p className="ip-display" style={{ color: COLORS.gold, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>Iconic Pairs</p>
          <h1 className="ip-display ip-gradient-text" style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Admin console</h1>
        </div>
        <GhostButton onClick={onExit}>Exit</GhostButton>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {ADMIN_TABS.map((t) => (
          <button key={t.id} className="ip-btn" onClick={() => setTab(t.id)} style={{ background: tab === t.id ? COLORS.gold : "rgba(247,244,239,0.1)", color: tab === t.id ? COLORS.navy : COLORS.cream, border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13 }}>{t.label}</button>
        ))}
      </div>
      <Panel maxWidth={800}>
        {tab === "create" && <CreateLinkTab categories={categories} background={background} cardCount={cardCount} countdownSeconds={countdownSeconds} timerSeconds={timerSeconds} movesBonusThreshold={movesBonusThreshold} music={music} games={games} setGames={setGames} />}
        {tab === "links" && <LinksTab games={games} />}
        {tab === "pairs" && <CategoriesTab categories={categories} setCategories={setCategories} />}
        {tab === "background" && <BackgroundTab background={background} setBackground={setBackground} />}
        {tab === "music" && <MusicTab music={music} setMusic={setMusic} />}
        {tab === "count" && <CardCountTab cardCount={cardCount} setCardCount={setCardCount} maxPairs={totalPairs} />}
        {tab === "countdown" && <CountdownTab countdownSeconds={countdownSeconds} setCountdownSeconds={setCountdownSeconds} />}
        {tab === "timer" && <GameTimerTab timerSeconds={timerSeconds} setTimerSeconds={setTimerSeconds} />}
        {tab === "movesbonus" && <MovesBonusTab movesBonusThreshold={movesBonusThreshold} setMovesBonusThreshold={setMovesBonusThreshold} />}
      </Panel>
    </div>
  );
}

function CreateLinkTab({ categories, background, cardCount, countdownSeconds, timerSeconds, movesBonusThreshold, music, games, setGames }) {
  const [name, setName] = useState("");
  const [selectedCats, setSelectedCats] = useState(() => Object.fromEntries(CATEGORY_NAMES.map((c) => [c, true])));
  const [created, setCreated] = useState(null); const [saving, setSaving] = useState(false); const [error, setError] = useState("");

  const toggleCat = (cat) => setSelectedCats((s) => ({ ...s, [cat]: !s[cat] }));
  const allOn = () => setSelectedCats(Object.fromEntries(CATEGORY_NAMES.map((c) => [c, true])));
  const allOff = () => setSelectedCats(Object.fromEntries(CATEGORY_NAMES.map((c) => [c, false])));

  const create = async () => {
    if (!name.trim()) return;
    const pool = CATEGORY_NAMES.filter((c) => selectedCats[c]).flatMap((c) => categories[c] || []);
    if (pool.length < 2) { setError("Select at least one category with pairs."); return; }
    setError(""); setSaving(true);
    const code = uid(5);
    const game = { code, name: name.trim(), background, cardCount, countdownSeconds, timerSeconds, movesBonusThreshold, music, pairs: pool, createdAt: Date.now() };
    await saveJSON("game-" + code, game);
    const idxEntry = { code, name: game.name, createdAt: game.createdAt, cardCount };
    const newIndex = [idxEntry, ...(games || [])];
    await saveJSON("games-index", newIndex);
    setGames(newIndex); setCreated(game); setName(""); setSaving(false);
  };
  const link = created ? `${window.location.href.split("#")[0]}#play-${created.code}` : "";

  return (
    <div>
      <p style={{ fontSize: 13, color: COLORS.cream, opacity: 0.85, margin: "0 0 4px", fontWeight: 600 }}>Activity name</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <input className="ip-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Offsite — Icebreaker" style={{ flex: 1, ...inputStyle(false), fontSize: 14 }} />
        <PrimaryButton onClick={create} disabled={saving || !name.trim()}>Create link</PrimaryButton>
      </div>

      <p style={{ fontSize: 13, color: COLORS.cream, opacity: 0.85, margin: "0 0 4px", fontWeight: 600 }}>Pair categories to include</p>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 10px" }}>Pick which themed sets feed into this link's board (edit each set's pairs under "Pairs library").</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <GhostButton onClick={allOn}>Select all</GhostButton>
        <GhostButton onClick={allOff}>Select none</GhostButton>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginBottom: 8 }}>
        {CATEGORY_NAMES.map((cat) => (
          <label key={cat} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(247,244,239,0.05)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13, color: COLORS.cream }}>
            <input type="checkbox" checked={!!selectedCats[cat]} onChange={() => toggleCat(cat)} />
            {cat} <span style={{ color: CREAM_FAINT, fontSize: 11 }}>({(categories[cat] || []).length})</span>
          </label>
        ))}
      </div>
      {error && <p style={{ color: COLORS.coral, fontSize: 12, margin: "4px 0 0" }}>{error}</p>}

      {created && (
        <div className="ip-fade-in" style={{ marginTop: 20, padding: 16, background: "rgba(46,196,182,0.12)", borderRadius: 12, border: "1px solid rgba(46,196,182,0.35)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.cream, margin: "0 0 8px" }}>Link ready</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={link} className="ip-input" style={{ flex: 1, ...inputStyle(false), fontSize: 12, padding: "9px 12px" }} />
            <GhostButton onClick={() => navigator.clipboard?.writeText(link)}>Copy</GhostButton>
          </div>
          <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "10px 0 0" }}>Game code: <strong style={{ color: COLORS.cream }}>{created.code}</strong></p>
        </div>
      )}
    </div>
  );
}

function LinksTab({ games }) {
  const [openLeaderboard, setOpenLeaderboard] = useState(null); const [board, setBoard] = useState(null);
  const viewLeaderboard = async (code) => { const lb = await loadJSON("leaderboard-" + code, []); setBoard(lb); setOpenLeaderboard(code); };
  if (!games || games.length === 0) return <p style={{ color: CREAM_MUTED, fontSize: 14 }}>No links created yet — head to "Create link" to make your first one.</p>;
  return (
    <div>
      {games.map((g) => {
        const link = `${window.location.href.split("#")[0]}#play-${g.code}`;
        return (
          <div key={g.code} style={{ padding: "12px 0", borderBottom: "1px solid rgba(247,244,239,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontWeight: 600, color: COLORS.cream, margin: 0, fontSize: 14 }}>{g.name}</p>
                <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "2px 0 0" }}>Code {g.code} · {g.cardCount} cards · {new Date(g.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <GhostButton onClick={() => navigator.clipboard?.writeText(link)}>Copy link</GhostButton>
                <GhostButton onClick={() => viewLeaderboard(g.code)}>Leaderboard</GhostButton>
              </div>
            </div>
            {openLeaderboard === g.code && (
              <div style={{ marginTop: 10, background: "rgba(247,244,239,0.05)", borderRadius: 10, padding: 12 }}>
                {board && board.length > 0 ? board.slice(0, 10).map((e, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: COLORS.cream }}>
                    <span>{i + 1}. {e.name}{e.team ? ` (${e.team})` : ""}</span><span style={{ color: CREAM_MUTED }}>{e.score ?? "—"} pts · {fmtTime(e.seconds)}</span>
                  </div>
                )) : <p style={{ fontSize: 12, color: CREAM_MUTED, margin: 0 }}>No completed plays yet.</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CategoriesTab({ categories, setCategories }) {
  const [activeCat, setActiveCat] = useState(CATEGORY_NAMES[0]);
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [saving, setSaving] = useState(false);
  const list = categories[activeCat] || [];

  const persist = async (nextList) => {
    setSaving(true);
    const next = { ...categories, [activeCat]: nextList };
    setCategories(next);
    await saveJSON("pairs-categories", next);
    setSaving(false);
  };
  const add = () => { if (!a.trim() || !b.trim()) return; persist([...list, { id: activeCat.replace(/\s+/g, "") + "-" + Date.now(), a: a.trim(), b: b.trim() }]); setA(""); setB(""); };
  const remove = (id) => persist(list.filter((p) => p.id !== id));
  const resetCat = () => persist(DEFAULT_CATEGORIES[activeCat]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {CATEGORY_NAMES.map((cat) => (
          <button key={cat} className="ip-btn" onClick={() => setActiveCat(cat)} style={{
            background: activeCat === cat ? COLORS.teal : "rgba(247,244,239,0.08)", color: activeCat === cat ? COLORS.navy : COLORS.cream,
            border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12,
          }}>{cat} ({(categories[cat] || []).length})</button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 14px" }}>Editing <strong style={{ color: COLORS.cream }}>{activeCat}</strong> — {list.length} pairs ({list.length * 2} cards). Icons are auto-assigned as you type.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input className="ip-input" value={a} onChange={(e) => setA(e.target.value)} placeholder="First item" style={{ flex: 1, ...inputStyle(false), padding: "10px 12px", fontSize: 13 }} />
        <input className="ip-input" value={b} onChange={(e) => setB(e.target.value)} placeholder="Second item" style={{ flex: 1, ...inputStyle(false), padding: "10px 12px", fontSize: 13 }} />
        <PrimaryButton onClick={add} disabled={saving || !a.trim() || !b.trim()}>Add pair</PrimaryButton>
      </div>
      {(a.trim() || b.trim()) && (
        <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "-8px 0 14px" }}>
          Preview: {a.trim() && <span>{iconFor(a.trim())} {a.trim()}</span>} {a.trim() && b.trim() && "· "} {b.trim() && <span>{iconFor(b.trim())} {b.trim()}</span>}
        </p>
      )}
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {list.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid rgba(247,244,239,0.08)" }}>
            <span style={{ fontSize: 13, color: COLORS.cream }}>{iconFor(p.a)} {p.a} &nbsp;·&nbsp; {iconFor(p.b)} {p.b}</span>
            <button className="ip-btn" onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: COLORS.coral, fontSize: 12 }}>Remove</button>
          </div>
        ))}
      </div>
      <GhostButton onClick={resetCat} style={{ marginTop: 14 }}>Reset "{activeCat}" to default 10 pairs</GhostButton>
    </div>
  );
}

function MusicTab({ music, setMusic }) {
  const [url, setUrl] = useState(music.type === "custom" ? music.url || "" : "");
  const [ytUrl, setYtUrl] = useState(music.type === "youtube" ? `https://youtu.be/${music.videoId || ""}` : "");
  const [ytError, setYtError] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);

  const saveMusic = async (next) => { setMusic(next); await saveJSON("music-settings", next); };

  const useBuiltin = async () => { setSaving(true); await saveMusic({ type: "builtin", url: "" }); setSaving(false); };

  const useYouTube = async () => {
    const id = extractYouTubeId(ytUrl.trim());
    if (!id) { setYtError("Couldn't find a video ID in that link — paste a normal youtube.com or youtu.be link."); return; }
    setYtError(""); setSaving(true);
    await saveMusic({ type: "youtube", videoId: id });
    setSaving(false);
  };

  const useUrl = async () => {
    if (!url.trim()) return;
    setSaving(true);
    await saveMusic({ type: "custom", url: url.trim() });
    setSaving(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("music").upload(safeName, file, { upsert: true, contentType: file.type || "audio/mpeg" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("music").getPublicUrl(safeName);
      setUrl(data.publicUrl);
      await saveMusic({ type: "custom", url: data.publicUrl });
    } catch (e) {
      setUploadError("Upload failed. Make sure the \"music\" storage bucket is set up — run supabase-music-setup.sql once in Supabase's SQL Editor.");
    }
    setUploading(false);
  };

  const activeLabel = music.type === "youtube" ? "YouTube" : music.type === "custom" ? "Custom track" : "Built-in";

  return (
    <div>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 4px" }}>Choose the background music for the next links you create.</p>
      <p style={{ fontSize: 12, color: COLORS.teal, margin: "0 0 20px" }}>Currently active: {activeLabel}</p>

      <div style={{ marginBottom: 22, padding: 14, background: "rgba(247,244,239,0.04)", borderRadius: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.cream, margin: "0 0 4px" }}>🎵 Built-in soundtrack</p>
        <p style={{ fontSize: 12, color: CREAM_FAINT, margin: "0 0 10px" }}>Generated in-browser, no setup needed, always available.</p>
        <PrimaryButton onClick={useBuiltin} disabled={saving}>Use built-in soundtrack</PrimaryButton>
      </div>

      <div style={{ marginBottom: 22, padding: 14, background: "rgba(247,244,239,0.04)", borderRadius: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.cream, margin: "0 0 4px" }}>📺 YouTube link</p>
        <p style={{ fontSize: 12, color: CREAM_FAINT, margin: "0 0 10px" }}>Paste any normal YouTube link — it plays hidden in the background, looping.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="ip-input" value={ytUrl} onChange={(e) => { setYtUrl(e.target.value); setYtError(""); }} placeholder="https://youtu.be/…"
            style={{ flex: 1, ...inputStyle(!!ytError), padding: "10px 12px", fontSize: 13 }} />
          <PrimaryButton onClick={useYouTube} disabled={saving || !ytUrl.trim()}>Use this video</PrimaryButton>
        </div>
        {ytError && <p style={{ color: COLORS.coral, fontSize: 12, margin: "8px 0 0" }}>{ytError}</p>}
      </div>

      <div style={{ marginBottom: 22, padding: 14, background: "rgba(247,244,239,0.04)", borderRadius: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.cream, margin: "0 0 4px" }}>⬆️ Upload an MP3</p>
        <p style={{ fontSize: 12, color: CREAM_FAINT, margin: "0 0 10px" }}>Uploads to your project's storage and uses it directly — no external link needed. Requires the one-time "music" storage bucket setup (see supabase-music-setup.sql).</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ color: COLORS.cream, fontSize: 12, flex: 1, minWidth: 180 }} />
          <PrimaryButton onClick={handleUpload} disabled={uploading || !file}>{uploading ? "Uploading…" : "Upload & use"}</PrimaryButton>
        </div>
        {uploadError && <p style={{ color: COLORS.coral, fontSize: 12, margin: "8px 0 0" }}>{uploadError}</p>}
      </div>

      <details>
        <summary style={{ fontSize: 12, color: CREAM_FAINT, cursor: "pointer" }}>Advanced: paste a direct audio URL instead</summary>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input className="ip-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/track.mp3"
            style={{ flex: 1, ...inputStyle(false), padding: "10px 12px", fontSize: 13 }} />
          <PrimaryButton onClick={useUrl} disabled={saving || !url.trim()}>Use this URL</PrimaryButton>
        </div>
      </details>
    </div>
  );
}

function BackgroundTab({ background, setBackground }) {
  const [customColor, setCustomColor] = useState("#14142B"); const [customImage, setCustomImage] = useState("");
  const choose = async (bg) => { setBackground(bg); await saveJSON("background-settings", bg); };
  return (
    <div>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 14px" }}>Sets the background for the next links you create.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
        {BACKGROUND_PRESETS.map((p) => (
          <div key={p.id} onClick={() => choose({ id: p.id, name: p.name, css: p.css })} style={{ cursor: "pointer" }}>
            <div style={{ height: 60, borderRadius: 10, background: p.css, border: background?.id === p.id ? `2px solid ${COLORS.gold}` : "2px solid transparent" }} />
            <p style={{ fontSize: 11, color: CREAM_MUTED, margin: "4px 0 0", textAlign: "center" }}>{p.name}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.cream, margin: "0 0 8px" }}>Custom color</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} style={{ width: 44, height: 36, border: "none", borderRadius: 8 }} />
        <PrimaryButton onClick={() => choose({ id: "custom-color", name: "Custom color", css: customColor })}>Use this color</PrimaryButton>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.cream, margin: "0 0 8px" }}>Custom image URL</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="ip-input" value={customImage} onChange={(e) => setCustomImage(e.target.value)} placeholder="https://…" style={{ flex: 1, ...inputStyle(false), padding: "10px 12px", fontSize: 13 }} />
        <PrimaryButton onClick={() => customImage.trim() && choose({ id: "custom-image", name: "Custom image", css: `center / cover no-repeat url(${customImage.trim()})` })} disabled={!customImage.trim()}>Use image</PrimaryButton>
      </div>
    </div>
  );
}

function CardCountTab({ cardCount, setCardCount, maxPairs }) {
  const [saving, setSaving] = useState(false); const max = maxPairs * 2;
  const persist = async (val) => { setSaving(true); setCardCount(val); await saveJSON("card-count-setting", val); setSaving(false); };
  const presets = [12, 16, 20, 24, 30, 40, 50].filter((n) => n <= max || n === 12);
  return (
    <div>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 4px" }}>Sets the default number of cards for the next links you create.</p>
      <p style={{ fontSize: 12, color: COLORS.coral, margin: "0 0 16px" }}>Heads up: past ~24 cards, recall-matching gets slow for most groups. 16–24 tends to keep energy highest for corporate play.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {presets.map((n) => (
          <button key={n} className="ip-btn" onClick={() => persist(n)} disabled={saving || n > max} style={{ background: cardCount === n ? COLORS.gold : "rgba(247,244,239,0.1)", color: cardCount === n ? COLORS.navy : COLORS.cream, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13 }}>{n}</button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: CREAM_FAINT, margin: 0 }}>Your combined categories currently support up to {max} cards ({maxPairs} pairs). Add more pairs to unlock higher counts.</p>
    </div>
  );
}

function MovesBonusTab({ movesBonusThreshold, setMovesBonusThreshold }) {
  const [saving, setSaving] = useState(false);
  const persist = async (val) => { setSaving(true); setMovesBonusThreshold(val); await saveJSON("moves-bonus-threshold", val); setSaving(false); };
  const presets = [10, 15, 20, 25];
  return (
    <div>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 4px" }}>Finishing the whole board in this many moves or fewer earns a flat +{MOVES_BONUS_POINTS} point bonus at the end.</p>
      <p style={{ fontSize: 12, color: CREAM_FAINT, margin: "0 0 16px" }}>Sets the default for the next links you create. Doesn't apply if the overall game timer runs out first.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {presets.map((n) => (
          <button key={n} className="ip-btn" onClick={() => persist(n)} disabled={saving} style={{ background: movesBonusThreshold === n ? COLORS.gold : "rgba(247,244,239,0.1)", color: movesBonusThreshold === n ? COLORS.navy : COLORS.cream, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13 }}>{n} moves</button>
        ))}
      </div>
    </div>
  );
}

function CountdownTab({ countdownSeconds, setCountdownSeconds }) {
  const [saving, setSaving] = useState(false);
  const persist = async (val) => { setSaving(true); setCountdownSeconds(val); await saveJSON("countdown-seconds", val); setSaving(false); };
  const presets = [5, 10, 15, 20];
  return (
    <div>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 4px" }}>How long players wait — with a live card-shuffle animation — before the board unlocks.</p>
      <p style={{ fontSize: 12, color: CREAM_FAINT, margin: "0 0 16px" }}>Sets the default for the next links you create.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {presets.map((n) => (
          <button key={n} className="ip-btn" onClick={() => persist(n)} disabled={saving} style={{ background: countdownSeconds === n ? COLORS.gold : "rgba(247,244,239,0.1)", color: countdownSeconds === n ? COLORS.navy : COLORS.cream, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13 }}>{n}s</button>
        ))}
      </div>
    </div>
  );
}

function GameTimerTab({ timerSeconds, setTimerSeconds }) {
  const [saving, setSaving] = useState(false);
  const persist = async (val) => { setSaving(true); setTimerSeconds(val); await saveJSON("game-timer-seconds", val); setSaving(false); };
  const presets = [{ label: "No limit", val: 0 }, { label: "2 min", val: 120 }, { label: "3 min", val: 180 }, { label: "4 min", val: 240 }, { label: "5 min", val: 300 }];
  return (
    <div>
      <p style={{ fontSize: 12, color: CREAM_MUTED, margin: "0 0 4px" }}>An optional overall time limit — the game ends automatically (and locks in whatever score the player has) when it runs out.</p>
      <p style={{ fontSize: 12, color: CREAM_FAINT, margin: "0 0 16px" }}>Sets the default for the next links you create.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button key={p.val} className="ip-btn" onClick={() => persist(p.val)} disabled={saving} style={{ background: timerSeconds === p.val ? COLORS.gold : "rgba(247,244,239,0.1)", color: timerSeconds === p.val ? COLORS.navy : COLORS.cream, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13 }}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT
--------------------------------------------------------- */

export default function App() {
  const [view, setView] = useState("loading");
  const [activeGame, setActiveGame] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerTeam, setPlayerTeam] = useState("");
  const [showInstructionsOverlay, setShowInstructionsOverlay] = useState(false);

  useEffect(() => {
    (async () => {
      const hash = window.location.hash || "";
      if (hash === "#admin") { setView("admin"); return; }
      if (hash.startsWith("#play-")) {
        const code = hash.replace("#play-", "").toUpperCase();
        const game = await loadJSON("game-" + code, null);
        if (game) { setActiveGame(game); setView("player-login"); } else { setView("not-found"); }
        return;
      }
      setView("join");
    })();
  }, []);

  const goJoin = () => { window.location.hash = ""; setView("join"); };
  const handleJoinCode = async (code) => {
    const game = await loadJSON("game-" + code, null);
    if (game) { window.location.hash = "play-" + code; setActiveGame(game); setView("player-login"); }
    else { setActiveGame({ notFoundCode: code }); setView("not-found"); }
  };
  const bg = activeGame?.background?.css;

  if (view === "loading") return <Shell><p style={{ color: COLORS.cream }}>Loading…</p></Shell>;
  if (view === "join") return <Shell><JoinScreen onJoin={handleJoinCode} /></Shell>;
  if (view === "admin") return <Shell><AdminPanel onExit={goJoin} /></Shell>;
  if (view === "not-found") {
    return (
      <Shell>
        <div style={{ textAlign: "center", marginTop: "12vh" }}>
          <h1 className="ip-display" style={{ color: COLORS.cream, fontSize: 26, marginBottom: 12 }}>We couldn't find that game</h1>
          <p style={{ color: CREAM_MUTED, marginBottom: 20 }}>Double-check the code or link with your organizer.</p>
          <PrimaryButton onClick={goJoin}>Try another code</PrimaryButton>
        </div>
      </Shell>
    );
  }
  if (view === "player-login") return <Shell background={bg}><PlayerLogin game={activeGame} onPlay={(n, t) => { setPlayerName(n); setPlayerTeam(t); setView("instructions"); }} onBack={goJoin} /></Shell>;
  if (view === "instructions") return <Shell background={bg}><InstructionsScreen game={activeGame} onStart={() => setView("countdown")} /></Shell>;
  if (view === "countdown") {
    return (
      <Shell background={bg}>
        <CountdownScreen game={activeGame} onDone={() => setView("game")} onShowInstructions={() => setShowInstructionsOverlay(true)} />
        {showInstructionsOverlay && <InstructionsOverlay game={activeGame} onClose={() => setShowInstructionsOverlay(false)} />}
      </Shell>
    );
  }
  if (view === "game") return <Shell background={bg}><GameBoard game={activeGame} playerName={playerName} team={playerTeam} onExit={goJoin} /></Shell>;
  return null;
}
