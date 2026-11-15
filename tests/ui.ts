import { expect, type Page } from "@playwright/test";

export type RegionName = "Deck" | "Sheets" | "Print setup";

export async function showRegion(page: Page, name: RegionName) {
  const nav = page.getByRole("navigation", { name: "Workspace regions" });
  const sideSwitch = page.getByRole("group", { name: "Side panel" });
  const control = (await nav.isVisible())
    ? nav.getByRole("button", { name, exact: true })
    : (await sideSwitch.isVisible()) && name !== "Sheets"
      ? sideSwitch.getByRole("button", { name, exact: true })
      : null;
  if (!control) return;
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "true");
}

export function exportDialog(page: Page) {
  return page.getByRole("dialog", { name: "Export", exact: true });
}

export async function openExport(page: Page) {
  const dialog = exportDialog(page);
  if (await dialog.isVisible()) return;
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(dialog).toBeVisible();
}

export async function setTwoSided(page: Page, on: boolean) {
  await showRegion(page, "Print setup");
  const button = page.getByRole("button", {
    name: on ? "Two-sided" : "One-sided",
    exact: true,
  });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
}

export async function openAdvanced(
  page: Page,
  name: "Artwork edges" | "Preview"
) {
  await showRegion(page, "Print setup");
  const summary = page.getByText(`Advanced: ${name.toLowerCase()}`, {
    exact: true,
  });
  if (
    !(await summary.evaluate(
      (el) => (el.parentElement as HTMLDetailsElement).open
    ))
  )
    await summary.click();
}

export async function confirmDialog(page: Page, label: string) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: label, exact: true })
    .click();
}

export function addCardsDialog(page: Page) {
  return page.getByRole("dialog", { name: "Add cards", exact: true });
}

// The add form fills the Deck panel while the deck is empty and opens in a
// dialog once it has cards.
export async function openAddCards(page: Page) {
  if (await page.getByLabel("Decklist", { exact: true }).isVisible()) return;
  await showRegion(page, "Deck");
  if (await page.getByLabel("Decklist", { exact: true }).isVisible()) return;
  await page.getByRole("button", { name: "Add cards", exact: true }).click();
  await expect(addCardsDialog(page)).toBeVisible();
}
