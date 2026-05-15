// Montage Events — all content in one place
export const PHONE = "60133446521";
export const PHONE_DISPLAY = "+60 13-344 6521";
export const EMAIL = "montage.eventmanagement@gmail.com";
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
    heroBg: `${R2}/Bar%20%26%20Beverages/photo_6316472874990421557_y.jpg`,
    photos: [
      { src: `${R2}/Bar%20%26%20Beverages/photo_6316472874990421557_y.jpg`, caption: "Bar Setup" },
      { src: `${R2}/Bar%20%26%20Beverages/photo_6316472874990421486_y.jpg`, caption: "Cocktail Station" },
      { src: `${R2}/Bar%20%26%20Beverages/photo_6316472874990421563_y.jpg`, caption: "Bar in Action" },
      { src: `${R2}/Bar%20%26%20Beverages/photo_6332483980497719287_y.jpg`, caption: "Beverages" },
      { src: `${R2}/Bar%20%26%20Beverages/photo_6332575974402231900_y.jpg`, caption: "Mocktail Bar" },
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
      { src: `${R2}/Sound%20%26%20Lighting/photo_6330141780212388564_y.jpg`, caption: "Stage Lighting" },
      { src: `${R2}/Sound%20%26%20Lighting/photo_6332483980497719298_y.jpg`, caption: "LED Wash Setup" },
      { src: `${R2}/Sound%20%26%20Lighting/photo_6332483980497719307_y.jpg`, caption: "Live Sound Setup" },
    ],
    videos: [
      `${R2}/Sound%20%26%20Lighting/document_6332483980037726243.mp4`,
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
      { src: `${R2}/360%20Photobooth/photo_6316472874990421437_y.jpg`, caption: "360° Camera Platform" },
      { src: `${R2}/360%20Photobooth/photo_6316472874990421466_y.jpg`, caption: "360° Camera Platform" },
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
    heroBg: `${R2}/Event%20Vibes/TVA_7534.jpg`,
    photos: [
      { src: `${R2}/Event%20Vibes/TVA_7534.jpg`, caption: "Event Coverage" },
      { src: `${R2}/Event%20Vibes/TVA_7559.jpg`, caption: "Candid Photography" },
      { src: `${R2}/Event%20Vibes/TVA_7560.jpg`, caption: "Stage Coverage" },
      { src: `${R2}/Event%20Vibes/TVA_7582.jpg`, caption: "Cinematic Highlight" },
    ],
    videos: [],
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
      { src: `${R2}/Entertainers/photo_6082628024735481028_y.jpg`, caption: "Family Entertainment" },
      { src: `${R2}/Entertainers/photo_6321049192712835034_w.jpg`, caption: "Carnival Activities" },
      { src: `${R2}/Entertainers/photo_6321279321351762844_y.jpg`, caption: "Entertainer Moment" },
      { src: `${R2}/Entertainers/photo_6321279321351762848_y.jpg`, caption: "Mascot Entertainment" },
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
  `${R2}/Event%20Vibes/IMG_2924.MP4`,
  `${R2}/Event%20Vibes/IMG_3625.MP4`,
  `${R2}/Event%20Vibes/document_6332483980037726236.mp4`,
  `${R2}/Event%20Vibes/document_6332483980037726237.mp4`,
  `${R2}/Event%20Vibes/document_6332483980037726241.mp4`,
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
// CLIENT LOGOS — will be updated with R2 URLs once logos are uploaded
// ─────────────────────────────────────────────────────────────
export const clientLogos = [
  { name: "DoubleTree by Hilton KL", id: "1pjpkjKbNNHWylijVFxEumoy8anKh27vH" },
  { name: "DoubleTree Penang", id: "1gczj26wcJXwDAyW4PM4HQaJ7-xv3azUs" },
  { name: "DoubleTree Melaka", id: "1vwiymwmX0UI8_QQH7D_Y2_eEDXEIg1Hf" },
  { name: "Petaling Jaya Hilton", id: "1GNIZ3BIk9tPz4kG0c0fEqVtkjtit3fHZ" },
  { name: "Sheraton Petaling Jaya", id: "15VHvcEnIVJ2J3rngQemsWvolYd1v347o" },
  { name: "W Hotel Kuala Lumpur", id: "12GieLwGVm2my6TbQINlQY-8qH8N29bJW" },
  { name: "InterContinental KL", id: "17qZzL1l06gi9MQdYArczNNq6tLZrU4Is" },
  { name: "Four Seasons KL", id: "11FVrEoMVr-VR61TJ2Atzhpu6cscPemug" },
  { name: "Pavilion Hotel KL", id: "1tQMuwiaDJ-Hy4pxYs_vQlqhYIyJZ-Zqy" },
  { name: "Sofitel Damansara", id: "1EuvgYunoFL7uAMT_6jhEESJ_TLS74BzL" },
  { name: "Putrajaya Marriott", id: "1WDMo1mRLeJF3n6FnCrnC0m6YwgTeWB8h" },
  { name: "Triangle Worldwide", id: "1qJj-up4-RP4aBjqdf2XxBQSwb6Yr1HwX" },
  { name: "World Asia Group", id: "1NHzB3beQ7mjlefsfvCVOCvNwUdSUDoPl" },
  { name: "Haskell Company", id: "1m0ri4Aq0oIhD8JsLRUZrw4YO0rGgZalS" },
  { name: "Stella Maris", id: "1RkeqQrmz3rF1w70YKF6Ri2Tv9Mr627Jp" },
  { name: "IJM", id: "1A7ptGdXVAdMiAMlvOlIXyHNiQQI2TRvm" },
  { name: "IGT Solutions", id: "1A74hhgJErL2LryjeoNG3aXNk4He1FtN7" },
  { name: "Turkish Cargo", id: "19aY2NV-bGeGtQVNJndel3v6HG01e-auR" },
  { name: "Emperor Group", id: "1faluD6jtGijPjfk-uJYAQUOH38QoDM-v" },
  { name: "BSV Malaysia", id: "1IQjBEOizwp1aAO5o2L8K5ixIM2hFnY1L" },
  { name: "Ericsson Malaysia", id: "1kbNzNXNWrx_yT4g0ydfwV7DIHCUVEHje" },
  { name: "UMW Toyota", id: "1N_7F7P7q1lTPvf43wUoK_kEiC3_Nqy0W" },
  { name: "Kota Permai Golf", id: "16o5o5GIJNqD4pdCgSOKPujyGCu_VBJOP" },
  { name: "Mazda Malaysia", id: "1S9fZk-3W970ZsIHLGNI1GZDFqqXTgj0R" },
  { name: "Sentosa Medical", id: "1Mvr2YBjUlrYiCtkIn34cHrLidnZlh9RF" },
  { name: "Krohne Malaysia", id: "12O-qUSoo9JRGieqCoPN_Y9MDJFY5F2EY" },
  { name: "Shell Malaysia", id: "1H4AAT80WvWD5sFMTza9YwT9S8XWu3ZZJ" },
  { name: "Sailajah Group", id: "1yfcVBY9vEpE5qXMnXbeWjB0Tds0jW2Xj" },
].map((c) => ({ ...c, url: `https://lh3.googleusercontent.com/d/${c.id}=s400` }));

export const eventTypes = [
  "Corporate Event",
  "Wedding Event",
  "Birthday Party",
  "Private Celebration",
  "Team Building",
  "Other",
];