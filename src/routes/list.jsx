import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";

export default function List(props) {
	const [items, setItems] = useState([]);

	useEffect(() => {
		props.db
			.find({
				limit: 10,
				include_docs: true,
				selector: { _id: { $regex: "^(?!_design).+" } }
			})
			.then((results) => {
				setItems(results.docs);
			});
	}, [props.db]);

	return (
		<div id="results">
			{items.map((item) => {
				return (
					<div className="item">
						<h2>{item.name}</h2>
						<ul>
							{item.tags.forEach((tag) => {
								<li>{tag}</li>;
							})}
						</ul>
						<MDEditor.Markdown source={item.text} />
					</div>
				);
			})}
		</div>
	);
}
