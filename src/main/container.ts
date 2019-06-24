import { AppWindow } from './app-window';
import { ProcessWindow } from './process-window';
import console = require('console');
import { platform } from 'os';

let id = 1;
let rowId = 0;

interface Row {
  id: number;
  height?: number;
  y?: number;
}

interface Column {
  id: number;
  width?: number;
  x?: number;
  rows: Row[];
}

export class Container {
  public id: number = id++;

  private appWindow: AppWindow;

  public columns: Column[] = [];

  public windows: ProcessWindow[] = [];

  constructor(appWindow: AppWindow, window: ProcessWindow) {
    this.appWindow = appWindow;

    this.columns.push({
      id: rowId++,
      rows: [
        {
          id: rowId++,
        },
      ],
    });

    window.rowId = 0;
    window.dragged = true;

    this.windows.push(window);

    this.rearrangeWindows();
  }

  rearrangeWindows() {
    if (this.appWindow.isMinimized()) return;

    const area = this.appWindow.getContentArea();

    const colWidth = area.width / this.columns.length;

    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      const rowHeight = area.height / col.rows.length;

      col.x = i * colWidth;
      col.width = colWidth;

      for (let j = 0; j < col.rows.length; j++) {
        const row = col.rows[i];
        row.y = i * rowHeight;
        row.height = rowHeight;

        const window = this.windows.find(
          x => x.rowId === row.id && x.columnId === col.id,
        );
        if (window && !window.dragged) {
          const bounds: any = {
            x: area.x + col.x,
            y: area.y + row.y,
            width: col.width,
            height: row.height,
          };

          window.setBounds(bounds);
          window.lastBounds = bounds;
        }
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
