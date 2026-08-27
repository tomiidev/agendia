import { test, expect } from '@playwright/test';

test('auth flow: login and logout', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', 'a@a.com');
  await page.fill('input[name="password"]', 'a');
  await page.click('button[type="submit"]');

  // Verify successful login (should redirect to dashboard)
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Logout
  await page.click('button[title="Cerrar sesión"]');
  await expect(page).toHaveURL('/login');
});

test('auth flow: registration', async ({ page }) => {
  await page.goto('/register');
  
  const timestamp = Date.now();
  await page.fill('input[name="name"]', 'New User');
  await page.fill('input[name="email"]', `newuser${timestamp}@example.com`);
  await page.fill('input[name="password"]', 'password123');
  await page.fill('input[name="businessName"]', 'New Business');
  await page.fill('input[name="businessSlug"]', `new-business-${timestamp}`);
  
  await page.click('button[type="submit"]');
  
  // Verify successful registration (should redirect to dashboard)
  await expect(page).toHaveURL(/.*dashboard/);
});
