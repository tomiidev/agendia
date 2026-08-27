import { test, expect, Page } from '@playwright/test';

// Utilidad para iniciar sesión como admin/owner
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'a@a.com');
  await page.fill('input[name="password"]', 'a');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

test('admin: agenda view and service management', async ({ page }) => {
  await loginAsAdmin(page);
  
  // 1. Verificar Agenda
  await page.click('[data-testid="nav-agenda"]');
  await expect(page).toHaveURL(/.*agenda/);
  
  // 2. Gestión de Servicios (Navegar a servicios)
  await page.click('[data-testid="nav-servicios"]');
  await expect(page).toHaveURL(/.*services/);
  
  // Validar que se listan servicios
  await expect(page.locator('text=Corte de Cabello Classic')).toBeVisible();
});
