import { Window } from 'node-window-manager';
import { AppWindow } from './windows/app';
import { iohook } from '.';
import { release } from 'os';

const CAN_USE_GETTITLE =
  process.platform !== 'darwin' ||
  (process.platform === 'darwin' && !release().startsWith('19'));

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
  public resizing = false;

  public rowId: number;
  public columnId: number;

  public constructor(handle: any, appWindow: AppWindow) {
    super(handle);

    this.lastBounds = this.getBounds();
    this.initialBounds = this.getBounds();

    this.parentWindow = appWindow;
  }

  public detach(mouseup = false) {
    const handler = () => {
      setTimeout(() => {
        const b = this.getBounds();
        const a = this.parentWindow.getBounds();

        if (
          b.x < a.x ||
          b.x > a.x + a.width ||
          b.y < a.y ||
          b.y > a.y + a.height
        ) {
          this.setBounds({
            width: this.initialBounds.width,
            height: this.initialBounds.height,
          });
        }

        if (process.platform === 'win32') {
          this.parentWindow.window.bringToTop();
          this.setOwner(null);
          this.bringToTop();
        }
      }, 50);
    };

    if (mouseup) {
      handler();
    } else {
      iohook.once('mouseup', handler);
    }
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

  public getTitle() {
    if (CAN_USE_GETTITLE) return super.getTitle();
    return '';
  }
}
