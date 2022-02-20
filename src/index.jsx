import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";
import App from "./routes/app";
import Creator from "./routes/creator";
import List from "./routes/list";
import Collections from "./routes/collections";
import Collection from "./routes/collection";

import "bootstrap/dist/css/bootstrap.min.css";

PouchDB.plugin(PouchDBFind);

const db = new PouchDB("documents");

db.createIndex({
	index: { fields: ["tags"] }
})
	.then(() => {
		db.createIndex({
			index: { fields: ["collections"] }
		});
	})
	.then(() => {
		db.createIndex({
			index: { fields: ["type"] }
		});
	})
	.then(() => {
		db.createIndex({
			index: { fields: ["name"] }
		});
	});

ReactDOM.render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />}>
					<Route path="create" element={<Creator db={db} />} />
					<Route path="list" element={<List db={db} />} />
					<Route path="collections" element={<Collections db={db} />} />
					<Route
						path="collection/:collection"
						element={<Collection db={db} />}
					/>
				</Route>
			</Routes>
		</BrowserRouter>
	</React.StrictMode>,
	document.getElementById("root")
);
