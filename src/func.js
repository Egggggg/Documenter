export function evaluateTable(table, vars, globalRoot, name, scope) {
	// the first entry of a table is always the default value and conflictType entry
	if (table[0].conflictType === "last") {
		for (let row = table.length - 1; row > 0; row--) {
			try {
				if (evaluateRow(row, table, vars, globalRoot, name, scope)) {
					return [table[row][0].value, row];
				}
			} catch (err) {
				return [err.message, null];
			}
		}
	} else {
		for (let row = 1; row < table.length; row++) {
			try {
				if (evaluateRow(row, table, vars, globalRoot, name, scope)) {
					return [table[row][0].value, row];
				}
			} catch (err) {
				return [err.message, null];
			}
		}
	}

	return ["couldn't evaluate", null];
}

function evaluateRow(row, table, vars, globalRoot, name, scope) {
	const comparisons = {
		// eslint-disable-next-line eqeqeq
		eq: (arg1, arg2) => arg1 == arg2,
		lt: (arg1, arg2) => parseFloat(arg1) < parseFloat(arg2),
		gt: (arg1, arg2) => parseFloat(arg1) > parseFloat(arg2)
	};

	// the first entry of each row is always the output
	for (let i = 1; i < table[row].length; i++) {
		let condition = table[row][i];
		let { val1, val2 } = condition;

		if (condition.val1Type === "var") {
			try {
				val1 = evaluateVal(val1, vars, globalRoot, name, scope);
			} catch (err) {
				throw err;
			}
		}

		if (condition.val2Type === "var") {
			try {
				val2 = evaluateVal(val2, vars, globalRoot, name, scope);
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

function evaluateVal(val, vars, globalRoot, name, scope) {
	const path = val.split(".");

	if (path.length === 1) {
		if (globalRoot) {
			if (!vars[path[0]]) {
				throw Error("variable does not exist");
			}

			if (scope === "global" && name === path[0]) {
				throw Error("circular dependency error");
			}

			val = vars[path[0]];

			if (typeof val !== "string") {
				val = evaluateTable(val, vars, globalRoot, name, scope)[0];
			}
		} else {
			if (scope === "global" && name === path[0]) {
				throw Error("circular dependency error");
			}

			if (vars.global) {
				if (!vars.global[path[0]]) {
					throw ReferenceError("variable does not exist");
				}

				if (vars.global) {
					val = vars.global[path[0]];

					if (typeof val !== "string") {
						val = evaluateTable(
							vars.global[path[0]],
							vars,
							globalRoot,
							name,
							scope
						)[0];
					}
				} else {
					throw ReferenceError("scope does not exist");
				}
			}
		}
	} else if (path.length === 2) {
		if (scope === path[0] && name === path[1]) {
			throw Error("circular dependency error");
		}

		if (vars[path[0]]) {
			if (!vars[path[0]][path[1]]) {
				throw ReferenceError("variable does not exist");
			}

			val = vars[path[0]][path[1]];

			if (typeof val !== "string") {
				val = evaluateTable(
					vars.global[path[0]],
					vars,
					globalRoot,
					name,
					scope
				)[0];
			}
		} else {
			throw ReferenceError("scope does not exist");
		}
	}

	return val;
}
