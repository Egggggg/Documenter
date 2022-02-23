import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { NotificationManager } from "react-notifications";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");
	const [keyValue, setKeyValue] = useState("1");
	const [scope, setScope] = useState("");

	const [tagValue, setTagValue] = useState("");
	const [tags, setTags] = useState([]);

	const [{ search }] = useState(useLocation());
	const [id, setId] = useState(null);

	const [redirect, setRedirect] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(search);
		setId(params.get("id"));

		if (id != null) {
			props.db.get(id, { include_docs: true }).then((doc) => {
				setMdValue(doc.text);
				setNameValue(doc.name);
				setTags(doc.tags);
				setKeyValue(doc.sortKey);
				setScope(doc.scope || "");
			});
		}
	}, [id, props.db, search, setId]);

	const save = (leave) => (e) => {
		e.preventDefault();

		if (id !== null) {
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
			const data = {
				name: nameValue,
				tags: tags,
				text: mdValue,
				type: "document",
				sortKey: keyValue,
				scope: scope
			};

			props.db.post(data);
		}

		if (!leave) {
			NotificationManager.success(null, "Saved", 750);
		}

		setRedirect(leave);
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

	const nameValueChange = (e) => {
		setNameValue(e.target.value);
	};

	const mdEditorDown = (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			save(false)();
		}
	};

	const keyValueChange = (e) => {
		setKeyValue(e.target.value);
	};

	const scopeChange = (e) => {
		setScope(e.target.value);
	};

	return (
		<Form onSubmit={save(true)}>
			{redirect && <Navigate to="/" />}
			<Form.Group className="mb-3" controlId="formBasicItemName">
				<Form.Label>Item Name</Form.Label>
				<Form.Control
					type="text"
					value={nameValue}
					onChange={nameValueChange}
					placeholder="Name"
				/>
			</Form.Group>
			<Form.Group className="mb-3" controlId="formBasicSortKey">
				<Form.Label>Sort Key</Form.Label>
				<Form.Control
					type="text"
					value={keyValue}
					onChange={keyValueChange}
					placeholder="Sort key"
				/>
			</Form.Group>
			<Form.Group className="mb-3" controlId="formBasicScope">
				<Form.Label>Scope</Form.Label>
				<Form.Control
					type="text"
					value={scope}
					onChange={scopeChange}
					placeholder="Scope"
				/>
			</Form.Group>
			<MDEditor
				onKeyDown={mdEditorDown}
				value={mdValue}
				onChange={setMdValue}
			/>
			<Card>
				<Card.Header>Tags</Card.Header>
				<Form.Group className="mb-3" controlId="formBasicTag">
					<Form.Label>Add Tag</Form.Label>
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
			<Button type="submit">Create</Button>
		</Form>
	);
}
