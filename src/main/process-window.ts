import { windowManager, Window } from 'node-window-manager';
import { appWindow } from '.';

const iohook = require('iohook');

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
    this.bringToTop();

    this.setBounds({
      width: this.initialBounds.width,
      height: this.initialBounds.height,
    });

    appWindow.webContents.send('remove-tab', this.id);
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
