import { useState, useEffect, useCallback } from "react";
import { Navigate, NavLink } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import Handlebars from "handlebars/dist/handlebars.min.js";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ListGroup from "react-bootstrap/ListGroup";
import { evaluateTable } from "../func";

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

const perPage = 5;

export default function List(props) {
	const [items, setItems] = useState([]);
	const [redirect, setRedirect] = useState(null);
	const [vars, setVars] = useState({});

	const [filterValue, setFilterValue] = useState("");
	const [filters, setFilters] = useState([]);
	const [sortOrder, setSortOrder] = useState("Ascending");
	const [page, setPage] = useState(0);
	const [pages, setPages] = useState(1);

	const refresh = useCallback(() => {
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
				limit: perPage,
				skip: 5 * page,
				include_docs: true,
				selector,
				sort: [{ sortKey: sortOrderKeys[sortOrder] }]
			})
			.then((results) => {
				setItems(results.docs);
			});
	}, [filters, page, props.db, sortOrder]);

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

				let newTables = {};

				results.docs.forEach((doc) => {
					if (typeof doc.value !== "string") {
						if (doc.scope === "global") {
							newTables = {
								...newTables,
								[doc.name]: evaluateTable(
									doc.value,
									newVars,
									true,
									doc.scope,
									doc.name
								)[0]
							};
						} else {
							newTables[doc.scope] = {
								...newTables[doc.scope],
								[doc.name]: evaluateTable(
									doc.value,
									newVars,
									true,
									doc.scope,
									doc.name
								)[0]
							};
						}
					}
				});

				newVars = { ...newVars, ...newTables };

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
				selector,
				sort: [{ sortKey: sortOrderKeys[sortOrder] }]
			})
			.then((results) => {
				setPages(Math.ceil(results.docs.length / perPage));
			});
	});

	useEffect(refresh, [refresh]);

	const copyDoc = (doc) => () => {
		props.db.post({
			name: doc.name,
			tags: doc.tags,
			text: doc.text,
			type: "document",
			sortKey: doc.sortKey,
			scope: doc.scope
		});

		refresh();
	};

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

	const nextPage = () => {
		setPage(page < pages - 1 ? page + 1 : page);
	};

	const prevPage = () => {
		setPage(page > 0 ? page - 1 : page);
	};

	const compile = (item) => {
		try {
			const exists = Object.keys(vars).includes(item.scope);

			return Handlebars.compile(
				item.scope && exists
					? `{{#with ${item.scope}}}${item.text}{{/with}}`
					: item.text
			)(vars);
		} catch (err) {
			return err.message.replace(/\n/g, "<br />");
		}
	};

	const pageList = () => {
		return (
			<>
				<Button
					variant="link"
					style={{ visibility: page > 0 ? "visible" : "hidden" }}
					onClick={prevPage}
				>
					Prev
				</Button>
				Page {page + 1}/{pages > 0 ? pages : 1}
				<Button
					variant="link"
					style={{ visibility: page < pages - 1 ? "visible" : "hidden" }}
					onClick={nextPage}
				>
					Next
				</Button>
			</>
		);
	};

	return (
		<Container>
			{redirect !== null && <Navigate to={redirect} />}
			<div className="w-25">
				{pageList()}
				<DropdownButton size="sm" onSelect={selectSortOrder} title={sortOrder}>
					<Dropdown.Item eventKey="Ascending">Ascending</Dropdown.Item>
					<Dropdown.Item eventKey="Descending">Descending</Dropdown.Item>
				</DropdownButton>
				<form onSubmit={addFilter}>
					<input
						type="text"
						value={filterValue}
						onChange={filterValueChange}
						placeholder="Filter"
						className="w-75"
					/>
					<Button type="submit">Add</Button>
				</form>
				<ListGroup>
					{filters.map((filter) => {
						return (
							<ListGroup.Item
								action
								onClick={deleteFilter(filter)}
								key={filter}
							>
								{filter}
							</ListGroup.Item>
						);
					})}
				</ListGroup>
			</div>
			<br />
			{items.length === 0 && (
				<h3>
					There's nothing here yet! If you would like help, follow the{" "}
					<NavLink to="/create?guide=c1">guide</NavLink>, or to just add a
					document go to the <NavLink to="/create">create</NavLink> page
				</h3>
			)}
			{items.map((item) => {
				return (
					<div key={item._id}>
						<Card>
							<Card.Header>
								<h1 className="float-start">{item.name}</h1>
								<Button
									className="float-end me-3"
									onClick={deleteDoc(item._id)}
								>
									Delete
								</Button>
								<Button className="float-end me-3" onClick={editDoc(item._id)}>
									Edit
								</Button>
								<Button className="float-end me-3" onClick={copyDoc(item)}>
									Copy
								</Button>
							</Card.Header>
							<Card.Body>
								Sort Key: {item.sortKey}
								<h3>Content</h3>
								<MDEditor.Markdown source={compile(item)} />
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
			{items.length > 0 && pageList()}
		</Container>
	);
}
