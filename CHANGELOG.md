### ✨ Changelog

- Migrated to Tauri v2
- Added support for caption download
- Added new Settings page
- Added new Notifications page (will be used for app, component updates and broadcast messages)
- Added dynamic websocket server port configuration option in settings
- Added Node.js detection and installation option
- Changed RPM ffmpeg-free dependency to ffmpeg (as full ffmpeg is required for embedding captions)
- Improved single instance functionality by switching to tauri_plugin_single_instance from websocket based single instance detection
- Enabled app-updater (for supported packaging formats in Windows - exe, msi, MacOS - app)
- Minor fixes and improvements

### 📎 Minimum Requirements

- pytubepp v1.1.8
- pytubepp-extension v0.2.0

### 📝 Notes

> IMPORTANT: Linux (Fedora) users must need to [enable](https://docs.fedoraproject.org/en-US/quick-docs/rpmfusion-setup/#_enabling_the_rpm_fusion_repositories_using_command_line_utilities) RPM Fusion free+nonfree repos before installing this update (to avoid 'ffmpeg not found' error while installing the RPM package)

> IMPORTANT: MacOS users must re-click the 'Register' button after updating

> This is an Un-Signed Build (Windows doesn't trust this Certificate so, it may flag this as malicious software, in that case, disable Windows SmartScreen and Defender, install it, and then re-enable them)

> This is an Un-Signed Build (MacOS doesn't trust this Certificate so, it may flag this as from 'unverified developer' and prevent it from opening, in that case, open Settings and allow it from 'Settings > Privacy and Security' section to get started)

### ⬇️ Download Section

| Arch\OS | Windows (msi) ⬆️ | Windows (exe) ⬆️ | Linux (deb) | Linux (rpm) | MacOS (dmg) | MacOS (app) ⬆️ |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| x86_64 | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper_0.7.0_x64_en-US.msi) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper_0.7.0_x64-setup.exe) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper_0.7.0_amd64.deb) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper-0.7.0-1.x86_64.rpm) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper_0.7.0_x64.dmg) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper_x64.app.tar.gz) |
| ARM64 | N/A | N/A | N/A | N/A | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper_0.7.0_aarch64.dmg) | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/download/v0.7.0-beta/pytubepp-helper_aarch64.app.tar.gz) |

> ⬆️ icon indicates this packaging format supports in-built app-updater