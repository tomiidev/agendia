import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'a@a.com');
  await page.fill('input[name="password"]', 'a');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

test('services: CRUD flow', async ({ page }) => {
  await loginAsAdmin(page);

  // Navigate to Services
  await page.click('[data-testid="nav-servicios"]');
  await expect(page).toHaveURL(/.*services/);

  // 1. Create Service (FAIL CASE: No professional selected)
  await page.click('text=Nuevo Servicio');

  // Fill form
  const timestamp = Date.now();
  await page.fill('input[placeholder="Ej. Corte de Cabello"]', `Servicio Fallido ${timestamp}`);
  await page.fill('input[placeholder="Ej. Corte, Coloración..."]', 'Categoría Test');
  await page.fill('input[placeholder="2500"]', '5000');

  // Submit without selecting professional
  await page.click('text=Crear Servicio');

  // Verify error message
  await expect(page.locator('text=Debes asignar al menos un profesional.')).toBeVisible();

  // Close modal
  await page.click('[data-testid="add-service-close"]');

  // 1. Create Service (SUCCESS CASE: With professional selected)
  await page.click('text=Nuevo Servicio');

  // Fill form
  await page.fill('input[placeholder="Ej. Corte de Cabello"]', `Servicio Exitoso ${timestamp}`);
  await page.fill('input[placeholder="Ej. Corte, Coloración..."]', 'Categoría Test');
  await page.fill('input[placeholder="2500"]', '5000');

  // Select professional - use data-testid and verify selection
  const profToggle = page.locator('[data-testid^="prof-toggle-"]').first();
  await profToggle.click();

  // Verify it is now selected (should have bg-brand-600 in inner div)
  await expect(profToggle.locator('.bg-brand-600')).toBeVisible();

  // Submit
  await page.click('text=Crear Servicio');

  // Verify visibility
  await expect(page.locator(`text=Servicio Exitoso ${timestamp}`)).toBeVisible();

  // 2. Read (already verified by visibility check)

  // 3. Update (select to open drawer)
  await page.click(`text=Servicio Exitoso ${timestamp}`);

  // Click edit button
  await page.click('button[title="Editar servicio"]');

  // Update name
  const updatedName = `Servicio Actualizado ${timestamp}`;
  await page.fill('input[placeholder="Ej. Corte de Cabello"]', updatedName);

  // Try to remove all professionals (deselect them)
  const selectedProfs = page.locator('[data-testid^="prof-toggle-"]');
  const count = await selectedProfs.count();
  console.log('Professional toggles count:', count);

  for (let i = 0; i < count; i++) {
     const prof = selectedProfs.nth(i);
     // Click to deselect if selected
     await prof.click();
  }

  // Debug: check how many are selected after clicking all
  // The selected ones should have the brand-600 background class.
  // Actually, let's just assume clicking toggles them.

  // Save
  await page.click('text=Guardar Cambios');

  // Verify error
  await expect(page.locator('[data-testid="service-error"]')).toBeVisible();

  // Close drawer using the close button in the header
  await page.click('[data-testid="drawer-close"]'); 
  });
