import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";

export default function List(props) {
	const [items, setItems] = useState([]);

	useEffect(() => {
		props.db
			.find({
				limit: 10,
				include_docs: true,
				selector: { type: "document" }
			})
			.then((results) => {
				setItems(results.docs);
			});
	}, [props.db]);

	return (
		<Container>
			{items.map((item) => {
				return (
					<>
						<Card>
							<Card.Body>
								<Card.Title>{item.name}</Card.Title>
								<Card.Text>
									{item.tags.length > 0 && (
										<div id="tags">
											<h3>Tags</h3>
											<ul>
												{item.tags.map((tag) => {
													return <li key={tag}>{tag}</li>;
												})}
											</ul>
										</div>
									)}
									<MDEditor.Markdown source={item.text} />
								</Card.Text>
							</Card.Body>
						</Card>
						<br />
					</>
				);
			})}
		</Container>
	);
}
