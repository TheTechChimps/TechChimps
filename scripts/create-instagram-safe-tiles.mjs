import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outRoot = path.join(root, "social-assets");
const outDir = path.join(outRoot, "instagram-safe-upload-order");
const picturesDir = "C:\\Users\\Emulation Station\\Pictures\\TechChimps Instagram Upload Order";
const logoPath = path.join(root, "public", "images", "techchimps-banana-logo.svg");

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(picturesDir, { recursive: true });

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

function lines(text, x, y, size, weight, fill, gap = Math.round(size * 1.28), anchor = "start") {
  return text
    .map((line, index) => {
      const dx = anchor === "middle" ? 540 : x;
      return `<text x="${dx}" y="${y + index * gap}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`;
    })
    .join("");
}

function tileSvg({ number, title, body, accent, secondary = "#22E89B", footer = "techchimps.com", logo = false }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <radialGradient id="glowA" cx="20%" cy="12%" r="92%">
        <stop offset="0" stop-color="${accent}" stop-opacity=".92"/>
        <stop offset=".42" stop-color="${secondary}" stop-opacity=".42"/>
        <stop offset="1" stop-color="#080E1E" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowB" cx="100%" cy="86%" r="78%">
        <stop offset="0" stop-color="#FF4FD8" stop-opacity=".42"/>
        <stop offset=".62" stop-color="#3E7BFF" stop-opacity=".22"/>
        <stop offset="1" stop-color="#080E1E" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="rgba(255,255,255,.16)"/>
        <stop offset="1" stop-color="rgba(255,255,255,.06)"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="30" stdDeviation="28" flood-color="#000000" flood-opacity=".38"/>
      </filter>
      <pattern id="dots" width="76" height="76" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="3.2" fill="rgba(255,255,255,.18)"/>
      </pattern>
    </defs>
    <rect width="1080" height="1080" fill="#080E1E"/>
    <rect width="1080" height="1080" fill="url(#glowA)"/>
    <rect width="1080" height="1080" fill="url(#glowB)"/>
    <rect width="1080" height="1080" fill="url(#dots)" opacity=".45"/>
    <path d="M-90 930 C 170 770 350 830 530 670 C 760 470 890 520 1180 350" fill="none" stroke="${accent}" stroke-width="12" opacity=".42"/>
    <path d="M-90 170 C 200 360 370 270 570 430 C 780 600 930 520 1180 670" fill="none" stroke="${secondary}" stroke-width="8" opacity=".32"/>

    <rect x="72" y="72" width="936" height="936" rx="72" fill="url(#card)" stroke="rgba(255,255,255,.2)" stroke-width="3" filter="url(#shadow)"/>
    <circle cx="154" cy="154" r="48" fill="${accent}"/>
    <text x="154" y="171" text-anchor="middle" font-family="${font}" font-size="42" font-weight="950" fill="#08101E">${esc(number)}</text>

    ${
      logo
        ? `<image href="${logoData}" x="238" y="150" width="604" height="604"/>
           <text x="540" y="760" text-anchor="middle" font-family="${font}" font-size="92" font-weight="950" fill="#ffffff">TechChimps</text>
           <text x="540" y="842" text-anchor="middle" font-family="${font}" font-size="44" font-weight="900" fill="#FFE86B">Powered by bananas</text>`
        : `${lines(title, 116, 292, 86, 950, "#ffffff", 96)}
           ${lines(body, 116, 530, 48, 780, "#EAF3FF", 68)}`
    }

    <rect x="116" y="884" width="848" height="86" rx="43" fill="rgba(8,14,30,.5)" stroke="rgba(255,255,255,.16)" stroke-width="2"/>
    <text x="540" y="940" text-anchor="middle" font-family="${font}" font-size="38" font-weight="900" fill="#FFE86B">${esc(footer)}</text>
  </svg>`;
}

const visualGrid = [
  {
    file: "09-LAST-top-left.png",
    number: "01",
    title: ["Websites"],
    body: ["Landing pages,", "business sites", "and link hubs.", "From £49."],
    accent: "#FFE86B",
  },
  {
    file: "08-eighth-top-middle.png",
    number: "02",
    title: ["Apps"],
    body: ["Web apps,", "dashboards", "and desktop", "tools."],
    accent: "#22E89B",
  },
  {
    file: "07-seventh-top-right.png",
    number: "03",
    title: ["Bots"],
    body: ["Discord bots", "and server", "setup for", "communities."],
    accent: "#8B6BFF",
  },
  {
    file: "06-sixth-middle-left.png",
    number: "04",
    title: ["Automation"],
    body: ["Turn repeat", "tasks into", "simple smart", "systems."],
    accent: "#00C2FF",
  },
  {
    file: "05-fifth-middle.png",
    number: "05",
    title: ["TechChimps"],
    body: [],
    accent: "#FFE86B",
    logo: true,
  },
  {
    file: "04-fourth-middle-right.png",
    number: "06",
    title: ["Support"],
    body: ["Care plans,", "fixes and", "priority help", "when needed."],
    accent: "#FF4FD8",
  },
  {
    file: "03-third-bottom-left.png",
    number: "07",
    title: ["Custom"],
    body: ["Tell us the", "dream product.", "We make it", "clear."],
    accent: "#F5A623",
  },
  {
    file: "02-second-bottom-middle.png",
    number: "08",
    title: ["Simple"],
    body: ["Easy pricing,", "plain English", "and fast", "delivery."],
    accent: "#2EE0A1",
  },
  {
    file: "01-FIRST-bottom-right.png",
    number: "09",
    title: ["Start"],
    body: ["Message us", "today and get", "a clear plan.", "No jargon."],
    accent: "#FFE86B",
  },
];

const uploadOrder = [
  visualGrid[8],
  visualGrid[7],
  visualGrid[6],
  visualGrid[5],
  visualGrid[4],
  visualGrid[3],
  visualGrid[2],
  visualGrid[1],
  visualGrid[0],
];

const previewLayers = [];

for (const [index, tile] of uploadOrder.entries()) {
  const numberedName = `${String(index + 1).padStart(2, "0")}-${index === 0 ? "FIRST" : index === 8 ? "LAST" : "upload"}-${tile.file.replace(/^[0-9]+-[^-]+-?/, "")}`;
  const buffer = await sharp(Buffer.from(tileSvg(tile))).png().toBuffer();
  const outPath = path.join(outDir, numberedName);
  await fs.writeFile(outPath, buffer);
  await fs.writeFile(path.join(picturesDir, numberedName), buffer);
}

for (const [index, tile] of visualGrid.entries()) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const buffer = await sharp(Buffer.from(tileSvg(tile))).resize(720, 720).png().toBuffer();
  const tilePath = path.join(outDir, `.preview-${index}.png`);
  await fs.writeFile(tilePath, buffer);
  previewLayers.push({
    input: tilePath,
    top: row * 720,
    left: col * 720,
  });
}

const preview = await sharp({
  create: {
    width: 2160,
    height: 2160,
    channels: 4,
    background: "#080E1E",
  },
})
  .composite(previewLayers)
  .png()
  .toBuffer();

await fs.writeFile(path.join(outDir, "00-safe-grid-preview.png"), preview);
await fs.writeFile(path.join(picturesDir, "00-safe-grid-preview.png"), preview);

await Promise.all(previewLayers.map((layer) => fs.rm(layer.input, { force: true })));

const caption = `TechChimps builds websites, apps, bots, tech services and automation for creators and small businesses.

Affordable. Clear. Fast. Powered by bananas.

techchimps.com

#TechChimps #PoweredByBananas #WebDesignUK #SmallBusinessUK #DiscordBots #Automation #WebApps`;

await fs.writeFile(path.join(outDir, "caption.txt"), caption);
await fs.writeFile(path.join(picturesDir, "caption.txt"), caption);

console.log(JSON.stringify({ outDir, picturesDir }, null, 2));
