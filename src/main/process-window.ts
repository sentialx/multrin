import { Window } from 'node-window-manager';
import { appWindow } from '.';

export class ProcessWindow extends Window {
  public resizable = false;
  public maximizable = false;
  public minimizable = false;

  public lastTitle: string;

  public opacity: number;

  public lastBounds: any;
  public initialBounds: any;

  constructor(handle: number) {
    super(handle);

    this.lastBounds = this.getBounds();
    this.initialBounds = this.getBounds();
  }

  public detach() {
    this.setOwner(null);

    appWindow.webContents.send('remove-tab', this.id);

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
