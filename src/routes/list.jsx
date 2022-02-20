import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";

export default function List(props) {
	const [items, setItems] = useState([]);
	const [tags, setTags] = useState([]);
	const [{ search }] = useState(useLocation());
	const [redirect, setRedirect] = useState(null);

	useEffect(() => {
		const params = new URLSearchParams(search);
		const tagsParam = params.get("tags");

		try {
			setTags(JSON.parse(tagsParam));
		} catch (err) {
			setTags(tagsParam);
		}
	}, [search]);

	useEffect(() => {
		const selector = {
			type: "document"
		};

		if (typeof tags === "string") {
			selector.tags = {
				$elemMatch: {
					$eq: tags
				}
			};
		} else if (tags !== null) {
			selector.tags = {
				$elemMatch: {
					$in: tags
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
				console.log(results.docs);
				setItems(results.docs);
			});
	}, [props.db, tags]);

	const editDoc = (id) => () => {
		setRedirect(`/create?id=${id}`);
	};

	const deleteDoc = (id) => () => {
		props.db
			.get(id)
			.then((doc) => {
				console.log(doc);
				props.db.remove(doc);
			})
			.catch((err) => {
				console.error(err);
			});

		const newItems = items.filter((item) => item._id !== id);
		setItems(newItems);
	};

	return (
		<Container>
			{items.map((item, index) => {
				return (
					<div key={item._id}>
						{redirect !== null && <Navigate to={redirect} />}
						<Card>
							<Card.Header>
								<h1 className="float-start">{item.name}</h1>
								<Button className="float-end" onClick={deleteDoc(item._id)}>
									Delete
								</Button>
								<Button className="float-end" onClick={editDoc(item._id)}>
									Edit
								</Button>
							</Card.Header>
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
							</Card.Body>
						</Card>
						<br />
					</div>
				);
			})}
		</Container>
	);
}
