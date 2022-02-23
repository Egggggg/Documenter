import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Handlebars from "handlebars/dist/handlebars.min.js";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ListGroup from "react-bootstrap/ListGroup";

Handlebars.registerHelper("gt", (arg1, arg2) => {
	return parseFloat(arg1) > parseFloat(arg2);
});

Handlebars.registerHelper("lt", (arg1, arg2) => {
	return parseFloat(arg1) < parseFloat(arg2);
});

Handlebars.registerHelper("eq", (arg1, arg2) => {
	// eslint-disable-next-line eqeqeq
	return arg1 == arg2;
});

export default function List(props) {
	const [items, setItems] = useState([]);
	const [redirect, setRedirect] = useState(null);
	const [vars, setVars] = useState({});

	const [filterValue, setFilterValue] = useState("");
	const [filters, setFilters] = useState([]);
	const [sortOrder, setSortOrder] = useState("Ascending");

	useEffect(() => {
		props.db
			.find({
				include_docs: true,
				selector: { type: "var" }
			})
			.then((results) => {
				let newVars = {};

				results.docs.forEach((doc) => {
					if (doc.scope === "global") {
						newVars = { ...newVars, [doc.name]: doc.value };
					} else {
						newVars[doc.scope] = {
							...newVars[doc.scope],
							[doc.name]: doc.value
						};
					}
				});

				setVars(newVars);
			});
	}, [props.db]);

	useEffect(() => {
		const sortOrderKeys = { Ascending: "asc", Descending: "desc" };
		const selector = {
			type: "document",
			sortKey: { $gte: null }
		};

		if (filters.length > 0) {
			selector.tags = {
				$in: filters
			};
		}

		props.db
			.find({
				limit: 50,
				include_docs: true,
				selector: selector,
				sort: [{ sortKey: sortOrderKeys[sortOrder] }]
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
								<MDEditor.Markdown
									source={Handlebars.compile(
										!item.scope
											? item.text
											: `{{#with ${item.scope}}}${item.text}{{/with}}`
									)(vars)}
								/>
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
