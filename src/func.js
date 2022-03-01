import Handlebars from "handlebars/dist/handlebars.min.js";

const comparisons = {
	// eslint-disable-next-line eqeqeq
	eq: (arg1, arg2) => arg1 == arg2,
	lt: (arg1, arg2) => parseFloat(arg1) < parseFloat(arg2),
	gt: (arg1, arg2) => parseFloat(arg1) > parseFloat(arg2)
};

const depthMax = 10;

// chain keeps track of accessed tables and purpose
// chain gets cleared when purpose changes
export function evaluateTable(table, vars, globalRoot, scope, name, depth) {
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
				name,
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
				name,
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
		return [
			evaluateVal(table[0].value, vars, globalRoot, scope, name, depth),
			-1
		];
	}
}

function evaluateIter(row, table, vars, globalRoot, scope, name, depth) {
	try {
		if (evaluateRow(row, table, vars, globalRoot, scope, name, depth)) {
			if (table[row][0].type === "var") {
				if (typeof table[row][0].value === "string") {
					let val = table[row][0].value;
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
						evaluateVal(val[0].value, vars, globalRoot, scope, name, depth),
						row
					];
				}

				return [
					evaluateVal(
						table[row][0].value,
						vars,
						globalRoot,
						scope,
						name,
						depth
					),
					row
				];
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

function evaluateRow(row, table, vars, globalRoot, scope, name, depth) {
	// the first entry of each row is always the output
	for (let i = 1; i < table[row].length; i++) {
		let condition = table[row][i];
		let { val1, val2 } = condition;

		if (condition.val1Type === "var") {
			try {
				val1 = evaluateVal(val1, vars, globalRoot, scope, name, depth);
			} catch (err) {
				throw err;
			}
		}

		if (condition.val2Type === "var") {
			try {
				val2 = evaluateVal(val2, vars, globalRoot, scope, name, depth);
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

export function evaluateVal(val, vars, globalRoot, scope, name, depth) {
	const up = val.startsWith("../");

	if (up) {
		val = val.substring(3);
	}

	let path = [];

	if (!val.startsWith("{{") && !val.endsWith("}}")) {
		path = val.split(".");
	}

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

	if (path.length === 1) {
		if (globalRoot) {
			if (scope === "global" && name === path[0]) {
				throw Error("too much recursion");
			}

			if (!vars[path[0]]) {
				return "variable does not exist";
			}

			val = vars[path[0]];

			if (typeof val !== "string" && typeof val[0] !== "string") {
				val = evaluateTable(val, vars, globalRoot, scope, name, depth)[0];
			} else if (typeof val !== "string") {
				// list
				val = evaluateList(val, vars, globalRoot, scope, name, depth);
			}
		} else {
			if (scope === "global" && name === path[0]) {
				throw Error("too much recursion");
			}

			if (vars.global) {
				if (!vars.global[path[0]]) {
					return val;
				}

				val = vars.global[path[0]];

				if (typeof val !== "string" && typeof val[0] !== "string") {
					// table
					val = evaluateTable(
						val,
						vars,
						globalRoot,
						"global",
						path[0],
						depth
					)[0];
				} else if (typeof val !== "string") {
					// list
					val = evaluateList(
						val,
						vars,
						globalRoot,
						"global",
						path[0],
						depth
					)[0];
				}
			} else {
				return "scope does not exist";
			}
		}
	} else if (path.length === 2) {
		if (scope === path[0] && name === path[1]) {
			throw Error("too much recursion");
		}

		if (vars[path[0]]) {
			if (!vars[path[0]][path[1]]) {
				return "variable does not exist";
			}

			val = vars[path[0]][path[1]];

			if (typeof val !== "string" && typeof val[0] !== "string") {
				val = evaluateTable(val, vars, globalRoot, path[0], path[1], depth)[0];
			} else if (typeof val !== "string") {
				// list
				val = evaluateList(val, vars, globalRoot, path[0], path[1], depth);
			}
		} else {
			return "scope does not exist";
		}
	} else {
		let tempVars = { ...vars };

		if (!globalRoot) {
			delete tempVars.global;

			tempVars = { ...tempVars, ...vars.global };
		}

		console.log(tempVars, val, scope);

		return Handlebars.compile(
			scope === "global" ? val : `{{#with ${scope}}}${val}{{/with}}`
		)(tempVars);
	}

	return val;
}

function evaluateList(list, vars, globalRoot, scope, name, depth) {
	const output = list.map((item, index) => {
		if (index === 0) {
			return null;
		}

		if (item[1] === "var") {
			return evaluateVal(item[0], vars, globalRoot, scope, name, depth);
		}

		return item[0];
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
