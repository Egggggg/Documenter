import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");

	const [tagValue, setTagValue] = useState("");
	const [tags, setTags] = useState([]);

	const [allCollections, setAllCollections] = useState([]);
	const [collections, setCollections] = useState([]);

	useEffect(() => {
		props.db.find({ selector: { type: "collection" } }).then((results) => {
			setAllCollections(
				results.docs.map((row) => {
					return row._id;
				})
			);
		});
	});

	const save = () => {
		const data = {
			_id: new Date().toJSON(),
			collections: collections,
			name: nameValue,
			tags: tags,
			text: mdValue,
			type: "document"
		};

		props.db.put(data);
	};

	const addTag = (e) => {
		e.preventDefault();
		setTags([...tags, tagValue]);
		setTagValue("");
	};

	const tagValueChange = (e) => {
		setTagValue(e.target.value);
	};

	const nameValueChange = (e) => {
		setNameValue(e.target.value);
	};

	const toggleCollection = (e) => {
		const index = collections.indexOf(e.target.value);

		if (index === -1) {
			setCollections([...collections, e.target.value]);
		} else {
			const newCollections = collections.filter(
				(value) => value === e.target.value
			);

			setCollections(newCollections);
		}
	};

	return (
		<div className="creator">
			<input type="text" value={nameValue} onChange={nameValueChange} />
			<MDEditor value={mdValue} onChange={setMdValue} />
			<form onSubmit={addTag}>
				<input type="submit" value="+" />
				<input type="text" value={tagValue} onChange={tagValueChange} />
			</form>
			<ul>
				{tags.map((tag) => {
					return (
						<div className="tag" key={tag}>
							<li>{tag}</li>
							<br />
						</div>
					);
				})}
			</ul>
			<details>
				<summary>Collections</summary>
				{allCollections.map((name) => {
					return (
						<div key={name}>
							<input
								type="checkbox"
								name={name}
								value={name}
								onChange={toggleCollection}
							/>
							<label for={name}>{name}</label>
						</div>
					);
				})}
			</details>
			<button onClick={save}>Create</button>
		</div>
	);
}
