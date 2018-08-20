import { observer } from "mobx-react";
import React from "react";

import StyledPage from "./styles";
import { Page, Tab } from "../../models";
import store from "@app/store";

@observer
export default class extends React.Component<{ page: Page }> {
  private tab: Tab;

  public componentDidMount() {
    const { page } = this.props;
    const { id } = page;
    const tab = store.tabsStore.getTabById(id);

    this.tab = tab;
  }

  public componentWillUnmount() {
    store.isHTMLFullscreen = false;
  }

  public render() {
    const { page } = this.props;
    const { id } = page;

    return <StyledPage selected={store.tabsStore.selectedTab === id} />;
  }
}
