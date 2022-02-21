import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Mustache from "mustache";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ListGroup from "react-bootstrap/ListGroup";

export default function List(props) {
	const [items, setItems] = useState([]);
	const [redirect, setRedirect] = useState(null);
	const [vars, setVars] = useState({});

	const [filterValue, setFilterValue] = useState("");
	const [filters, setFilters] = useState([]);
	const [sortOrder, setSortOrder] = useState("Ascending");

	// const sortOrderKeys = { Ascending: "asc", Descending: "desc" };

	useEffect(() => {
		props.db
			.find({
				include_docs: true,
				selector: { type: "var" }
			})
			.then((results) => {
				setVars(
					Object.fromEntries(
						results.docs.map((doc) => {
							return [doc._id, doc.value];
						})
					)
				);
			});
	}, [props.db]);

	useEffect(() => {
		const selector = {
			type: "document",
			sortKey: { $gt: true }
		};

		let index = "type";

		if (filters.length > 0) {
			selector.tags = {
				$in: filters
			};

			index = "tags";
		}

		console.log(selector);

		props.db
			.find({
				limit: 50,
				include_docs: true,
				selector: selector,
				sort: ["sortKey"],
				use_index: index
			})
			.then((results) => {
				setItems(results.docs);
			});
	}, [props.db, filters, sortOrder]);

	const editDoc = (id) => () => {
		setRedirect(`/create?id=${id}`);
	};

	const deleteDoc = (id) => () => {
		props.db
			.get(id)
			.then((doc) => {
				props.db.remove(doc);
			})
			.catch((err) => {
				console.error(err);
			});

		const newItems = items.filter((item) => item._id !== id);
		setItems(newItems);
	};

	const addFilter = (e) => {
		e.preventDefault();

		if (!filters.includes(filterValue)) {
			setFilters([...filters, filterValue]);
		}

		setFilterValue("");
	};

	const filterValueChange = (e) => {
		setFilterValue(e.target.value);
	};

	const deleteFilter = (remove) => () => {
		const newFilters = filters.filter((filter) => filter !== remove);

		setFilters(newFilters);
	};

	const selectSortOrder = (eventKey) => {
		setSortOrder(eventKey);
	};

	return (
		<Container>
			{redirect !== null && <Navigate to={redirect} />}
			<DropdownButton size="sm" onSelect={selectSortOrder} title={sortOrder}>
				<Dropdown.Item eventKey="Ascending">Ascending</Dropdown.Item>
				<Dropdown.Item eventKey="Descending">Descending</Dropdown.Item>
			</DropdownButton>
			<form onSubmit={addFilter}>
				<input type="submit" value="+" />
				<input
					type="text"
					value={filterValue}
					onChange={filterValueChange}
					placeholder="Filter"
				/>
			</form>
			<ListGroup>
				{filters.map((filter) => {
					return (
						<ListGroup.Item
							className="w-25"
							action
							onClick={deleteFilter(filter)}
							key={filter}
						>
							{filter}
						</ListGroup.Item>
					);
				})}
			</ListGroup>
			<br />
			{items.map((item, index) => {
				return (
					<div key={item._id}>
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
								Sort Key: {item.sortKey}
								<h3>Content</h3>
								<MDEditor.Markdown source={Mustache.render(item.text, vars)} />
								<hr />
								{item.tags.length > 0 && (
									<div id="tags">
										<h3>Tags</h3>
										<ListGroup>
											{item.tags.map((tag) => (
												<ListGroup.Item key={tag}>{tag}</ListGroup.Item>
											))}
										</ListGroup>
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
