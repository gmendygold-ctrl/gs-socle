import { expect, test } from "@playwright/test";

test("l'accueil présente le service et mène à l'inscription", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("plateformes sûres");
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await expect(page).toHaveURL(/\/auth\/inscription$/);
});

test("une page privée redirige un visiteur vers la connexion", async ({ page }) => {
  await page.goto("/espace/commune-a");
  await expect(page).toHaveURL(/\/auth\/connexion\?suite=%2Fespace%2Fcommune-a/);
  await expect(page.locator('input[name="suite"]')).toHaveValue("/espace/commune-a");
});

test("une redirection vers un site externe est neutralisée", async ({ page }) => {
  await page.goto("/auth/connexion?suite=https://pirate.example");
  await expect(page.locator('input[name="suite"]')).toHaveValue("/espace");
});

test("l'inscription affiche des erreurs claires par champ", async ({ page }) => {
  await page.goto("/auth/inscription");
  await page.getByLabel("Nom complet").fill("G");
  await page.getByLabel("Adresse e-mail").fill("pas-un-email");
  await page.getByLabel(/Mot de passe/).fill("court");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByText("Nom complet : 2 caractères minimum")).toBeVisible();
  await expect(page.getByText("Adresse e-mail invalide")).toBeVisible();
  await expect(page.getByText("Mot de passe : 10 caractères minimum")).toBeVisible();
  await expect(page.getByLabel("Adresse e-mail")).toHaveAttribute("aria-invalid", "true");
});

test("aucun débordement horizontal (mobile compris)", async ({ page }) => {
  for (const url of ["/", "/auth/connexion", "/auth/inscription"]) {
    await page.goto(url);
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(deborde, url).toBe(false);
  }
});

test("pas d'erreur JavaScript dans la console", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  for (const url of ["/", "/auth/connexion", "/auth/inscription"]) await page.goto(url);
  expect(erreurs).toEqual([]);
});

test("la saisie est conservée après une erreur (sauf le mot de passe)", async ({ page }) => {
  await page.goto("/auth/inscription");
  await page.getByLabel("Nom complet").fill("Gérard Mendy");
  await page.getByLabel("Adresse e-mail").fill("pas-un-email");
  await page.getByLabel(/Mot de passe/).fill("court");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByText("Adresse e-mail invalide")).toBeVisible();
  await expect(page.getByLabel("Nom complet")).toHaveValue("Gérard Mendy");
  await expect(page.getByLabel("Adresse e-mail")).toHaveValue("pas-un-email");
  await expect(page.getByLabel(/Mot de passe/)).toHaveValue("");
});
