import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outRoot = path.join(root, "social-assets");
const outDir = path.join(outRoot, "instagram-final-posts");
const picturesDir = "C:\\Users\\Emulation Station\\Pictures\\TechChimps Instagram FINAL Posts";
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

function textLines(lines, x, y, size, weight, color, gap, anchor = "start") {
  return lines
    .map((line, index) => {
      const textX = anchor === "middle" ? 540 : x;
      return `<text x="${textX}" y="${y + index * gap}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(line)}</text>`;
    })
    .join("");
}

function postSvg({
  title,
  kicker,
  body,
  accent,
  accent2 = "#28E39F",
  footer = "techchimps.com",
  logo = false,
  price = false,
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <radialGradient id="glowA" cx="18%" cy="12%" r="88%">
        <stop offset="0" stop-color="${accent}" stop-opacity=".98"/>
        <stop offset=".44" stop-color="${accent2}" stop-opacity=".52"/>
        <stop offset="1" stop-color="#080D1B" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowB" cx="105%" cy="90%" r="76%">
        <stop offset="0" stop-color="#FF4FD8" stop-opacity=".55"/>
        <stop offset=".58" stop-color="#3E7BFF" stop-opacity=".28"/>
        <stop offset="1" stop-color="#080D1B" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="rgba(255,255,255,.20)"/>
        <stop offset="1" stop-color="rgba(255,255,255,.07)"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="34" stdDeviation="34" flood-color="#000000" flood-opacity=".42"/>
      </filter>
      <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="20" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <pattern id="dots" width="78" height="78" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="3" fill="rgba(255,255,255,.18)"/>
      </pattern>
    </defs>
    <rect width="1080" height="1080" fill="#080D1B"/>
    <rect width="1080" height="1080" fill="url(#glowA)"/>
    <rect width="1080" height="1080" fill="url(#glowB)"/>
    <rect width="1080" height="1080" fill="url(#dots)" opacity=".42"/>
    <path d="M-110 930 C 190 735 380 830 580 635 C 790 430 940 500 1190 320" fill="none" stroke="${accent}" stroke-width="15" opacity=".38"/>
    <path d="M-130 160 C 170 370 390 265 600 435 C 805 600 945 515 1190 660" fill="none" stroke="${accent2}" stroke-width="10" opacity=".32"/>
    <rect x="70" y="70" width="940" height="940" rx="64" fill="url(#glass)" stroke="rgba(255,255,255,.24)" stroke-width="3" filter="url(#shadow)"/>

    ${
      logo
        ? `<image href="${logoData}" x="250" y="128" width="580" height="580"/>
           <text x="540" y="750" text-anchor="middle" font-family="${font}" font-size="94" font-weight="950" fill="#ffffff">TechChimps</text>
           <text x="540" y="828" text-anchor="middle" font-family="${font}" font-size="42" font-weight="900" fill="#FFE86B">Powered by bananas</text>
           <text x="540" y="905" text-anchor="middle" font-family="${font}" font-size="35" font-weight="800" fill="#EAF3FF">websites • apps • bots • automation</text>`
        : price
          ? `<text x="540" y="245" text-anchor="middle" font-family="${font}" font-size="74" font-weight="950" fill="#ffffff">${esc(kicker)}</text>
             <text x="540" y="395" text-anchor="middle" font-family="${font}" font-size="72" font-weight="930" fill="#ffffff">From</text>
             <text x="540" y="610" text-anchor="middle" font-family="${font}" font-size="205" font-weight="950" fill="#FFE86B" filter="url(#softGlow)">£49</text>
             ${textLines(body, 540, 735, 43, 820, "#EAF3FF", 58, "middle")}`
          : `<rect x="116" y="126" width="280" height="68" rx="34" fill="rgba(8,13,27,.48)" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
             <text x="256" y="171" text-anchor="middle" font-family="${font}" font-size="30" font-weight="900" fill="#FFE86B">${esc(kicker)}</text>
             ${textLines(title, 116, 335, 88, 950, "#ffffff", 96)}
             ${textLines(body, 116, 585, 51, 800, "#EAF3FF", 70)}`
    }

    <rect x="116" y="890" width="848" height="82" rx="41" fill="rgba(8,13,27,.55)" stroke="rgba(255,255,255,.16)" stroke-width="2"/>
    <text x="540" y="943" text-anchor="middle" font-family="${font}" font-size="36" font-weight="950" fill="#FFE86B">${esc(footer)}</text>
  </svg>`;
}

// Upload these in this order. Instagram shows newest first, so the final
// visible grid becomes the reverse of this list.
const uploadOrder = [
  {
    file: "01-FIRST-custom-ideas.png",
    kicker: "ANY IDEA",
    title: ["Custom", "builds"],
    body: ["No request too", "big or too small.", "Tell us the dream."],
    accent: "#F5A623",
  },
  {
    file: "02-support-care.png",
    kicker: "SUPPORT",
    title: ["Care", "plans"],
    body: ["Fixes, updates", "and priority help", "when you need it."],
    accent: "#FF4FD8",
  },
  {
    file: "03-automation.png",
    kicker: "AUTOMATION",
    title: ["Save", "hours"],
    body: ["Smart workflows", "for repeat tasks", "and busy teams."],
    accent: "#00C2FF",
  },
  {
    file: "04-discord-bots.png",
    kicker: "DISCORD",
    title: ["Bots", "& servers"],
    body: ["Setup, commands,", "roles, moderation", "and community tools."],
    accent: "#8B6BFF",
  },
  {
    file: "05-apps-tools.png",
    kicker: "SOFTWARE",
    title: ["Apps", "& tools"],
    body: ["Dashboards,", "client portals", "and desktop tools."],
    accent: "#22E89B",
  },
  {
    file: "06-websites.png",
    kicker: "WEBSITES",
    title: ["Clean", "websites"],
    body: ["Landing pages,", "business sites", "and creator hubs."],
    accent: "#FFE86B",
  },
  {
    file: "07-start-here.png",
    kicker: "START HERE",
    title: ["Message", "the idea"],
    body: ["We turn it into", "a clear price", "and simple plan."],
    accent: "#2EE0A1",
  },
  {
    file: "08-from-49.png",
    kicker: "LOW PRICE",
    title: "From",
    body: ["Real builds.", "Clear pricing.", "No jargon."],
    accent: "#FFE86B",
    price: true,
  },
  {
    file: "09-LAST-techchimps-main.png",
    kicker: "TECHCHIMPS",
    title: ["TechChimps"],
    body: [],
    accent: "#FFE86B",
    logo: true,
  },
];

const previewOrder = [...uploadOrder].reverse();
const previewLayers = [];

for (const item of uploadOrder) {
  const buffer = await sharp(Buffer.from(postSvg(item))).png().toBuffer();
  await fs.writeFile(path.join(outDir, item.file), buffer);
  await fs.writeFile(path.join(picturesDir, item.file), buffer);
}

for (const [index, item] of previewOrder.entries()) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const buffer = await sharp(Buffer.from(postSvg(item))).resize(720, 720).png().toBuffer();
  const tempPath = path.join(outDir, `.preview-${index}.png`);
  await fs.writeFile(tempPath, buffer);
  previewLayers.push({ input: tempPath, top: row * 720, left: col * 720 });
}

const preview = await sharp({
  create: {
    width: 2160,
    height: 2160,
    channels: 4,
    background: "#080D1B",
  },
})
  .composite(previewLayers)
  .png()
  .toBuffer();

await fs.writeFile(path.join(outDir, "00-preview-after-uploading-all-9.png"), preview);
await fs.writeFile(path.join(picturesDir, "00-preview-after-uploading-all-9.png"), preview);
await Promise.all(previewLayers.map((layer) => fs.rm(layer.input, { force: true })));

const caption = `TechChimps builds affordable websites, apps, Discord bots, desktop tools and automation for creators and small businesses.

Powered by bananas.
techchimps.com

#TechChimps #PoweredByBananas #WebDesignUK #SmallBusinessUK #DiscordBots #Automation #WebApps`;

const readme = `Use this folder for the final Instagram posts.

Upload the PNG files in filename order:
01-FIRST-custom-ideas.png
02-support-care.png
03-automation.png
04-discord-bots.png
05-apps-tools.png
06-websites.png
07-start-here.png
08-from-49.png
09-LAST-techchimps-main.png

Instagram shows the newest post first, so after all 9 are uploaded the profile grid will look like 00-preview-after-uploading-all-9.png.
`;

await fs.writeFile(path.join(outDir, "caption.txt"), caption);
await fs.writeFile(path.join(picturesDir, "caption.txt"), caption);
await fs.writeFile(path.join(outDir, "README.txt"), readme);
await fs.writeFile(path.join(picturesDir, "README.txt"), readme);

console.log(JSON.stringify({ outDir, picturesDir }, null, 2));
