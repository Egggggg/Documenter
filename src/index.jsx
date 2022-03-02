import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Routes } from "react-router-dom";
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
import Handlebars from "handlebars/dist/handlebars.min.js";

import App from "./routes/app";
import Creator from "./routes/creator";
import List from "./routes/list";
import Vars from "./routes/vars";
import SaveLoad from "./routes/saveLoad";
import Guides from "./routes/guides";
import Docs from "./routes/docs";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-notifications/lib/notifications.css";

Handlebars.registerHelper("eq", function () {
	let last = arguments[0];

	for (let i = 0; i < arguments.length - 1; i++) {
		// eslint-disable-next-line eqeqeq
		if (arguments[i] != last) {
			return false;
		}

		last = arguments[i];
	}

	return true;
});

Handlebars.registerHelper("gt", (arg1, arg2) => {
	return parseFloat(arg1) > parseFloat(arg2);
});

Handlebars.registerHelper("lt", (arg1, arg2) => {
	return parseFloat(arg1) < parseFloat(arg2);
});

Handlebars.registerHelper("add", function () {
	let sum = 0;

	// subtract 1 to remove the lookup property from being a helper
	for (let i = 0; i < arguments.length - 1; i++) {
		let argNum = parseFloat(arguments[i]);

		if (Number.isInteger(argNum)) {
			argNum = Math.floor(argNum);
		}

		sum += argNum;
	}

	return sum;
});

Handlebars.registerHelper("sub", (arg1, arg2) => {
	arg1 = parseFloat(arg1);
	arg2 = parseFloat(arg2);

	if (Number.isInteger(arg1)) {
		arg1 = Math.floor(arg1);
	}

	if (Number.isInteger(arg2)) {
		arg2 = Math.floor(arg2);
	}

	return arg1 - arg2;
});

Handlebars.registerHelper("mul", function () {
	let sum = 1;

	// subtract 1 to remove the lookup property from being a helper
	for (let i = 0; i < arguments.length - 1; i++) {
		let argNum = parseFloat(arguments[i]);

		if (Number.isInteger(argNum)) {
			argNum = Math.floor(argNum);
		}

		sum *= argNum;
	}

	return sum;
});

Handlebars.registerHelper("div", (arg1, arg2) => {
	arg1 = parseFloat(arg1);
	arg2 = parseFloat(arg2);

	if (Number.isInteger(arg1)) {
		arg1 = Math.floor(arg1);
	}

	if (Number.isInteger(arg2)) {
		arg2 = Math.floor(arg2);
	}

	return arg1 / arg2;
});

Handlebars.registerHelper("floor", (arg) => {
	return Math.floor(parseFloat(arg));
});

Handlebars.registerHelper("ceil", (arg) => {
	return Math.ceil(parseFloat(arg));
});

Handlebars.registerHelper("in", (list, item) => {
	console.log(list);

	let output = [...list];

	output.splice(0, 1);
	output = list.map((e) => {
		return e[0];
	});

	console.log(output, item);

	return output.indexOf(item) > -1;
});

PouchDB.plugin(PouchDBFind);

let db = new PouchDB("documents", { auto_compaction: true });

db.createIndex({
	index: { fields: ["sortKey", "tags", "type", "collection"], ddoc: "tags" }
})
	.then(() =>
		db.createIndex({
			index: { fields: ["sortKey", "type", "collection"], ddoc: "type" }
		})
	)
	.then(() =>
		db.createIndex({
			index: { fields: ["type", "name", "tag", "collection"], ddoc: "vars" }
		})
	)
	.then(() =>
		db.createIndex({
			index: { fields: ["scope", "name", "collection"], ddoc: "scopes" }
		})
	)
	.then(() =>
		db.createIndex({
			index: { fields: ["type", "collection"], ddoc: "collection" }
		})
	);

db.find({ selector: { type: "var" } }).then((results) => {
	results.docs.forEach((doc) => {
		if (typeof doc.value === "string") {
			db.put({
				_id: doc._id,
				_rev: doc._rev,
				name: doc.name,
				value: {
					value: doc.value,
					type: "literal"
				}
			});
		}
	});
});

ReactDOM.render(
	<React.StrictMode>
		<HashRouter>
			<Routes>
				<Route path="/" element={<App />}>
					<Route path="/" element={<List db={db} />} />
					<Route path="create" element={<Creator db={db} />} />
					<Route path="vars" element={<Vars db={db} />} />
					<Route path="save-load" element={<SaveLoad db={db} />} />
					<Route path="guides" element={<Guides />} />
					<Route path="docs" element={<Docs />} />
				</Route>
			</Routes>
		</HashRouter>
	</React.StrictMode>,
	document.getElementById("root")
);
