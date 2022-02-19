import MDEditor from "@uiw/react-md-editor";
import { useState } from "react";

export default function Creator(props) {
	const [mdValue, setMdValue] = useState("# Boy howdy!");
	const [nameValue, setNameValue] = useState("Default Name");
	const [tagValue, setTagValue] = useState("");
	const [tags, setTags] = useState([]);

	const save = async () => {
		const data = {
			_id: new Date().toJSON(),
			name: nameValue,
			tags: tags,
			text: mdValue
		};

		await props.db.put(data);
	};

	const addTag = () => {
		console.log(tags);

		setTags([...tags, tagValue]);
		setTagValue("");

		console.log(tags);
	};

	const setTagValueWrapper = (e) => {
		console.log(e.target.value);
		setTagValue(e.target.value);
	};

	const setNameValueWrapper = (e) => {
		setNameValue(e.target.value);
	};

	return (
		<div className="creator">
			<input type="text" value={nameValue} onChange={setNameValueWrapper} />
			<MDEditor value={mdValue} onChange={setMdValue} />
			<button onClick={addTag}>+</button>
			<input type="text" value={tagValue} onChange={setTagValueWrapper} />
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
