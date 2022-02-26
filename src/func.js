export function evaluateTable(table, vars, globalRoot, name, scope) {
	// the first entry of a table is always the default value and conflictType entry
	if (table[0].conflictType === "last") {
		for (let row = table.length - 1; row > 0; row--) {
			if (evaluateRow(row, table, vars, globalRoot, name, scope)) {
				return [table[row][0].value, row];
			}
		}
	} else {
		for (let row = 1; row < table.length; row++) {
			if (evaluateRow(row, table, vars, globalRoot, name, scope)) {
				return [table[row][0].value, row];
			}
		}
	}

	return [`error`, null];
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
			const path = val1.split(".");

			if (path.length === 1) {
				if (globalRoot) {
					if (scope === "global" && name === path[0]) {
						return false;
					}

					val1 = vars[path[0]];
				} else {
					if (scope === "global" && name === path[0]) {
						return false;
					}

					if (vars.global) {
						val1 = vars.global[path[0]];
					}
				}
			} else if (path.length === 2) {
				if (scope === path[0] && name === path[1]) {
					return false;
				}

				if (vars[path[0]]) {
					val1 = vars[path[0]][path[1]];
				}
			}
		}

		if (condition.val2Type === "var") {
			const path = val2.split(".");

			if (path.length === 1) {
				if (globalRoot) {
					if (scope === "global" && name === path[0]) {
						return false;
					}

					val2 = vars[path[0]];
				} else {
					if (scope === "global" && name === path[0]) {
						return false;
					}

					val2 = vars.global[path[0]];
				}
			} else if (path.length === 2) {
				if (scope === path[0] && name === path[1]) {
					return false;
				}

				val2 = vars[path[0]][path[1]];
			}
		}

		if (!comparisons[table[row][i].comparison](val1, val2)) {
			return false;
		}
	}

	return true;
}
