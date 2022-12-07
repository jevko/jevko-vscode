/* eslint-disable @typescript-eslint/semi */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {main} from './node/main.js'

////////////////////////////////              
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed 
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated 
	console.log('Extension "jevko.jevko" is now active!');

	vscode.workspace.onDidSaveTextDocument((e) => {
		let filePath = e.fileName
		console.log('SAVE', filePath)
		
		main({input: filePath})

		console.log('SAVED*****') 
	})

	let disposable = vscode.commands.registerCommand('jevko.translateCurrentFile', () => {
		const activeEditor = vscode.window.activeTextEditor
    if (activeEditor){
			let filePath = activeEditor.document.uri.fsPath

			main({input: filePath})

			console.log('SAVED----')
    }
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
