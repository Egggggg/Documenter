import { useEffect, useState } from "react";

import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

export default function Vars(props) {
	const [vars, setVars] = useState({});
	const [newName, setNewName] = useState("");
	const [newValue, setNewValue] = useState("");

	useEffect(() => {
		props.db
			.find({ include_docs: true, selector: { type: "var" } })
			.then((results) => {
				setVars(
					Object.fromEntries(
						results.docs.map((doc) => {
							return [doc._id, doc.value];
						})
					)
				);
			});
	}, [props.db]);

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
						type: "var"
					});
				});
			}
		} else {
			props.db.put({
				_id: newName,
				value: newValue,
				type: "var"
			});
		}

		setVars({ ...vars, [newName]: newValue });

		setNewName("");
		setNewValue("");
	};

	const newNameChange = (e) => {
		setNewName(e.target.value);
	};

	const newValueChange = (e) => {
		setNewValue(e.target.value);
	};

	const selectVar = (key) => () => {
		setNewName(key);
		setNewValue(vars[key]);
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
				<Button type="submit">Add</Button>
			</Form>
			<br />
			<br />
			<ListGroup>
				{Object.keys(vars).map(
					(key) =>
						vars[key] !== "" && (
							<ListGroup.Item key={key} action onClick={selectVar(key)}>
								{`${key}: ${vars[key]}`}
							</ListGroup.Item>
						)
				)}
			</ListGroup>
		</Container>
	);
}
