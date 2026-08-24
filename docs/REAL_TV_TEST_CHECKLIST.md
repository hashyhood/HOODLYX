# Real television test checklist — Samsung UA55H6400

**Never mark an item passed unless it was tested against the physical television.**

Environment used for this repository snapshot: cloud agent **without** the household TV on the LAN. Every hardware line below is **untested** until you run it.

| # | Check | Passed on physical TV? |
| --- | --- | --- |
| 1 | TV and laptop are on the same local network | ☐ untested |
| 2 | TV IP is correct | ☐ untested |
| 3 | Port 8080 was tested | ☐ untested |
| 4 | Port 8000 was tested | ☐ untested |
| 5 | Pairing request appeared on TV | ☐ untested |
| 6 | Four-digit PIN was accepted | ☐ untested |
| 7 | Token and session ID were stored | ☐ untested |
| 8 | KEY_VOLUP worked | ☐ untested |
| 9 | KEY_VOLDOWN worked | ☐ untested |
| 10 | Mute worked | ☐ untested |
| 11 | Directional navigation worked | ☐ untested |
| 12 | Enter worked | ☐ untested |
| 13 | Back worked | ☐ untested |
| 14 | Smart Hub opened with KEY_CONTENTS | ☐ untested |
| 15 | Source worked | ☐ untested |
| 16 | Guide worked | ☐ untested |
| 17 | Channel controls worked | ☐ untested |
| 18 | Numeric keypad worked | ☐ untested |
| 19 | Playback controls were tested | ☐ untested |
| 20 | Power-off worked | ☐ untested |
| 21 | Application restart did not require pairing again | ☐ untested |
| 22 | Phone connected through the QR flow | ☐ untested |
| 23 | Phone command controlled the TV | ☐ untested |
| 24 | Laptop keyboard shortcuts worked | ☐ untested |
| 25 | Reconnection after temporary Wi-Fi loss worked | ☐ untested |
| 26 | No sensitive credentials appeared in logs | ☐ untested |
| 27 | Windows packaged build worked on a clean user account | ☐ untested |

Record TV software version here when known: `________________`

Probe command:

```text
python tools/h6400_probe.py --host <TV_IP> --verbose
```
