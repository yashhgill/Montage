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

// ─────────────────────────────────────────────────────────────
// HOSTED VIDEOS
// To add videos to a service, upload them to Emergent (drag-drop into the chat)
// and paste the returned public URL into the `videos` array of the matching service.
// The same applies for galleryVideos below.
// ─────────────────────────────────────────────────────────────

export const heroSlides = [
  "https://lh3.googleusercontent.com/d/1h-RMATR8EAVrFYK3LRiakW21TaPHcJzB",
  "https://lh3.googleusercontent.com/d/1cIT13xNVEXSNtM3a72agesX8P1vcl5SA",
  "https://lh3.googleusercontent.com/d/15JXAFpBuX32AOo_aeWWG1a6CV5YQ2FJr",
  "https://lh3.googleusercontent.com/d/1wgkkEOvsQ0I-iYgvX6yffn3TsqX1BoEs",
];

export const services = [
  {
    key: "bar",
    no: "01",
    title: "Bar & Beverages",
    short: "Portable bar, customised cocktails, and mocktails crafted for every crowd.",
    accent: "red",
    subtitle:
      "Portable bar setups with customised cocktails and mocktails crafted for every crowd — from corporate dinners to birthday blowouts.",
    heroBg: "https://lh3.googleusercontent.com/d/1iYJRncYOiZ5xiLCB6IX1dxfRr2TCsnuV=s800",
    photos: [
      "https://lh3.googleusercontent.com/d/1iYJRncYOiZ5xiLCB6IX1dxfRr2TCsnuV=s600",
      "https://lh3.googleusercontent.com/d/1dbVDRHxKrrxkaOpLZqyoYc4HEtH6azE0=s600",
      "https://lh3.googleusercontent.com/d/1B4GpPPxKlDiBWuC7HcBMkr0YQDOhGaSC=s600",
      "https://lh3.googleusercontent.com/d/1PFOgKGh1RDo6pxBt2gafrwdZRgZX7uOR=s600",
      "https://lh3.googleusercontent.com/d/1tlbgWTRqDThDwOSe9phDj8mZLBiqfiFl=s600",
    ].map((src) => ({ src, caption: "Bar in Action" })),
    videos: [
      "https://customer-assets.emergentagent.com/job_occasion-desk/artifacts/7gy9cvuk_VID-20260106-WA0080.mp4",
      "https://customer-assets.emergentagent.com/job_occasion-desk/artifacts/9f50nn8p_VID_20260114_153406_963.mp4",
      "https://customer-assets.emergentagent.com/job_occasion-desk/artifacts/jivg3hy4_VID_20250709_065904_343.mp4",
    ], // Upload bar service videos and paste public URLs here
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
    heroBg: "https://lh3.googleusercontent.com/d/1wgkkEOvsQ0I-iYgvX6yffn3TsqX1BoEs=s800",
    photos: [
      { src: "https://lh3.googleusercontent.com/d/1wgkkEOvsQ0I-iYgvX6yffn3TsqX1BoEs=s600", caption: "Stage Lighting" },
      { src: "https://lh3.googleusercontent.com/d/15-L-mcPPF0MpLnDd5Xv3wyO6hFIMtvkz=s600", caption: "LED Wash Setup" },
      { src: "https://lh3.googleusercontent.com/d/1ilkumGGeY3JbGAOzSwVEUNf4nmv13uqB=s600", caption: "Live Sound Setup" },
    ],
    videos: [],
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
    heroBg: "https://lh3.googleusercontent.com/d/19OlZJ5aaHsfA1dCiRdPXjZbP74gQpMAc=s800",
    photos: [
      { src: "https://lh3.googleusercontent.com/d/19OlZJ5aaHsfA1dCiRdPXjZbP74gQpMAc=s600", caption: "360° Camera Platform" },
      { src: "https://lh3.googleusercontent.com/d/111mUih_vt35f2wpYp-yEumSwYaKvPnym=s600", caption: "Classic Photobooth" },
      { src: "https://lh3.googleusercontent.com/d/1UhymksIz19pCDLTK2C9-f1FvB1r0S-kP=s600", caption: "Guests in Action" },
      { src: "https://lh3.googleusercontent.com/d/1mYKtyu1sQV3LrWUJeKilX8CcRvtyyX61=s600", caption: "Photo Moment" },
    ],
    videos: [],
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
    heroBg: "https://lh3.googleusercontent.com/d/1Vco4uBSaVIVqRtpEzN3DmXUkVt2gy_pQ=s800",
    photos: [
      { src: "https://lh3.googleusercontent.com/d/1Vco4uBSaVIVqRtpEzN3DmXUkVt2gy_pQ=s600", caption: "Event Coverage" },
      { src: "https://lh3.googleusercontent.com/d/1otKHB7wvKdz1sHg6JtFik8ObyhAx7qrU=s600", caption: "Candid Photography" },
      { src: "https://lh3.googleusercontent.com/d/1Sj-Ir-ITMYZhk_EK8Fo1OvasOJ-Quqjg=s600", caption: "Stage Coverage" },
      { src: "https://lh3.googleusercontent.com/d/1lOzOXImTKaxyai58FUg6AnbDEEOYJlrB=s600", caption: "Cinematic Highlight" },
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
    heroBg: "https://lh3.googleusercontent.com/d/1mfiejDVkkmmSEHAq9UeaXwpBdBQnJm-H=s800",
    photos: [
      { src: "https://lh3.googleusercontent.com/d/1mfiejDVkkmmSEHAq9UeaXwpBdBQnJm-H=s600", caption: "Arcade Cabinets" },
      { src: "https://lh3.googleusercontent.com/d/1MB5S9gTIdb5VUYchcDaOl9yqd5cfdoeB=s600", caption: "Game Zone Layout" },
      { src: "https://lh3.googleusercontent.com/d/1_CeEy62rnOSEtVWpaZluj0PTUZZZDC3S=s600", caption: "Racing Simulator" },
      { src: "https://lh3.googleusercontent.com/d/1Q6nyJ7hWYtljKClUgZCBScuvO2JJd0He=s600", caption: "Claw Machine" },
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
    heroBg: "https://lh3.googleusercontent.com/d/1SnFMVId0ij8CJt0QFeL5Ml-emjF9E5EU=s800",
    photos: [
      { src: "https://lh3.googleusercontent.com/d/1mwdvf8Ei9MZdZz8NjIPICEV4VikpiiHm=s600", caption: "Family Entertainment" },
      { src: "https://lh3.googleusercontent.com/d/1690kKPjwwx9iMQYWcILxG3--B11ppVx5=s600", caption: "Carnival Activities" },
      { src: "https://lh3.googleusercontent.com/d/1aXWGZ-4PzIND26maIpp-L2PSYQYpMbo5=s600", caption: "Entertainer Moment" },
      { src: "https://lh3.googleusercontent.com/d/1jCKJyGENDWYrvGqdS44uoRdeZHswPty7=s600", caption: "Mascot Entertainment" },
      { src: "https://lh3.googleusercontent.com/d/1E8F2hJzTewAOXLJ3drKP_6BAJEveuWa5=s600", caption: "Live Character" },
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
    heroBg: "https://lh3.googleusercontent.com/d/14Dpt9L0JRO5zNLxF8OYUbSLmCOEs4kKp=s800",
    photos: [
      { src: "https://lh3.googleusercontent.com/d/1q3zCT1m9-VE2t_VR--eoxhG-OEjd6rTb=s600", caption: "Event Coordination" },
      { src: "https://lh3.googleusercontent.com/d/1j2z4YiDMQvw9WtQsq2zqUTM9cw5ecPs-=s600", caption: "Setup Day" },
      { src: "https://lh3.googleusercontent.com/d/14Dpt9L0JRO5zNLxF8OYUbSLmCOEs4kKp=s600", caption: "Full Event Package" },
      { src: "https://lh3.googleusercontent.com/d/1erkjTEnoit4l12XsFJHVtE6Bt05z8GCw=s600", caption: "Guest Experience" },
      { src: "https://lh3.googleusercontent.com/d/1JdleRHUZNn1PtMkqlGYV6_Af3of58aKr=s600", caption: "Event Flow" },
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

// Experience zone — 6 cards in a 3-column bento for a perfect fit.
export const experience = [
  { src: "https://lh3.googleusercontent.com/d/1mfiejDVkkmmSEHAq9UeaXwpBdBQnJm-H=s800", title: "Arcade Games", caption: "Retro competition and easy crowd energy.", large: true },
  { src: "https://lh3.googleusercontent.com/d/111mUih_vt35f2wpYp-yEumSwYaKvPnym=s600", title: "Photobooth", caption: "Instant keepsakes for every table." },
  { src: "https://lh3.googleusercontent.com/d/1_CeEy62rnOSEtVWpaZluj0PTUZZZDC3S=s600", title: "Racing Simulator", caption: "Fast laps for competitive guests." },
  { src: "https://lh3.googleusercontent.com/d/1iYJRncYOiZ5xiLCB6IX1dxfRr2TCsnuV=s600", title: "Portable Bar Setup", caption: "Bartenders, cocktails, and beverage stations." },
  { src: "https://lh3.googleusercontent.com/d/1SnFMVId0ij8CJt0QFeL5Ml-emjF9E5EU=s600", title: "Kids Entertainment", caption: "Clowns, magicians, mascots, and inflatables." },
  { src: "https://lh3.googleusercontent.com/d/1MB5S9gTIdb5VUYchcDaOl9yqd5cfdoeB=s600", title: "Full Game Zone", caption: "A play area between music moments." },
];

// Gallery videos — paste public URLs after uploading. Empty array hides the video row.
export const galleryVideos = [];

export const galleryPhotos = [
  "1otKHB7wvKdz1sHg6JtFik8ObyhAx7qrU",
  "1Vco4uBSaVIVqRtpEzN3DmXUkVt2gy_pQ",
  "1SnFMVId0ij8CJt0QFeL5Ml-emjF9E5EU",
  "10FLpaWsWTirmZVigoqdKfqjC7SEXp8Nj",
  "1ffYENMXcxfVHAsnc5gDco2unykovsy9d",
  "1FT_9PzwH6wNyiHMgvbdk_SqtvGMhdCQ_",
  "10_fwus6NUeHLA2inh4D1lNwp9eVM1N88",
  "1WqAn8HJlWL_j7tKVE5PiN2Bq9AT9KtNs",
  "131R0oyyIFSou5g1VR-R4Hd6upOpBuyKj",
  "10Ai24zQaYffiG9Anb54YDEXS2DSxNX2v",
  "1Sj-Ir-ITMYZhk_EK8Fo1OvasOJ-Quqjg",
  "1VxyRczcackYVY1-iZAQSU3zpXv61Lzzk",
  "15JXAFpBuX32AOo_aeWWG1a6CV5YQ2FJr",
  "13-b3wuZhxN632zZK9Pwezhtdxo234BLw",
  "1ATHnyQNnGTfTaWb5pedXdI2m8h1EmqAH",
  "1_nlo4i0AEADAPAxUO-3v4RytsVKpWLKl",
  "1BovI5ru05KLhyE-996Tjn8EqNUIpiSKj",
  "1DtWaeHjWOTVcMq27C442QIKrISWwXZfw",
  "1LQujQOpF3udWpRAIEpl5JmXYa0LreBa7",
  "1iuusqVyVDWKDCsChZbrYQdVnR5sN6fuO",
  "1lOzOXImTKaxyai58FUg6AnbDEEOYJlrB",
  "1LkTyDr9RTLV_vTsu1rJx1q--lgBxhFe-",
  "1YV8gNqkmqrJ5yAahj0WHBU1RjqiW9g0j",
  "1gppmbkiH9WRnS1l7gbi4t8V-JMZNgUhX",
  "1PN1cHdKTS8KIz9yXH0n9OBGlMHFu3SWs",
  "1BqhfYwAT5SbGnwpGKYIhDf-gSKbid1RQ",
].map((id) => `https://lh3.googleusercontent.com/d/${id}=s600`);

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
