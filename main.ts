import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { deprecate } from 'util';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class LatexTruthTableGeneratorPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'Generate-truth-table-from-latex-math',
			name: 'Generate truth table from latex math',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const targetSequence = "$";
				
				const selection = editor.getSelection();
				if (selection == "") {
					new Notice("ERROR: No text selected!");
					return;
				}

				const cursorPosition = editor.getCursor("anchor");
				const fullText = editor.getValue();
				
				// Find the index of the target sequence starting from the cursor position
				const startIndex = fullText.indexOf(targetSequence, cursorPosition.ch);

				if (startIndex !== -1) {
					cursorPosition.ch = 0;
					cursorPosition.line++;
					editor.replaceRange(this.generateResult(selection), cursorPosition);
				} else {
					console.log("ERROR: No closing $$ found!");
				}
			}
		});
	}

	replaceMultiple(input: string, replacements: { [key: string]: string }): string {
		let result = input;
		for (const [oldValue, newValue] of Object.entries(replacements)) {
		  result = result.split(oldValue).join(newValue);
		}
		return result;
	}
	
	replacements = {
		"\\text": "",
		"\\vee": "||",
		"\\lor": "||",
		"\\wedge": "&&",
		"\\land": "&&",
		"{": "(",
		"}": ")",
		"\\overline": "!",
		"\\neg": "!",
		"True": "1",
		"T": "1",
		"true": "1",
		"False": "0",
		"F": "0",
		"false": "0",
	};

	replaceImplication(expr: string): string {
		const negateLeftSide = (left: string, right: string): string => {

			let missingLeftPart = "";
			let missingRightPart = "";

			let brackets = 0;
			for (let index = left.length - 1; index >= 0; index--) {
				if (left.charAt(index) == ')') {
					brackets++;
				}
				else if (left.charAt(index) == '(') {
					brackets--;
					if (brackets <= 0) {
						missingLeftPart = left.substring(0, index);
						left = left.substring(index);
						break;
					}
				}
			}
			for (let index = 0; index < right.length; index++) {
				if (right.charAt(index) == '(') {
					brackets++;
				}
				else if (right.charAt(index) == ')') {
					brackets--;
					if (brackets <= 0) {
						missingRightPart = right.substring(index);
						right = right.substring(0, index);
						break;
					}
				}
			}

			return `${missingLeftPart}(!(${left}) || (${right}))${missingRightPart}`;
		};
	
		function processExpression(expression: string): string {
			while (true) {
				const implicationIndex = expression.lastIndexOf("\\to");
				if (implicationIndex === -1) {
					return expression;
				}
				
				// Otherwise, split the expression into left and right parts around the last "→"
				const left = expression.slice(0, implicationIndex).trim();
				const right = expression.slice(implicationIndex + 3).trim();
				
				expression = negateLeftSide(left, right);
			}
		}
	
		// Start processing the entire expression
		return processExpression(expr);
	}
	
	generateCombinations(n: number): boolean[][] {
		const combinations: boolean[][] = [];
		for (let i = 0; i < Math.pow(2, n); i++) {
			const combination: boolean[] = [];
			for (let j = n - 1; j >= 0; j--) {  // Reverse the bit checking order
				combination.push(!!(i & (1 << j)));
			}
			combinations.push(combination);
		}
		return combinations;
	}
	
	// Step 2: Evaluate the expression for each combination
	evaluateExpression(expression: string, variables: string[], values: boolean[]): boolean {
		// Map each variable to its value
		const scopedExpression = variables.reduce(
			(expr, variable, index) => expr.replace(new RegExp(`\\b${variable}\\b`, "g"), values[index].toString()),
			expression
		);
		// Evaluate the modified expression
		return eval(scopedExpression);
	}
	
	// Step 3: Generate and display the truth table
	generateTruthTable(expression: string) : string {
		let truthTable = "\n";

		const variables = Array.from(new Set(expression.match(/[a-z]/g) || [])).sort();
		truthTable += "|$" + variables.join("$|$") + "$|$\\text{Result}$|\n|";
		variables.forEach(() => {
			truthTable += "-|";
		})
		truthTable += "-|\n| ";

		const combinations = this.generateCombinations(variables.length);
		for (const combination of combinations) {
			const result = this.evaluateExpression(expression, variables, combination);
			truthTable += combination.map(v => (v ? "1" : "0")).join(" | ") + " | " + (result ? "1" : "0") + " |\n| ";
		}
		truthTable = truthTable.substring(0, truthTable.length - 3); 

		return truthTable;
	}

	generateResult(selectedText: string) : string {
		try {
			const rewritten = this.replaceImplication(this.replaceMultiple(selectedText, this.replacements));
			const truthTable = this.generateTruthTable(rewritten);
			new Notice("Success!");
			return truthTable;
		}
		catch (e){
			new Notice(e);
			return ""; 
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}