<p align="center">
  <img src="static/app-icons/icon.png" width="256">
</p>

<div align="center">
  <h1>Multrin</h1>

[![Travis](https://img.shields.io/travis/com/sentialx/multrin.svg?style=flat-square)](https://travis-ci.com/sentialx/multrin)
[![Downloads](https://img.shields.io/github/downloads/sentialx/multrin/total.svg?style=flat-square)](https://github.com/sentialx/multrin/releases)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsentialx%2Fmultrin.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsentialx%2Fmultrin?ref=badge_shield)
[![PayPal](https://img.shields.io/badge/PayPal-Donate-brightgreen?style=flat-square)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=VCPPFUAL4R6M6&source=url)
[![Discord](https://discordapp.com/api/guilds/307605794680209409/widget.png?style=shield)](https://discord.gg/P7Vn4VX)

Multrin is a cross-platform app built on Electron that lets you to organize apps in tabs by simply dropping them onto Multrin. It aims to greatly improve your productivity and organization.

</div>

> NOTE: Multrin works currently only on Windows and macOS. Support for Linux coming soon.

# Features

- Dark theme
- <kbd>Ctrl</kbd>+<kbd>Tab</kbd> keyboard shortcut to change selected tab

# Screenshots

![gif](https://user-images.githubusercontent.com/11065386/62975420-96351880-be1a-11e9-9b95-fa63b970620a.gif)

![image](https://user-images.githubusercontent.com/11065386/62975121-ff685c00-be19-11e9-81cb-073c97bf61d9.png)

# [Roadmap](https://github.com/sentialx/multrin/projects)

# Components

Multrin has some very important components:

- Tabs from [Wexond](https://github.com/wexond/wexond)
- [`node-window-manager`](https://github.com/sentialx/node-window-manager) for managing the docked windows

# Contributing

If you have found any bugs or just want to see some new features in Multrin, feel free to open an issue. I'm open to any suggestions and bug reports would be really helpful for me and appreciated very much. Multrin is in heavy development and some bugs may occur. Also, please don't hesitate to open a pull request. This is really important to me and for the further development of this project.

## Running

Before running Multrin in development mode, please ensure you have [`Node.js`](https://nodejs.org/en/) installed on your machine.

When running on Windows, make sure you have build tools installed. You can install them by running as **administrator**:

```bash
$ npm i -g windows-build-tools
```

Firstly, run this command to install all needed dependencies. If you have encountered any problems, please report it. I will try to help as much as I can.

```bash
$ npm i
```

Now the native modules need to be rebuilt with Electron's headers. To do that, please run:

```bash
$ npm run rebuild
```

The given command below will run Multrin in the development mode.

```bash
$ npm run dev
```

And in other terminal:

```bash
$ npm start
```

### Sponsors

[![Sponsors](https://opencollective.com/multrin/tiers/sponsor.svg?avatarHeight=48)](https://opencollective.com/multrin)

### Backers

[![Backers](https://opencollective.com/multrin/tiers/backer.svg?avatarHeight=48)](https://opencollective.com/multrin)

<a href="https://www.patreon.com/bePatron?u=12270966">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsentialx%2Fmultrin.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsentialx%2Fmultrin?ref=badge_large)
