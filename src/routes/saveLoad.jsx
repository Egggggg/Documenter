import JSZip from "jszip";
import FileSaver from "file-saver";
import { useState } from "react";
import Handlebars from "handlebars/dist/handlebars.min.js";

import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
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

	const save = () => {
		const manifest = {};

		const zip = new JSZip();
		let docFolder;
		let varFolder;

		const vars = {};
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
						manifest[`${doc.name}--${doc._id}`] = {
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
				results.docs.forEach((doc) => {
					const slug = `${doc.name}--${doc._id}`;
					let text = doc.text;

					if (saveOptions.eval && saveOptions.readable) {
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
						manifest[slug] = {
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

		const varString = [0, 1, 2, 3, 4]
			.map(() => {
				return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 25)];
			})
			.join("");

		const text = await e.target.elements.formBasicLoadFile.files[0].text();

		const data = JSON.parse(text);

		Object.keys(data).forEach(async (key) => {
			const doc = data[key];

			if (loadOptions.addType === "append") {
				if (doc.type === "document" && loadOptions.type !== "vars") {
					props.db.put({
						_id: new Date().toJSON(),
						name: doc.name,
						tags: doc.tags,
						text: doc.text,
						type: "document",
						sortKey: doc.sortKey,
						scope: doc.scope
					});
				}
				if (doc.type === "var" && loadOptions.type !== "docs") {
					let name = doc.name;
					let scope = doc.scope;

					if (doc.scope === "global") {
						const results = await props.db.find({
							selector: { scope: doc.name }
						});

						if (results.length > 0) {
							name = `${name}-${varString}`;
						}
					}

					let results = await props.db.find({
						selector: { scope: scope, name: name }
					});

					if (results.docs.length > 0) {
						name = `${name}-${varString}`;
					}

					results = await props.db.find({
						selector: { scope: "global", name: scope }
					});

					if (results.docs.length > 0) {
						scope = `${scope}-${varString}`;
					}

					props.db.put({
						_id: new Date().toJSON(),
						name: name,
						value: doc.value,
						scope: scope,
						type: "var"
					});
				}
			}
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
			<Button onClick={save}>Save As...</Button> <hr />
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
					<Form.Control type="file" accept=".json" />
					<Button type="submit">Load</Button>
				</Form.Group>
			</Form>
		</Container>
	);
}
