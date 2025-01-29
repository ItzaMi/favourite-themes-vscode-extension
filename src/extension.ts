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
  const selectThemeCommand = vscode.commands.registerCommand(
    "favourite-themes.selectTheme",
    async (theme?: string) => {
      try {
        if (!theme) {
          const favouriteThemes = context.globalState.get<string[]>(
            "favouriteThemes",
            []
          );
          theme = await vscode.window.showQuickPick(favouriteThemes, {
            placeHolder: "Select a theme to apply",
          });
          if (!theme) {
            vscode.window.showErrorMessage("No theme selected.");
            return;
          }
        }
        await vscode.workspace
          .getConfiguration()
          .update("workbench.colorTheme", theme, true);
        vscode.window.showInformationMessage(`Theme changed to ${theme}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(
          `Failed to change theme: ${errorMessage}`
        );
      }
    }
  );

  context.subscriptions.push(selectThemeCommand);

  const treeDataProvider = new ThemeProvider(context);
  vscode.window.registerTreeDataProvider("bookmarks", treeDataProvider);

  const addThemeCommand = vscode.commands.registerCommand(
    "favourite-themes.addTheme",
    async () => {
      try {
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
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to add theme: ${errorMessage}`);
      }
    }
  );

  context.subscriptions.push(addThemeCommand);

  const removeThemeCommand = vscode.commands.registerCommand(
    "favourite-themes.removeTheme",
    async () => {
      try {
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
            await context.globalState.update(
              "favouriteThemes",
              favouriteThemes
            );
            treeDataProvider.refresh();
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(
          `Failed to remove theme: ${errorMessage}`
        );
      }
    }
  );

  context.subscriptions.push(removeThemeCommand);

  const addCurrentThemeCommand = vscode.commands.registerCommand(
    "favourite-themes.addCurrentTheme",
    async () => {
      try {
        const currentTheme = vscode.workspace
          .getConfiguration()
          .get<string>("workbench.colorTheme");
        vscode.window.showInformationMessage(
          `Current theme is ${currentTheme}`
        );
        const favouriteThemes = context.globalState.get<string[]>(
          "favouriteThemes",
          []
        );

        if (currentTheme && !favouriteThemes.includes(currentTheme)) {
          favouriteThemes.push(currentTheme);
          await context.globalState.update("favouriteThemes", favouriteThemes);
          treeDataProvider.refresh();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(
          `Failed to add current theme: ${errorMessage}`
        );
      }
    }
  );

  context.subscriptions.push(addCurrentThemeCommand);
}
