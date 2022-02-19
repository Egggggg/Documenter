import { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";

export default function Collections(props) {
	const [collections, setCollections] = useState([]);
	const [newValue, setNewValue] = useState("");

	useEffect(() => {
		props.db
			.find({ limit: 10, selector: { type: "collection" } })
			.then((results) => {
				console.log(results);
				setCollections(results.docs.map((row) => row._id));
			});
	}, [props.db]);

	const addCollection = (e) => {
		e.preventDefault();

		const data = {
			_id: newValue,
			type: "collection"
		};

		props.db.put(data).then(() => {
			setCollections([...collections, newValue]);
			setNewValue("");
		});
	};

	const newValueChange = (e) => {
		setNewValue(e.target.value);
	};

	return (
		<div id="collections">
			<form onSubmit={addCollection}>
				<input type="submit" value="+" />
				<input type="text" value={newValue} onChange={newValueChange} />
			</form>
			<ul>
				{collections.map((collection) => {
					return (
						<li key={collection}>
							<LinkContainer to={`/collections/${collection}`}>
								<button>{collection}</button>
							</LinkContainer>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
