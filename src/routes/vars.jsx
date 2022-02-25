import { useEffect, useState } from "react";
import { NotificationManager } from "react-notifications";
import { useLocation, Navigate } from "react-router-dom";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

export default function Vars(props) {
	const [vars, setVars] = useState({});
	const [newName, setNewName] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newScope, setNewScope] = useState("");
	const [scopes, setScopes] = useState([]);
	const [guide, setGuide] = useState(null);
	const [redirect, setRedirect] = useState(null);
	const [{ search }] = useState(useLocation());

	useEffect(() => {
		const params = new URLSearchParams(search);
		setGuide(params.get("guide"));
	}, [search]);

	useEffect(() => {
		props.db
			.find({ include_docs: true, selector: { type: "var" } })
			.then((results) => {
				const newVars = {};

				results.docs.forEach((doc) => {
					if (!doc.name) {
						props.db.put({ ...doc, name: doc._id });

						doc.name = doc._id;
					}

					if (!doc.scope) {
						props.db.put({ ...doc, scope: "global" });

						doc.scope = "global";
					}

					newVars[doc.scope] = {
						...newVars[doc.scope],
						[doc.name]: doc.value
					};

					if (!scopes.includes(doc.scope)) {
						setScopes([...scopes, doc.scope]);
					}
				});

				setVars(newVars);
			});
	}, [props.db, scopes]);

	useEffect(() => {
		if (guide && guide.startsWith("/create")) {
			setRedirect(guide);
		}
	}, [guide]);

	const addVar = (e) => {
		e.preventDefault();

		let scope = newScope;
		let exists = false;

		if (!scope) {
			scope = "global";
		}

		if (vars[scope]) {
			exists = Object.keys(vars[scope]).includes(newName);
		}

		if (scope === "global" && scopes.includes(newName)) {
			NotificationManager.error(
				null,
				"There is already a scope with this name"
			);

			return;
		}

		// if vars[scope] isn't an object or undefined, it is a variable
		if (
			vars.global &&
			!["object", "undefined"].includes(typeof vars.global[scope])
		) {
			console.log(typeof vars[scope]);
			console.log(scope);

			NotificationManager.error(
				null,
				"There is a variable in the global scope with this scope name"
			);
			return;
		}

		if (exists) {
			if (!newValue) {
				props.db
					.find({ selector: { type: "var", scope: scope, name: newName } })
					.then((results) => {
						props.db.remove(results.docs[0]);
					});
			} else {
				props.db
					.find({ selector: { type: "var", scope: scope, name: newName } })
					.then((results) => {
						return props.db.put({
							_id: results.docs[0]._id,
							_rev: results.docs[0]._rev,
							name: newName,
							value: newValue,
							scope: scope,
							type: "var"
						});
					});
			}
		} else if (newValue !== "") {
			props.db.put({
				_id: new Date().toJSON(),
				name: newName,
				value: newValue,
				scope: scope,
				type: "var"
			});
		}

		if (newValue) {
			setVars({
				...vars,
				[scope]: { ...vars[scope], [newName]: newValue }
			});
		} else if (exists) {
			const newVars = { ...vars };
			delete newVars[scope][newName];

			if (Object.keys(newVars[scope]).length === 0) {
				delete newVars[scope];
			}

			setVars(newVars);
		}

		setNewName("");
		setNewValue("");
	};

	const newNameChange = (e) => {
		setNewName(e.target.value);
	};

	const newValueChange = (e) => {
		setNewValue(e.target.value);
	};

	const newScopeChange = (e) => {
		setNewScope(e.target.value);
	};

	const selectVar = (key, name) => () => {
		setNewName(name);
		setNewValue(vars[key][name]);
		setNewScope(key === "global" ? "" : key);
	};

	const popover = (title, text, prev, next) => {
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
					{next && <Button onClick={() => setGuide(next)}>Next</Button>}
				</div>
			</Popover>
		);
	};

	return (
		<Container>
			{redirect && <Navigate to={redirect} />}
			<OverlayTrigger
				placement="bottom"
				overlay={popover(
					"Engine",
					"This application uses the <a href='https://handlebarsjs.com/'>HandlebarsJS</a> templating engine for inserting variables, and supports all of its features",
					null,
					"v2"
				)}
				show={guide === "v1"}
			>
				<div></div>
			</OverlayTrigger>
			<Form onSubmit={addVar}>
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Variable Name",
						"This is how you'll refer to your variable in the content of documents. Entering the name of an existing variable will edit that variable",
						"v1",
						"v3"
					)}
					show={guide === "v2"}
				>
					<Form.Group className="mb-3" controlId="formBasicVarName">
						<Form.Label>Variable Name</Form.Label>
						<Form.Control
							value={newName}
							onChange={newNameChange}
							type="text"
							placeholder="Name"
						/>
					</Form.Group>
				</OverlayTrigger>
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Variable Value",
						"This is what will be shown wherever the variable is used",
						"v2",
						"v4"
					)}
					show={guide === "v3"}
				>
					<Form.Group className="mb-3" controlId="formBasicVarValue">
						<Form.Label>Variable Value</Form.Label>
						<Form.Control
							value={newValue}
							onChange={newValueChange}
							type="text"
							placeholder="Value"
						/>
					</Form.Group>
				</OverlayTrigger>
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Scope",
						"Variables can have the same name as long as they're in different scopes. Defaults to 'global'",
						null,
						"/create?guide=s2"
					)}
					show={guide === "s1"}
				>
					<Form.Group className="mb3" controlId="formBasicVarScopes">
						<Form.Label>Scope</Form.Label>
						<Form.Control
							value={newScope}
							onChange={newScopeChange}
							type="text"
							placeholder="Scope"
						/>
					</Form.Group>
				</OverlayTrigger>
				<br />
				<br />
				<Button type="submit">Add</Button>
			</Form>
			<br />
			<br />
			<OverlayTrigger
				placement="top"
				overlay={popover(
					"Variable List",
					"Here is where all the variables you add will show up. You can click one to edit it, and after that you can delete it by saving it with an empty value",
					"v3",
					"/create?guide=v5"
				)}
				show={guide === "v4"}
			>
				<h3>Variable List</h3>
			</OverlayTrigger>
			{vars["global"] && (
				<Card>
					<Card.Header>global</Card.Header>
					<ListGroup>
						{Object.keys(vars["global"]).map((key) => (
							<ListGroup.Item
								key={key}
								action
								onClick={selectVar("global", key)}
							>
								{`${key}: ${vars["global"][key]}`}
							</ListGroup.Item>
						))}
					</ListGroup>
				</Card>
			)}
			{Object.keys(vars).length > 0 &&
				Object.keys(vars).map((key) => {
					return (
						key !== "global" && (
							<Card key={key}>
								<Card.Header>{key}</Card.Header>
								<ListGroup>
									{Object.keys(vars[key]).map((name) => (
										<ListGroup.Item
											key={name}
											action
											onClick={selectVar(key, name)}
										>
											{`${name}: ${vars[key][name]}`}
										</ListGroup.Item>
									))}
								</ListGroup>
							</Card>
						)
					);
				})}
		</Container>
	);
}
