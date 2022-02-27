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

import "bootstrap/dist/css/bootstrap.min.css";
import "react-notifications/lib/notifications.css";

Handlebars.registerHelper("gt", (arg1, arg2) => {
	return parseFloat(arg1) > parseFloat(arg2);
});

Handlebars.registerHelper("lt", (arg1, arg2) => {
	return parseFloat(arg1) < parseFloat(arg2);
});

Handlebars.registerHelper("eq", (arg1, arg2) => {
	// eslint-disable-next-line eqeqeq
	return arg1 == arg2;
});

Handlebars.registerHelper("add", (arg1, arg2) => {
	arg1 = parseFloat(arg1);
	arg2 = parseFloat(arg2);

	if (Number.isInteger(arg1)) {
		arg1 = Math.floor(arg1);
	}

	if (Number.isInteger(arg2)) {
		arg2 = Math.floor(arg2);
	}

	return arg1 + arg2;
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

Handlebars.registerHelper("mul", (arg1, arg2) => {
	arg1 = parseFloat(arg1);
	arg2 = parseFloat(arg2);

	if (Number.isInteger(arg1)) {
		arg1 = Math.floor(arg1);
	}

	if (Number.isInteger(arg2)) {
		arg2 = Math.floor(arg2);
	}

	return arg1 * arg2;
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

PouchDB.plugin(PouchDBFind);

let db = new PouchDB("documents", { auto_compaction: true });

db.createIndex({
	index: { fields: ["sortKey", "tags", "type"], ddoc: "tags" }
})
	.then(() =>
		db.createIndex({
			index: { fields: ["sortKey", "type"], ddoc: "type" }
		})
	)
	.then(() => {
		db.createIndex({
			index: { fields: ["type", "name", "tag"], ddoc: "vars" }
		});
	})
	.then(() => {
		db.createIndex({
			index: { fields: ["scope", "name"], ddoc: "scopes" }
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
				</Route>
			</Routes>
		</HashRouter>
	</React.StrictMode>,
	document.getElementById("root")
);
