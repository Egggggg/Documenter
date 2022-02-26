const comparisons = {
	// eslint-disable-next-line eqeqeq
	eq: (arg1, arg2) => arg1 == arg2,
	lt: (arg1, arg2) => parseFloat(arg1) < parseFloat(arg2),
	gt: (arg1, arg2) => parseFloat(arg1) > parseFloat(arg2)
};

const depthMax = 100;

// chain keeps track of accessed tables and purpose
// chain gets cleared when purpose changes
export function evaluateTable(table, vars, globalRoot, scope, name, depth) {
	if (!depth) {
		depth = 0;
	}

	depth++;

	if (depth > depthMax) {
		return ["circular dependency", null];
	}

	// the first entry of a table is always the default value and priority entry
	if (table[0].priority === "last") {
		for (let row = table.length - 1; row > 0; row--) {
			try {
				if (evaluateRow(row, table, vars, globalRoot, scope, name, depth)) {
					if (table[row][0].type === "var") {
						if (typeof table[row][0].value === "string") {
							const val = getVar(table[row][0].value, vars, globalRoot);

							if (typeof val === "string") {
								return [val, row];
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
				console.log(err.message);

				if (err.message === "circular dependency") {
					return [err.message, null];
				}

				throw err;
			}
		}
	} else {
		for (let row = 1; row < table.length; row++) {
			try {
				if (evaluateRow(row, table, vars, globalRoot, scope, name, depth)) {
					if (table[row][0].type === "var") {
						if (typeof table[row][0].value === "string") {
							const val = getVar(table[row][0].value, vars, globalRoot);

							if (typeof val === "string") {
								return [val, row];
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
				if (err.message === "circular dependency") {
					return [err.message, null];
				}

				throw err;
			}
		}
	}

	return [
		evaluateVal(table[0].value, vars, globalRoot, scope, name, depth),
		-1
	];
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

		return true;
	}
}

export function evaluateVal(val, vars, globalRoot, scope, name, depth) {
	const path = val.split(".");

	if (path.length === 1) {
		if (globalRoot) {
			if (!vars[path[0]]) {
				throw Error("variable does not exist");
			}

			if (scope === "global" && name === path[0]) {
				throw Error("circular dependency");
			}

			val = vars[path[0]];

			if (typeof val !== "string") {
				val = evaluateTable(val, vars, globalRoot, scope, name, depth)[0];
			}
		} else {
			if (scope === "global" && name === path[0]) {
				return val;
			}

			if (vars.global) {
				if (!vars.global[path[0]]) {
					return val;
				}

				val = vars.global[path[0]];

				if (typeof val !== "string") {
					val = evaluateTable(
						val,
						vars,
						globalRoot,
						"global",
						path[0],
						depth
					)[0];
				}
			} else {
				throw ReferenceError("scope does not exist");
			}
		}
	} else if (path.length === 2) {
		if (scope === path[0] && name === path[1]) {
			throw Error("circular dependency");
		}

		if (vars[path[0]]) {
			if (!vars[path[0]][path[1]]) {
				throw ReferenceError("variable does not exist");
			}

			val = vars[path[0]][path[1]];

			if (typeof val !== "string") {
				val = evaluateTable(val, vars, globalRoot, path[0], path[1], depth)[0];
			}
		} else {
			throw ReferenceError("scope does not exist");
		}
	}

	return val;
}

function getVar(name, vars, globalRoot) {
	let path = name.split(".");

	if (path.length === 1) {
		path.push(path[0]);
		path[0] = "global";
	}

	if (path[0] === "global" && globalRoot) {
		return path[0];
	} else {
		return vars[path[0]][path[1]];
	}
}
