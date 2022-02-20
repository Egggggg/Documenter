import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Collection(props) {
	const [docs, setDocs] = useState([]);

	let collection = useParams().collection;

	useEffect(() => {
		props.db.find({
			selector: {
				collections: {
					$elemMatch: {
						$eq: collection
					}
				}
			}
		});
	}, [collection, props.db]);

	return <div id="list"></div>;
}
