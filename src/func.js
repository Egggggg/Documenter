export function evaluateTable(table, vars, globalRoot) {
	const comparisons = {
		// eslint-disable-next-line eqeqeq
		eq: (arg1, arg2) => arg1 == arg2,
		lt: (arg1, arg2) => arg1 < arg2,
		gt: (arg1, arg2) => arg1 > arg2
	};

	// the first entry of a table is always the default value and conflictType entry
	if (table[0].conflictType === "last") {
		for (let row = table.length - 1; row > 0; row--) {
			if (evaluateRow(row, table, vars, globalRoot)) {
			}
		}
	}
}

function evaluateRow(row, table, vars, globalRoot) {
	// the first entry of each row is always the output
	for (let i = 1; i < table[row].length; i++) {
		let condition = table[row][i];

		let { val1, val2 } = condition;

		if (condition.val1Type === "var") {
			const path = val1.split(".");

			if (path.length === 1) {
				if (globalRoot) {
					val1 = vars[path[0]];
				} else {
					val1 = vars["global"][path[0]];
				}
			} else if (path.length === 2) {
				val1 = vars[path[0]][path[1]];
			}
		}

		if (condition.val2Type === "var") {
			const path = val2.split(".");

			if (path.length === 1) {
				if (globalRoot) {
					val2 = vars[path[0]];
				} else {
					val2 = vars["global"][path[0]];
				}
			} else if (path.length === 2) {
				val2 = vars[path[0]][path[1]];
			}
		}

		if (!comparisons[table][row][i].comparison(val1, val2)) {
			thisOne = false;
			break;
		}
	}

	if (thisOne) {
		return table[row][0].value;
	}
}
