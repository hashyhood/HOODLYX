import { test, expect } from "@playwright/test";

test("critical remote chrome has honest controls and no raw key box", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/health") || url.includes("/api/status") || url.includes("/api/events")) {
      await route.fulfill({
        status: 200,
        contentType: url.includes("events") ? "text/event-stream" : "application/json",
        body: url.includes("events")
          ? ""
          : JSON.stringify({
              ok: true,
              status: "Disconnected",
              host_running: true,
              phone_access: false,
              tv_model: "UA55H6400",
              csrf_token: "test",
              power_on_supported: false,
              power_on_message: "This 2014 Samsung model normally cannot be powered on over Wi-Fi.",
              device: null,
            }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, sessions: [] }) });
  });

  await page.goto("/");
  await expect(page.getByTestId("btn-hub")).toHaveAttribute("data-key", "KEY_CONTENTS");
  await expect(page.getByTestId("btn-back")).toHaveAttribute("data-key", "KEY_RETURN");
  await expect(page.getByTestId("btn-power")).toHaveAttribute("data-key", "KEY_POWEROFF");
  await expect(page.locator("text=Wi-Fi power on")).toHaveCount(0);
  await expect(page.locator("input[name='raw-key']")).toHaveCount(0);
  await expect(page.getByText("Windows host: running")).toBeVisible();
});
