import { Window } from 'node-window-manager';
import { AppWindow } from './app-window';

const iohook = require('iohook');

export class ProcessWindow extends Window {
  public resizable = false;
  public maximizable = false;
  public minimizable = false;

  public lastTitle: string;

  public opacity: number;

  public lastBounds: any;
  public initialBounds: any;

  public parentWindow: AppWindow;

  public dragged = false;
  public rowId: number;
  public columnId: number;

  constructor(handle: any, appWindow: AppWindow) {
    super(handle);

    this.lastBounds = this.getBounds();
    this.initialBounds = this.getBounds();

    this.parentWindow = appWindow;
  }

  public detach() {
    this.setOwner(null);

    setTimeout(() => {
      this.bringToTop();
    }, 50);

    iohook.once('mouseup', () => {
      setTimeout(() => {
        this.setBounds({
          width: this.initialBounds.width,
          height: this.initialBounds.height,
        });
      }, 50);
    });
  }

  public show() {
    this.setOpacity(1);
    this.toggleTransparency(false);
    this.bringToTop();
  }

  public hide() {
    this.toggleTransparency(true);
    this.setOpacity(0);
  }
}
