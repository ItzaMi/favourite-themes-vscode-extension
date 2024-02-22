import * as vscode from "vscode";

class ThemeProvider implements vscode.TreeDataProvider<string> {
  private _onDidChangeTreeData: vscode.EventEmitter<string | undefined> =
    new vscode.EventEmitter<string | undefined>();
  readonly onDidChangeTreeData: vscode.Event<string | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(element: string): vscode.TreeItem {
    let treeItem = new vscode.TreeItem(element);
    treeItem.command = {
      command: "favourite-themes.selectTheme",
      title: "Select Theme",
      arguments: [element],
    };
    return treeItem;
  }

  getChildren(element?: string): Thenable<string[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      const favouriteThemes = this.context.globalState.get<string[]>(
        "favouriteThemes",
        []
      );
      return Promise.resolve(favouriteThemes);
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "favourite-themes.selectTheme",
    async (theme: string) => {
      await vscode.workspace
        .getConfiguration()
        .update("workbench.colorTheme", theme, true);
      vscode.window.showInformationMessage(`Theme changed to ${theme}`);
    }
  );

  context.subscriptions.push(disposable);

  const treeDataProvider = new ThemeProvider(context);
  vscode.window.registerTreeDataProvider("bookmarks", treeDataProvider);

  disposable = vscode.commands.registerCommand(
    "favourite-themes.addTheme",
    async () => {
      const theme = await vscode.window.showInputBox({
        prompt: "Enter the name of the theme",
      });
      if (theme) {
        const favouriteThemes = context.globalState.get<string[]>(
          "favouriteThemes",
          []
        );
        favouriteThemes.push(theme);
        await context.globalState.update("favouriteThemes", favouriteThemes);
        treeDataProvider.refresh();
      }
    }
  );

  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "favourite-themes.removeTheme",
    async () => {
      const favouriteThemes = context.globalState.get<string[]>(
        "favouriteThemes",
        []
      );
      const theme = await vscode.window.showQuickPick(favouriteThemes, {
        placeHolder: "Select a theme to remove",
      });
      if (theme) {
        const index = favouriteThemes.indexOf(theme);
        if (index > -1) {
          favouriteThemes.splice(index, 1);
          await context.globalState.update("favouriteThemes", favouriteThemes);
          treeDataProvider.refresh();
        }
      }
    }
  );

  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "favourite-themes.addCurrentTheme",
    () => {
      const currentTheme = vscode.workspace
        .getConfiguration()
        .get("workbench.colorTheme");
      vscode.window.showInformationMessage(`Current theme is ${currentTheme}`);
      const favouriteThemes = context.globalState.get<string[]>(
        "favouriteThemes",
        []
      );

      if (currentTheme && !favouriteThemes.includes(currentTheme as string)) {
        favouriteThemes.push(currentTheme as string);
        context.globalState.update("favouriteThemes", favouriteThemes);
        treeDataProvider.refresh();
      }
    }
  );
}
