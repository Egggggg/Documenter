import Handlebars from "handlebars/dist/handlebars.min.js";
import { get } from "lodash";

const comparisons = {
	eq: (arg1, arg2) => arg1 === arg2,
	lt: (arg1, arg2) => parseFloat(arg1) < parseFloat(arg2),
	gt: (arg1, arg2) => parseFloat(arg1) > parseFloat(arg2),
	isin: (arg1, arg2) => {
		if (!arg2.varType || (arg2.varType && arg2.varType !== "list")) {
			return false;
		}

		return arg2.indexOf(arg1) > -1;
	}
};

const depthMax = 10;

// chain keeps track of accessed tables and purpose
// chain gets cleared when purpose changes
export function evaluateTable(table, vars, globalRoot, scope, depth) {
	if (!depth) {
		depth = 0;
	}

	depth++;

	if (depth > depthMax) {
		return ["too much recursion", null];
	}

	// the first entry of a table is always the default value and priority entry
	if (table[0].priority === "last") {
		for (let row = table.length - 1; row > 0; row--) {
			const iteration = evaluateIter(
				row,
				table,
				vars,
				globalRoot,
				scope,
				depth
			);

			if (iteration) {
				return iteration;
			}
		}
	} else {
		for (let row = 1; row < table.length; row++) {
			const iteration = evaluateIter(
				row,
				table,
				vars,
				globalRoot,
				scope,
				depth
			);

			if (iteration) {
				return iteration;
			}
		}
	}

	if (table[0].type === "literal") {
		return [table[0].value, -1];
	} else {
		try {
			return [evaluateVal(table[0], vars, globalRoot, scope, depth), -1];
		} catch (err) {
			if (err.message === "too much recursion") {
				return [table[0].value, -1];
			}

			throw err;
		}
	}
}

function evaluateIter(row, table, vars, globalRoot, scope, depth) {
	try {
		if (evaluateRow(row, table, vars, globalRoot, scope, depth)) {
			if (table[row][0].type === "var") {
				let val = table[row][0].value;

				if (typeof val === "string") {
					const up = val.startsWith("../");

					if (up) {
						val = val.substring(3);
					}

					let path = val.split(".");

					if (path.length === 1) {
						if (up) {
							if (!globalRoot) {
								path.push(path[0]);
								path[0] = "global";
							}
						} else if (!(globalRoot && scope === "global")) {
							path.push(path[0]);
							path[0] = scope;
						}
					}

					val = getVar(path, vars, globalRoot);

					if (typeof val === "string") {
						return [val, row];
					} else if (!val) {
						return [null, null];
					}

					return [
						evaluateVal(val[0].value, vars, globalRoot, scope, depth),
						row
					];
				}
			}

			return [table[row][0].value, row];
		}
	} catch (err) {
		if (err.message === "too much recursion") {
			return [err.message, null];
		}

		throw err;
	}
}

function evaluateRow(row, table, vars, globalRoot, scope, depth) {
	// the first entry of each row is always the output
	for (let i = 1; i < table[row].length; i++) {
		let condition = table[row][i];
		let { val1, val2 } = condition;

		if (condition.val1Type === "var") {
			try {
				val1 = evaluateVal(val1, vars, globalRoot, scope, depth);
			} catch (err) {
				throw err;
			}
		}

		if (condition.val2Type === "var") {
			try {
				val2 = evaluateVal(val2, vars, globalRoot, scope, depth);
			} catch (err) {
				throw err;
			}
		}

		if (!comparisons[table[row][i].comparison](val1, val2)) {
			return false;
		}
	}

	return true;
}

export function evaluateVal(item, vars, globalRoot, scope, depth) {
	if (!depth) {
		depth = 0;
	}

	depth++;

	if (depth > depthMax) {
		return "too much recursion";
	}

	let val = item.value || item;

	if (item.varType === "basic" && item.basicType === "literal") {
		return val;
	}

	if (val.startsWith("{{") && val.endsWith("}}")) {
		let tempVars = {...vars};

		if (!globalRoot) {
			delete tempVars.global;

			tempVars = { ...tempVars, ...vars.global };
		}

		try {
			return Handlebars.compile(
				scope === "global" ? val : `{{#with ${scope}}}${val}{{/with}}`
			)(tempVars);
		} catch (err) {
			return err.message.replace(/\n/g, "<br />");
		}
	}

	let path = val.replace("../", "");

	if (scope) {
		if (scope !== "global") {
			if (!val.startsWith("../")) {
				path = `${scope}.${path}`;
			} else if (!globalRoot) {
				path = `global.${path}`;
			}
		} else {
			if (!globalRoot) {
				path = `global.${path}`;
			}
		}
	}

	let found = get(vars, path);

	if (!found) {
		return "not found";
	}

	if (found.varType !== "basic" || found.basicType === "var") {
		let newScope = path.split(".")[0];

		if (found.varType === "basic") {
			return evaluateVal(found, vars, globalRoot, newScope, depth);
		} else if (found.varType === "list") {
			return evaluateList(found, vars, globalRoot, newScope, depth);
		} else if (found.varType === "table") {
			return evaluateTable(found, vars, globalRoot, newScope, depth);
		}
	}

	return found.value;
}

function evaluateList(list, vars, globalRoot, scope, depth) {
	const output = list.map((item, index) => {
		if (index === 0) {
			return null;
		}

		if (item.basicType === "var") {
			return evaluateVal(item.value, vars, globalRoot, scope, depth);
		}

		return item.value;
	});

	output.splice(0, 1);

	return output;
}

function getVar(path, vars, globalRoot) {
	if (path[0] === "global" && globalRoot) {
		return vars[path[1]];
	} else {
		if (vars[path[0]]) {
			return vars[path[0]][path[1]];
		}
	}
}
