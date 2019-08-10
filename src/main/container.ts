import { AppWindow } from './app-window';
import { ProcessWindow } from './process-window';
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
  weight: number;
  lastWidth?: number;
}

const iohook = require('iohook');

export class Container {
  public id: number = id++;

  public columns: Column[] = [];
  public windows: ProcessWindow[] = [];

  private appWindow: AppWindow;
  private _handler: any;

  public constructor(appWindow: AppWindow, window: ProcessWindow) {
    this.appWindow = appWindow;

    let colId = spaceId++;
    let rowId = spaceId++;

    this.columns.push({
      id: colId,
      weight: 1,
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

  public rearrangeWindows() {
    if (this.appWindow.isMinimized()) return;

    const area = this.appWindow.getContentArea();
    const colWidth = area.width / this.columns.length;

    for (const col of this.columns) {
      col.width = Math.round(colWidth * col.weight);
      col.lastWidth = col.width;
    }

    let left = 0;

    for (const col of this.columns) {
      const rowHeight = area.height / col.rows.length;

      col.x = area.x + left;
      left += col.width;

      for (let j = 0; j < col.rows.length; j++) {
        const row = col.rows[j];
        row.y = area.y + j * rowHeight;
        row.height = rowHeight;

        const window = this.windows.find(
          x => x.rowId === row.id && x.columnId === col.id,
        );

        if (window && !window.dragged) {
          const bounds: any = {
            x: col.x,
            y: row.y,
            width: col.width,
            height: row.height,
          };

          window.setBounds(bounds);
          window.lastBounds = bounds;
        }
      }
    }
  }

  public removeWindow(id: number) {
    const win = this.windows.find(x => x.id === id);
    if (!win) return;

    const col = this.columns.find(x => x.id === win.columnId);
    if (!col) return;

    if (col.rows.length === 1) {
      this.columns = this.columns.filter(x => x.id !== win.columnId);
      this.detachWindow(win);
    }

    if (!col) return;

    const row = col.rows.find(x => x.id === win.rowId);
    if (!row) return;

    col.rows = col.rows.filter(x => x.id !== win.rowId);
    this.detachWindow(win);

    for (const c of this.columns) {
      c.weight = 1;
    }

    this.rearrangeWindows();
  }

  public detachWindow(window: ProcessWindow) {
    window.detach();

    const handler = () => {
      setTimeout(() => {
        if (this.windows.length === 0) {
          this.appWindow.removeContainer(this);
        }

        const b = window.getBounds();
        const a = this.appWindow.getBounds();

        if (
          b.x < a.x ||
          b.x > a.x + a.width ||
          b.y < a.y ||
          b.y > a.y + a.height
        ) {
          window.setBounds({
            width: window.initialBounds.width,
            height: window.initialBounds.height,
          });
        }
      }, 50);
    };

    this._handler = handler;

    iohook.once('mouseup', handler);

    this.windows = this.windows.filter(x => x.id !== window.id);
  }

  public dragWindow(window: ProcessWindow, { x, y }: any) {
    const area = this.appWindow.getContentArea();
    const win = this.windows.find(x => x.id === window.id);

    if (win) {
      if (win.resizing) return;

      const col = this.columns.find(x => x.id === win.columnId);
      if (!col) return;

      const row = col.rows.find(x => x.id === win.rowId);

      win.dragged = true;

      if (
        x > col.x + col.width ||
        x < col.x ||
        y < area.y ||
        y > area.y + area.height ||
        ((row && y > row.y + row.height) || y < row.y)
      ) {
        this.removeWindow(win.id);
      }
    } else {
      for (const col of this.columns) {
        if (
          x < col.x ||
          x > col.x + col.width ||
          y < area.y ||
          y > area.y + area.height
        ) {
          continue;
        }

        let dirX = -1;
        let dirY = -1;
        let colId = -1;
        let rowId = -1;

        if (x <= col.x + 50 && x >= col.x) {
          dirX = 0;
        } else if (x <= col.x + col.width && x >= col.x + col.width - 50) {
          dirX = 1;
        }

        if (dirX !== -1) {
          colId = spaceId++;
          rowId = spaceId++;

          this.columns.splice(this.columns.indexOf(col) + dirX, 0, {
            id: colId,
            weight: 1,
            rows: [
              {
                id: rowId,
              },
            ],
          });
        } else {
          for (const row of col.rows) {
            if (y <= row.y + 50 && y >= row.y) {
              dirY = 0;
            } else if (
              y <= row.y + row.height &&
              y >= row.y + row.height - 50
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
          window.dragged = true;
          if (this._handler) {
            iohook.off('mouseup', this._handler);
          }

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

  public resizeWindow(window: ProcessWindow) {
    const win = this.windows.find(x => x.id === window.id);
    const col = this.columns.find(x => x.id === win.columnId);
    const affectedCol = this.columns[this.columns.indexOf(col) + 1];

    win.dragged = false;
    win.resizing = true;

    const baseWidth =
      this.appWindow.getContentArea().width / this.columns.length;

    const change = win.getBounds().width - col.lastWidth;

    col.width += change;
    affectedCol.width -= change;

    for (const c of this.columns) {
      c.weight = c.width / baseWidth;
    }

    this.rearrangeWindows();
  }

  public showWindows() {
    for (const window of this.windows) {
      window.show();
    }

    this.rearrangeWindows();
  }

  public hideWindows() {
    for (const window of this.windows) {
      window.hide();
    }
  }
}
