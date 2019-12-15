import { AppWindow } from './app';
import { TOOLBAR_HEIGHT } from '~/renderer/views/app/constants/design';
import { PopupWindow } from './popup';
import { ipcMain } from 'electron';

const WIDTH = 300;
const HEIGHT = 182;

export class MenuWindow extends PopupWindow {
  public visible = false;

  public constructor(appWindow: AppWindow) {
    super(appWindow, 'menu');

    this.setBounds({
      height: HEIGHT,
      width: WIDTH,
    } as any);

    ipcMain.on(`hide-${this.id}`, () => {
      this.hide();
    });

    this.on('blur', () => {
      this.hide();
    });
  }

  public show() {
    this.rearrange();
    super.show();
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
      x: Math.floor(cBounds.x + cBounds.width - WIDTH - 8),
      y: cBounds.y + TOOLBAR_HEIGHT,
      width: WIDTH,
      height: HEIGHT,
    } as any);
  }
}
