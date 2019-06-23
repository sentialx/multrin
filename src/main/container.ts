import { AppWindow } from './app-window';
import { ProcessWindow } from './process-window';

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
  }

  rearrangeWindows() {}

  addWindow(window: ProcessWindow, x: number, y: number) {
    window.dragged = true;

    for (const row of this.rows) {
      if (y <= row.position + row.size && y >= row.position + row.size - 50) {
        this.rows.push({
          id: rowId,
          count: 0,
          size: 0,
          position: 0,
        });
        window.rowId = rowId;
        rowId++;

        break;
      }
    }

    this.rearrangeWindows();
  }
}
