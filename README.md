<div align="center">
  <h1>Multrin</h1>

[![AppVeyor](https://img.shields.io/appveyor/ci/sentialx/multrin.svg?style=flat-square)](https://ci.appveyor.com/project/sentialx/multrin)

Multrin is an app built on top of `Electron`, `React`, `styled-components` and `TypeScript` that lets you to organize windows in tabs, by just dragging them onto the app.

</div>

> NOTE: Multrin works currently only on Windows since it's dependent on `node-window-manager` which also only supports Windows. This may change in the future.

# Screenshots

![](screenshots/screen1.gif)

# Components

Multrin has two very important components:

- Tabs from [Wexond](https://github.com/wexond/wexond)
- [`node-window-manager`](https://github.com/sentialx/node-window-manager) for managing the docked windows
- [`mouse-hooks`](https://github.com/sentialx/mouse-hooks) for listening to global mouse events, for example when dropping a window into Multrin.

## Running

Before running Multrin, please ensure you have [`Node.js`](https://nodejs.org/en/) installed on your machine. You can use `npm`, although I highly recommend to use `yarn`. In this guide I will use `yarn`.

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

| Command            | Description                                 |
| ------------------ | ------------------------------------------- |
| `build-production` | Bundles Multrin's source in production mode.|
| `compile-win32`    | Compiles Multrin binaries for Windows.      |
| `electron-rebuild` | Rebuilds all dependencies for `Electron`.   |
| `lint`             | Lints code.                                 |
| `lint-fix`         | Fixes eslint errors if any                  |
| `start`            | Starts Multrin.                             |
| `dev`              | Starts Multrin in the development mode      |

# Authors

[@sentialx](https://github.com/sentialx)
