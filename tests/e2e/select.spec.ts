import { test, expect, Page, Locator } from '@playwright/test';

const HARNESS = '/#/__ui-test';

const panel = (page: Page) => page.locator('[role="listbox"]');
const rows = (page: Page) => panel(page).locator('[role="option"]');

const expectInViewport = async (loc: Locator, page: Page) => {
  const box = await loc.boundingBox();
  const vp = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height + 1);
};

test.beforeEach(async ({ page }) => {
  await page.goto(HARNESS);
  await expect(page.getByTestId('ui-test')).toBeVisible();
});

test.describe('Select (single)', () => {
  test('opens on click, shows all options, closes on outside click', async ({ page }) => {
    await page.getByLabel('Tax rate').click();
    await expect(panel(page)).toBeVisible();
    await expect(rows(page)).toHaveCount(9);
    await page.mouse.click(5, 5);
    await expect(panel(page)).toHaveCount(0);
  });

  test('selecting an option updates the value and closes the panel', async ({ page }) => {
    await page.getByLabel('Tax rate').click();
    await rows(page).filter({ hasText: /^5%$/ }).click();
    await expect(page.getByTestId('tax-value')).toHaveText('5');
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByLabel('Tax rate')).toContainText('5%');
  });

  test('marks the current option with a check', async ({ page }) => {
    await page.getByLabel('Tax rate').click();
    const active = rows(page).filter({ hasText: '18%' });
    await expect(active).toHaveAttribute('aria-selected', 'true');
    await expect(active.locator('.fa-check')).toBeVisible();
  });

  test('shows a search box automatically for long lists and filters', async ({ page }) => {
    await page.getByLabel('State').click();
    const search = panel(page).getByPlaceholder('Search…');
    await expect(search).toBeFocused();
    await search.fill('guj');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toHaveText(/Gujarat/);
    await rows(page).first().click();
    await expect(page.getByTestId('state-value')).toHaveText('Gujarat');
  });

  test('shows "No match" when the search has no results', async ({ page }) => {
    await page.getByLabel('State').click();
    await panel(page).getByPlaceholder('Search…').fill('zzzz');
    await expect(rows(page)).toHaveCount(0);
    await expect(panel(page)).toContainText('No match');
  });

  test('keyboard: ArrowDown opens, arrows move, Enter picks, Escape closes', async ({ page }) => {
    const trigger = page.getByLabel('Tax rate');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(panel(page)).toBeVisible();
    // current is 18% (index 7). Down once -> 28%
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('tax-value')).toHaveText('28');
    await expect(panel(page)).toHaveCount(0);

    await trigger.click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });

  test('clear button resets to placeholder', async ({ page }) => {
    await page.getByLabel('State').click();
    await panel(page).getByPlaceholder('Search…').fill('kerala');
    await rows(page).first().click();
    await expect(page.getByTestId('state-value')).toHaveText('Kerala');
    await page.getByLabel('State').getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByTestId('state-value')).toHaveText('');
    await expect(page.getByLabel('State')).toContainText('Select state');
    await expect(panel(page)).toHaveCount(0);
  });

  test('disabled select does not open', async ({ page }) => {
    const d = page.getByLabel('Disabled select');
    await expect(d).toBeDisabled();
    await d.click({ force: true });
    await expect(panel(page)).toHaveCount(0);
  });

  test('only one panel is open at a time', async ({ page }) => {
    await page.getByLabel('Tax rate').click();
    await expect(panel(page)).toHaveCount(1);
    await expect(panel(page)).toContainText('18%');
    // State sits in the other column, so this click is not under the open panel
    await page.getByLabel('State').click();
    await expect(panel(page)).toHaveCount(1);
    await expect(panel(page)).toContainText('Gujarat');
  });

  test('keyboard works while the search box has focus', async ({ page }) => {
    await page.getByLabel('State').click();
    const search = panel(page).getByPlaceholder('Search…');
    await expect(search).toBeFocused();
    await search.fill('a');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByTestId('state-value')).not.toHaveText('');
  });

  test('a short list has no search box', async ({ page }) => {
    await page.getByLabel('Tax rate').click();
    await expect(panel(page).getByPlaceholder('Search…')).toHaveCount(0);
  });
});

test.describe('Positioning', () => {
  test('embedded select inside an overflow-hidden group is not clipped', async ({ page }) => {
    await page.getByLabel('Unit').click();
    await expect(panel(page)).toBeVisible();
    await expect(rows(page)).toHaveCount(13);
    // panel must be at least ~180px wide and fully visible even though the group is 192px and overflow-hidden
    const box = (await panel(page).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(180);
    await expectInViewport(panel(page), page);
    await rows(page).filter({ hasText: 'KGS' }).click();
    await expect(page.getByTestId('unit-value')).toHaveText('KGS');
  });

  test('select inside an overflow-x-auto table cell is fully visible', async ({ page }) => {
    await page.getByLabel('Row tax').click();
    await expect(panel(page)).toBeVisible();
    await expectInViewport(panel(page), page);
    const trig = (await page.getByLabel('Row tax').boundingBox())!;
    const box = (await panel(page).boundingBox())!;
    // align="end": right edges line up (within a couple px)
    expect(Math.abs(box.x + box.width - (trig.x + trig.width))).toBeLessThanOrEqual(2);
  });

  test('panel opens below the trigger normally and flips above near the bottom', async ({ page }) => {
    await page.getByLabel('Tax rate').click();
    let trig = (await page.getByLabel('Tax rate').boundingBox())!;
    let box = (await panel(page).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(trig.y + trig.height);
    await page.keyboard.press('Escape');

    const bottom = page.getByLabel('Bottom select');
    await bottom.scrollIntoViewIfNeeded();
    // put the trigger near the bottom edge of the viewport
    await page.evaluate(() => {
      const el = document.querySelector('[aria-label="Bottom select"]') as HTMLElement;
      const r = el.getBoundingClientRect();
      window.scrollBy(0, r.bottom - window.innerHeight + 60);
    });
    await bottom.click();
    await expect(panel(page)).toBeVisible();
    trig = (await bottom.boundingBox())!;
    box = (await panel(page).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(trig.y + 1);
    await expectInViewport(panel(page), page);
  });

  test('panel follows the trigger on scroll', async ({ page }) => {
    await page.getByLabel('Tax rate').click();
    const before = (await panel(page).boundingBox())!;
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(50);
    const after = (await panel(page).boundingBox())!;
    const trig = (await page.getByLabel('Tax rate').boundingBox())!;
    expect(after.y).toBeLessThan(before.y);
    expect(Math.abs(after.y - (trig.y + trig.height + 4))).toBeLessThanOrEqual(2);
  });
});

test.describe('MultiSelect', () => {
  test('toggles multiple values and shows them joined in the trigger', async ({ page }) => {
    const t = page.getByLabel('Business type');
    await t.click();
    await rows(page).filter({ hasText: 'Wholesaler' }).click();
    await rows(page).filter({ hasText: 'Distributor' }).click();
    await expect(panel(page)).toBeVisible(); // stays open for multi
    await expect(page.getByTestId('types-value')).toHaveText('Wholesaler|Distributor');
    await expect(t).toContainText('Wholesaler, Distributor');
    await rows(page).filter({ hasText: 'Wholesaler' }).click();
    await expect(page.getByTestId('types-value')).toHaveText('Distributor');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });
});

test.describe('Combobox (item name)', () => {
  test('shows styled suggestions on focus and filters while typing', async ({ page }) => {
    const input = page.getByLabel('Item name');
    await input.click();
    await expect(panel(page)).toBeVisible();
    await expect(rows(page)).toHaveCount(6);
    await input.fill('rakhi');
    await expect(rows(page)).toHaveCount(3);
    await expect(panel(page)).toContainText('₹80.00');
  });

  test('picking a suggestion fills the input and reports the option', async ({ page }) => {
    const input = page.getByLabel('Item name');
    await input.fill('epoxy');
    await rows(page).first().click();
    await expect(input).toHaveValue('EPOXY NORMAL 5 KG');
    await expect(page.getByTestId('item-picked')).toHaveText('EPOXY NORMAL 5 KG:₹1059.32');
    await expect(panel(page)).toHaveCount(0);
    await expect(input).toBeFocused();
  });

  test('keyboard pick with ArrowDown + Enter', async ({ page }) => {
    const input = page.getByLabel('Item name');
    await input.fill('hair');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Flower hairclip');
  });

  test('free text is allowed and the panel hides when nothing matches', async ({ page }) => {
    const input = page.getByLabel('Item name');
    await input.fill('Custom handmade thing');
    await expect(panel(page)).toHaveCount(0);
    await expect(page.getByTestId('item-value')).toHaveText('Custom handmade thing');
    await expect(page.getByTestId('item-picked')).toHaveText('');
  });

  test('does not use the native datalist popup', async ({ page }) => {
    const input = page.getByLabel('Item name');
    await expect(input).not.toHaveAttribute('list', /.+/);
    expect(await page.locator('datalist').count()).toBe(0);
  });

  test('Escape and Tab close the suggestions', async ({ page }) => {
    const input = page.getByLabel('Item name');
    await input.click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await input.click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(panel(page)).toHaveCount(0);
  });
});
