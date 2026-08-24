# Samsung UA55H6400 setup

This application is for **Samsung UA55H6400 / 2014 H-series (Orsay)** only. It is **not** the modern Tizen remote protocol used on 2016+ Samsung televisions.

## Network

1. Put the television, the Windows laptop, and the phone on the **same home Wi-Fi router**.
2. Do **not** use guest Wi-Fi or AP/client isolation. Those modes block device-to-device traffic.
3. Disconnect or pause VPN software on the laptop. VPNs often hide the real LAN IP or block local sockets.
4. Do **not** forward ports 8000, 8080, or the host port (default 8787) through the router. This remote is local-only.

## Television

1. Power the TV **on** with the physical remote. This 2014 model **normally cannot be powered on over Wi-Fi**.
2. Note the TV IP from the TV network menu (or your router’s DHCP list). Manual IP entry is always available.
3. Optional SSDP discovery can fill the IP in, but a discovery miss must not block setup.

## Pairing

1. Start the Windows host. The laptop browser should open automatically.
2. Enter the TV IP. Pairing port defaults to **8080**. Remote port defaults to **8000**. Change them if your firmware differs.
3. Press **Test ports**, then **Start pairing**.
4. Look at the television. A **four-digit PIN** should appear.
5. Enter that PIN in the app. On success the host stores:
   - TV IP and name
   - ports
   - encrypted token / context
   - session ID
   - last successful connection time
6. The app immediately proves control with a harmless command, then reconnects with the saved credentials.
7. Restart the Windows host. You should **not** need to pair again.

Sensitive credentials are stored via Windows Credential Manager (with an encrypted fallback file if the OS keyring is unavailable). They are never written to browser storage or logs in full.

## Phone PWA

1. Keep the **Windows host running**. The phone talks to the laptop, not directly to the TV in this milestone.
2. In Settings, enable **Enable phone remote**.
3. Scan the QR code (local URL + one-time code). The code expires after a few minutes or first use.
4. Install the site as a PWA from the mobile browser if you want a home-screen icon.
5. You can revoke all phone sessions from Settings.

## Power

- Power off: `KEY_POWEROFF` over the network.
- Power on: **not supported** over Wi-Fi on this 2014 H-series set. Use the physical remote. Infrared bridges are a future interface only.

## Smart Hub

On this television, Smart Hub is **`KEY_CONTENTS`**. Do not assume `KEY_HOME` works.
