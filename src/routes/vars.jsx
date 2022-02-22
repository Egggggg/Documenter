import { useEffect, useState } from "react";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

export default function Vars(props) {
	const [allVars, setAllVars] = useState({});
	const [vars, setVars] = useState({});
	const [taggedVars, setTaggedVars] = useState({});
	const [newName, setNewName] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newTag, setNewTag] = useState("");

	useEffect(() => {
		props.db
			.find({ include_docs: true, selector: { type: "var" } })
			.then((results) => {
				const newVars = {};
				const newTaggedVars = {};

				results.docs.forEach((doc) => {
					if (doc.tag === undefined || doc.tag === "") {
						newVars[doc._id] = doc.value;
					} else {
						newTaggedVars[doc.tag] = {
							...newTaggedVars[doc.tag],
							[doc._id]: doc.value
						};
					}

					setVars(newVars);
					setTaggedVars(newTaggedVars);
				});
			});
	}, [props.db, taggedVars, vars]);

	const addVar = (e) => {
		e.preventDefault();

		if (Object.keys(vars).includes(newName)) {
			if (newValue === "") {
				props.db.get(newName).then((doc) => {
					props.db.remove(doc);
				});
			} else {
				props.db.get(newName).then((doc) => {
					return props.db.put({
						_id: newName,
						_rev: doc._rev,
						value: newValue,
						tag: newTag,
						type: "var"
					});
				});
			}
		} else {
			props.db.put({
				_id: newName,
				value: newValue,
				tag: newTag,
				type: "var"
			});
		}

		setVars({ ...vars, [newName]: newValue });

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

	const selectVar = (key) => () => {
		setNewName(key);
		setNewValue(vars[key]);
	};

	const selectTaggedVar = (key, name) => () => {
		setNewName(name);
		setNewValue(taggedVars[key][name]);
		setNewTag(key);
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
				<Button type="submit">Add</Button>
			</Form>
			<br />
			<br />
			{Object.keys(vars).length !== 0 && (
				<Card>
					<Card.Header>Global</Card.Header>
					<ListGroup>
						{Object.keys(vars).map((key) => (
							<ListGroup.Item key={key} action onClick={selectVar(key)}>
								{`${key}: ${vars[key]}`}
							</ListGroup.Item>
						))}
					</ListGroup>
				</Card>
			)}
			{Object.keys(taggedVars).length !== 0 &&
				Object.keys(taggedVars).map((key) => {
					<Card>
						<Card.Header>{key}</Card.Header>
						<ListGroup>
							{Object.keys(taggedVars[key]).map((name) => (
								<ListGroup.Item
									key={name}
									action
									onClick={selectTaggedVar(key, name)}
								>
									{`${name}: ${vars[key][name]}`}
								</ListGroup.Item>
							))}
						</ListGroup>
					</Card>;
				})}
		</Container>
	);
}
