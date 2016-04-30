'use strict';
import * as vscode from 'vscode';
import * as solc from 'solc';
import * as fs from 'fs';
import * as path from 'path';
import * as fsex from 'fs-extra';
import {compile} from './compiler';
import {ContractCollection, Package, Contract, Project} from './contractsCollection';

export function compileAllContracts(diagnosticCollection: vscode.DiagnosticCollection) {

    //Check if is folder, if not stop we need to output to a bin folder on rootPath
    if (vscode.workspace.rootPath === undefined) {
        vscode.window.showWarningMessage('Please open a folder in Visual Studio Code as a workspace');
        return;
    }

    let contractsCollection = new ContractCollection();

    //Process open Text Documents first as it is faster (We might need to save them all first? Is this assumed?) 
    vscode.workspace.textDocuments.forEach(document => {

        if (path.extname(document.fileName) === '.sol') {
            let contractPath = document.fileName;
            let contractCode = document.getText();
            contractsCollection.addContract(contractPath, contractCode);
        }
    });

    //Find all the other sol files, to compile them (1000 maximum should be enough for now)
    let files = vscode.workspace.findFiles('**/*.sol', '**/bin/**', 1000);

    return files.then(documents => {

        documents.forEach(document => {
            let contractPath = document.fsPath;

            //have we got this already opened? used those instead
            if (!contractsCollection.containsContract(contractPath)) {
                let contractCode = fs.readFileSync(document.fsPath, "utf8");
                contractsCollection.addContract(contractPath, contractCode);
            }
        });

        compile(contractsCollection.getContractsForCompilation(), diagnosticCollection);

    });
}

