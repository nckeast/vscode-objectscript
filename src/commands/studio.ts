import * as vscode from "vscode";
import { AtelierAPI } from "../api";
import { FILESYSTEM_SCHEMA } from "../extension";
import { currentFile, outputChannel } from "../utils";
import { loadChanges } from "./compile";

interface StudioAction extends vscode.QuickPickItem {
  name: string;
  id: string;
}

function doMenuAction(uri: vscode.Uri, menuType: string): Promise<any> {
  uri = uri || vscode.window.activeTextEditor.document.uri;
  if (uri.scheme !== FILESYSTEM_SCHEMA) {
    return;
  }
  const query = "select * from %Atelier_v1_Utils.Extension_GetMenus(?,?,?)";
  const name = uri.path.slice(1).replace(/\//g, ".");
  const api = new AtelierAPI(uri.authority);
  const parameters = [menuType, name, ""];
  return api
    .actionQuery(query, parameters)
    .then(data => data.result.content)
    .then(menu =>
      menu.reduce(
        (list, sub) =>
          list.concat(
            sub.items
              .filter(el => el.id !== "" && el.separator == 0 && el.enabled == 1)
              .map(el => ({ ...el, id: `${sub.id},${el.id}`, label: el.name.replace('&',''), itemId: el.id, type: sub.type }))
          ),
        []
      )
    )
    .then(menuItems =>
      menuItems.filter((item: any, index: number, self: any) => {
        if (item && item.type === "main") {
          return true;
        }
        return self.findIndex((el): boolean => el.itemId === item.itemId) === index;
      })
    )
    .then(menuItems => {
      return vscode.window.showQuickPick<StudioAction>(menuItems, { canPickMany: false });
    })
    .then(action => {
      if (!action) {
        return;
      }
      const query = "select * from %Atelier_v1_Utils.Extension_UserAction(?, ?, ?, ?)";
      let selectedText = "";
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        selectedText = "";
      }
      const selection = editor.selection;
      selectedText = editor.document.getText(selection);

      const parameters = ["0", action.id, name, selectedText];
      return vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
          title: `Executing user action: ${action.label}`,
        },
        () =>
          api
            .actionQuery(query, parameters)
            .then(data => data.result.content.pop())
            .then(userAction => {
              if (userAction) {
                if (userAction.reload) {
                  reload();
                }
                if (userAction.action == "0") {
                  // No subsequent action
                } else if (userAction.action == "1") {
                  // Show message
                  vscode.window
                    .showInformationMessage(userAction.target, ...['Yes', 'No', 'Cancel'])
                    .then(selection => {
                      let answer = (selection == 'No' ? '0' : (selection == 'Yes' ? '1' : '2'));
                      const query = "select * from %Atelier_v1_Utils.Extension_AfterUserAction(?,?,?,?,?)";
                      const parameters = ["0", action.id, name, answer, ''];
                      api
                        .actionQuery(query, parameters)
                        .then(data => data.result.content.pop())
                        .then(result => {
                          if (result) {
                            if (result.errorText) {
                              vscode.window.showErrorMessage(result.errorText);
                            }
                            if (result.message) {
                              vscode.window.showInformationMessage(result.message);
                            }
                            if (result.reload) {
                              reload();
                            }
                          }
                        });
                    });
                } else {
                  outputChannel.appendLine(`Studio Action "${action.label}" not supported`);
                  outputChannel.show();
                }
              } 
            })
      );
    });
}

function reload() {
  const file = currentFile();
  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title: `Reloading ${file.name}`,
    },
    () =>
      loadChanges([file])
  );
}

// export function contextMenu(uri: vscode.Uri): Promise<void> {
//   return doMenuAction(uri, "context");
// }

export function mainMenu(uri: vscode.Uri) {
  return doMenuAction(uri, "main");
}
