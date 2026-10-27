import { chromium } from "@playwright/test";

const homelabUrl = process.env.HOMELAB_PORTAL_URL ?? "http://127.0.0.1:4321";
const medtriageUrl = process.env.MEDTRIAGE_URL ?? "http://127.0.0.1:3000";

const browser = await chromium.launch({ channel: "chromium", headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(homelabUrl, { waitUntil: "domcontentloaded" });
  await page.locator("#catalog-items").waitFor();
  await page.screenshot({
    path: "public/assets/projects/homelab-portal-catalog.png",
  });

  await page.goto(`${homelabUrl}/admin`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Admin diagnostics" }).waitFor();
  await page.screenshot({
    path: "public/assets/projects/homelab-portal-diagnostics.png",
  });

  await page.goto(medtriageUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "MedTriageAI" }).waitFor();
  await page.screenshot({
    path: "public/assets/projects/medtriage-home.png",
  });

  const symptoms = page.getByPlaceholder("Décrivez vos symptômes...");
  await symptoms.fill("J’ai une forte fièvre et une douleur intense.");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.getByText("Pour affiner l'évaluation").waitFor();
  await symptoms.fill("Depuis deux jours, avec une température de 39 °C.");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.getByText("Consultation à prévoir").last().waitFor();
  await page.getByText("Conseils").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "public/assets/projects/medtriage-session.png",
  });
} finally {
  await browser.close();
}
