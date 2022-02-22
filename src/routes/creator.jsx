import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { NotificationManager } from "react-notifications";

import ListGroup from "react-bootstrap/ListGroup";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");
	const [keyValue, setKeyValue] = useState("1");

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
			});
		}
	}, [id, props.db, search, setId]);

	const save = (leave) => () => {
		if (id !== null) {
			props.db.get(id).then((doc) => {
				props.db.put({
					_id: id,
					_rev: doc._rev,
					name: nameValue,
					tags: tags,
					text: mdValue,
					type: "document",
					sortKey: keyValue
				});
			});
		} else {
			const data = {
				name: nameValue,
				tags: tags,
				text: mdValue,
				type: "document",
				sortKey: keyValue
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

	return (
		<div className="creator">
			{redirect && <Navigate to="/" />}
			<input type="text" value={nameValue} onChange={nameValueChange} />
			<br />
			<input type="text" value={keyValue} onChange={keyValueChange} />
			<MDEditor
				onKeyDown={mdEditorDown}
				value={mdValue}
				onChange={setMdValue}
			/>
			<form onSubmit={addTag}>
				<input type="submit" value="+" />
				<input type="text" value={tagValue} onChange={tagValueChange} />
			</form>
			<ListGroup>
				{tags.map((tag) => {
					return (
						<ListGroup.Item action key={tag} onClick={deleteTag(tag)}>
							{tag}
						</ListGroup.Item>
					);
				})}
			</ListGroup>
			<button onClick={save(true)}>Create</button>
		</div>
	);
}
