import { useEffect, useState } from "react";
import { NotificationManager } from "react-notifications";
import { useLocation, Navigate } from "react-router-dom";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Table from "react-bootstrap/Table";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

export default function Vars(props) {
	const [vars, setVars] = useState({});
	const [newName, setNewName] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newScope, setNewScope] = useState("");
	const [scopes, setScopes] = useState([]);
	const [guide, setGuide] = useState(null);
	const [redirect, setRedirect] = useState(null);
	const [{ search }] = useState(useLocation());
	const [isTable, setIsTable] = useState(false);
	const [tableData, setTableData] = useState([
		{ type: "literal", value: "", conflictType: "last" }
	]);

	useEffect(() => {
		const params = new URLSearchParams(search);
		setGuide(params.get("guide"));
	}, [search]);

	useEffect(() => {
		props.db
			.find({ include_docs: true, selector: { type: "var" } })
			.then((results) => {
				const newVars = {};

				results.docs.forEach((doc) => {
					if (!doc.name) {
						props.db.put({ ...doc, name: doc._id });

						doc.name = doc._id;
					}

					if (!doc.scope) {
						props.db.put({ ...doc, scope: "global" });

						doc.scope = "global";
					}

					newVars[doc.scope] = {
						...newVars[doc.scope],
						[doc.name]: doc.value
					};

					if (!scopes.includes(doc.scope)) {
						setScopes([...scopes, doc.scope]);
					}
				});

				setVars(newVars);
			});
	}, [props.db, scopes]);

	useEffect(() => {
		if (guide && guide.startsWith("/create")) {
			setRedirect(guide);
		}
	}, [guide]);

	useEffect(() => {
		if (isTable) {
			setNewValue("");
		} else {
			setTableData([{ type: "literal", value: "", conflictType: "last" }]);
		}
	}, [isTable]);

	const addVar = (e) => {
		e.preventDefault();

		let scope = newScope.trim(" ");
		let name = newName.trim(" ");
		let exists = false;

		if (!name) {
			NotificationManager.error(null, "Please enter a name");

			return;
		}

		if (!scope) {
			scope = "global";
		}

		if (vars[scope]) {
			exists = Object.keys(vars[scope]).includes(name);
		}

		if (scope === "global" && scopes.includes(name)) {
			NotificationManager.error(
				null,
				"There is already a scope with this name"
			);

			return;
		}

		// if vars[scope] isn't an object (scope) or undefined (nonexistent), it is a variable
		if (
			vars.global &&
			!["object", "undefined"].includes(typeof vars.global[scope])
		) {
			NotificationManager.error(
				null,
				"There is a variable in the global scope with this scope name"
			);

			return;
		}

		if (exists) {
			if (!newValue) {
				props.db
					.find({ selector: { type: "var", scope: scope, name: name } })
					.then((results) => {
						props.db.remove(results.docs[0]);
					});
			} else {
				props.db
					.find({ selector: { type: "var", scope: scope, name: name } })
					.then((results) => {
						props.db.put({
							_id: results.docs[0]._id,
							_rev: results.docs[0]._rev,
							name: name,
							value: newValue,
							scope: scope,
							type: "var"
						});
					});
			}
		} else if (newValue !== "") {
			props.db.post({
				name: name,
				value: newValue,
				scope: scope,
				type: "var"
			});
		}

		if (newValue) {
			setVars({
				...vars,
				[scope]: { ...vars[scope], [name]: newValue }
			});
		} else if (exists) {
			const newVars = { ...vars };
			delete newVars[scope][name];

			if (Object.keys(newVars[scope]).length === 0) {
				delete newVars[scope];
			}

			setVars(newVars);
		}

		setNewName("");
		setNewValue("");
	};

	const addTable = (e) => {
		e.preventDefault();

		let scope = newScope.trim(" ");
		let name = newName.trim(" ");
		let exists = false;

		if (!name.trim(" ")) {
			NotificationManager.error(null, "Please enter a name");

			return;
		}

		if (name.includes(".") || name.includes("/")) {
			NotificationManager.error(null, "Name cannot include '.' or '/'");

			return;
		}

		if (!tableData[0].value) {
			NotificationManager.error(null, "Please enter a default value");

			return;
		}

		if (!scope) {
			scope = "global";
		}

		if (vars[scope]) {
			exists = Object.keys(vars[scope]).includes(name);
		}

		if (scope === "global" && scopes.includes(name)) {
			NotificationManager.error(
				null,
				"There is already a scope with this name"
			);

			return;
		}

		// if vars[scope] isn't an object (scope) or undefined (nonexistent), it is a variable
		if (
			vars.global &&
			!["object", "undefined"].includes(typeof vars.global[scope])
		) {
			NotificationManager.error(
				null,
				"There is a variable in the global scope with this scope name"
			);

			return;
		}

		if (exists) {
			props.db
				.find({ selector: { type: "var", scope: scope, name: name } })
				.then((results) => {
					props.db.put({
						_id: results.docs[0]._id,
						_rev: results.docs[0]._rev,
						name: name,
						value: tableData,
						scope: scope,
						type: "var"
					});
				});
		} else {
			props.db.post({
				name: name,
				value: tableData,
				scope: scope,
				type: "var"
			});
		}

		setVars({
			...vars,
			[scope]: {
				...vars[scope],
				[name]: tableData
			}
		});

		console.log(tableData);

		setNewName("");
		setNewScope("");
		setTableData([{ type: "literal", value: "" }]);
	};

	const newNameChange = (e) => {
		setNewName(e.target.value);
	};

	const newValueChange = (e) => {
		setNewValue(e.target.value);
	};

	const newScopeChange = (e) => {
		setNewScope(e.target.value);
	};

	const selectVar = (key, name) => () => {
		if (typeof vars[key][name] === "string") {
			setIsTable(false);
			setNewName(name);
			setNewScope(key === "global" ? "" : key);
			setNewValue(vars[key][name]);
		} else {
			setIsTable(true);
			setNewName(name);
			setNewScope(key === "global" ? "" : key);
			setTableData(vars[key][name]);
		}
	};

	const popover = (title, text, prev, next) => {
		return (
			<Popover style={{ maxWidth: "60%" }}>
				<Popover.Header as="h3">{title}</Popover.Header>
				<Popover.Body dangerouslySetInnerHTML={{ __html: text }}></Popover.Body>
				<div className="text-end me-3 mb-3">
					{prev && (
						<Button className="me-3" onClick={() => setGuide(prev)}>
							Previous
						</Button>
					)}
					{next && <Button onClick={() => setGuide(next)}>Next</Button>}
				</div>
			</Popover>
		);
	};

	const addRow = () => {
		setTableData([
			...tableData,
			[
				{
					type: "literal",
					value: ""
				},
				{
					val1Type: "var",
					val1: "",
					comparison: "eq",
					val2Type: "literal",
					val2: ""
				}
			]
		]);
	};

	const addCondition = (index) => () => {
		const copy = [...tableData];

		copy[index].push({
			val1Type: "var",
			val1: "",
			comparison: "eq",
			val2Type: "literal",
			val2: ""
		});

		setTableData(copy);
	};

	const listTable = (name, table) => {
		const comparisons = { eq: "==", lt: "<", gt: ">" };

		return (
			<>
				<h3 onClick={selectVar("global", name)}>{name}</h3>
				<details>
					<summary>Table</summary>
					<Table striped bordered hover size="sm">
						<thead>
							<tr>
								<th>Argument 1</th>
								<th>Comparison</th>
								<th>Argument 2</th>
								<th>Output</th>
							</tr>
						</thead>
						<tbody>
							{table.map((row, index) => {
								if (index === 0) {
									return (
										<tr>
											<td>DEFAULT</td>
											<td>DEFAULT</td>
											<td>DEFAULT</td>
											<td>{row.value}</td>
										</tr>
									);
								}

								return (
									<>
										{row.map((condition, rowIndex) => {
											if (index === 0) {
												return null;
											}

											let val1 = condition.val1;
											let val2 = condition.val2;
											let comparison = comparisons[condition.comparison];

											if (condition.val1Type === "var") {
												const path = val1.split(".");

												if (path.length === 1) {
													val1 = `${val1} (${vars["global"][path[0]]})`;
												} else if (path.length === 2) {
													val1 = `${val1} (${vars[path[0]][path[1]]})`;
												}
											}

											if (condition.val2Type === "var") {
												const path = val2.split(".");

												if (path.length === 1) {
													val2 = `${val2} (${vars["global"][path[0]]})`;
												} else if (path.length === 2) {
													val2 = `${val2} (${vars[path[0]][path[1]]})`;
												}
											}

											return (
												<tr key={rowIndex}>
													<td>{val1}</td>
													<td>{comparison}</td>
													<td>{val2}</td>
												</tr>
											);
										})}
										<tr>
											<td></td>
											<td></td>
											<td></td>
											<td>{row[0].value}</td>
										</tr>
									</>
								);
							})}
						</tbody>
					</Table>
				</details>
			</>
		);
	};

	return (
		<Container>
			{redirect && <Navigate to={redirect} />}
			<OverlayTrigger
				placement="bottom"
				overlay={popover(
					"Engine",
					"This application uses the <a href='https://handlebarsjs.com/'>Handlebars</a> templating engine for inserting variables, and supports all of its features",
					null,
					"v2"
				)}
				show={guide === "v1"}
			>
				<div></div>
			</OverlayTrigger>
			<Form
				onSubmit={(e) => {
					if (isTable) {
						addTable(e);
					} else {
						addVar(e);
					}
				}}
			>
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Variable Name",
						"This is how you'll refer to your variable in the content of documents. Entering the name of an existing variable will edit that variable",
						"v1",
						"v3"
					)}
					show={guide === "v2"}
				>
					<Form.Group className="mb-3" controlId="formBasicVarName">
						<Form.Label>Variable Name</Form.Label>
						<Form.Control
							value={newName}
							onChange={newNameChange}
							type="text"
							placeholder="Name"
						/>
					</Form.Group>
				</OverlayTrigger>
				<OverlayTrigger
					placement="bottom"
					overlay={popover(
						"Variable Scope",
						"Variables can have the same name as long as they're in different scopes. Defaults to 'global'",
						null,
						"/create?guide=s2"
					)}
					show={guide === "s1"}
				>
					<Form.Group className="mb-3" controlId="formBasicVarScopes">
						<Form.Label>Variable Scope</Form.Label>
						<Form.Control
							value={newScope}
							onChange={newScopeChange}
							type="text"
							placeholder="Scope"
						/>
					</Form.Group>
				</OverlayTrigger>
				<Form.Label>Variable Type</Form.Label>
				<br />
				<ToggleButtonGroup
					type="radio"
					value={isTable}
					onChange={(val) => setIsTable(val)}
					name="isTable"
					className="mb-2"
				>
					<ToggleButton
						id="option-not-table"
						variant="outline-primary"
						value={false}
					>
						Basic
					</ToggleButton>
					<ToggleButton
						id="option-table"
						variant="outline-primary"
						value={true}
					>
						Table
					</ToggleButton>
				</ToggleButtonGroup>
				<br />
				{!isTable && (
					<OverlayTrigger
						placement="bottom"
						overlay={popover(
							"Variable Value",
							"This is what will be shown wherever the variable is used",
							"v2",
							"v4"
						)}
						show={guide === "v3"}
					>
						<Form.Group className="mb-3" controlId="formBasicVarValue">
							<Form.Label>Variable Value</Form.Label>
							<Form.Control
								value={newValue}
								onChange={newValueChange}
								type="text"
								placeholder="Value"
							/>
						</Form.Group>
					</OverlayTrigger>
				)}
				{isTable && (
					<>
						<Form.Label>Conflict Resolution</Form.Label>
						<br />
						<ToggleButtonGroup
							type="radio"
							value={tableData[0].conflictType}
							onChange={(val) => {
								const copy = [...tableData];

								copy[0].conflictType = val;

								setTableData(copy);
							}}
							name="conflictType"
							className="mb-2"
						>
							<ToggleButton
								id="option-conflict-last"
								variant="outline-primary"
								value="last"
							>
								Last
							</ToggleButton>
							<ToggleButton
								id="option-conflict-first"
								variant="outline-primary"
								value="first"
							>
								First
							</ToggleButton>
						</ToggleButtonGroup>
						<br />
						<Form.Group controlId="formBasicTableDefault">
							<Form.Label>Default Value</Form.Label>
							<Form.Control
								value={tableData[0].value}
								onChange={(e) => {
									const copy = [...tableData];

									copy[0].value = e.target.value;

									setTableData(copy);
								}}
								type="text"
								placeholder="Default"
							/>
							<ToggleButtonGroup
								type="radio"
								value={tableData[0].type}
								onChange={(val) => {
									const copy = [...tableData];

									copy[0].type = val;

									setTableData(copy);
								}}
								name="formBasicDefaultType"
								className="mb-3"
							>
								<ToggleButton
									id="default-type-literal"
									variant="outline-primary"
									value="literal"
								>
									Literal
								</ToggleButton>
								<ToggleButton
									id="default-type-var"
									variant="outline-primary"
									value="var"
								>
									Variable
								</ToggleButton>
							</ToggleButtonGroup>
						</Form.Group>
						<Button onClick={addRow}>Add Row</Button>
						{tableData.map((row, index) => {
							if (index === 0) return null;
							return (
								<Card key={index}>
									<Card.Header>
										Row {index}
										<Button
											className="float-end"
											onClick={() => {
												const copy = [...tableData];

												copy.splice(index, 1);

												setTableData(copy);
											}}
										>
											Delete Row
										</Button>
									</Card.Header>
									<Button className="w-25" onClick={addCondition(index)}>
										Add Condition
									</Button>
									{row.map((item, rowIndex) => {
										if (rowIndex === 0) return <></>;

										return (
											<div key={rowIndex}>
												<Form.Group
													className="w-25 float-start"
													controlId={`formBasic${index}${rowIndex}Val1`}
												>
													<Form.Label>Value 1</Form.Label>
													<Form.Control
														value={item.val1}
														onChange={(e) => {
															const copy = [...tableData];

															copy[index][rowIndex].val1 = e.target.value;

															setTableData(copy);
														}}
														type="text"
														placeholder="Value 1"
													/>
													<ToggleButtonGroup
														type="radio"
														value={item.val1Type}
														onChange={(val) => {
															const copy = [...tableData];

															copy[index][rowIndex].val1Type = val;

															setTableData(copy);
														}}
														name={`formBasic${index}${rowIndex}Val1Type`}
														className="mb-3"
													>
														<ToggleButton
															id={`${index}-${rowIndex}-type1-literal`}
															variant="outline-primary"
															value="literal"
														>
															Literal
														</ToggleButton>
														<ToggleButton
															id={`${index}-${rowIndex}-type1-var`}
															variant="outline-primary"
															value="var"
														>
															Variable
														</ToggleButton>
													</ToggleButtonGroup>
												</Form.Group>
												<Form.Group className="w-25 float-start text-center">
													<Form.Label>Comparison Type</Form.Label>
													<br />
													<ToggleButtonGroup
														type="radio"
														value={item.comparison}
														onChange={(val) => {
															const copy = [...tableData];

															copy[index][rowIndex].comparison = val;

															setTableData(copy);
														}}
														name={`formBasic${index}${rowIndex}Comparison`}
														className="mb-3"
													>
														<ToggleButton
															id={`compare-eq-${index}-${rowIndex}`}
															variant="outline-primary"
															value="eq"
														>
															==
														</ToggleButton>
														<ToggleButton
															id={`compare-lt-${index}-${rowIndex}`}
															variant="outline-primary"
															value="lt"
														>
															{"<"}
														</ToggleButton>
														<ToggleButton
															id={`compare-gt-${index}-${rowIndex}`}
															variant="outline-primary"
															value="gt"
														>
															{">"}
														</ToggleButton>
													</ToggleButtonGroup>
												</Form.Group>
												<Form.Group
													className="w-25 float-start"
													controlId={`formBasic${rowIndex}Val2`}
												>
													<Form.Label>Value 2</Form.Label>
													<Form.Control
														value={item.val2}
														onChange={(e) => {
															const copy = [...tableData];

															copy[index][rowIndex].val2 = e.target.value;

															setTableData(copy);
														}}
														type="text"
														placeholder="Value 2"
													/>
													<ToggleButtonGroup
														type="radio"
														value={item.val2Type}
														onChange={(val) => {
															const copy = [...tableData];

															copy[index][rowIndex].val2Type = val;

															setTableData(copy);
														}}
														name={`formBasic${index}${rowIndex}Val2Type`}
														className="mb-3"
													>
														<ToggleButton
															id={`${index}-${rowIndex}-type2-literal`}
															variant="outline-primary"
															value="literal"
														>
															Literal
														</ToggleButton>
														<ToggleButton
															id={`${index}-${rowIndex}-type2-var`}
															variant="outline-primary"
															value="var"
														>
															Variable
														</ToggleButton>
													</ToggleButtonGroup>
												</Form.Group>
												<Form.Group className="w-25 float-start text-end">
													<Form.Label>&nbsp;</Form.Label>
													<br />
													<Button
														className="me-3"
														onClick={() => {
															const copy = [...tableData];

															copy[index].splice(rowIndex, 1);

															setTableData(copy);
														}}
													>
														Delete Condition
													</Button>
												</Form.Group>
											</div>
										);
									})}
									<Form.Group
										className="w-25"
										controlId={`formBasic${index}Value`}
									>
										<Form.Label>Output</Form.Label>
										<Form.Control
											value={row[0].value}
											onChange={(e) => {
												const copy = [...tableData];

												copy[index][0].value = e.target.value;

												setTableData(copy);
											}}
											type="text"
											placeholder="Value"
										/>
									</Form.Group>
								</Card>
							);
						})}
					</>
				)}
				<br />
				<Button className="my-3" type="submit">
					Add
				</Button>
			</Form>
			<br />
			<br />
			<OverlayTrigger
				placement="top"
				overlay={popover(
					"Variable List",
					"Here is where all the variables you add will show up. You can click one to edit it, and after that you can delete it by saving it with an empty value",
					"v3",
					"/create?guide=v5"
				)}
				show={guide === "v4"}
			>
				<h3>Variable List</h3>
			</OverlayTrigger>
			{vars["global"] && (
				<Card>
					<Card.Header>global</Card.Header>
					<ListGroup>
						{Object.keys(vars["global"]).map((name) => {
							if (typeof vars["global"][name] === "string") {
								// basic var
								return (
									<ListGroup.Item
										key={name}
										action
										onClick={selectVar("global", name)}
									>
										{`${name}: ${vars["global"][name]}`}
									</ListGroup.Item>
								);
							} else {
								// table var
								return (
									<ListGroup.Item key={name}>
										{listTable(name, vars["global"][name])}
									</ListGroup.Item>
								);
							}
						})}
					</ListGroup>
				</Card>
			)}
			{Object.keys(vars).length > 0 &&
				Object.keys(vars).map((key) => {
					if (key === "global") return null;

					return (
						<Card key={key}>
							<Card.Header>{key}</Card.Header>
							<ListGroup>
								{Object.keys(vars[key]).map((name) => {
									console.log(vars[key][name]);

									if (typeof vars[key][name] === "string") {
										// basic var
										return (
											<ListGroup.Item
												key={name}
												action
												onClick={selectVar(key, name)}
											>
												{`${name}: ${vars[key][name]}`}
											</ListGroup.Item>
										);
									} else {
										// table var
										return (
											<ListGroup.Item key={name}>
												{listTable(name, vars[key][name])}
											</ListGroup.Item>
										);
									}
								})}
							</ListGroup>
						</Card>
					);
				})}
		</Container>
	);
}
