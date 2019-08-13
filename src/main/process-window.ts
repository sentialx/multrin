import { Window } from 'node-window-manager';
import { AppWindow } from './windows/app';

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

  public detach() {
    this.setOwner(null);

    setTimeout(() => {
      this.bringToTop();
    }, 50);
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
