/* eslint-disable @typescript-eslint/semi */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {main} from 'jevko-interface.js'

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
		// todo: not sure if should do that on JSON->jevkodata
		defaultOutput: (text: string) => {
			// todo: ask first -- allow dismissing forever
			vscode.window.showInformationMessage(
				`Jevko: Open translation of current file in new document?`, 
				// todo: add Always & Never options
				// perhaps add option to save to untitled/new file
				'Yes', /*'Always', 'Never',*/ 'No'
			).then(value => {
				if (value === 'Yes') {
					vscode.workspace.openTextDocument({
						content: text
					}).then(doc => vscode.window.showTextDocument(doc))
				}
				// todo: if value === 'Never' or 'Always', save choice and don't ask again
			})
		},
		defaultFormatHandler: (format: string) => {
			console.log('[Extension jevko.jevko] Ignoring unknown format:', format)
		},
	}

	console.log('Extension "jevko.jevko" is now active!');

	vscode.workspace.onDidSaveTextDocument((e) => {
		let filePath = e.fileName
		const fileExtension = filePath.slice(filePath.lastIndexOf('.') + 1)

		if (fileExtension === 'json') {
			vscode.window.showInformationMessage(
				`Convert this .json file to corresponding .jevkodata file?`, 
				// todo: add Always & Never options
				// perhaps add option to save to untitled/new file
				'Yes', /*'Always', 'Never',*/ 'No'
			).then(value => {
				if (value === 'Yes') {
					main({
						...defaultOptions, 
						input: filePath, 
						'infer output': true,
					})
				}
				// todo: if value === 'Never' or 'Always', save choice and don't ask again
			})
		} else if (['html', 'xml', 'xhtml'].includes(fileExtension)) {
			vscode.window.showInformationMessage(
				`Convert this .${fileExtension} file to corresponding .jevkoml file?`, 
				// todo: add Always & Never options
				// perhaps add option to save to untitled/new file
				'Yes', /*'Always', 'Never',*/ 'No'
			).then(value => {
				if (value === 'Yes') {
					main({
						...defaultOptions, 
						input: filePath, 
						'infer output': true,
					})
				}
				// todo: if value === 'Never' or 'Always', save choice and don't ask again
			})
		} else {
			// handle all other formats, including unrecognized
			main({...defaultOptions, input: filePath})
		}
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
