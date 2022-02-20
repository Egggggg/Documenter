import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";

import ListGroup from "react-bootstrap/ListGroup";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");

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
			});
		}
	}, [id, props.db, search, setId]);

	const save = () => {
		if (id !== null) {
			props.db.get(id).then((doc) => {
				props.db.put({
					_id: id,
					_rev: doc._rev,
					name: nameValue,
					tags: tags,
					text: mdValue,
					type: "document"
				});
			});
		} else {
			const data = {
				name: nameValue,
				tags: tags,
				text: mdValue,
				type: "document"
			};

			props.db.post(data);
		}

		setId(null);
		setMdValue("# Boy howdy!");
		setNameValue("Default Name");
		setTags([]);

		setRedirect(true);
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

	return (
		<div className="creator">
			{redirect && <Navigate to="/" />}
			<input type="text" value={nameValue} onChange={nameValueChange} />
			<MDEditor value={mdValue} onChange={setMdValue} />
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
			<button onClick={save}>Create</button>
		</div>
	);
}
