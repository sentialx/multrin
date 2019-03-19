<p align="center">
  <img src="static/app-icons/icon.png" width="256">
</p>

<div align="center">
  <h1>Multrin</h1>

[![AppVeyor](https://img.shields.io/appveyor/ci/sentialx/multrin.svg?style=for-the-badge)](https://ci.appveyor.com/project/sentialx/multrin)
[![Twitter](https://img.shields.io/twitter/follow/sentialx.svg?label=Follow&style=for-the-badge)](https://twitter.com/sentialx)
[![Downloads](https://img.shields.io/github/downloads/sentialx/multrin/total.svg?style=for-the-badge)](https://github.com/sentialx/multrin/releases)

Multrin is a ~~cross-platform~~ app built on top of  `Electron`, `React`, `styled-components` and `TypeScript`, that lets you to organize apps in tabs, by just dropping them onto Multrin. It aims to greatly improve your productivity and organization.

Multrin has been mainly created to be integrated with [Wexond](https://github.com/wexond/wexond) web browser.

</div>

> NOTE: Multrin works currently only on Windows since it's dependent on `node-window-manager` which also only supports Windows. I'm working on macOS and Linux support.

# Features

- Dark theme
- `Ctrl + Tab` keyboard shortcut to change selected tab

# Screenshots

![](screenshots/screen1.gif)

# [Roadmap](https://github.com/sentialx/multrin/projects)

# Components

Multrin has some very important components:

- Tabs from [Wexond](https://github.com/wexond/wexond)
- [`node-window-manager`](https://github.com/sentialx/node-window-manager) for managing the docked windows
- [`mouse-hooks`](https://github.com/sentialx/mouse-hooks) for listening to global mouse events, for example when dropping a window into Multrin.

# Running

Before running Multrin, please ensure you have [`Node.js`](https://nodejs.org/en/) installed on your machine. You can use `npm`, although I highly recommend to use `yarn`. In this guide I will use `yarn`.

To install `yarn`, please run:
```bash
$ npm i -g yarn
```

Also you will need build tools. To install them, please run as administrator:

```bash
$ npm i -g windows-build-tools
```

Firstly, run this command to install all needed dependencies. If you have encountered any problems, please report it. I will try to help as much as I can.

```bash
$ yarn
```

The given command below will run Multrin in the development mode.

```bash
$ yarn dev
```

## Other commands

You can also run other commands, for other tasks like building the app or linting the code, by using the commands described below.

### Usage:

Using `yarn`:

```bash
$ yarn <command>
```

Using `npm`:

```bash
$ npm run <command>
```

#### List of available commands:

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `build-production` | Bundles Multrin's source in production mode. |
| `compile-win32`    | Compiles Multrin binaries for Windows.       |
| `electron-rebuild` | Rebuilds all dependencies for `Electron`.    |
| `lint`             | Lints code.                                  |
| `lint-fix`         | Fixes eslint errors if any                   |
| `start`            | Starts Multrin.                              |
| `dev`              | Starts Multrin in the development mode       |

> NOTE: `compile-win32` command will produce publishing errors at the end. Just ignore them.

# Authors

[@sentialx](https://github.com/sentialx)

<a href="https://www.patreon.com/bePatron?u=12270966">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>
