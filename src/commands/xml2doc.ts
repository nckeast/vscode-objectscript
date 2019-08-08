import * as vscode from "vscode";
import { config } from "../extension";
import { outputConsole } from "../utils";
import { DocumentContentProvider } from "../providers/DocumentContentProvider";
import { XmlContentProvider } from "../providers/XmlContentProvider";

export async function xml2doc(context: vscode.ExtensionContext, document: vscode.TextDocument): Promise<void> {  
  const xmlContentProvider: XmlContentProvider = context.workspaceState.get("xmlContentProvider");
  const conn: any = config("conn");
  var message: string[];
  
  const uri = document.uri;
  if (uri.scheme === "file" && uri.fsPath.toLowerCase().endsWith("xml")) {
    const actionDescription = 'Preview XML as UDL \'' + uri.fsPath + '\''
    if (!conn.active) {
      message = [actionDescription + ' cancelled.  ObjectScript connection disabled.'];
      outputConsole(message);
      return;
    }

    let line = document.lineAt(1).text;
    if (line.match(/<Export generator="(Cache|IRIS)"/)) {
      line = document.lineAt(2).text;
      const className = line.match('Class name="([^"]+)"');
      let fileName = "";
      if (className) {
        fileName = className[1] + ".cls";
      }
      if (fileName !== "") {
        if (conn.ns) {
          const previewUri = DocumentContentProvider.getUri(fileName, conn.workspaceFolder, conn.ns, true)
          xmlContentProvider.update(previewUri);
          vscode.window.showTextDocument(previewUri);
          message = [actionDescription + ' complete.'];
          outputConsole(message);
        } else {
          message = [actionDescription + ' cancelled.  ObjectScript namespace unavailable.'];
          outputConsole(message);
        }
      }
    }
  }
}
