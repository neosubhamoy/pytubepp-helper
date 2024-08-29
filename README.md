![PytubePPHelper](./assets/images/pytubepp-helper.png)

# PytubePP Helper

A Helper App for PytubePP Extension/Addon to Communicate with Pytube Post Processor CLI

[![status](https://img.shields.io/badge/status-active-brightgreen.svg?style=flat)](https://github.com/neosubhamoy/pytubepp-helper)
[![verion](https://img.shields.io/badge/version-v0.1.0_beta-yellow.svg?style=flat)](https://github.com/neosubhamoy/pytubepp-helper)
[![PRs](https://img.shields.io/badge/PRs-welcome-blue.svg?style=flat)](https://github.com/neosubhamoy/pytubepp-helper)

#### **🌟 Loved this Project? Don't forget to Star this Repo to show us your appreciation !!**

### 💻 Supported Platforms
- Windows 10 (v1803 or later)/11
- Linux (Coming Soon)
- MacOS (Maybe later :)

### 📎 Pre-Requirements

- [Python (>3.8)](https://www.python.org/downloads/)
- [FFmpeg](https://www.ffmpeg.org)
- [PytubePP](https://github.com/neosubhamoy/pytubepp)
* These requirements can be installed using PytubePP Helper (post installation) if [WinGet](https://learn.microsoft.com/en-us/windows/package-manager/winget/#install-winget) is installed in your system.

### ⬇️ Download and Installation

1. Download the latest release based on your OS and CPU Architecture

| Arch\OS | Windows | Linux | MacOS |
| :----        | :----   | :---- | :---- |
| x64 | [Download](https://github.com/neosubhamoy/pytubepp-helper/releases/latest) | N/A | N/A |
| x86 | N/A | N/A | N/A |
| ARM | N/A | N/A | N/A |

* Windows:

2. If you don't have any Pre-Requirements installed first install [WinGet](https://learn.microsoft.com/en-us/windows/package-manager/winget/#install-winget). Then restart your Computer.

3. Now open PytubePP Helper (from system tray not from start menu or shotcut) you will see (blue) 'install' buttons. First click on the install button on the right side of 'Python', a cmd window will popup to install Python. after the installation is finished then close the cmd window and now install 'FFmpeg' by clicking on the next install button. after the installation is finished close the cmd window and restart your Computer.

4. Again open PytubePP Helper (from system tray not from start menu or shotcut) and install PytubePP at last. after it finishes you can close the cmd window. Now click on the refresh button and you will see the 'Ready' message. Then close PytubePP Helper

5. You can now add the [PytubePP Extension](https://github.com/neosubhamoy/pytubepp-extension) in your browser and it should work properly with [PytubePP](https://github.com/neosubhamoy/pytubepp)

6. PRO TIPS:
- Make sure PytubePP Helper is always running in the background (system tray) otherwise PytubePP Extension will not work properly.
- Always open PytubePP Helper from system tray if it's already running. if you open PytubePP Helper from start menu or shotcut when PytubePP Helper is already running in system tray then two instances of PytubePP Helper will run on the same time which may cause the app to malfunction!
- PytubePP Helper by default always autostarts itself when Windows starts. Make sure autosart is not disabled for PytubePP Helper in Task Manager (Startup apps tab)

### ❔ How It Works

- PytubePP Helper is an intermediate communicator between PytubePP Extension and Pytube Post Processor CLI interface. It is used as a bridge to estblish communication between the System Shell / CMD and Browser Extension, as a Browser Extension can not directly talk (execute commands) with System Shell / CMD for security reasons. Browser Extensions are isolated from the system too, the only way they can communicate with the system (native apps only) is nativeMessaging API provided by Chrome (other Browsers provides it too). So, PytubePP Helper uses that API to communicate with the Browser Extension and recives it's requests and processes the data from PytubePP CLI then genrates a response and sends it to the Browser Extension. For further understanding view the system design diagram of PytubePP Helper app below:

![PytubePPHelperDiagram](./assets/images/pytubepp-helper-diagram.png)

### ⚡ Technologies Used

![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=%23FFFFFF)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![ShadCnUi](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)

### 🛠️ Contributing / Building from Source

Want to be part of this? Feel free to contribute...!! Pull Requests are always welcome...!! (^_^) Follow this simple steps to start building:

* Make sure to install Rust, Node.js and Git before proceeding.
1. Fork this repo in your github account.
2. Git clone the forked repo in your local machine.
3. Install node dependencies

```code
npm install
```
4. Run development / build process
```code
npm run tauri dev
```
```code
npm run tauri build
```
5. Do the changes, Send a Pull Request with proper Description (NOTE: Pull Requests Without Proper Description will be Rejected)

**⭕ Noticed any Bugs or Want to give us some suggetions? Always feel free to open a GitHub Issue. We would love to hear from you...!!**

### 📝 License

PytubePP Helper is Licensed under the [MIT license](https://github.com/neosubhamoy/pytubepp-helper/blob/main/LICENSE). Anyone can view, modify, use (personal and commercial) or distribute it's sources without any attribution and extra permissions.