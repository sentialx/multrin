import store from '.';

export class AddTabStore {
  public left = 0;

  public ref: HTMLDivElement;

  public setLeft(left: number, animation: boolean) {
    store.tabsStore.animateProperty('x', this.ref, left, animation);
    //animateTab('translateX', left, this.ref, animation);
    this.left = left;
  }
}
