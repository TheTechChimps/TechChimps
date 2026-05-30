import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outDir = path.join(root, "social-assets", "instagram-simple-1080");
const picturesDir = "C:\\Users\\Emulation Station\\Pictures\\TechChimps Instagram SIMPLE 1080";
const logoPath = path.join(root, "public", "images", "techchimps-banana-logo.svg");

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(picturesDir, { recursive: true });

await Promise.all(
  [outDir, picturesDir].map(async (dir) => {
    const files = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(
      files.filter((file) => file.isFile()).map((file) => fs.rm(path.join(dir, file.name), { force: true })),
    );
  }),
);

const logoSvg = await fs.readFile(logoPath, "utf8");
const logoData = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;
const font = "Arial, Helvetica, sans-serif";

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text(lines, y, size, weight, fill, gap = Math.round(size * 1.16)) {
  return lines
    .map(
      (line, index) =>
        `<text x="540" y="${y + index * gap}" text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`,
    )
    .join("");
}

function postSvg({ title, sub = [], price, accent = "#FFE86B", logo = false }) {
  const titleLines = Array.isArray(title) ? title : [title];
  const subLines = Array.isArray(sub) ? sub : [sub];
  const longestTitle = Math.max(...titleLines.map((line) => line.length));
  const titleSize = titleLines.length > 1 ? 112 : longestTitle > 9 ? 104 : 128;
  const titleY = titleLines.length > 1 ? 310 : 370;
  const priceSubY = subLines.length > 2 ? 700 : 745;

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <radialGradient id="bg" cx="18%" cy="10%" r="92%">
        <stop offset="0" stop-color="${accent}" stop-opacity=".95"/>
        <stop offset=".45" stop-color="#23D99B" stop-opacity=".42"/>
        <stop offset="1" stop-color="#070C18" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="pink" cx="100%" cy="100%" r="76%">
        <stop offset="0" stop-color="#FF4FD8" stop-opacity=".42"/>
        <stop offset=".58" stop-color="#3E7BFF" stop-opacity=".24"/>
        <stop offset="1" stop-color="#070C18" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="26" stdDeviation="24" flood-color="#000000" flood-opacity=".35"/>
      </filter>
      <pattern id="dots" width="84" height="84" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,.18)"/>
      </pattern>
    </defs>
    <rect width="1080" height="1080" fill="#070C18"/>
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <rect width="1080" height="1080" fill="url(#pink)"/>
    <rect width="1080" height="1080" fill="url(#dots)" opacity=".34"/>
    <rect x="108" y="108" width="864" height="864" rx="72" fill="rgba(9,15,31,.70)" stroke="rgba(255,255,255,.22)" stroke-width="4" filter="url(#shadow)"/>
    <path d="M95 770 C 250 680 360 700 500 590 C 675 450 790 480 970 365" fill="none" stroke="${accent}" stroke-width="12" opacity=".44"/>

    ${
      logo
        ? `<image href="${logoData}" x="285" y="170" width="510" height="510"/>
           ${text(["TechChimps"], 750, 92, 900, "#ffffff")}
           ${text(["Powered by bananas"], 835, 44, 900, "#FFE86B")}`
        : `${text(titleLines, titleY, titleSize, 900, "#ffffff")}
           ${price ? text([price], 590, 150, 900, "#FFE86B") : ""}
           ${text(subLines, price ? priceSubY : 650, 55, 800, "#EAF3FF", 66)}`
    }

    <text x="540" y="930" text-anchor="middle" font-family="${font}" font-size="38" font-weight="900" fill="#FFE86B">techchimps.com</text>
  </svg>`;
}

const posts = [
  { file: "01-techchimps.png", title: "TechChimps", logo: true },
  { file: "02-websites-from-49.png", title: ["WEBSITES"], price: "From £49", sub: ["Clean sites", "built fast"], accent: "#FFE86B" },
  { file: "03-apps-tools.png", title: ["APPS", "& TOOLS"], sub: ["Dashboards", "portals", "desktop tools"], accent: "#22E89B" },
  { file: "04-discord-bots.png", title: ["DISCORD", "BOTS"], price: "From £99", sub: ["Setup", "commands", "automation"], accent: "#8B6BFF" },
  { file: "05-automation.png", title: "AUTOMATION", sub: ["Save time", "remove repeat work"], accent: "#00C2FF" },
  { file: "06-support.png", title: "SUPPORT", sub: ["Care plans", "fixes", "priority help"], accent: "#FF4FD8" },
  { file: "07-custom-builds.png", title: ["CUSTOM", "BUILDS"], sub: ["No request", "too big or small"], accent: "#F5A623" },
  { file: "08-fast-delivery.png", title: ["FAST", "DELIVERY"], sub: ["Clear price", "simple plan"], accent: "#2EE0A1" },
  { file: "09-message-us.png", title: ["MESSAGE", "US"], sub: ["Tell us", "the dream product"], accent: "#FFE86B" },
];

const previewLayers = [];

for (const [index, post] of posts.entries()) {
  const buffer = await sharp(Buffer.from(postSvg(post))).png().toBuffer();
  await fs.writeFile(path.join(outDir, post.file), buffer);
  await fs.writeFile(path.join(picturesDir, post.file), buffer);

  const previewBuffer = await sharp(buffer).resize(720, 720).png().toBuffer();
  const temp = path.join(outDir, `.preview-${index}.png`);
  await fs.writeFile(temp, previewBuffer);
  previewLayers.push({
    input: temp,
    left: (index % 3) * 720,
    top: Math.floor(index / 3) * 720,
  });
}

const preview = await sharp({
  create: {
    width: 2160,
    height: 2160,
    channels: 4,
    background: "#070C18",
  },
})
  .composite(previewLayers)
  .png()
  .toBuffer();

await fs.writeFile(path.join(outDir, "00-preview.png"), preview);
await fs.writeFile(path.join(picturesDir, "00-preview.png"), preview);
await Promise.all(previewLayers.map((layer) => fs.rm(layer.input, { force: true })));

const caption = `TechChimps builds websites, apps, Discord bots, desktop tools and automation.

Affordable builds. Clear pricing. Powered by bananas.

techchimps.com

#TechChimps #PoweredByBananas #WebDesignUK #DiscordBots #Automation`;

await fs.writeFile(path.join(outDir, "caption.txt"), caption);
await fs.writeFile(path.join(picturesDir, "caption.txt"), caption);

console.log(JSON.stringify({ outDir, picturesDir }, null, 2));
