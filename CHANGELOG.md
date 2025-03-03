### ✨ Changelog

- Added support for Arch Linux
- Added Extension Manager (to manage unpacked pytubepp-extension - unpacking, updating)
- Added app theme preference option in settings
- Added update notification preference toggle in settings
- Minor fixes and improvements

### 📎 Minimum Requirements

- pytubepp v1.1.8
- pytubepp-extension v0.2.0

### 📝 Notes

> ⭐ **IMPORTANT:** Linux (Fedora) users must need to [enable](https://docs.fedoraproject.org/en-US/quick-docs/rpmfusion-setup/#_enabling_the_rpm_fusion_repositories_using_command_line_utilities) RPM Fusion free+nonfree repos before installing this update (to avoid 'ffmpeg not found' error while installing the RPM package)

> ⭐ **IMPORTANT:** MacOS users must re-click the 'register to mac' icon after updating

> This is an Un-Signed Build (Windows doesn't trust this Certificate so, it may flag this as malicious software, in that case, disable Windows SmartScreen and Defender, install it, and then re-enable them)

> This is an Un-Signed Build (MacOS doesn't trust this Certificate so, it may flag this as from 'unverified developer' and prevent it from opening, in that case, open Settings and allow it from 'Settings > Privacy and Security' section to get started)

### ⬇️ Download Section

| Arch\OS | Windows (msi) ⬆️ | Windows (exe) ⬆️ | Linux (deb) | Linux (rpm) | MacOS (dmg) | MacOS (app) ⬆️ |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| x86_64 | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper_0.8.0_x64_en-US.msi) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper_0.8.0_x64-setup.exe) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper_0.8.0_amd64.deb) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper-0.8.0-1.x86_64.rpm) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper_0.8.0_x64.dmg) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper_x64.app.tar.gz) |
| ARM64 | N/A | N/A | N/A | N/A | ⚠️ [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper_0.8.0_aarch64.dmg) | ⚠️ [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.8.0-beta/pytubepp-helper_aarch64.app.tar.gz) |

> ⬆️ icon indicates this packaging format supports in-built app-updater

> ⚠️ ARM64 binaries are experimental and may not work properly on Apple Silicon Macs (You might see 'Damaged File' warning) it's because the binaries are not signed and Apple Silicon Macs don't allow unsigned apps (downloaded from internet) to be installed on the system (also I'm not planning to sign it soon as it costs 99$/year, which I can't afford RN!). If you want to use pytubepp-helper in your Apple Silicon Macs then you have to [compile it from source](https://github.com/neosubhamoy/pytubepp-helper?tab=readme-ov-file#%EF%B8%8F-contributing--building-from-source) in your Mac