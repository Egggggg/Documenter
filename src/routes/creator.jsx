import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { NotificationManager } from "react-notifications";

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

	const [tagValue, setTagValue] = useState("");
	const [tags, setTags] = useState([]);

	const [{ search }] = useState(useLocation());
	const [id, setId] = useState(null);
	const [guide, setGuide] = useState(null);

	const [redirect, setRedirect] = useState(false);

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

	const popover = (title, text, prev, next) => {
		return (
			<Popover style={{ maxWidth: "60%" }}>
				<Popover.Header as="h3">{title}</Popover.Header>
				<Popover.Body dangerouslySetInnerHTML={{ __html: text }}></Popover.Body>
				<div className="text-end me-3 mb-3">
					{prev && <Button onClick={() => setGuide(prev)}>Previous</Button>}
					{next && <Button onClick={() => setGuide(next)}>Next</Button>}
				</div>
			</Popover>
		);
	};

	return (
		<Container>
			<Form onSubmit={save(true)}>
				{redirect && <Navigate to="/" />}
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
							onChange={(e) => setTagValue(e.target.value)}
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
				<Form.Group className="mb-3" controlId="formBasicScope">
					<Form.Label>Scope</Form.Label>
					<Form.Control
						type="text"
						value={scope}
						onChange={(e) => setScope(e.target.value)}
						placeholder="Scope"
					/>
				</Form.Group>
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
				<MDEditor
					onKeyDown={mdEditorDown}
					value={mdValue}
					onChange={setMdValue}
				/>
				<Card>
					<OverlayTrigger
						placement="top"
						overlay={popover(
							"Tags",
							"Tags are used for filtering your documents in the list view. Each document can have any number of tags, and you can delete them by clicking on them while on this page",
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
				<Button type="submit">Create</Button>
				<span>(or Ctrl+S in the text editor)</span>
			</Form>
		</Container>
	);
}
