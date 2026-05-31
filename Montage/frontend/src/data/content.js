// Montage Events — all content in one place
export const PHONE = "60133446521";
export const PHONE_DISPLAY = "+60 13-344 6521";
export const EMAIL = "enquiries@montageevents.my";
export const INSTAGRAM = "https://www.instagram.com/montage.event.management";
export const INSTAGRAM_HANDLE = "@montage.event.management";
export const ADDRESS = "No. 15-A, Jalan Panglima Hitam Q 35/Q, Alam Impian, Seksyen 35, 40470 Shah Alam, Selangor";
export const OWNER = "Mr. Jo";

export const waLink = (msg) =>
  `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;

const R2 = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images";

// ─────────────────────────────────────────────────────────────
// HERO SLIDESHOW
// ─────────────────────────────────────────────────────────────
export const heroSlides = [
  `${R2}/Hero/TVA_7542.jpg`,
  `${R2}/Hero/photo_6332483980497719292_y.jpg`,
  `${R2}/Hero/photo_6332483980497719305_y.jpg`,
];

// ─────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────
export const services = [
  {
    key: "bar",
    no: "01",
    title: "Bar & Beverages",
    short: "Portable bar, customised cocktails, and mocktails crafted for every crowd.",
    accent: "red",
    subtitle:
      "Portable bar setups with customised cocktails and mocktails crafted for every crowd — from corporate dinners to birthday blowouts.",
    heroBg: `${R2}/Bar%20%26%20Beverages/photo_6332483980497719287_y.jpg`,
    photos: [
      { src: `${R2}/Bar%20%26%20Beverages/photo_6332483980497719287_y.jpg`, caption: "Bar Setup" },
      { src: `${R2}/Bar%20%26%20Beverages/photo_6316472874990421486_y.jpg`, caption: "Cocktail Station" },
      { src: `${R2}/Bar%20%26%20Beverages/photo_6316472874990421563_y.jpg`, caption: "Bar in Action" },
      { src: `${R2}/Bar%20%26%20Beverages/photo_6316472874990421557_y.jpg`, caption: "Beverages" },
      { src: `${R2}/Bar%20%26%20Beverages/IMG_20260529_232814_986.jpg`, caption: "Beverages" },
      
    ],
    videos: [
      `${R2}/Bar%20%26%20Beverages/VID-20260106-WA0080.mp4`,
      `${R2}/Bar%20%26%20Beverages/VID_20260114_153406_963.mp4`,
      `${R2}/Bar%20%26%20Beverages/VID_20250709_065904_343.mp4`,
    ],
    details: [
      { label: "Bar Type", value: "Portable freestanding bar" },
      { label: "Cocktails", value: "Custom signature menu" },
      { label: "Mocktails", value: "Up to 4–5 varieties" },
      { label: "Best For", value: "Weddings, corporate dinners, private parties" },
    ],
  },
  {
    key: "sound",
    no: "02",
    title: "Sound & Lighting",
    short: "Clear audio, punchy bass, LED washes, moving lights, and neon atmosphere tuned for the crowd.",
    accent: "yellow",
    subtitle:
      "Clear audio, punchy bass, LED washes, moving lights, and neon atmosphere — professional sound and lighting tuned for your crowd.",
    heroBg: `${R2}/Sound%20%26%20Lighting/photo_6332483980497719307_y.jpg`,
    photos: [
      { src: `${R2}/Sound%20%26%20Lighting/photo_6332483980497719307_y.jpg`, caption: "Live Sound Setup" },
      { src: `${R2}/Sound%20%26%20Lighting/photo_6329969337275453838_x.jpg`, caption: "Stage Lighting" },
      { src: `${R2}/Sound%20%26%20Lighting/photo_6329969337275453840_y.jpg`, caption: "LED Wash Setup" },
    ],
    videos: [
      `${R2}/Sound%20%26%20Lighting/document_6064284532490639690.mp4`,
      `${R2}/Sound%20%26%20Lighting/document_6332483980037726245.mp4`,
    ],
    details: [
      { label: "Audio", value: "PA system, subwoofers, monitor speakers" },
      { label: "Lighting", value: "LED wash, moving heads, neon strobes" },
      { label: "DJ", value: "Optional DJ package available" },
      { label: "Best For", value: "All event types" },
    ],
  },
  {
    key: "photo",
    no: "03",
    title: "360° Photobooth",
    short: "360 camera platform with slow-mo videos and instant share links for every guest.",
    accent: "lime",
    subtitle:
      "Guests step on the platform, the arm spins, and walk away with a slow-motion video — instant share links, custom overlays, and classic photobooth prints for every table.",
    heroBg: `${R2}/360%20Photobooth/photo_6316472874990421415_y.jpg`,
    photos: [
      { src: `${R2}/360%20Photobooth/photo_6316472874990421415_y.jpg`, caption: "360° Camera Platform" },
      { src: `${R2}/360%20Photobooth/photo_6316472874990421466_y.jpg`, caption: "360° Camera Platform" },
      { src: `${R2}/360%20Photobooth/photo_6069153969302344036_y.jpg`, caption: "360° Experience" },
      { src: `${R2}/360%20Photobooth/photo_6069153969302344086_y%20(1).jpg`, caption: "360° Moment" },
    ],
    videos: [
      `${R2}/360%20Photobooth/VID-20260318-WA0140.mp4`,
      `${R2}/360%20Photobooth/VID-20260224-WA0146.mp4`,
    ],
    details: [
      { label: "360° Booth", value: "Slow-mo video, instant share link" },
      { label: "Photobooth", value: "Printed strips & digital copies" },
      { label: "Props", value: "Full prop kit included" },
      { label: "Best For", value: "Birthdays, weddings, campus nights" },
    ],
  },
  {
    key: "videography",
    no: "04",
    title: "Video & Photography",
    short: "Professional event videography, highlight reels, and on-the-night photography.",
    accent: "orange",
    subtitle:
      "Professional event coverage — cinematic highlight videos, candid photography, drone shots, and same-day social media edits to make your event live online before guests leave.",
    heroBg: `${R2}/Video%20%26%20Photography/photo_6069153969302344062_y.jpg`,
    photos: [
      { src: `${R2}/Video%20%26%20Photography/photo_6069153969302344062_y.jpg`, caption: "Event Coverage" },
      { src: `${R2}/Video%20%26%20Photography/photo_6069153969302344086_y.jpg`, caption: "Candid Photography" },
      { src: `${R2}/Video%20%26%20Photography/photo_6069153969302344209_y.jpg`, caption: "Stage Coverage" },
    ],
    videos: [
      `${R2}/Video%20%26%20Photography/document_6064284532490639689.mp4`,
    ],
    details: [
      { label: "Videography", value: "Multi-cam coverage, 4K edit" },
      { label: "Photography", value: "Editorial-style stills, fast turnaround" },
      { label: "Drone", value: "Aerial shots available on request" },
      { label: "Best For", value: "Weddings, corporate, brand events" },
    ],
  },
  {
    key: "games",
    no: "05",
    title: "Game Corners",
    short: "Claw machines, arcade games, game stalls, and digital game stalls that keep guests moving.",
    accent: "cyan",
    subtitle:
      "Claw machines, arcade cabinets, physical game stalls, and digital game stalls — a full play area that keeps guests energised between music moments.",
    heroBg: `${R2}/Game%20Corners/photo_6321049192712835026_y.jpg`,
    photos: [
      { src: `${R2}/Game%20Corners/photo_6321049192712835026_y.jpg`, caption: "Game Corner" },
      { src: `${R2}/Game%20Corners/photo_6332483980497719283_y.jpg`, caption: "Racing Simulator" },
      { src: `${R2}/Game%20Corners/photo_6332483980497719285_y.jpg`, caption: "Arcade Games" },
      { src: `${R2}/Game%20Corners/photo_6316472874990421470_y.jpg`, caption: "Inflatable Games" },
    ],
    videos: [],
    details: [
      { label: "Arcade", value: "Classic & modern game cabinets" },
      { label: "Claw Machine", value: "Prize-filled, crowd favourite" },
      { label: "Digital", value: "Touchscreen & VR options" },
      { label: "Best For", value: "Corporate events, campus parties" },
    ],
  },
  {
    key: "entertainers",
    no: "06",
    title: "Entertainers",
    short: "Clowns, magicians, and mascots that bring extra character to any celebration.",
    accent: "blue",
    subtitle:
      "Live entertainment that works the room — clowns, magicians, and mascots bring personality, laughs, and unforgettable moments to any celebration.",
    heroBg: `${R2}/Entertainers/photo_6321049192712835034_w.jpg`,
    photos: [
      { src: `${R2}/Entertainers/photo_6321049192712835034_w.jpg`, caption: "Carnival Activities" },
      { src: `${R2}/Entertainers/photo_6321279321351762848_y.jpg`, caption: "Mascot Entertainment" },
      { src: `${R2}/Entertainers/photo_6329969337275453823_y.jpg`, caption: "Live Entertainment" },
      { src: `${R2}/Entertainers/photo_6329969337275453834_y.jpg`, caption: "Entertainer Moment" },
      { src: `${R2}/Entertainers/photo_6332483980497719266_y.jpg`, caption: "Live Character" },
    ],
    videos: [],
    details: [
      { label: "Clown", value: "Balloon art, face painting, slapstick" },
      { label: "Magician", value: "Close-up & stage magic shows" },
      { label: "Mascot", value: "Custom character suits available" },
      { label: "Best For", value: "Children's parties, family events" },
    ],
  },
  {
    key: "planning",
    no: "07",
    title: "Event Planning",
    short: "Tell Montage the date, crowd size, and theme. They help shape the setup around your event.",
    accent: "pink",
    subtitle:
      "Tell Montage your date, crowd size, and theme. They shape the full setup — from layout and logistics to atmosphere and entertainment — around your vision.",
    heroBg: `${R2}/Event%20Planning/photo_6330141780212388534_y.jpg`,
    photos: [
      { src: `${R2}/Event%20Planning/photo_6330141780212388534_y.jpg`, caption: "Event Coordination" },
      { src: `${R2}/Event%20Planning/photo_6330141780212388544_y.jpg`, caption: "Setup Day" },
      { src: `${R2}/Event%20Planning/photo_6332483980497719292_y.jpg`, caption: "Full Event Package" },
      { src: `${R2}/Event%20Planning/photo_6332483980497719293_y.jpg`, caption: "Guest Experience" },
    ],
    videos: [],
    details: [
      { label: "Consultation", value: "Free WhatsApp planning session" },
      { label: "Setup", value: "Full crew on event day" },
      { label: "Packages", value: "Modular — pick what you need" },
      { label: "Best For", value: "Any event, any size" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// EXPERIENCE ZONE (bento grid on homepage)
// ─────────────────────────────────────────────────────────────
export const experience = [
  { src: `${R2}/Experience%20Zone/ArcadeGame.jpg`, title: "Arcade Games", caption: "Retro competition and easy crowd energy.", large: true },
  { src: `${R2}/Experience%20Zone/360%20Photobooth.jpg`, title: "Photobooth", caption: "Instant keepsakes for every table." },
  { src: `${R2}/Experience%20Zone/Racing%20Simulator.jpg`, title: "Racing Simulator", caption: "Fast laps for competitive guests." },
  { src: `${R2}/Experience%20Zone/Portable%20Bar%20Setup.jpg`, title: "Portable Bar Setup", caption: "Bartenders, cocktails, and beverage stations." },
  { src: `${R2}/Experience%20Zone/Claw%20Machine.jpg`, title: "Kids Entertainment", caption: "Clowns, magicians, mascots, and inflatables." },
  { src: `${R2}/Game%20Corners/photo_6332483980497719285_y.jpg`, title: "Full Game Zone", caption: "A play area between music moments." },
];

// ─────────────────────────────────────────────────────────────
// GALLERY
// ─────────────────────────────────────────────────────────────
export const galleryVideos = [
  {
    src: `${R2}/Event%20Vibes/IMG_2924.MP4`,
    poster: `${R2}/Event%20Vibes/TVA_7534.jpg`,
  },
  {
    src: `${R2}/Event%20Vibes/IMG_3625.MP4`,
    poster: `${R2}/Event%20Vibes/TVA_7559.jpg`,
  },
  {
    src: `${R2}/Event%20Vibes/document_6332483980037726236.mp4`,
    poster: `${R2}/Event%20Vibes/TVA_7582.jpg`,
  },
  {
    src: `${R2}/Event%20Vibes/document_6332483980037726237.mp4`,
    poster: `${R2}/Event%20Vibes/photo_6332483980497719305_y.jpg`,
  },
  {
    src: `${R2}/Event%20Vibes/document_6332483980037726241.mp4`,
    poster: `${R2}/Event%20Vibes/photo_6330141780212388571_y.jpg`,
  },
];

export const galleryPhotos = [
  `${R2}/Event%20Vibes/TVA_7534.jpg`,
  `${R2}/Event%20Vibes/TVA_7559.jpg`,
  `${R2}/Event%20Vibes/TVA_7560.jpg`,
  `${R2}/Event%20Vibes/TVA_7582.jpg`,
  `${R2}/Event%20Vibes/photo_6332483980497719305_y.jpg`,
  `${R2}/Event%20Vibes/photo_6332483980497719307_y.jpg`,
  `${R2}/Event%20Vibes/photo_6332483980497719293_y.jpg`,
  `${R2}/Event%20Vibes/photo_6332483980497719292_y.jpg`,
  `${R2}/Event%20Vibes/photo_6332483980497719263_y.jpg`,
  `${R2}/Event%20Vibes/photo_6330141780212388571_y.jpg`,
  `${R2}/Event%20Vibes/photo_6330141780212388564_y.jpg`,
  `${R2}/Event%20Vibes/photo_6330141780212388560_y.jpg`,
  `${R2}/Event%20Vibes/photo_6330141780212388548_y.jpg`,
  `${R2}/Event%20Vibes/photo_6330141780212388539_y.jpg`,
  `${R2}/Event%20Vibes/photo_6321279321351762848_y.jpg`,
  `${R2}/Event%20Vibes/photo_6321049192712835004_w.jpg`,
  `${R2}/Event%20Vibes/photo_6316472874990421540_y.jpg`,
  `${R2}/Event%20Vibes/photo_6316472874990421427_y.jpg`,
];

// ─────────────────────────────────────────────────────────────
// CLIENT LOGOS
// ─────────────────────────────────────────────────────────────
const LOGO_BASE = `${R2}/logos`;

export const clientLogos = [
  { name: "DoubleTree by Hilton KL", file: "doubletree.png" },
  { name: "DoubleTree Penang", file: "doubletree-penang.png" },
  { name: "DoubleTree Melaka", file: "doubletree-melaka.png" },
  { name: "Petaling Jaya Hilton", file: "hilton-petaling-jaya.jpg" },
  { name: "Sheraton Petaling Jaya", file: "sheraton-petaling-jaya.png" },
  { name: "W Hotel Kuala Lumpur", file: "w-kuala-lumpur.jpg" },
  { name: "InterContinental KL", file: "intercontinental-kl.png" },
  { name: "Four Seasons KL", file: "four-seasons-kl.png" },
  { name: "Pavilion Hotel KL", file: "pavilion-hotel-kl.png" },
  { name: "Sofitel Damansara", file: "sofitel-damansara.png" },
  { name: "Putrajaya Marriott Hotel", file: "putrajaya-marriott.png" },
  { name: "Triangle Worldwide", file: "triangle-worldwide.png" },
  { name: "World Asia Group", file: "world-asia-group.png" },
  { name: "Haskell Company", file: "haskell.png" },
  { name: "Stella Maris", file: "stella-maris.png" },
  { name: "IJM Company", file: "ijm-company.png" },
  { name: "IGT Solutions", file: "igt-solutions.png" },
  { name: "Turkish Cargo", file: "turkish-cargo.png" },
  { name: "Turkish Airlines", file: "turkish_airlines.png" },
  { name: "Emperor Group", file: "emperor-shipping.jpg" },
  { name: "BSV Malaysia", file: "bsv-malaysia.png" },
  { name: "Ericsson Malaysia", file: "ericsson.jpg" },
  { name: "UMW Toyota", file: "umw-toyota.png" },
  { name: "Kota Permai Golf & Country Club", file: "kota-permai.png" },
  { name: "Mazda Malaysia", file: "mazda-malaysia.png" },
  { name: "Sentosa Medical Centre", file: "sentosa-medical-centre.png" },
  { name: "Krohne Malaysia", file: "krohne-malaysia.png" },
  { name: "Shell Malaysia", file: "shell-malaysia.png" },
  { name: "Sailajah Group", file: "sailajah-group.png" },
].map((c) => ({
  ...c,
  url: c.url || (c.file ? `${LOGO_BASE}/${c.file}` : null),
}));

export const eventTypes = [
  "Corporate Event",
  "Wedding Event",
  "Birthday Party",
  "Private Celebration",
  "Team Building",
  "Other",
];