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
	index: { fields: ["sortKey", "tags", "type"], ddoc: "tags" }
}).then(() =>
	db.createIndex({
		index: { fields: ["sortKey", "type"], ddoc: "type" }
	})
);

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
