import { useEffect, useState } from "react";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

export default function Vars(props) {
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

				results.docs.forEach((doc) => {
					console.log(doc);

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

		let exists = false;

		if (vars[newTag] === undefined) {
			exists = false;
		} else {
			exists = Object.keys(vars[newTag]).includes(newName);
		}

		if (exists) {
			if (newValue === "") {
				props.db
					.find({ selector: { type: "var", tag: newTag, name: newName } })
					.then((results) => {
						props.db.remove(results.docs[0]);
					});
			} else {
				props.db
					.find({ selector: { type: "var", tag: newTag, name: newName } })
					.then((results) => {
						return props.db.put({
							_id: new Date().toJSON(),
							_rev: results.docs[0]._rev,
							name: newName,
							value: newValue,
							tag: newTag,
							type: "var"
						});
					});
			}
		} else {
			props.db.put({
				_id: new Date().toJSON(),
				name: newName,
				value: newValue,
				tag: newTag,
				type: "var"
			});
		}

				const newTaggedVars = { ...taggedVars };
				delete newTaggedVars[newTag][newName];

				setTaggedVars(newTaggedVars);
				console.log(taggedVars);
		
			if (newValue !== "") {
				setVars({
					...vars,
					[newTag]: { ...vars[newTag], [newName]: newValue }
				});
			} else if (exists) {
				const newVars = { ...vars };
				delete newVars[newName];

				setVars(newVars);
				console.log(vars);
			}
		}

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
		setNewTag(key === "No Tag" ? "" : key);
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
			{Object.keys(vars).length !== 0 && (
				<Card>
					<Card.Header>No Tags</Card.Header>
					<ListGroup>
						{Object.keys(vars["No Tags"]).map((key) => (
							<ListGroup.Item
								key={key}
								action
								onClick={selectVar("No Tags", key)}
							>
								{`${key}: ${vars[key]}`}
							</ListGroup.Item>
						))}
					</ListGroup>
				</Card>
			)}
			{Object.keys(vars).length !== 0 &&
				Object.keys(vars).map(
					(key) =>
						key !== "No Tag" && (
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
				)}
		</Container>
	);
}
