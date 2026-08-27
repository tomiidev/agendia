import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'a@a.com');
  await page.fill('input[name="password"]', 'a');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

test('quote request E2E flow', async ({ page }) => {
  // 1. Log in to the admin panel
  await loginAsAdmin(page);

  // 2. Go to Services and create a QUOTE service
  await page.click('[data-testid="nav-servicios"]');
  await expect(page).toHaveURL(/.*services/);

  await page.click('text=Nuevo Servicio');
  
  const timestamp = Date.now();
  const serviceName = `Servicio Presupuesto ${timestamp}`;
  
  await page.fill('input[placeholder="Ej. Corte de Cabello"]', serviceName);
  await page.fill('input[placeholder="Ej. Corte, Coloración..."]', 'Presupuesto');
  await page.fill('input[placeholder="2500"]', '4000');
  
  // Select professional
  const profToggle = page.locator('[data-testid^="prof-toggle-"]').first();
  await profToggle.click();
  
  // Select booking mode QUOTE
  await page.selectOption('select', 'QUOTE');
  
  // Submit
  await page.click('text=Crear Servicio');
  
  // Verify it exists in services grid
  await expect(page.locator(`text=${serviceName}`)).toBeVisible();

  // 3. Go to public booking page
  await page.goto('/book/estetica-belleza');
  
  // Select the quote service
  await page.click(`text=${serviceName}`);
  
  // Verify it directly goes to quoteDetails form
  await expect(page.locator('text=Solicitar Presupuesto')).toBeVisible();
  
  // Fill the quote request form
  await page.fill('[data-testid="quote-name"]', 'Juan Perez');
  await page.fill('[data-testid="quote-phone"]', '59899123456');
  await page.fill('[data-testid="quote-email"]', 'juan@perez.com');
  await page.fill('[data-testid="quote-description"]', 'Hola, me gustaría saber el costo de este servicio detallado.');
  
  // Submit
  await page.click('[data-testid="btn-quote-submit"]');
  
  // Verify success message
  await expect(page.locator('text=¡Solicitud enviada!')).toBeVisible();
  await expect(page.locator('text=El negocio se pondrá en contacto contigo')).toBeVisible();

  // 4. Return to admin panel to verify quotes listing
  await page.goto('/quotes');
  
  // Verify the quote request is under Pendientes tab
  await expect(page.locator('text=Juan Perez')).toBeVisible();
  await expect(page.locator(`text=Servicio: ${serviceName}`)).toBeVisible();
  await expect(page.locator('text=Hola, me gustaría saber el costo de este servicio detallado.')).toBeVisible();
  
  // Click "Contactado" button
  await page.click('text=Contactado');
  
  // Verify it is removed from Pendientes tab
  await expect(page.locator('text=Juan Perez')).not.toBeVisible();
  
  // Go to Contactadas tab
  await page.click('text=Contactadas');
  await expect(page.locator('text=Juan Perez')).toBeVisible();
  
  // Click "Cerrar" button
  await page.click('text=Cerrar');
  
  // Verify it is removed from Contactadas tab
  await expect(page.locator('text=Juan Perez')).not.toBeVisible();
  
  // Go to Cerradas tab
  await page.click('text=Cerradas');
  await expect(page.locator('text=Juan Perez')).toBeVisible();
});
