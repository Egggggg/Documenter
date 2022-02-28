import JSZip from "jszip";
import FileSaver from "file-saver";
import { useState } from "react";
import Handlebars from "handlebars/dist/handlebars.min.js";
import { NotificationManager } from "react-notifications";
import { evaluateTable } from "../func";
import Papa from "papaparse";
import fm from "front-matter";

import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

export default function SaveLoad(props) {
	const [saveOptions, setSaveOptions] = useState({
		manifest: true,
		readable: false,
		eval: false
	});

	const [loadOptions, setLoadOptions] = useState({
		addType: "append",
		type: "all"
	});

	const [showModal, setShowModal] = useState(false);

	const save = () => {
		const manifest = {};

		const zip = new JSZip();
		let docFolder;
		let varFolder;

		let vars = {};
		let varFiles = {};

		if (saveOptions.readable) {
			docFolder = zip.folder("docs");
			varFolder = zip.folder("vars");
		}

		props.db
			.find({
				selector: { type: "var" }
			})
			.then((results) => {
				results.docs.forEach((doc) => {
					if (saveOptions.eval) {
						if (doc.scope === "global") {
							vars[doc.name] = doc.value;
						} else {
							vars[doc.scope] = { ...vars[doc.scope], [doc.name]: doc.value };
						}
					}

					if (saveOptions.readable) {
						varFiles = {
							...varFiles,
							[doc.scope]: {
								...varFiles[doc.scope],
								[`${doc.name}`]: doc.value
							}
						};
					}

					if (saveOptions.manifest) {
						manifest[doc._id] = {
							_id: doc._id,
							name: doc.name,
							value: doc.value,
							scope: doc.scope,
							type: "var"
						};
					}
				});

				if (saveOptions.readable) {
					Object.keys(varFiles).forEach((key) => {
						varFolder.file(
							`${key}.txt`,
							Object.keys(varFiles[key])
								.map((name) => {
									return `----------\nName: ${name}\nValue: ${varFiles[key][name]}`;
								})
								.join("\n")
						);
					});
				}
			})
			.then(() => {
				return props.db.find({ selector: { type: "document" } });
			})
			.then((results) => {
				let evaluatedVars = { ...vars };

				if (saveOptions.readable && saveOptions.eval) {
					Object.keys(vars).forEach((key) => {
						const current = vars[key];

						// basic variables
						if (typeof current === "string") {
							return;
						}

						// tables
						if (current[0]) {
							evaluatedVars[key] = evaluateTable(
								current,
								vars,
								true,
								"global",
								key
							)[0];

							return;
						}

						// scopes
						Object.keys(current).forEach((item) => {
							const currentItem = current[item];

							if (typeof currentItem === "string") {
								return;
							}

							console.log(currentItem, vars, key, item);

							evaluatedVars[key][item] = evaluateTable(
								currentItem,
								vars,
								true,
								key,
								item
							)[0];
						});
					});

					vars = { ...vars, ...evaluatedVars };
				}

				results.docs.forEach((doc) => {
					let text = doc.text;

					if (saveOptions.readable && saveOptions.eval) {
						text = Handlebars.compile(
							!doc.scope
								? doc.text
								: `{{#with ${doc.scope}}}${doc.text}{{/with}}`
						)(vars);
					}

					if (saveOptions.readable) {
						docFolder.file(
							`${doc.name}--${doc._id}.md`,
							`${text}\n\n--------\n\n### Tags\n${doc.tags.join(
								", "
							)}\n\n------------\n\n### Sort Key\n${
								doc.sortKey
							}\n\n---------\n\n### Scope\n${doc.scope ? doc.scope : "global"}`
						);
					}

					if (saveOptions.manifest) {
						manifest[doc._id] = {
							_id: doc._id,
							name: doc.name,
							tags: doc.tags,
							text: doc.text,
							type: "document",
							sortKey: doc.sortKey,
							scope: doc.scope
						};
					}
				});
			})
			.then(() => {
				if (saveOptions.manifest) {
					zip.file("data.json", JSON.stringify(manifest, null, 2));
				}

				zip.generateAsync({ type: "blob" }).then((content) => {
					FileSaver.saveAs(content, "documenter.zip");
				});
			});
	};

	const load = async (e) => {
		e.preventDefault();

		if (
			!e.target.elements.formBasicLoadFile.files[0] &&
			loadOptions.addType !== "replaceAll"
		) {
			NotificationManager.warning(null, "No file chosen");
			return;
		}

		setShowModal(true);

		const file = e.target.elements.formBasicLoadFile.files[0];

		if (loadOptions.addType === "replaceAll") {
			let results = [];

			if (loadOptions.type !== "vars") {
				results.push(
					await props.db.find({
						selector: { type: "document" }
					})
				);
			}

			if (loadOptions.type !== "docs") {
				results.push(
					await props.db.find({
						selector: { type: "var" }
					})
				);
			}

			for (let i in results) {
				for (const doc of results[i].docs) {
					props.db.remove(doc);
				}
			}
		}

		if (!file) {
			setShowModal(false);
		}

		if (file.type === "application/json") {
			await loadJSON(await file.text());
		} else if (file.type === "text/csv") {
			if (loadOptions.type !== "vars") {
				NotificationManager.warning(
					null,
					"You can only load variables from .csv files"
				);

				setShowModal(false);
				return;
			}

			loadCSV(await file.text());
		} else if (file.type === "text/plain") {
			if (loadOptions.type !== "docs") {
				NotificationManager.warning(
					null,
					"You can only load documents from .txt files"
				);

				setShowModal(false);
				return;
			}

			const name = /(.*)\..*/.exec(file.name);

			loadTXT(name ? name[1] : file.name, await file.text());
		} else if (file.type === "text/markdown" || file.name.endsWith(".md")) {
			if (loadOptions.type !== "docs") {
				NotificationManager.warning(
					null,
					"You can only load documents from .md files"
				);

				setShowModal(false);
				return;
			}

			const name = /(.*)\..*/.exec(file.name);

			loadMD(name ? name[1] : file.name, await file.text());
		} else if (
			file.type === "application/zip" ||
			file.type === "application/x-zip-compressed"
		) {
			JSZip.loadAsync(file).then((zip) => {
				Object.keys(zip.files).forEach((name) => {
					zip.files[name].async("string").then(async (data) => {
						if (name.endsWith(".json")) {
							await loadJSON(data);
						} else if (name.endsWith(".txt")) {
							name = name.split("\\").pop().split("/").pop();
							const title = /(.*)\..*/.exec(name);

							loadTXT(title ? title[1] : name, data);
						} else if (name.endsWith(".md")) {
							name = name.split("\\").pop().split("/").pop();
							const title = /(.*)\..*/.exec(name);

							loadMD(title ? title[1] : name, data);
						}
					});
				});
			});
		} else {
			console.log(file.type);
		}

		setShowModal(false);
	};

	const appendVars = async (name, value, scope) => {
		const varString = [0, 1, 2, 3, 4]
			.map(() => {
				return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 25)];
			})
			.join("");

		if (scope === "global") {
			const results = await props.db.find({
				selector: { scope: name },
				limit: 1 // make sure not to have a variable name conflict with a scope name
			});

			if (results.docs.length > 0) {
				name = `${name}-${varString}`;
			}
		}

		let results = await props.db.find({
			selector: { scope, name },
			limit: 1
		});

		if (results.docs.length > 0) {
			name = `${name}-${varString}`;
		}

		results = await props.db.find({
			selector: { scope: "global", name: scope },
			limit: 1
		});

		if (results.docs.length > 0) {
			scope = `${scope}-${varString}`;
		}

		props.db.post({
			name,
			value,
			scope,
			type: "var"
		});
	};

	const overwriteVars = async (name, value, scope) => {
		if (scope === "global") {
			const results = await props.db.find({
				selector: { scope: name }
			});

			if (results.docs.length > 0) {
				results.docs.forEach((result) => {
					props.db.remove(result);
				});
			}
		}

		let results = await props.db.find({
			selector: { scope, name },
			limit: 1
		});

		if (results.docs.length > 0) {
			results.docs.forEach((result) => {
				props.db.remove(result);
			});
		}

		results = await props.db.find({
			selector: { scope: "global", name: scope }
		});

		if (results.docs.length > 0) {
			results.docs.forEach((result) => {
				props.db.remove(result);
			});
		}

		props.db.post({
			name,
			value,
			scope,
			type: "var"
		});
	};

	const loadJSON = async (text) => {
		setShowModal(true);

		const data = JSON.parse(text);

		for (const key of Object.keys(data)) {
			const doc = data[key];

			if (loadOptions.addType === "append") {
				if (doc.type === "document" && loadOptions.type !== "vars") {
					props.db.post({
						name: doc.name || "",
						tags: doc.tags || [],
						text: doc.text || "",
						type: "document",
						sortKey: doc.sortKey || "1",
						scope: doc.scope || "global"
					});
				} else if (doc.type === "var" && loadOptions.type !== "docs") {
					await appendVars(doc.name, doc.value, doc.scope);
				}
			} else if (loadOptions.addType === "overwrite") {
				if (doc.type === "document" && loadOptions.type !== "vars") {
					let result;

					try {
						result = await props.db.get(doc._id);
						props.db.put({
							_id: doc._id,
							_rev: result._rev,
							name: doc.name || "",
							tags: doc.tags || [],
							text: doc.text || "",
							type: "document",
							sortKey: doc.sortKey || "1",
							scope: doc.scope || "global"
						});
					} catch {
						props.db.post({
							name: doc.name || "",
							tags: doc.tags || [],
							text: doc.text || "",
							type: "document",
							sortKey: doc.sortKey || "1",
							scope: doc.scope || "global"
						});
					}
				} else if (doc.type === "var" && loadOptions.type !== "docs") {
					await overwriteVars(doc.name, doc.value, doc.scope);
				}
			} else if (loadOptions.addType === "replaceAll") {
				if (doc.type === "document" && loadOptions.type !== "vars") {
					props.db.post({
						name: doc.name || "",
						tags: doc.tags || [],
						text: doc.text || "",
						type: "document",
						sortKey: doc.sortKey || "1",
						scope: doc.scope || "global"
					});
				} else if (doc.type === "var" && loadOptions.type !== "docs") {
					props.db.post({
						name: doc.name,
						value: doc.value,
						scope: doc.scope,
						type: "var"
					});
				}
			}
		}

		setShowModal(false);
		NotificationManager.success(null, "Loading complete");
	};

	const loadCSV = (text) => {
		const { data } = Papa.parse(text);

		if (data[0].indexOf("Name") === -1 || data[0].indexOf("Value") === -1) {
			NotificationManager.warning(null, "Name and Value columns are required");
			return;
		}

		const nameIndex = data[0].indexOf("Name");
		const valueIndex = data[0].indexOf("Value");
		let scopeIndex;

		if (data[0].indexOf("Scope") > -1) {
			scopeIndex = data[0].indexOf("Scope");
		}

		data.forEach(async (row, i) => {
			if (i === 0) {
				return;
			}

			const name = row[nameIndex];
			const value = row[valueIndex];
			const scope = row[scopeIndex] || "global";

			if (!name || !value) {
				return;
			}

			if (loadOptions.addType === "append") {
				await appendVars(name, value, scope);
			} else if (loadOptions.addType === "overwrite") {
				await overwriteVars(name, value, scope);
			} else if (loadOptions.addType === "replaceAll") {
				props.db.post({ name, value, scope, type: "var" });
			}
		});
	};

	const loadTXT = (name, text) => {
		props.db.post({
			name,
			tags: [],
			text: text.replace(/\r\n/g, "<br />").replace(/\n/g, "<br />"),
			type: "document",
			sortKey: "1",
			scope: "global"
		});
	};

	const loadMD = (name, text) => {
		let frontmatter = fm(text);

		text = frontmatter.body;
		frontmatter = frontmatter.attributes;

		if (frontmatter._id && loadOptions.addType === "replace") {
			props.db
				.get(frontmatter._id)
				.then((doc) => {
					props.db.put({
						_id: doc._id,
						_rev: doc._rev,
						type: "document",
						name,
						text,
						tags: frontmatter.tags || [],
						scope: frontmatter.scope || "global",
						sortKey: frontmatter.sortKey || "1"
					});

					return;
				})
				.catch(() => {});
		}

		props.db.post({
			name,
			text,
			type: "document",
			tags: frontmatter.tags || [],
			scope: frontmatter.scope || "global",
			sortKey: frontmatter.sortKey || "1"
		});
	};

	const checkboxChange = (e) => {
		setSaveOptions({
			...saveOptions,
			[e.target.name]: !saveOptions[e.target.name]
		});
	};

	const loadOptionChange = (val) => {
		setLoadOptions({ ...loadOptions, addType: val });
	};

	const loadTypeChange = (val) => {
		setLoadOptions({ ...loadOptions, type: val });
	};

	return (
		<Container>
			<Modal show={showModal} backdrop="static" keyboard={false}>
				<Modal.Header>
					<Modal.Title>Loading...</Modal.Title>
				</Modal.Header>
			</Modal>
			<Form>
				<Form.Label>Save Options</Form.Label>
				<Form.Group className="mb-3" controlId="formBasicManifest">
					<Form.Check
						type="checkbox"
						name="manifest"
						label="Manifest (Backup)"
						onChange={checkboxChange}
						value={saveOptions.manifest}
						defaultChecked
					/>
				</Form.Group>
				<Form.Group className="mb-3" controlId="formBasicReadable">
					<Form.Check
						type="checkbox"
						name="readable"
						label="Human Readable"
						value={saveOptions.readable}
						onChange={checkboxChange}
					/>
				</Form.Group>
				<Form.Group className="mb-3" controlId="formBasicEval">
					<Form.Check
						type="checkbox"
						name="eval"
						label="Evaluate Templates"
						value={saveOptions.eval}
						onChange={checkboxChange}
						disabled={!saveOptions.readable}
					/>
				</Form.Group>
			</Form>
			<Button onClick={save}>Save</Button> <hr />
			<Form onSubmit={load}>
				<Form.Label>Load Options</Form.Label>
				<br />
				<ToggleButtonGroup
					type="radio"
					value={loadOptions.type}
					onChange={loadTypeChange}
					name="loadType"
					className="mb-2"
				>
					<ToggleButton id="option-all" variant="outline-primary" value="all">
						All
					</ToggleButton>
					<ToggleButton id="option-docs" variant="outline-primary" value="docs">
						Documents
					</ToggleButton>
					<ToggleButton id="option-vars" variant="outline-primary" value="vars">
						Variables
					</ToggleButton>
				</ToggleButtonGroup>
				<br />
				<ToggleButtonGroup
					type="radio"
					value={loadOptions.addType}
					onChange={loadOptionChange}
					name="loadAppend"
					className="mb-2"
				>
					<ToggleButton
						id="option-append"
						variant="outline-success"
						value="append"
					>
						Append
					</ToggleButton>
					<ToggleButton
						id="option-overwrite"
						variant="outline-secondary"
						value="overwrite"
					>
						Overwrite
					</ToggleButton>
					<ToggleButton
						id="option-replace-all"
						variant="outline-danger"
						value="replaceAll"
					>
						Replace All
					</ToggleButton>
				</ToggleButtonGroup>
				{loadOptions.addType === "append" && loadOptions.type !== "docs" && (
					<Alert variant="secondary">
						Any variables or scopes from the loaded file with names that
						conflict with existing variables or scopes will have a random string
						appended to the end.
					</Alert>
				)}
				{loadOptions.addType === "append" && loadOptions.type === "docs" && (
					<Alert style={{ visibility: "hidden" }}>
						aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
						aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
						aaaaaaaaaaaaaaaaaaaa
					</Alert>
				)}
				{loadOptions.addType === "overwrite" && (
					<Alert variant="warning">
						This will overwrite any{" "}
						{loadOptions.type === "all" &&
							"documents or variables with conflicting IDs or names, respectively,"}
						{loadOptions.type === "docs" && "documents with conflicting IDs"}
						{loadOptions.type === "vars" &&
							"variables with conflicting names"}{" "}
						with those from the loaded file. It may be a good idea to make a
						backup.
					</Alert>
				)}
				{loadOptions.addType === "replaceAll" && (
					<Alert variant="danger">
						This will replace all of your{" "}
						{loadOptions.type === "all" && "documents and variables"}
						{loadOptions.type === "docs" && "documents"}
						{loadOptions.type === "vars" && "variables"}. It is a good idea to
						make a backup.
					</Alert>
				)}
				<Form.Group className="mb-3" controlId="formBasicLoadFile">
					<Form.Label>Load manifest.json</Form.Label>
					<Form.Control type="file" accept=".json, .csv, .txt, .md, .zip" />
					<Button type="submit">Load</Button>
				</Form.Group>
			</Form>
			<ListGroup>
				<h3>Tips</h3>
				<ListGroup.Item>
					You can load nothing with 'Replace All' selected to delete everything
					from the selected types of items
				</ListGroup.Item>
				<ListGroup.Item>
					If you choose 'Human Readable' when saving, the program will generate
					a .txt file for each variable scope and a .md file for each document
				</ListGroup.Item>
				<ListGroup.Item>
					Choosing 'Evaluate Templates' makes the human readable documents
					contain the values from variables, like if you were looking at them in
					the list view
				</ListGroup.Item>
			</ListGroup>
		</Container>
	);
}
