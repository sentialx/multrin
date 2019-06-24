import { AppWindow } from './app-window';
import { ProcessWindow } from './process-window';
import console = require('console');
import { platform } from 'os';

let id = 1;
let spaceId = 0;

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

    let colId = spaceId++;
    let rowId = spaceId++;

    this.columns.push({
      id: colId,
      rows: [
        {
          id: rowId,
        },
      ],
    });

    window.rowId = rowId;
    window.columnId = colId;
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
        const row = col.rows[j];
        row.y = j * rowHeight;
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
      const col = this.columns.find(x => x.id === win.columnId);
      if (!col) return;

      win.dragged = true;

      if (
        (x - area.x > col.x + col.width ||
          x - area.x < col.x ||
          y < area.y ||
          y > area.y + area.height) &&
        col.rows.length === 1
      ) {
        this.columns = this.columns.filter(x => x.id !== win.columnId);
        this.windows = this.windows.filter(x => x.id !== win.id);
        return;
      }

      const row = col.rows.find(x => x.id === win.rowId);
      if (!row) return;

      if (y - area.y > row.y + row.height || y - area.y < row.y) {
        col.rows = col.rows.filter(x => x.id !== win.rowId);
        this.windows = this.windows.filter(x => x.id !== win.id);
      }
    } else {
      for (const col of this.columns) {
        if (
          x - area.x < col.x ||
          x - area.x > col.x + col.width ||
          y < area.y ||
          y > area.y + area.height
        ) {
          continue;
        }

        let dirX = -1;
        let dirY = -1;
        let colId = -1;
        let rowId = -1;

        if (x - area.x <= col.x + 50 && x - area.x >= col.x) {
          dirX = 0;
        } else if (
          x - area.x <= col.x + col.width &&
          x - area.x >= col.x + col.width - 50
        ) {
          dirX = 1;
        }

        if (dirX !== -1) {
          colId = spaceId++;
          rowId = spaceId++;

          this.columns.splice(this.columns.indexOf(col) + dirX, 0, {
            id: colId,
            rows: [
              {
                id: rowId,
              },
            ],
          });
        } else {
          for (const row of col.rows) {
            if (y - area.y <= row.y + 50 && y - area.y >= row.y) {
              dirY = 0;
            } else if (
              y - area.y <= row.y + row.height &&
              y - area.y >= row.y + row.height - 50
            ) {
              dirY = 1;
            }

            if (dirY !== -1) {
              rowId = spaceId++;
              colId = col.id;

              col.rows.splice(col.rows.indexOf(row) + dirY, 0, {
                id: rowId,
              });

              break;
            }
          }
        }

        if (dirY !== -1 || dirX !== -1) {
          window.rowId = rowId;
          window.columnId = colId;

          if (platform() === 'win32') {
            const handle = this.appWindow
              .getNativeWindowHandle()
              .readInt32LE(0);
            window.setOwner(handle);
          }

          this.windows.push(window);

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
