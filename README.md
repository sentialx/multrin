# Multrin
Multrin is an app built on top of `Electron`, `React`, `styled-components` and `TypeScript` that lets you to organize windows in tabs, by just dragging them onto the app.

> NOTE: Multrin works currently only on Windows since it's dependent on `node-window-manager` which also only supports Windows. This may change in the future.

# Components
Multrin has two very important components:
- Tabs from [Wexond](https://github.com/wexond/wexond)
- [`node-window-manager`](https://github.com/sentialx/node-window-manager) for managing the docked windows
- [`mouse-hooks`](https://github.com/sentialx/mouse-hooks) for listening to global mouse events, for example when dropping a window into Multrin.

# Authors
[@sentialx](https://github.com/sentialx)
