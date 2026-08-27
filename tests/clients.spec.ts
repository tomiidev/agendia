import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'a@a.com');
  await page.fill('input[name="password"]', 'a');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

test('clients: CRUD flow', async ({ page }) => {
  await loginAsAdmin(page);

  // Navigate to Clients
  await page.click('[data-testid="nav-clientes"]');
  await expect(page).toHaveURL(/.*clients/);

  // 1. Create Client
  await page.click('text=Nuevo Cliente');

  // Fill form
  const timestamp = Date.now();
  const clientName = `Cliente Test ${timestamp}`;
  await page.fill('[data-testid="add-client-input-name"]', clientName);
  await page.fill('[data-testid="add-client-input-phone"]', `123456789${timestamp % 1000}`);
  await page.fill('[data-testid="add-client-input-email"]', `test${timestamp}@example.com`);

  // Submit
  await page.click('[data-testid="add-client-submit-btn"]');

  // Verify visibility
  await expect(page.locator(`text=${clientName}`)).toBeVisible();

  // 2. Read (already verified by visibility check)

  // 3. Update
  await page.click(`text=${clientName}`);

  // Click edit button
  await page.click('[data-testid="client-edit-btn"]');

  // Update name
  const updatedName = `Cliente Actualizado ${timestamp}`;
  await page.fill('[data-testid="client-input-name"]', updatedName);

  // Save
  await page.click('[data-testid="client-save-btn"]');

  // Verify update
  await expect(page.locator(`text=${updatedName}`)).toBeVisible();

  // Close drawer
  await page.click('[data-testid="drawer-close"]');

});
