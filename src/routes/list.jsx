import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";

import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";

export default function List(props) {
	const [items, setItems] = useState([]);
	const [collection, setCollection] = useState("");
	const [tag, setTag] = useState("");

	const { search } = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(search);

		setCollection(params.get("collection"));
		setTag(params.get("tag"));
	}, [search]);

	useEffect(() => {
		const selector = {
			type: "document"
		};

		if (collection !== null) {
			selector.collections = {
				$elemMatch: {
					$eq: collection
				}
			};
		}

		if (tag !== null) {
			selector.tags = {
				$elemMatch: {
					$eq: tag
				}
			};
		}

		props.db
			.find({
				limit: 25,
				include_docs: true,
				selector: selector
			})
			.then((results) => {
				setItems(results.docs);
			});
	}, [collection, props.db, tag]);

	return (
		<Container>
			{items.map((item) => {
				return (
					<div key={item._id}>
						<Card>
							<Card.Header>{item.name}</Card.Header>
							<Card.Body>
								<h3>Content</h3>
								<MDEditor.Markdown source={item.text} />
								<hr />
								{item.tags.length > 0 && (
									<div id="tags">
										<h3>Tags</h3>
										<ul>
											{item.tags.map((tag) => (
												<li key={tag}>{tag}</li>
											))}
										</ul>
									</div>
								)}
								{item.collections.length > 0 && (
									<div id="collections">
										<h3>Collections</h3>
										<ul>
											{item.collections.map((collection) => (
												<li key={collection}>{collection}</li>
											))}
										</ul>
									</div>
								)}
							</Card.Body>
						</Card>
						<br />
					</div>
				);
			})}
		</Container>
	);
}
