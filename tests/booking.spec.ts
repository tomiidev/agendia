import { test, expect } from '@playwright/test';

test('booking flow for Barbería Classic', async ({ page }) => {
  // 1. Ir a la página del negocio
  await page.goto('/book/barberia-classic');
  
  // 2. Seleccionar servicio
  await page.click('[data-testid^="service-"]');
  
  // 3. Seleccionar profesional
  await page.click('[data-testid^="professional-"]');
  await page.click('[data-testid="btn-continue"]'); // Go to date

  // 4. Seleccionar fecha (hoy)
  const today = new Date().toISOString().split('T')[0];
  await page.fill('[data-testid="date-input"]', today);
  await page.click('[data-testid="btn-continue"]'); // Go to time
  
  // 5. Seleccionar horario
  await page.click('[data-testid^="time-"]');
  await page.click('[data-testid="btn-continue"]'); // Go to details

  // 6. Completar detalles
  await page.fill('[data-testid="input-name"]', 'Test User');
  await page.fill('[data-testid="input-phone"]', '1234567890');
  await page.click('[data-testid="btn-continue"]'); // Go to confirm
  
  // 7. Confirmar
  await page.click('[data-testid="btn-confirm"]');

  // 8. Verificar éxito
  await expect(page.locator('text=¡Reserva confirmada!')).toBeVisible();
});
