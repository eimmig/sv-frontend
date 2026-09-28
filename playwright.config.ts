import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    // 127.0.0.1, nao 'localhost': o hosts file resolve 'localhost' tanto pra
    // 127.0.0.1 quanto ::1, e o dev server so escuta numa familia - sob carga
    // paralela o Chromium as vezes tenta a outra e leva ECONNREFUSED (feat-053).
    baseURL: 'http://127.0.0.1:4300',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // --host 127.0.0.1: fixa a familia que o dev server escuta (mesma razao do
    // baseURL acima). Rodando manualmente na porta 4300 pra reuseExistingServer,
    // use a mesma flag.
    command: 'npx ng serve --port 4300 --host 127.0.0.1',
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
