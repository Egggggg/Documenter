import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { NotificationManager } from "react-notifications";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Popover from "react-bootstrap/Popover";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");
	const [keyValue, setKeyValue] = useState("1");
	const [scope, setScope] = useState("");

	const [tagValue, setTagValue] = useState("");
	const [tags, setTags] = useState([]);

	const [{ search }] = useState(useLocation());
	const [id, setId] = useState(null);
	const [guide, setGuide] = useState(0);

	const [redirect, setRedirect] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(search);
		const idParam = params.get("id");
		const guideParam = params.get("guide");

		setId(idParam);

		if (!isNaN(guideParam)) {
			setGuide(parseInt(guideParam));
		}

		if (idParam) {
			props.db.get(idParam, { include_docs: true }).then((doc) => {
				setMdValue(doc.text);
				setNameValue(doc.name);
				setTags(doc.tags);
				setKeyValue(doc.sortKey);
				setScope(doc.scope || "");
			});
		}
	}, [props.db, search, setId]);

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

	const mdEditorDown = (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			save(false)();
		}
	};

	const namePopover = (
		<Popover>
			<Popover.Header as="h3">Enter a name</Popover.Header>
			<Popover.Body>Enter a name here for your new document</Popover.Body>
		</Popover>
	);

	return (
		<Form onSubmit={save(true)}>
			{redirect && <Navigate to="/" />}
			<Form.Group className="mb-3" controlId="formBasicItemName">
				<Form.Label>Item Name</Form.Label>
				<Form.Control
					type="text"
					value={nameValue}
					onChange={(e) => setTagValue(e.target.value)}
					placeholder="Name"
				/>
			</Form.Group>
			<Form.Group className="mb-3" controlId="formBasicSortKey">
				<Form.Label>Sort Key</Form.Label>
				<Form.Control
					type="text"
					value={keyValue}
					onChange={(e) => setKeyValue(e.target.value)}
					placeholder="Sort key"
				/>
			</Form.Group>
			<Form.Group className="mb-3" controlId="formBasicScope">
				<Form.Label>Scope</Form.Label>
				<Form.Control
					type="text"
					value={scope}
					onChange={(e) => setScope(e.target.value)}
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
			<span>(or Ctrl+S in the text editor)</span>
		</Form>
	);
}
