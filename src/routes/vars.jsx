import { useEffect, useState } from "react";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

export default function Vars(props) {
	const [vars, setVars] = useState({});
	const [newName, setNewName] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newTag, setNewTag] = useState("");

	useEffect(() => {
		props.db
			.find({ include_docs: true, selector: { type: "var" } })
			.then((results) => {
				const newVars = {};

				results.docs.forEach((doc) => {
					console.log(doc);

					if (doc.name === undefined) {
						props.db.put({
							_id: doc._id,
							_rev: doc._rev,
							name: doc._id,
							value: doc.value,
							tag: doc.tag
						});

						doc.name = doc._id;
					}

					newVars[doc.tag] = {
						...newVars[doc.tag],
						[doc.name]: doc.value
					};
				});

				setVars(newVars);
			});
	}, [props.db]);

	const addVar = (e) => {
		e.preventDefault();

		let tag = newTag;
		let exists = false;

		if (!tag) {
			tag = "global";
		}

		if (vars[tag]) {
			exists = Object.keys(vars[tag]).includes(newName);
		}

		if (exists) {
			if (newValue === "") {
				props.db
					.find({ selector: { type: "var", tag: tag, name: newName } })
					.then((results) => {
						console.log(results);
						props.db.remove(results.docs[0]);
					});
			} else {
				props.db
					.find({ selector: { type: "var", tag: tag, name: newName } })
					.then((results) => {
						return props.db.put({
							_id: new Date().toJSON(),
							_rev: results.docs[0]._rev,
							name: newName,
							value: newValue,
							tag: tag,
							type: "var"
						});
					});
			}
		} else {
			props.db.put({
				_id: new Date().toJSON(),
				name: newName,
				value: newValue,
				tag: tag,
				type: "var"
			});
		}

		if (newValue !== "") {
			setVars({
				...vars,
				[tag]: { ...vars[tag], [newName]: newValue }
			});
		} else if (exists) {
			const newVars = { ...vars };
			delete newVars[tag][newName];

			setVars(newVars);
		}

		console.log(tag);

		setNewName("");
		setNewValue("");
		setNewTag("");
	};

	const newNameChange = (e) => {
		setNewName(e.target.value);
	};

	const newValueChange = (e) => {
		setNewValue(e.target.value);
	};

	const newTagChange = (e) => {
		setNewTag(e.target.value);
	};

	const selectVar = (key, name) => () => {
		setNewName(name);
		setNewValue(vars[key][name]);
		setNewTag(key === "global" ? "" : key);
	};

	return (
		<Container>
			<Form onSubmit={addVar}>
				<Form.Group className="mb-3" controlId="formBasicVarName">
					<Form.Label>Variable Name</Form.Label>
					<Form.Control
						value={newName}
						onChange={newNameChange}
						type="text"
						placeholder="Name"
					/>
				</Form.Group>
				<Form.Group className="mb-3" controlId="formBasicVarValue">
					<Form.Label>Variable Value</Form.Label>
					<Form.Control
						value={newValue}
						onChange={newValueChange}
						type="text"
						placeholder="Value"
					/>
				</Form.Group>
				<Form.Group className="mb3" controlId="formBasicVarTags">
					<Form.Label>Tags</Form.Label>
					<Form.Control
						value={newTag}
						onChange={newTagChange}
						type="text"
						placeholder="Tag"
					/>
				</Form.Group>
				<br />
				<br />
				<Button type="submit">Add</Button>
			</Form>
			<br />
			<br />
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
					console.log(key);
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
