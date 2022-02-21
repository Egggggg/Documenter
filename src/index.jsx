import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";

import App from "./routes/app";
import Creator from "./routes/creator";
import List from "./routes/list";
import Vars from "./routes/vars";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-notifications/lib/notifications.css";

PouchDB.plugin(PouchDBFind);

const db = new PouchDB("documents");

db.createIndex({
	index: { fields: ["type", "sortKey", "tags"] },
	name: "tags"
}).then(() => {
	db.createIndex({
		index: { fields: ["type", "sortKey"] },
		name: "type"
	});
});

db.get("version").catch(() => {
	db.find({ selector: { type: "document" } })
		.then((results) => {
			results.docs.forEach((doc, index) => {
				db.put({
					_id: doc._id,
					_rev: doc._rev,
					name: doc.name,
					tags: doc.tags,
					text: doc.text,
					type: "document",
					sortKey: index
				});
			});
		})
		.then(() => {
			db.put({ _id: "version", version: 1, type: "meta" });
		});
});

ReactDOM.render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />}>
					<Route path="/" element={<List db={db} />} />
					<Route path="create" element={<Creator db={db} />} />
					<Route path="vars" element={<Vars db={db} />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</React.StrictMode>,
	document.getElementById("root")
);
