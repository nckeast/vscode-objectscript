import * as vscode from "vscode";
import { DocumentContentProvider } from "../../providers/DocumentContentProvider";
import { NodeBase } from "./nodeBase";

export class ClassNode extends NodeBase {
  public static readonly contextValue: string = "dataNode:classNode";
  public constructor(label: string, fullName: string, workspaceFolder: string, namespace: string) {
    super(label, fullName, workspaceFolder, namespace);
  }

  public getTreeItem(): vscode.TreeItem {
    const displayName: string = this.label;

    return {
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      command: {
        arguments: [DocumentContentProvider.getUri(this.fullName, this.workspaceFolder, this.namespace, true)],
        command: "vscode-objectscript.explorer.openClass",
        title: "Open class",
      },
      contextValue: "dataNode:classNode",
      label: `${displayName}`,
      // iconPath: {
      //     light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'class.svg'),
      //     dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'class.svg')
      // }
    };
  }
}
