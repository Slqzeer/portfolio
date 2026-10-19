// Author the bitmap surfaces used by the Blender scene, before exporting the room.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("assets/blender/refined/surfaces");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const palettes = {
  day: {
    bg: "#fdfbf6",
    panel: "#f0f0e8",
    bar: "#e9ece2",
    ink: "#263e35",
    muted: "#657269",
    accent: "#39705d",
    keyword: "#89503c",
    string: "#39705d",
    number: "#86642e",
    line: "#d8ddd2",
  },
  night: {
    bg: "#14211d",
    panel: "#1c2c26",
    bar: "#213436",
    ink: "#e7e8dc",
    muted: "#9caea7",
    accent: "#9bc8ae",
    keyword: "#e6b98c",
    string: "#9bc8ae",
    number: "#cfbf91",
    line: "#34483f",
  },
};
const records = {};
try {
  for (const theme of ["day", "night"]) {
    for (const device of [
      "monitor",
      "laptop",
      "phone",
      "notification-0",
      "notification-1",
    ]) {
      const result = await page.evaluate(
        ({ theme, device, p }) => {
          const canvas = document.createElement("canvas");
          const phone = device === "phone";
          const card = device.startsWith("notification");
          canvas.width = phone ? 590 : card ? 520 : 1600;
          canvas.height = phone
            ? 1280
            : card
              ? 160
              : device === "laptop"
                ? 1000
                : 900;
          const ctx = canvas.getContext("2d");
          const rect = (x, y, w, h, c) => {
            ctx.fillStyle = c;
            ctx.fillRect(x, y, w, h);
          };
          const text = (s, x, y, size = 20, c = p.ink, font = "Consolas") => {
            ctx.fillStyle = c;
            ctx.font = `${size}px ${font}, monospace`;
            ctx.fillText(s, x, y);
          };
          const rounded = (x, y, w, h, r, c) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
            ctx.fill();
          };
          rect(0, 0, canvas.width, canvas.height, p.bg);
          if (phone) {
            const g = ctx.createLinearGradient(0, 0, 590, 1280);
            g.addColorStop(0, theme === "day" ? "#dfe7d8" : "#213c32");
            g.addColorStop(1, theme === "day" ? "#f6f4ed" : "#14211d");
            rect(0, 0, 590, 1280, g);
            text("9:41", 36, 55, 25, p.ink, "Segoe UI");
            text("5G  ▰", 474, 55, 22, p.ink, "Segoe UI");
            rounded(215, 25, 160, 38, 19, "#101915");
            ctx.textAlign = "center";
            text("Monday, 19 October", 295, 208, 27, p.muted, "Segoe UI");
            text("09:41", 295, 330, 112, p.ink, "Segoe UI");
            text(
              "A little room to build things.",
              295,
              391,
              22,
              p.muted,
              "Segoe UI",
            );
            rounded(212, 1234, 166, 7, 4, p.ink);
          } else if (card) {
            rect(0, 0, 520, 160, theme === "day" ? "#ffffff" : "#273c32");
            ctx.strokeStyle = p.line;
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, 518, 158);
            rounded(20, 22, 44, 44, 12, p.accent);
            const first = device.endsWith("0");
            text(
              first ? "C" : "G",
              31,
              53,
              26,
              theme === "day" ? "#ffffff" : "#14211d",
              "Segoe UI",
            );
            text(
              first ? "ClassPulse" : "GitHub",
              80,
              48,
              24,
              p.ink,
              "Segoe UI",
            );
            text("now", 447, 46, 18, p.muted, "Segoe UI");
            text(
              first ? "Backend review ready" : "Portfolio update",
              80,
              92,
              23,
              p.ink,
              "Segoe UI",
            );
            text(
              first ? "API checks completed." : "Your latest commit is synced.",
              80,
              126,
              19,
              p.muted,
              "Segoe UI",
            );
          } else {
            const laptop = device === "laptop";
            const extraHeight = canvas.height - 900;
            rect(0, 0, 1600, 42, p.bar);
            text(
              "File   Edit   Selection   View   Go   Run   Terminal",
              24,
              28,
              17,
              p.muted,
            );
            rounded(600, 8, 600, 27, 5, p.panel);
            text(
              "portfolio / " + (laptop ? "room.ts" : "api.py"),
              755,
              27,
              17,
              p.muted,
            );
            rect(0, 42, 58, 824 + extraHeight, p.bar);
            for (let y = 76; y < 360; y += 67) {
              ctx.strokeStyle = y === 76 ? p.accent : p.muted;
              ctx.lineWidth = 2;
              ctx.strokeRect(19, y, 21, 25);
            }
            rect(58, 42, 278, 824 + extraHeight, p.panel);
            text("EXPLORER", 80, 77, 18, p.muted);
            text("⌄ PORTFOLIO", 80, 121, 20);
            const files = [
              "⌄ src",
              "  ⌄ room",
              "    room.ts",
              "    lighting.ts",
              "  ⌄ backend",
              "    api.py",
              "    test_api.py",
              "  App.tsx",
              "package.json",
              "README.md",
            ];
            files.forEach((f, i) => {
              if (i === (laptop ? 2 : 5))
                rect(58, 144 + i * 34, 278, 34, p.bar);
              text(
                f,
                81,
                168 + i * 34,
                20,
                i === (laptop ? 2 : 5) ? p.accent : p.muted,
              );
            });
            rect(336, 42, 1264, 48, p.panel);
            rect(336, 42, 250, 48, p.bg);
            rect(336, 42, 250, 3, p.accent);
            text(laptop ? "TS  room.ts   ×" : "PY  api.py   ×", 360, 74, 21);
            text(laptop ? "lighting.ts" : "test_api.py", 620, 74, 20, p.muted);
            text(
              "src  ›  " + (laptop ? "room  ›  room.ts" : "backend  ›  api.py"),
              365,
              119,
              18,
              p.muted,
            );
            const lines = laptop
              ? [
                  "// A room that follows your theme.",
                  'type Theme = "day" | "night";',
                  "",
                  "export function updateRoom(theme: Theme) {",
                  "  const palettes = {",
                  '    day: { background: "#fdfbf6", ink: "#263e35" },',
                  '    night: { background: "#14211d", ink: "#e7e8dc" },',
                  "  };",
                  "",
                  "  // Keep the editor aligned with the site.",
                  "  return palettes[theme];",
                  "}",
                ]
              : [
                  "from fastapi import FastAPI",
                  "from pydantic import BaseModel",
                  "",
                  'app = FastAPI(title="ClassPulse")',
                  "",
                  "class HealthResponse(BaseModel):",
                  "    status: str",
                  "",
                  '@app.get("/health", response_model=HealthResponse)',
                  "def health() -> HealthResponse:",
                  '    return HealthResponse(status="ok")',
                ];
            const font = 23,
              lineH = 33,
              x = 421,
              top = 164;
            const tokens =
              /("[^"]*"|'[^']*'|\/\/.*|\b(?:from|import|class|def|return|export|function|const|type)\b|\b\d+\b)/g;
            lines.forEach((s, i) => {
              text(String(i + 1), 369, top + i * lineH, 20, p.muted);
              let pos = x,
                last = 0;
              for (const match of s.matchAll(tokens)) {
                const plain = s.slice(last, match.index);
                text(plain, pos, top + i * lineH, font);
                pos += ctx.measureText(plain).width;
                const token = match[0];
                text(
                  token,
                  pos,
                  top + i * lineH,
                  font,
                  token.startsWith("//")
                    ? p.muted
                    : token.startsWith('"') || token.startsWith("'")
                      ? p.string
                      : /^\d/.test(token)
                        ? p.number
                        : p.keyword,
                );
                pos += ctx.measureText(token).width;
                last = match.index + token.length;
              }
              text(s.slice(last), pos, top + i * lineH, font);
            });
            rect(336, 650 + extraHeight, 1264, 2, p.line);
            text(
              "PROBLEMS     OUTPUT     TERMINAL",
              361,
              684 + extraHeight,
              18,
              p.muted,
            );
            rect(647, 694 + extraHeight, 93, 2, p.accent);
            const terminal = laptop
              ? [
                  "$ npm run build",
                  "✓ 596 modules transformed.",
                  "✓ built in 1.28s",
                ]
              : [
                  "$ pytest src/backend/test_api.py -q",
                  ".                              [100%]",
                  "1 passed in 0.24s",
                ];
            terminal.forEach((s, i) =>
              text(
                s,
                365,
                733 + extraHeight + i * 38,
                22,
                i === 0 ? p.ink : p.accent,
              ),
            );
            text("Demo workspace", 1390, 846 + extraHeight, 15, p.muted);
            rect(0, 866 + extraHeight, 1600, 34, p.bar);
            text("⑂ main    ✓ 0   ⚠ 0", 22, 889 + extraHeight, 18, p.accent);
            text(
              "UTF-8    LF    " + (laptop ? "TypeScript" : "Python 3.12"),
              1170,
              889 + extraHeight,
              18,
              p.muted,
            );
            // Cover only this meaningful final line; Blender authors its reveal and cursor.
            const row = 10;
            ctx.font = `${font}px Consolas, monospace`;
            return {
              png: canvas.toDataURL("image/png").split(",")[1],
              line: {
                x: x / 1600,
                y: (top + row * lineH - font) / canvas.height,
                w: ctx.measureText(lines[row]).width / 1600,
                h: 31 / canvas.height,
                characters: lines[row].length,
              },
              terminal: {
                x: 365 / 1600,
                y: (749 + extraHeight) / canvas.height,
                w: 0.7,
                rowHeight: 38 / canvas.height,
              },
            };
          }
          return { png: canvas.toDataURL("image/png").split(",")[1] };
        },
        { theme, device, p: palettes[theme] },
      );
      const filename = `${device}-${theme}.png`;
      await writeFile(
        path.join(output, filename),
        Buffer.from(result.png, "base64"),
      );
      if (result.line)
        records[device] = { line: result.line, terminal: result.terminal };
    }
  }
  await writeFile(
    path.join(output, "layout.json"),
    JSON.stringify({ palettes, ...records }, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
console.log(`Device artwork written to ${output}`);
