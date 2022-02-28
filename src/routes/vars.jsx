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
import { evaluateTable, evaluateVal } from "../func";

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
		{ type: "literal", value: "", priority: "last", scope: "global" }
	]);

	useEffect(() => {
		const params = new URLSearchParams(search);

		if (!guide) {
			setGuide(params.get("guide"));
		}
	}, [search, guide]);

	useEffect(() => {
		const params = new URLSearchParams(search);

		if (params.get("guide")) {
			return;
		}

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

					if (
						typeof newVars[doc.scope][doc.name] !== "string" &&
						!(newVars[doc.scope][doc.name] instanceof Array)
					) {
						newVars[doc.scope][doc.name][0].scope = doc.scope;
					}

					if (scopes.indexOf(doc.scope) === -1) {
						setScopes([...scopes, doc.scope]);
					}
				});

				setVars(newVars);
			});
	}, [props.db, scopes, guide, search]);

	useEffect(() => {
		if (guide) {
			if (guide.startsWith("/create")) {
				setRedirect(guide);
			} else if (guide === "v1") {
				setVars({ global: { example: "6", example2: "12" } });
			} else if (guide === "s1") {
				setVars({
					global: { example: "6", example2: "12" },
					scope1: { example: "24", example2: "36", example3: "72" }
				});
			}
		}
	}, [guide]);

	useEffect(() => {
		if (isTable) {
			setNewValue("");
		} else {
			setTableData([
				{ type: "literal", value: "", priority: "last", scope: "global" }
			]);
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
			exists = Object.keys(vars[scope]).indexOf(name) > -1;
		}

		if (scope === "global" && scopes.indexOf(name) > -1) {
			NotificationManager.error(
				null,
				"There is already a scope with this name"
			);

			return;
		}

		if (
			vars.global &&
			(typeof vars.global[scope] === "string" ||
				vars.global[scope] instanceof Array)
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
					.find({ selector: { type: "var", scope, name } })
					.then((results) => {
						props.db.remove(results.docs[0]);
					});
			} else {
				props.db
					.find({ selector: { type: "var", scope, name } })
					.then((results) => {
						props.db.put({
							_id: results.docs[0]._id,
							_rev: results.docs[0]._rev,
							name,
							value: newValue,
							scope,
							type: "var"
						});
					});
			}
		} else if (newValue !== "") {
			props.db.post({
				name,
				value: newValue,
				scope,
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

		if (
			name.indexOf(".") > -1 ||
			name.indexOf("/") > -1 ||
			name.indexOf(" ") > -1
		) {
			NotificationManager.error(
				null,
				"Name cannot include '.', '/', or ' ' (space)"
			);

			if (!tableData[0].value) {
				NotificationManager.error(null, "Please enter a default value");

				return;
			}

			if (!scope) {
				scope = "global";
			}

			if (vars[scope]) {
				exists = Object.keys(vars[scope]).indexOf(name) > -1;
			}

			if (scope === "global" && scopes.indexOf(name) > -1) {
				NotificationManager.error(
					null,
					"There is already a scope with this name"
				);

				return;
			}

			// if vars[scope] isn't an object (scope) or undefined (nonexistent), it is a variable
			if (
				vars.global &&
				(typeof vars.global[scope] === "string" ||
					vars.global[scope] instanceof Array)
			) {
				NotificationManager.error(
					null,
					"There is a variable in the global scope with this scope name"
				);

				return;
			}

			if (exists) {
				props.db
					.find({ selector: { type: "var", scope, name } })
					.then((results) => {
						props.db.put({
							_id: results.docs[0]._id,
							_rev: results.docs[0]._rev,
							name,
							value: tableData,
							scope,
							type: "var"
						});
					});
			} else {
				props.db.post({
					name,
					value: tableData,
					scope,
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

			setNewName("");
			setNewScope("");
			setTableData([
				{ type: "literal", value: "", priority: "last", scope: "global" }
			]);
		}
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
			setTableData(JSON.parse(JSON.stringify(vars[key][name])));
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

	const evalValue = (val, scope, name) => {
		try {
			let value = evaluateVal(val, vars, false, scope, name);

			if (value === val) {
				return [val, val];
			} else {
				return [`${val} (${value})`, value];
			}
		} catch (err) {
			if (err.message === "too much recursion") {
				return [err.message, null];
			}
		}
	};

	const listTable = (scope, name, table) => {
		const comparisons = { eq: "==", lt: "<", gt: ">" };

		let [output, outputIndex] = evaluateTable(table, vars, false, scope, name);

		if (outputIndex === -1) {
			if (table[0].type === "var") {
				output = [table[0].value, output];
			} else {
				output = [output, output];
			}
		} else {
			if (outputIndex && table[outputIndex].type === "var") {
				output = [table[outputIndex].value, output];
			} else {
				output = [output, output];
			}
		}

		return (
			<>
				<h3 onClick={selectVar(scope, name)}>{name}</h3>
				<details>
					<summary>Table</summary>
					<Table bordered hover size="sm">
						<thead>
							<tr>
								<th className="w-25">Argument 1</th>
								<th className="w-25">Comparison</th>
								<th className="w-25">Argument 2</th>
								<th className="w-25">Output</th>
							</tr>
						</thead>
						<tbody>
							{table.map((row, index) => {
								if (index === 0) {
									return (
										<>
											<tr>
												<td>DEFAULT</td>
												<td>DEFAULT</td>
												<td>DEFAULT</td>
												<td
													className={
														outputIndex === -1 ? "bg-primary text-light" : ""
													}
												>
													{row.type === "var"
														? evalValue(row.value, scope, name)[0]
														: row.value}
												</td>
											</tr>
											<tr className="bg-primary text-light">
												<td>OUTPUT</td>
												<td>OUTPUT</td>
												<td>OUTPUT</td>
												<td>{output[1]}</td>
											</tr>
										</>
									);
								}

								return (
									<>
										{row.map((condition, rowIndex) => {
											if (rowIndex === 0) {
												return <></>;
											}

											let val1 = condition.val1;
											let val2 = condition.val2;
											let comparison = comparisons[condition.comparison];

											if (condition.val1Type === "var") {
												val1 = evalValue(val1, scope, name)[0];
											}

											if (condition.val2Type === "var") {
												val2 = evalValue(val2, scope, name)[0];
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
											<td
												className={
													outputIndex === index ? "bg-primary text-light" : ""
												}
											>
												{row[0].type === "var"
													? evalValue(row[0].value, scope, name)[0]
													: row[0].value}
											</td>
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

	const valEntry = (
		controlId,
		buttonsName,
		title,
		placeholder,
		getter,
		setter,
		prependId,
		data,
		className,
		valKey,
		typeKey
	) => {
		return (
			<Form.Group className={className} controlId={controlId}>
				<Form.Label>{title}</Form.Label>
				<Form.Control
					value={getter(data)[valKey]}
					onChange={(e) => {
						const copy = [...tableData];

						setter(copy)[valKey] = e.target.value;

						setTableData(copy);
					}}
					type="text"
					placeholder={placeholder}
				/>
				<ToggleButtonGroup
					type="radio"
					value={getter(data)[typeKey]}
					onChange={(val) => {
						const copy = [...tableData];

						setter(copy)[typeKey] = val;

						setTableData(copy);
					}}
					name={buttonsName}
					className="mb-3"
				>
					<ToggleButton
						id={`${prependId}-type-literal`}
						variant="outline-primary"
						value="literal"
					>
						Literal
					</ToggleButton>
					<ToggleButton
						id={`${prependId}-type-var`}
						variant="outline-primary"
						value="var"
					>
						Variable
					</ToggleButton>
				</ToggleButtonGroup>
			</Form.Group>
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
						<Form.Label>Priority</Form.Label>
						<br />
						<ToggleButtonGroup
							type="radio"
							value={tableData[0].priority}
							onChange={(val) => {
								const copy = [...tableData];

								copy[0].priority = val;

								setTableData(copy);
							}}
							name="priority"
							className="mb-2"
						>
							<ToggleButton
								id="option-priority-last"
								variant="outline-primary"
								value="last"
							>
								Last
							</ToggleButton>
							<ToggleButton
								id="option-priority-first"
								variant="outline-primary"
								value="first"
							>
								First
							</ToggleButton>
						</ToggleButtonGroup>
						<br />
						{valEntry(
							"formBasicTableDefault",
							"formBasicDefaultType",
							"Default Value",
							"Default",
							() => tableData[0],
							(table) => table[0],
							"default",
							null,
							"",
							"value",
							"type"
						)}
						<Button onClick={addRow}>Add Output</Button>
						{tableData.map((row, index) => {
							if (index === 0) return null;
							return (
								<Card key={index}>
									<Card.Header>
										Output {index}
										<Button
											className="float-end"
											onClick={() => {
												const copy = [...tableData];

												copy.splice(index, 1);

												setTableData(copy);
											}}
										>
											Delete Output
										</Button>
									</Card.Header>
									<Button className="w-25" onClick={addCondition(index)}>
										Add Condition
									</Button>
									{row.map((item, rowIndex) => {
										if (rowIndex === 0) return <></>;

										return (
											<div key={rowIndex}>
												{valEntry(
													`formBasic${index}${rowIndex}Val1`,
													`formBasic${index}${rowIndex}Val1Type`,
													"Value 1",
													"Value 1",
													(data) => data,
													(table) => table[index][rowIndex],
													`${index}-${rowIndex}-val1`,
													item,
													"w-25 float-start",
													"val1",
													"val1Type"
												)}
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
												{valEntry(
													`formBasic${index}${rowIndex}Val2`,
													`formBasic${index}${rowIndex}Val2Type`,
													"Value 2",
													"Value 2",
													(data) => data,
													(table) => table[index][rowIndex],
													`${index}-${rowIndex}-val2`,
													item,
													"w-25 float-start",
													"val2",
													"val2Type"
												)}
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
									{valEntry(
										`formBasic${index}Output`,
										`formBasic${index}ValueType`,
										"Output",
										"Output",
										(data) => data[0],
										(table) => table[index][0],
										`${index}-output`,
										row,
										"w-25",
										"value",
										"type"
									)}
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
										{listTable("global", name, vars["global"][name])}
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
												{listTable(key, name, vars[key][name])}
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
