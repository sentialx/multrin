import { AppWindow } from './app';
import { TOOLBAR_HEIGHT } from '~/renderer/views/app/constants/design';
import { PopupWindow } from './popup';
import { ipcMain } from 'electron';

const WIDTH = 400;
const HEIGHT = 500;

export class MenuWindow extends PopupWindow {
  public visible: boolean = false;

  public constructor(appWindow: AppWindow) {
    super(appWindow, 'menu');

    this.setBounds({
      height: HEIGHT,
      width: WIDTH,
    } as any);

    ipcMain.on(`hide-${this.id}`, () => {
      this.hide();
    });
  }

  public show() {
    super.show();
    this.rearrange();
    this.visible = true;
  }

  public hide() {
    super.hide();
    this.visible = false;
  }

  public toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  public rearrange() {
    const cBounds = this.appWindow.getContentBounds();
    this.setBounds({
      x: Math.round(cBounds.x + cBounds.width - WIDTH),
      y: cBounds.y + TOOLBAR_HEIGHT,
    } as any);
  }
}
