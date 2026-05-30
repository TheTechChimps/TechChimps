import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outRoot = path.join(root, "social-assets");
const gridDir = path.join(outRoot, "instagram-grid");
const facebookDir = path.join(outRoot, "facebook");
const logoPath = path.join(root, "public", "images", "techchimps-banana-logo.svg");

await fs.mkdir(gridDir, { recursive: true });
await fs.mkdir(facebookDir, { recursive: true });

const logoSvg = await fs.readFile(logoPath, "utf8");
const logoData = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

const font = "Inter, Arial, Helvetica, sans-serif";

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pill(x, y, w, text, fill, stroke = "rgba(255,255,255,.28)") {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="132" rx="66" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <text x="${x + w / 2}" y="${y + 84}" text-anchor="middle" font-family="${font}" font-size="48" font-weight="850" fill="#ffffff">${esc(text)}</text>
    </g>`;
}

function serviceCard(x, y, title, lines, accent) {
  const lineMarkup = lines
    .map((line, index) => `<text x="${x + 72}" y="${y + 202 + index * 54}" font-family="${font}" font-size="36" font-weight="650" fill="#DCE8FF">${esc(line)}</text>`)
    .join("");

  return `
    <g filter="url(#cardShadow)">
      <rect x="${x}" y="${y}" width="820" height="350" rx="64" fill="rgba(13,18,31,.78)" stroke="rgba(255,255,255,.16)" stroke-width="4"/>
      <circle cx="${x + 92}" cy="${y + 92}" r="42" fill="${accent}"/>
      <text x="${x + 158}" y="${y + 106}" font-family="${font}" font-size="58" font-weight="900" fill="#ffffff">${esc(title)}</text>
      ${lineMarkup}
    </g>`;
}

function bigPosterSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="3240" height="3240" viewBox="0 0 3240 3240">
    <defs>
      <radialGradient id="glowYellow" cx="50%" cy="18%" r="72%">
        <stop offset="0" stop-color="#FFE86B" stop-opacity=".95"/>
        <stop offset=".42" stop-color="#2EE0A1" stop-opacity=".55"/>
        <stop offset="1" stop-color="#09101F" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowPink" cx="94%" cy="22%" r="54%">
        <stop offset="0" stop-color="#FF4FD8" stop-opacity=".66"/>
        <stop offset=".56" stop-color="#3E7BFF" stop-opacity=".24"/>
        <stop offset="1" stop-color="#09101F" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowBlue" cx="8%" cy="82%" r="62%">
        <stop offset="0" stop-color="#00C2FF" stop-opacity=".62"/>
        <stop offset=".56" stop-color="#22E89B" stop-opacity=".24"/>
        <stop offset="1" stop-color="#09101F" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="banana" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#FFE86B"/>
        <stop offset="1" stop-color="#F5A623"/>
      </linearGradient>
      <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="38" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.9 0 1 0 0 0.7 0 0 1 0 0.2 0 0 0 .75 0"/>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="36" stdDeviation="30" flood-color="#000000" flood-opacity=".32"/>
      </filter>
      <pattern id="dots" width="120" height="120" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,.18)"/>
      </pattern>
    </defs>
    <rect width="3240" height="3240" fill="#090F1F"/>
    <rect width="3240" height="3240" fill="url(#glowYellow)"/>
    <rect width="3240" height="3240" fill="url(#glowPink)"/>
    <rect width="3240" height="3240" fill="url(#glowBlue)"/>
    <rect width="3240" height="3240" fill="url(#dots)" opacity=".45"/>

    <path d="M-160 3140 C 680 2590 1170 2800 1750 2300 C 2330 1800 2720 1860 3390 1460" fill="none" stroke="#22E89B" stroke-width="16" opacity=".42"/>
    <path d="M-220 2880 C 660 2340 1160 2540 1710 2070 C 2290 1560 2790 1650 3420 1240" fill="none" stroke="#FFE86B" stroke-width="10" opacity=".45"/>
    <path d="M-160 430 C 640 960 1160 700 1680 1120 C 2250 1580 2760 1370 3420 1760" fill="none" stroke="#FF4FD8" stroke-width="12" opacity=".35"/>

    <g transform="translate(190 170)">
      <image href="${logoData}" x="0" y="0" width="420" height="420"/>
      <text x="500" y="160" font-family="${font}" font-size="118" font-weight="950" fill="#ffffff" letter-spacing="0">TechChimps</text>
      <text x="504" y="252" font-family="${font}" font-size="54" font-weight="800" fill="#FFE86B">Powered by bananas</text>
    </g>

    <text x="1620" y="880" text-anchor="middle" font-family="${font}" font-size="196" font-weight="950" fill="#ffffff">Dream tech.</text>
    <text x="1620" y="1080" text-anchor="middle" font-family="${font}" font-size="196" font-weight="950" fill="url(#banana)" filter="url(#softGlow)">Built fast.</text>
    <text x="1620" y="1220" text-anchor="middle" font-family="${font}" font-size="66" font-weight="760" fill="#DDEBFF">Websites, apps, bots and automation for creators and businesses.</text>

    ${pill(390, 1385, 620, "From £49", "rgba(255,232,107,.22)")}
    ${pill(1070, 1385, 520, "Fast plans", "rgba(46,224,161,.20)")}
    ${pill(1650, 1385, 720, "Beginner friendly", "rgba(62,123,255,.22)")}
    ${pill(2430, 1385, 420, "UK studio", "rgba(255,79,216,.18)")}

    ${serviceCard(270, 1705, "Websites", ["Business sites, link hubs", "and landing pages."], "#FFE86B")}
    ${serviceCard(1210, 1705, "Apps", ["Dashboards, portals", "and smart tools."], "#22E89B")}
    ${serviceCard(2150, 1705, "Bots", ["Discord bots, setup", "and community automation."], "#8B6BFF")}
    ${serviceCard(270, 2150, "Automation", ["Turn repeated work", "into one-click systems."], "#00C2FF")}
    ${serviceCard(1210, 2150, "Support", ["Care plans, fixes", "and priority help."], "#FF4FD8")}
    ${serviceCard(2150, 2150, "Custom", ["No request too big", "or too small."], "#F5A623")}

    <g transform="translate(270 2720)">
      <rect x="0" y="0" width="2700" height="320" rx="86" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.20)" stroke-width="4"/>
      <text x="1350" y="125" text-anchor="middle" font-family="${font}" font-size="72" font-weight="900" fill="#ffffff">Tell us the dream product.</text>
      <text x="1350" y="220" text-anchor="middle" font-family="${font}" font-size="52" font-weight="760" fill="#DDEBFF">We price it clearly, plan it simply, and build it beautifully.</text>
    </g>

    <text x="1620" y="3160" text-anchor="middle" font-family="${font}" font-size="68" font-weight="950" fill="#FFE86B">techchimps.com</text>
  </svg>`;
}

function profileSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <radialGradient id="bg" cx="50%" cy="28%" r="70%">
        <stop offset="0" stop-color="#FFE86B"/>
        <stop offset=".55" stop-color="#22E89B"/>
        <stop offset="1" stop-color="#090F1F"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#000000" flood-opacity=".35"/>
      </filter>
    </defs>
    <rect width="1080" height="1080" rx="220" fill="url(#bg)"/>
    <circle cx="540" cy="480" r="360" fill="rgba(9,15,31,.74)" filter="url(#shadow)"/>
    <image href="${logoData}" x="215" y="150" width="650" height="650"/>
    <text x="540" y="900" text-anchor="middle" font-family="${font}" font-size="86" font-weight="950" fill="#ffffff">TechChimps</text>
    <text x="540" y="972" text-anchor="middle" font-family="${font}" font-size="42" font-weight="850" fill="#FFE86B">Powered by bananas</text>
  </svg>`;
}

function facebookCoverSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1640" height="624" viewBox="0 0 1640 624">
    <defs>
      <radialGradient id="bgA" cx="18%" cy="40%" r="70%">
        <stop offset="0" stop-color="#FFE86B"/>
        <stop offset=".56" stop-color="#22E89B"/>
        <stop offset="1" stop-color="#090F1F"/>
      </radialGradient>
      <radialGradient id="bgB" cx="90%" cy="15%" r="62%">
        <stop offset="0" stop-color="#FF4FD8" stop-opacity=".78"/>
        <stop offset=".6" stop-color="#3E7BFF" stop-opacity=".35"/>
        <stop offset="1" stop-color="#090F1F" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1640" height="624" fill="#090F1F"/>
    <rect width="1640" height="624" fill="url(#bgA)" opacity=".82"/>
    <rect width="1640" height="624" fill="url(#bgB)"/>
    <path d="M-80 570 C 400 260 760 390 1110 160 C 1330 20 1530 60 1720 -50" fill="none" stroke="#FFE86B" stroke-width="10" opacity=".42"/>
    <image href="${logoData}" x="80" y="112" width="400" height="400"/>
    <text x="540" y="230" font-family="${font}" font-size="92" font-weight="950" fill="#ffffff">TechChimps</text>
    <text x="545" y="322" font-family="${font}" font-size="48" font-weight="850" fill="#FFE86B">Powered by bananas</text>
    <text x="545" y="410" font-family="${font}" font-size="42" font-weight="760" fill="#EAF3FF">Affordable websites, apps, bots and automation.</text>
    <text x="545" y="488" font-family="${font}" font-size="44" font-weight="900" fill="#ffffff">techchimps.com</text>
  </svg>`;
}

const posterBuffer = await sharp(Buffer.from(bigPosterSvg())).png().toBuffer();
await sharp(posterBuffer).png().toFile(path.join(gridDir, "techchimps-grid-preview.png"));

const names = [
  ["upload-09-top-left.png", 0, 0],
  ["upload-08-top-middle.png", 1080, 0],
  ["upload-07-top-right.png", 2160, 0],
  ["upload-06-middle-left.png", 0, 1080],
  ["upload-05-middle.png", 1080, 1080],
  ["upload-04-middle-right.png", 2160, 1080],
  ["upload-03-bottom-left.png", 0, 2160],
  ["upload-02-bottom-middle.png", 1080, 2160],
  ["upload-01-bottom-right.png", 2160, 2160],
];

for (const [file, left, top] of names) {
  await sharp(posterBuffer)
    .extract({ left, top, width: 1080, height: 1080 })
    .png()
    .toFile(path.join(gridDir, file));
}

await sharp(Buffer.from(profileSvg())).png().toFile(path.join(outRoot, "techchimps-profile-picture.png"));
await sharp(Buffer.from(facebookCoverSvg())).png().toFile(path.join(facebookDir, "techchimps-facebook-cover.png"));

const caption = `Dream tech. Built fast.

TechChimps builds affordable websites, apps, Discord bots, desktop tools and automation for creators, small businesses and anyone with an idea.

Tell us the dream product. We price it clearly, plan it simply and build it beautifully.

techchimps.com

#TechChimps #PoweredByBananas #WebDesignUK #SmallBusinessUK #DiscordBots #Automation #WebApps`;

await fs.writeFile(path.join(gridDir, "instagram-caption.txt"), caption);

const instructions = `Instagram grid upload order:

Post these nine images in this exact order so the profile grid forms one large image:
1. upload-01-bottom-right.png
2. upload-02-bottom-middle.png
3. upload-03-bottom-left.png
4. upload-04-middle-right.png
5. upload-05-middle.png
6. upload-06-middle-left.png
7. upload-07-top-right.png
8. upload-08-top-middle.png
9. upload-09-top-left.png

Use instagram-caption.txt for each post or a shorter variant.
`;

await fs.writeFile(path.join(gridDir, "README.txt"), instructions);

console.log(JSON.stringify({
  gridDir,
  facebookDir,
  files: [
    "techchimps-grid-preview.png",
    ...names.map(([file]) => file),
    "instagram-caption.txt",
    "README.txt",
    "../techchimps-profile-picture.png",
    "../facebook/techchimps-facebook-cover.png"
  ]
}, null, 2));
