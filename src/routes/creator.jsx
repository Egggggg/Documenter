import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { NotificationManager } from "react-notifications";
import Handlebars from "handlebars/dist/handlebars.min.js";
import { evaluateTable } from "../func";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");
	const [keyValue, setKeyValue] = useState("1");
	const [scope, setScope] = useState("");
	const [vars, setVars] = useState({});

	const [tagValue, setTagValue] = useState("");
	const [tags, setTags] = useState([]);

	const [{ search }] = useState(useLocation());
	const [id, setId] = useState(null);
	const [guide, setGuide] = useState(null);

	const [redirect, setRedirect] = useState(null);
	useEffect(() => {
		props.db
			.find({
				include_docs: true,
				selector: { type: "var" }
			})
			.then((results) => {
				let newVars = {};

				results.docs.forEach((doc) => {
					if (doc.scope === "global") {
						newVars = { ...newVars, [doc.name]: doc.value };
					} else {
						newVars[doc.scope] = {
							...newVars[doc.scope],
							[doc.name]: doc.value
						};
					}
				});

				let newTables = {};

				results.docs.forEach((doc) => {
					if (typeof doc.value !== "string") {
						console.log(doc.value);

						if (doc.scope === "global") {
							newTables = {
								...newTables,
								[doc.name]: evaluateTable(
									doc.value,
									newVars,
									true,
									doc.name,
									doc.scope
								)[0]
							};
						} else {
							newTables[doc.scope] = {
								...newTables[doc.scope],
								[doc.name]: evaluateTable(
									doc.value,
									newVars,
									true,
									doc.name,
									doc.scope
								)[0]
							};
						}
					}
				});

				newVars = { ...newVars, ...newTables };

				setVars(newVars);
			});
	}, [props.db]);

	useEffect(() => {
		const params = new URLSearchParams(search);
		const idParam = params.get("id");

		setId(idParam);
		setGuide(params.get("guide"));

		if (idParam) {
			props.db.get(idParam, { include_docs: true }).then((doc) => {
				setMdValue(doc.text);
				setNameValue(doc.name);
				setTags(doc.tags);
				setKeyValue(doc.sortKey);
				setScope(doc.scope || "");
			});
		}
	}, [props.db, search]);

	useEffect(() => {
		if (guide && guide.startsWith("/vars")) {
			setRedirect(guide);
		}
	}, [guide]);

	const save = (leave) => (e) => {
		if (e) {
			e.preventDefault();
		}

		console.log(id);

		if (id) {
			props.db.get(id).then((doc) => {
				props.db.put({
					_id: id,
					_rev: doc._rev,
					name: nameValue,
					tags: tags,
					text: mdValue,
					type: "document",
					sortKey: keyValue,
					scope: scope
				});
			});
		} else {
			const newId = new Date().toJSON();
			props.db.post({
				_id: newId,
				name: nameValue,
				tags: tags,
				text: mdValue,
				type: "document",
				sortKey: keyValue,
				scope: scope
			});

			if (!leave) {
				setId(newId);
			}
		}

		if (!leave) {
			NotificationManager.success(null, "Saved", 750);
		}

		if (leave) {
			setRedirect("/");
		}
	};

	const addTag = (e) => {
		e.preventDefault();

		if (!tags.includes(tagValue)) {
			setTags([...tags, tagValue]);
		}

		setTagValue("");
	};

	const deleteTag = (remove) => () => {
		const newTags = tags.filter((tag) => tag !== remove);
		setTags(newTags);
	};

	const tagValueChange = (e) => {
		setTagValue(e.target.value);
	};

	const mdEditorDown = (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			save(false)();
		}
	};

	const popover = (title, text, prev, next, done) => {
		return (
			<Popover style={{ maxWidth: "60%" }}>
				<Popover.Header as="h3">{title}</Popover.Header>
				<Popover.Body dangerouslySetInnerHTML={{ __html: text }}></Popover.Body>
				<div className="text-end me-3 mb-3">
					{prev && (
						<Button className="me-3" onClick={() => setGuide(prev)}>
							Previous
						</Button>
					)}
					{next && (
						<Button onClick={() => setGuide(next)}>
							{done ? "Finish" : "Next"}
						</Button>
					)}
				</div>
			</Popover>
		);
	};

	const compile = (item) => {
		try {
			const exists = Object.keys(vars).includes(scope);

			return Handlebars.compile(
				scope && exists ? `{{#with ${scope}}}${mdValue}{{/with}}` : mdValue
			)(vars);
		} catch (err) {
			return err.message.replace(/\n/g, "<br />");
		}
	};

	return (
		<Container>
			<Form onSubmit={save(true)}>
				{redirect && <Navigate to={redirect} />}
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Item Name",
						"This is the title that will show up at the top of your new document",
						null,
						"c2"
					)}
					show={guide === "c1"}
				>
					<Form.Group className="mb-3" controlId="formBasicItemName">
						<Form.Label>Item Name</Form.Label>
						<Form.Control
							type="text"
							value={nameValue}
							onChange={(e) => setNameValue(e.target.value)}
							placeholder="Name"
						/>
					</Form.Group>
				</OverlayTrigger>
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Sort Key",
						"The sort key is used to assign your document a place in the sort order. Sorting is done lexicographically",
						"c1",
						"c3"
					)}
					show={guide === "c2"}
				>
					<Form.Group className="mb-3" controlId="formBasicSortKey">
						<Form.Label>Sort Key</Form.Label>
						<Form.Control
							type="text"
							value={keyValue}
							onChange={(e) => setKeyValue(e.target.value)}
							placeholder="Sort key"
						/>
					</Form.Group>
				</OverlayTrigger>
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Scope",
						"Without setting scope, you will need to access the scope of a scoped variable (meaning the scope is not the default of 'global') before you can use it, like this: <code>{{scope.name}}</code>. With a scope, you access variables from the same scope with just their name. If you enter a scope, you can still access global variables or variables from other scopes by prepending them with <code>../</code>, like this <code>{{../otherScope.name}}</code> or <code>{{../globalVar}}</code>",
						"/vars?guide=s1",
						"done",
						true
					)}
					show={guide === "s2"}
				>
					<Form.Group className="mb-3" controlId="formBasicScope">
						<Form.Label>Scope</Form.Label>
						<Form.Control
							type="text"
							value={scope}
							onChange={(e) => setScope(e.target.value)}
							placeholder="Scope"
						/>
					</Form.Group>
				</OverlayTrigger>
				<OverlayTrigger
					placement="top"
					overlay={popover(
						"Content",
						"This is the main body of your document. Github flavored markdown is supported",
						"c2",
						"c4"
					)}
					show={guide === "c3"}
				>
					<div></div>
				</OverlayTrigger>
				<OverlayTrigger
					placement="top"
					overlay={popover(
						"Usage",
						"To use a variable in the content of a document, put the name between {{}}, like this: <code>{{name}}</code>",
						"/vars?guide=v4",
						"done",
						true
					)}
					show={guide === "v5"}
				>
					<div></div>
				</OverlayTrigger>
				<OverlayTrigger
					placement="top"
					overlay={popover(
						"Usage",
						"To use a variable in the content of a document, put the name between {{}}, like this: <code>{{name}}</code>",
						"/vars?guide=v4",
						"done",
						true
					)}
					show={guide === "v5"}
				>
					<div></div>
				</OverlayTrigger>
				<OverlayTrigger
					placement="top"
					overlay={popover(
						"Helper Functions",
						"You can check equality of values with our three custom helpers: <code>eq</code> (equals), <code>lt</code> (less than),  and <code>gt</code> (greater than). They each take two arguments, and check the first one against the second one. You can use variables in these helpers. You use them like this: <code>{{#eq&nbsp;3&nbsp;varName}}&nbsp;{{/eq}}</code>",
						null,
						"h2"
					)}
					show={guide === "h1"}
				>
					<div></div>
				</OverlayTrigger>
				<OverlayTrigger
					placement="top"
					overlay={popover(
						"Conditionals",
						"Where the helper functions really shine is when used with conditionals in a subexpression. If you do this, for example with <code>{{#if&nbsp;(lt&nbsp;3&nbsp;4)}}Hi!{{/if}}</code>, the content within the conditional will only show up if the helper returns <code>true</code>",
						"h1",
						"done",
						true
					)}
					show={guide === "h2"}
				>
					<div></div>
				</OverlayTrigger>
				<MDEditor
					onKeyDown={mdEditorDown}
					value={mdValue}
					onChange={setMdValue}
					previewOptions={{}}
				/>
				<Card>
					<OverlayTrigger
						placement="top"
						overlay={popover(
							"Tags",
							"Tags are used to filter your documents in the list view. Each document can have any number of tags, and you can delete them by clicking them on this page",
							"c3",
							"c5"
						)}
						show={guide === "c4"}
					>
						<Card.Header>Tags</Card.Header>
					</OverlayTrigger>
					<Form.Group className="mb-3" controlId="formBasicTag">
						<Form.Control
							type="text"
							value={tagValue}
							onChange={tagValueChange}
							placeholder="New tag"
						/>
						<Button onClick={addTag} type="submit">
							Add
						</Button>
					</Form.Group>
					<ListGroup>
						{tags.map((tag) => {
							return (
								<ListGroup.Item action key={tag} onClick={deleteTag(tag)}>
									{tag}
								</ListGroup.Item>
							);
						})}
					</ListGroup>
				</Card>
				<OverlayTrigger
					placement="right"
					overlay={popover(
						"Create",
						"That's all for this guide! Click here to create your document",
						"c4",
						"done",
						true
					)}
					show={guide === "c5"}
				>
					<Button type="submit">Create</Button>
				</OverlayTrigger>
				<span>(or Ctrl+S in the text editor)</span>
				<Card className="mt-3">
					<Card.Header>
						<h1 className="float-start">{nameValue}</h1>
						<Button className="float-end">Delete</Button>
						<Button className="float-end">Edit</Button>
					</Card.Header>
					<Card.Body>
						Sort Key: {keyValue}
						<h3>Content</h3>
						<MDEditor.Markdown source={compile(mdValue)} />
						<hr />
						{tags.length > 0 && (
							<div id="tags">
								<h3>Tags</h3>
								<ListGroup>
									{tags.map((tag) => (
										<ListGroup.Item key={tag}>{tag}</ListGroup.Item>
									))}
								</ListGroup>
							</div>
						)}
					</Card.Body>
				</Card>
			</Form>
		</Container>
	);
}
