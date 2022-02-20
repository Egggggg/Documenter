import MDEditor from "@uiw/react-md-editor";
import { useState, useEffect } from "react";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");

	const [tagValue, setTagValue] = useState("");
	const [tags, setTags] = useState([]);

	const save = () => {
		const data = {
			_id: new Date().toJSON(),
			name: nameValue,
			tags: tags,
			text: mdValue
		};

		props.db.put(data);
		setMdValue("# Boy howdy!");
		setNameValue("Default Name");
		setTags([]);
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
			<button onClick={save}>Create</button>
		</div>
	);
}
