/* eslint-disable @typescript-eslint/semi */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {main} from './node/portable/main.js'

////////////////////////////////              
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed 
export function activate(context: vscode.ExtensionContext) {
	const defaultOptions = {
		overwrite: async (path: string) => {
			const config = vscode.workspace.getConfiguration('jevko')
			
			if (config.overwrite === 'always') return true
	
			const ans = await vscode.window.showWarningMessage(
				`File '${path}' exists. Overwrite?`,
				'Yes', 'Always', 'No'
			)

			if (ans === 'Yes') {
				return true
			}
			else if (ans === 'Always') {
				config.update('overwrite', 'always')
				return true
			}
			// if (ans === 'No' || ans === undefined)
			return false
		},
		"storage dir": context.globalStoragePath,
		platform: "node",
		pretty: true,
	}

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated 
	console.log('Extension "jevko.jevko" is now active!');

	vscode.workspace.onDidSaveTextDocument((e) => {
		let filePath = e.fileName
		console.log('SAVE', filePath)

		main({...defaultOptions, input: filePath})

		console.log('SAVED*****') 
	})

	let disposable = vscode.commands.registerCommand('jevko.translateCurrentFile', () => {
		const activeEditor = vscode.window.activeTextEditor
    if (activeEditor){
			let filePath = activeEditor.document.uri.fsPath

			main(
				{
					...defaultOptions,
					input: filePath, 
					'infer output': true,
				}
			)

			console.log('SAVED----')
    }
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('jevko.forceActivate', () => {
		vscode.window.showInformationMessage('Jevko extension activated!')
	});
	context.subscriptions.push(disposable);

}

// This method is called when your extension is deactivated
export function deactivate() {}
