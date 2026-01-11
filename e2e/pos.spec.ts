/**
 * 🧪 E2E TEST SUITE - Toko Pakan Ainun POS
 * Comprehensive test covering all aspects:
 * - Database seeding
 * - Categories & Products
 * - Satuan/Unit system
 * - Cart operations
 * - Cash payment flow
 * - Kasbon (debt) payment flow
 * - Receipt printing
 * - Shift management
 */

import { test, expect, Page } from '@playwright/test';

// Helper: Clear IndexedDB and reload
async function clearDatabaseAndReload(page: Page) {
    await page.evaluate(async () => {
        localStorage.clear();
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
        }
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
}

// Helper: Go through outlet selection
async function selectOutletAndStartShift(page: Page) {
    // Wait for outlet selection page
    await page.waitForSelector('text=Pilih Outlet', { timeout: 10000 });

    // Click on outlet option (first available)
    await page.click('button:has-text("Outlet Utama"), button:has-text("Pilih")');

    // Click Mulai Kasir if visible
    const mulaiKasir = page.locator('button:has-text("Mulai Kasir")');
    if (await mulaiKasir.isVisible({ timeout: 3000 }).catch(() => false)) {
        await mulaiKasir.click();
    }

    // Wait for cashier page to load
    await page.waitForSelector('text=Toko Pakan Ainun', { timeout: 10000 });
}

// Helper: Click on a category button with exact match (to avoid matching product names)
async function clickCategory(page: Page, categoryName: string) {
    await page.getByRole('button', { name: categoryName, exact: true }).click();
}


test.describe('🏪 Toko Pakan Ainun POS - Full E2E Test Suite', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await clearDatabaseAndReload(page);
        await selectOutletAndStartShift(page);
    });

    test.describe('📦 Category & Product Display', () => {

        test('should display correct store name in header', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Toko Pakan Ainun');
        });

        test('should display all 5 pakan ternak categories', async ({ page }) => {
            const categories = [
                'Pakan Ayam',
                'Pakan Itik',
                'Pakan Sapi',
                'Konsentrat',
                'Dedak & Bekatul'
            ];

            for (const category of categories) {
                await expect(page.getByRole('button', { name: category, exact: true })).toBeVisible();
            }
        });

        test('should display products when category is selected', async ({ page }) => {
            // Click Pakan Ayam category
            await clickCategory(page, 'Pakan Ayam');

            // Verify products appear
            await expect(page.locator('text=Pakan Ayam 511')).toBeVisible();
            await expect(page.locator('text=Pakan Ayam 512')).toBeVisible();
            await expect(page.locator('text=Pakan Ayam Broiler Starter')).toBeVisible();
        });

        test('should switch products when different category selected', async ({ page }) => {
            // Select Pakan Sapi
            await clickCategory(page, 'Pakan Sapi');

            // Verify Pakan Sapi products appear
            await expect(page.locator('text=Pakan Sapi Potong')).toBeVisible();
            await expect(page.locator('text=Pakan Sapi Perah')).toBeVisible();

            // Verify Pakan Ayam products are NOT visible
            await expect(page.locator('text=Pakan Ayam 511')).not.toBeVisible();
        });

        test('should search products across all categories', async ({ page }) => {
            // Type in search
            await page.fill('input[placeholder*="Cari"]', 'Konsentrat');

            // Should show konsentrat products
            await expect(page.locator('text=Konsentrat Ayam Super')).toBeVisible();
            await expect(page.locator('text=Konsentrat Sapi 148')).toBeVisible();
        });
    });

    test.describe('📏 Satuan (Unit) System', () => {

        test('should show satuan panel when product clicked', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');

            // Verify satuan panel appears
            await expect(page.locator('text=Pilih Satuan')).toBeVisible();
            await expect(page.locator('text=Karung (50kg)')).toBeVisible();
            await expect(page.locator('text=Eceran (1kg)')).toBeVisible();
        });

        test('should update price when satuan selected', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');

            // Select Karung (50kg)
            await page.click('label:has-text("Karung (50kg)")');

            // Verify price shows 460,000 (basePrice 10,000 + modifier 450,000)
            await expect(page.locator('button:has-text("Tambah")')).toContainText('460.000');
        });

        test('should show different satuan options for Pakan Sapi', async ({ page }) => {
            await clickCategory(page, 'Pakan Sapi');
            await page.click('button:has-text("Pakan Sapi Potong")');

            // Pakan Sapi has 3 options: 50kg, 25kg, 1kg
            await expect(page.locator('text=Karung (50kg)')).toBeVisible();
            await expect(page.locator('text=Karung (25kg)')).toBeVisible();
            await expect(page.locator('text=Eceran (1kg)')).toBeVisible();
        });

        test('should show different satuan options for Dedak', async ({ page }) => {
            await clickCategory(page, 'Dedak & Bekatul');
            await page.click('button:has-text("Dedak Padi Halus")');

            // Dedak only has 25kg and 1kg
            await expect(page.locator('text=Karung (25kg)')).toBeVisible();
            await expect(page.locator('text=Eceran (1kg)')).toBeVisible();
            await expect(page.locator('text=Karung (50kg)')).not.toBeVisible();
        });
    });

    test.describe('🛒 Cart Operations', () => {

        test('should add product to cart with selected satuan', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Karung (50kg)")');
            await page.click('button:has-text("Tambah")');

            // Verify cart shows 1 item
            await expect(page.locator('text=Keranjang (1)')).toBeVisible();
            // Use heading selector to find cart item specifically
            await expect(page.locator('h4:has-text("Pakan Ayam 511")')).toBeVisible();
        });

        test('should update quantity in cart', async ({ page }) => {
            // Add product
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');

            // Find and click + button in cart (use h4 to target cart item heading)
            const cartItem = page.locator('.card').filter({ has: page.locator('h4:has-text("Pakan Ayam 511")') });
            await cartItem.locator('button:has(svg)').last().click(); // Plus button

            // Quantity should be 2
            await expect(cartItem.locator('span:has-text("2")')).toBeVisible();
        });

        test('should remove product from cart', async ({ page }) => {
            // Add product
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Karung (50kg)")');
            await page.click('button:has-text("Tambah")');

            // Remove from cart (using h4 to target cart item)
            await page.locator('.card').filter({ has: page.locator('h4:has-text("Pakan Ayam 511")') }).locator('button:has(svg.lucide-x)').click();

            // Cart should be empty
            await expect(page.locator('text=Keranjang kosong')).toBeVisible();
        });

        test('should add multiple different products', async ({ page }) => {
            // Add Pakan Ayam
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Karung (50kg)")');
            await page.click('button:has-text("Tambah")');

            // Add Dedak
            await clickCategory(page, 'Dedak & Bekatul');
            await page.click('button:has-text("Dedak Padi Halus")');
            await page.click('label:has-text("Karung (25kg)")');
            await page.click('button:has-text("Tambah")');

            // Cart should show 2 items
            await expect(page.locator('text=Keranjang (2)')).toBeVisible();
        });

        test('should calculate total correctly', async ({ page }) => {
            // Add Pakan Ayam Karung 50kg = 460,000 (basePrice 10,000 + modifier 450,000)
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Karung (50kg)")');
            await page.click('button:has-text("Tambah")');

            // Verify total displays correctly (use first() since price appears in cart and total)
            await expect(page.locator('text=Rp 460.000').first()).toBeVisible();
        });
    });

    test.describe('💵 Cash Payment Flow', () => {

        test('should open payment modal on CHARGE', async ({ page }) => {
            // Add product to cart
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');

            // Click CHARGE
            await page.click('button:has-text("CHARGE")');

            // Payment modal should appear (use heading to be more specific)
            await expect(page.getByRole('heading', { name: 'Pembayaran' })).toBeVisible();
            // Tunai is now a header (Kasbon was removed)
            await expect(page.locator('text=Tunai').first()).toBeVisible();
        });

        test('should show Tunai tab by default', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');
            await page.click('button:has-text("CHARGE")');

            // Tunai tab should be active
            await expect(page.locator('text=Uang Diterima')).toBeVisible();
            await expect(page.locator('text=Kembalian')).toBeVisible();
        });

        test('should use numpad to enter payment amount', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');
            await page.click('button:has-text("CHARGE")');

            // Enter 20000 using numpad (use exact match for numbers)
            await page.getByRole('button', { name: '2', exact: true }).click();
            await page.getByRole('button', { name: '0', exact: true }).click();
            await page.getByRole('button', { name: '000', exact: true }).click();

            // Verify amount shown (use first() to handle multiple matching elements)
            await expect(page.locator('text=Rp 20.000').first()).toBeVisible();
        });

        test('should use Uang Pas for exact amount', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');
            await page.click('button:has-text("CHARGE")');

            await page.click('button:has-text("Uang Pas")');

            // Kembalian should be 0
            await expect(page.locator('.bg-emerald-50:has-text("Rp 0")')).toBeVisible();
        });

        test('should calculate change correctly', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');
            await page.click('button:has-text("CHARGE")');

            // Enter 50000 (use exact match for numbers)
            await page.getByRole('button', { name: '5', exact: true }).click();
            await page.getByRole('button', { name: '0', exact: true }).click();
            await page.getByRole('button', { name: '000', exact: true }).click();

            // Product is 20,000 (base 10K + modifier 10K), change should be 30,000
            await expect(page.locator('text=Rp 30.000')).toBeVisible();
        });

        test('should complete cash payment successfully', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');
            await page.click('button:has-text("CHARGE")');
            await page.click('button:has-text("Uang Pas")');
            await page.click('button:has-text("BAYAR & SELESAI")');

            // Should show success and clear cart
            await expect(page.locator('text=Transaksi Berhasil')).toBeVisible({ timeout: 5000 });
        });

        test('should disable BAYAR button when amount insufficient', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');
            await page.click('button:has-text("Tambah")');
            await page.click('button:has-text("CHARGE")');

            // Enter only 5000 (less than 20000 product price)
            await page.getByRole('button', { name: '5', exact: true }).click();
            await page.getByRole('button', { name: '000', exact: true }).click();

            // BAYAR button should be disabled
            await expect(page.locator('button:has-text("BAYAR & SELESAI")')).toBeDisabled();
        });
    });

    // Kasbon feature removed - not in use

    test.describe('🔄 Shift Management', () => {

        test('should display current shift info in header', async ({ page }) => {
            await expect(page.locator('text=Shift:')).toBeVisible();
            await expect(page.locator('text=Kasir Ainun')).toBeVisible();
        });

        test('should display opening cash (Modal Awal)', async ({ page }) => {
            await expect(page.locator('text=Modal Awal')).toBeVisible();
            await expect(page.locator('text=Rp 500.000')).toBeVisible();
        });

        test('should show Tutup Shift button', async ({ page }) => {
            await expect(page.locator('button:has-text("Tutup Shift")')).toBeVisible();
        });

        test('should open close shift modal', async ({ page }) => {
            await page.click('button:has-text("Tutup Shift")');

            // Close shift modal should appear (use heading to avoid matching button)
            await expect(page.getByRole('heading', { name: 'Tutup Shift' })).toBeVisible();
        });
    });

    test.describe('🔍 Product Search', () => {

        test('should filter products by search query', async ({ page }) => {
            await page.fill('input[placeholder*="Cari"]', 'Broiler');

            // Should show Broiler products
            await expect(page.locator('text=Pakan Ayam Broiler Starter')).toBeVisible();
            await expect(page.locator('text=Pakan Ayam Broiler Finisher')).toBeVisible();
        });

        test('should show no results message for invalid search', async ({ page }) => {
            await page.fill('input[placeholder*="Cari"]', 'xyz123notfound');

            await expect(page.locator('text=Tidak ditemukan')).toBeVisible();
        });

        test('should clear search with X button', async ({ page }) => {
            await page.fill('input[placeholder*="Cari"]', 'Broiler');
            await page.click('button:has(svg.lucide-x)');

            // Search should be cleared, all products visible
            const input = page.locator('input[placeholder*="Cari"]');
            await expect(input).toHaveValue('');
        });
    });

    test.describe('📱 UI/UX Elements', () => {

        test('should have Admin link in header', async ({ page }) => {
            await expect(page.locator('a:has-text("Admin")')).toBeVisible();
        });

        test('should navigate to Admin page', async ({ page }) => {
            await page.click('a:has-text("Admin")');

            // Should navigate to admin
            await expect(page).toHaveURL(/\/admin/);
        });

        test('should close product panel with X button', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');

            // Panel should be visible
            await expect(page.locator('text=Pilih Satuan')).toBeVisible();

            // Close panel
            await page.click('.border-t-2 button:has(svg.lucide-x)');

            // Panel should be closed
            await expect(page.locator('text=Pilih Satuan')).not.toBeVisible();
        });

        test('should have working quantity controls', async ({ page }) => {
            await clickCategory(page, 'Pakan Ayam');
            await page.click('button:has-text("Pakan Ayam 511")');
            await page.click('label:has-text("Eceran (1kg)")');

            // Increase quantity
            const plusBtn = page.locator('.border-t-2 button').filter({ has: page.locator('svg.lucide-plus') }).first();
            await plusBtn.click();
            await plusBtn.click();

            // Verify quantity is 3
            await expect(page.locator('span:has-text("3")')).toBeVisible();
        });
    });
});
