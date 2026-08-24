# Troubleshooting

Do not silently switch to Tizen ports 8001/8002. One timeout does not mean the TV is unsupported. Pairing and remote ports are configurable.

## Incorrect TV IP

The host is not the television. Recheck the DHCP reservation or the TV network menu. Public internet addresses are rejected.

## TV offline

The set is powered off, sleeping, or off the Wi-Fi. Wake it with the physical remote. Network power-on is not available on UA55H6400.

## Port timeout (8080 or 8000)

Firewall, AP isolation, wrong VLAN, or the TV ignored the SYN. Try again, confirm the IP, disable guest isolation, pause the VPN. Then try `--auth-port` / `--remote-port` variants.

## Port refused

Something at that IP closed the port. Confirm it is the TV. Firmware may use a different pairing or remote port.

## No PIN appears

The pairing HTTP call did not open `CloudPINPage`. TV was not on, IP is wrong, port 8080 is wrong, or regional firmware differs. Watch the TV while pressing Start pairing.

## PIN rejected

Wrong four digits, PIN expired, or pairing step failed. Request a new PIN. The app validates `^\d{4}$` before sending.

## Pairing succeeds but control fails

Port 8080 worked; port 8000 did not, or the encrypted websocket was refused. Test both ports. Re-pair if the session ID was missing.

## Stored credentials rejected

The TV forgot the controller, or credentials were reset. The app marks them invalid and stops retrying forever. Use Reset pairing / Re-pair.

## Phone cannot reach laptop

The Windows host is not running, phone access is off, or the phone is on another SSID. The phone remote **requires** the Windows host.

## Windows Firewall blocks phone access

Allow inbound TCP on the host port for the **Private** profile only. The app never creates broad firewall rules without consent. See the text shown when you enable phone access.

## Laptop and phone on different networks

Same router SSID, no guest network, no cellular offload.

## Router guest isolation

Disable AP isolation / client isolation / guest mode.

## VPN interference

Pause RFC1918-breaking VPNs on the laptop (and phone, if they force all traffic through a tunnel).

## Regional or firmware protocol variation

H-series encrypted ports are not guaranteed identical worldwide. Record the TV software version in Setup and try alternate auth/remote ports. Still do not switch to 8001/8002 as a hidden fallback.
