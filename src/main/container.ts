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
  weight: number;
}

const iohook = require('iohook');

export class Container {
  public id: number = id++;

  public columns: Column[] = [];
  public windows: ProcessWindow[] = [];

  private appWindow: AppWindow;
  private _handler: any;

  constructor(appWindow: AppWindow, window: ProcessWindow) {
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

  rearrangeWindows() {
    if (this.appWindow.isMinimized()) return;

    const area = this.appWindow.getContentArea();
    const colWidth = area.width / this.columns.length;

    /*
    let spaceLeft = area.width;

    const sortedCols = this.columns
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .filter(x => x.weight !== 1)
      .concat(this.columns.filter(x => x.weight === 1));

    for (let i = 0; i < sortedCols.length; i++) {
      const col = sortedCols[i];
      const colWidth = (spaceLeft / (sortedCols.length - i)) * col.weight;
      spaceLeft -= colWidth;
      col.width = colWidth;
    }
    */

    for (const col of this.columns) {
      col.width = colWidth;
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

  detachWindow(window: ProcessWindow) {
    window.detach();

    const handler = () => {
      setTimeout(() => {
        window.setBounds({
          width: window.initialBounds.width,
          height: window.initialBounds.height,
        });
      }, 50);
    };

    this._handler = handler;

    iohook.once('mouseup', handler);

    this.windows = this.windows.filter(x => x.id !== window.id);

    if (this.windows.length === 0) {
      this.appWindow.removeContainer(this);
    }
  }

  dragWindow(window: ProcessWindow, { x, y }: any) {
    const area = this.appWindow.getContentArea();
    const win = this.windows.find(x => x.id === window.id);

    if (win) {
      const col = this.columns.find(x => x.id === win.columnId);
      if (!col) return;

      win.dragged = true;

      if (
        (x > col.x + col.width ||
          x < col.x ||
          y < area.y ||
          y > area.y + area.height) &&
        col.rows.length === 1
      ) {
        this.columns = this.columns.filter(x => x.id !== win.columnId);
        this.detachWindow(win);
        return;
      }

      const row = col.rows.find(x => x.id === win.rowId);
      if (!row) return;

      if (
        y > row.y + row.height ||
        y < row.y ||
        x < col.x ||
        x > col.x + col.width
      ) {
        col.rows = col.rows.filter(x => x.id !== win.rowId);
        this.detachWindow(win);
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

  resizeWindow(window: ProcessWindow) {
    /*const win = this.windows.find(x => x.id === window.id);
    const col = this.columns.find(x => x.id === win.columnId);

    col.weight =
      win.getBounds().width /
      (this.appWindow.getContentArea().width / this.columns.length);

    this.columns[this.columns.indexOf(col) + 1].weight = 1;*/

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
