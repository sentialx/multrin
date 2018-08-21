const { windowsManager } = require("window-manager");

windowsManager.createMouseUpHook(() => {
  process.send("mouseup");
});
