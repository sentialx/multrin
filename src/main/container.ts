import { AppWindow } from './app-window';
import { ProcessWindow } from './process-window';
import console = require('console');
import { platform } from 'os';

let id = 1;
let rowId = 1;

interface Space {
  id: number;
  count: number;
  size: number;
  position: number;
}

export class Container {
  public id: number = id++;

  private appWindow: AppWindow;

  public rows: Space[] = [];
  public columns: Space[] = [];

  public windows: ProcessWindow[] = [];

  constructor(appWindow: AppWindow, window: ProcessWindow) {
    this.appWindow = appWindow;

    this.rows.push({
      id: 0,
      count: 1,
      size: 0,
      position: 0,
    });

    window.rowId = 0;
    window.dragged = true;

    this.windows.push(window);

    this.rearrangeWindows();
  }

  rearrangeWindows() {
    if (this.appWindow.isMinimized()) return;

    const area = this.appWindow.getContentArea();

    const rowHeight = area.height / this.rows.length;

    for (const row of this.rows) {
      row.position = this.rows.indexOf(row) * rowHeight;
      row.size = rowHeight;

      const window = this.windows.find(x => x.rowId === row.id);
      if (window && !window.dragged) {
        const bounds: any = {
          x: area.x,
          y: area.y + row.position,
          width: area.width,
          height: row.size,
        };

        window.setBounds(bounds);
        window.lastBounds = bounds;
      }
    }
  }

  addWindow(window: ProcessWindow, { x, y }: any) {
    const area = this.appWindow.getContentArea();

    const win = this.windows.find(x => x.id === window.id);

    if (win) {
      const row = this.rows.find(x => x.id === win.rowId);

      win.dragged = true;

      if (row) {
        if (y - area.y > row.position + row.size || y - area.y < row.position) {
          this.rows = this.rows.filter(x => x.id !== win.rowId);
          this.windows = this.windows.filter(x => x.id !== win.id);
        }
      }
    } else {
      for (const row of this.rows) {
        let dir = -1;

        if (y - area.y <= row.position + 50 && y - area.y >= row.position) {
          dir = 0;
        } else if (
          y - area.y <= row.position + row.size &&
          y - area.y >= row.position + row.size - 50
        ) {
          dir = 1;
        }

        if (dir !== -1) {
          this.rows.splice(this.rows.indexOf(row) + dir, 0, {
            id: rowId,
            count: 0,
            size: 0,
            position: 0,
          });

          window.rowId = rowId;

          if (platform() === 'win32') {
            const handle = this.appWindow
              .getNativeWindowHandle()
              .readInt32LE(0);
            window.setOwner(handle);
          }

          this.windows.push(window);

          rowId++;

          break;
        }
      }
    }

    this.rearrangeWindows();
  }

  showWindows() {
    for (const window of this.windows) {
      window.show();
    }
  }

  hideWindows() {
    for (const window of this.windows) {
      window.hide();
    }
  }
}
