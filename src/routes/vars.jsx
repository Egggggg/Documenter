import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { UserVars } from "uservars";
import { get, set } from "lodash";

import { NotificationManager } from "react-notifications";

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

const defaultVals = {
	basic: {
		name: "",
		scope: "",
		value: {
			value: "",
			type: "literal"
		},
		varType: "basic"
	},
	list: {
		name: "",
		scope: "",
		value: [],
		varType: "list"
	},
	table: {
		name: "",
		scope: "",
		value: [
			{
				output: {
					value: "",
					type: "literal"
				},
				conditions: [
					{
						val1: {
							value: "",
							type: "literal"
						},
						comparison: "eq",
						val2: {
							value: "",
							type: "literal"
						}
					}
				]
			}
		],
		varType: "table",
		default: {
			value: "",
			type: "literal"
		},
		priority: "first"
	},
	expression: {
		name: "",
		scope: "",
		value: {
			value: "",
			type: "literal"
		},
		varType: "expression",
		functions: [],
		vars: {}
	},
	literal: {
		value: "",
		type: "literal"
	}
};

function popover(setGuide) {
	return (title, text, prev, next) => {
		return (
			<Popover style={{ maxWidth: "60%" }}>
				<Popover.Header as="h3">{title}</Popover.Header>
				<Popover.Body dangerouslySetInnerHTML={{ __html: text }} />
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
}

async function storeVar(value, db) {
	const existing = await db.find({
		selector: { type: "var", scope: value.scope, name: value.name }
	});

	if (!value.value && existing.docs.length > 0) {
		db.remove(existing.docs[0]);
		return;
	}

	const data = {
		name: value.name,
		scope: value.scope,
		value: value.value,
		type: "var",
		varType: value.varType,
		default: value.default,
		priority: value.priority,
		vars: value.vars,
		functions: value.functions
	};

	if (existing.docs.length > 0) {
		db.put({
			_id: existing.docs[0]._id,
			_rev: existing.docs[0]._rev,
			...data
		});
	} else {
		db.post(data);
	}
}

function submitVar(newValObject, setNewVal, userVars, db) {
	return async (e) => {
		e.preventDefault();

		const newVal = structuredClone(newValObject);

		if (newVal.scope === "") newVal.scope = "global";

		console.log(defaultVals);

		try {
			let success = userVars.setVar(newVal);

			console.log(userVars.vars);

			if (!success[0]) {
				NotificationManager.error(
					"Couldn't create variable",
					"An error occurred"
				);
				return;
			}

			await storeVar(newVal, db);
			setNewVal(structuredClone(defaultVals[newVal.varType]));

			NotificationManager.success("Variable created");
		} catch (err) {
			NotificationManager.error(err.toString(), "An error occurred");
		}
	};
}

function ValueType({
	newVal,
	setNewVal,
	controlPlaceholder,
	valuePath,
	typePath,
	idPrefix,
	titleText
}) {
	return (
		<Form.Group className="mb-3" controlId={`formVar${idPrefix}`}>
			{Boolean(titleText) && <Form.Label>{titleText}</Form.Label>}
			<Form.Control
				value={get(newVal, valuePath)}
				onChange={(e) => {
					const clone = structuredClone(newVal);

					set(clone, valuePath, e.target.value);
					setNewVal(clone);
				}}
				type="text"
				placeholder={controlPlaceholder}
			/>
			<ToggleButtonGroup
				type="radio"
				value={get(newVal, typePath, "literal")}
				onChange={(e) => {
					const clone = structuredClone(newVal);

					set(clone, typePath, e);
					setNewVal(clone);
				}}
				name={`${idPrefix}Type`}
				className="mb-3"
			>
				<ToggleButton
					id={`${idPrefix}-type-literal`}
					variant="outline-primary"
					value="literal"
				>
					Literal
				</ToggleButton>
				<ToggleButton
					id={`${idPrefix}-type-ref`}
					variant="outline-primary"
					value="reference"
				>
					Reference
				</ToggleButton>
				<ToggleButton
					id={`${idPrefix}-type-expr`}
					variant="outline-primary"
					value="expression"
				>
					Expression
				</ToggleButton>
			</ToggleButtonGroup>
		</Form.Group>
	);
}

function useUserVars() {
	const [rawVars, setRawVars] = useState({});
	const [vars, setVars] = useState({});
	const userVars = useRef(new UserVars());

	function setVar(...newVars) {
		const success = userVars.current.setVarBulk(...newVars);
		setVars(userVars.current.getAllVars(false));
		setRawVars(userVars.current.vars);

		return success;
	}

	return { rawVars, vars, setVar, current: userVars.current };
}

export default function Vars(props) {
	const userVars = useUserVars();
	const [{ search }] = useState(useLocation());
	const [newVal, setNewVal] = useState(structuredClone(defaultVals.basic));
	const [newListItem, setNewListItem] = useState("");
	const initialized = useRef(false);

	useEffect(() => {
		if (!initialized) {
			props.db
				.find({ include_docs: true, selector: { type: "var" } })
				.then((results) => {
					userVars.setVar(...results.docs);
				});

			initialized.current = true;
		}
	}, [props.db]);

	return (
		<Container>
			<Form onSubmit={submitVar(newVal, setNewVal, userVars, props.db)}>
				<Form.Group className="mb-3" controlId="formVarName">
					<Form.Label>Name</Form.Label>
					<Form.Control
						value={newVal.name}
						onChange={(e) => {
							setNewVal({ ...newVal, name: e.target.value });
						}}
						type="text"
						placeholder="Name"
					/>
				</Form.Group>
				<Form.Group className="mb-3" controlId="formVarScope">
					<Form.Label>Scope</Form.Label>
					<Form.Control
						value={newVal.scope}
						onChange={(e) => setNewVal({ ...newVal, scope: e.target.value })}
						type="text"
						placeholder="global"
					/>
				</Form.Group>
				<Form.Label>Type</Form.Label>
				<br />
				<ToggleButtonGroup
					type="radio"
					value={newVal.varType}
					onChange={(val) => setNewVal(structuredClone(defaultVals[val]))}
					name="varType"
					className="mb-2"
				>
					<ToggleButton
						id="option-basic"
						variant="outline-primary"
						value="basic"
					>
						Basic
					</ToggleButton>
					<ToggleButton id="option-list" variant="outline-primary" value="list">
						List
					</ToggleButton>
					<ToggleButton
						id="option-table"
						variant="outline-primary"
						value="table"
					>
						Table
					</ToggleButton>
					<ToggleButton
						id="option-expression"
						variant="outline-primary"
						value="expression"
					>
						Expression
					</ToggleButton>
				</ToggleButtonGroup>
				<br />
				{["basic", "expression"].includes(newVal.varType) && (
					<ValueType
						newVal={newVal}
						setNewVal={setNewVal}
						controlPlaceholder={"Value"}
						typePath={"value.type"}
						valuePath={"value.value"}
						idPrefix={"value"}
						titleText={"Value"}
					/>
				)}
				<Button className="my-3" type="submit">
					Create
				</Button>
			</Form>
			{newVal.varType === "list" && (
				<>
					{newVal.value.map((_, i) => {
						console.log(i);
						return (
							<ValueType
								key={i}
								newVal={newVal}
								setNewVal={setNewVal}
								controlPlaceholder={"Value"}
								typePath={`value[${i}].type`}
								valuePath={`value[${i}].value`}
								idPrefix={`value${i}`}
							/>
						);
					})}
					<Button
						className="my-3"
						onClick={() => {
							console.log(newVal);
							const clone = { ...newVal };

							clone.value.push(structuredClone(defaultVals.literal));
							setNewVal(clone);
						}}
					>
						Add Item
					</Button>
				</>
			)}
			{Object.keys(userVars.vars).length > 0 &&
				Object.keys(userVars.vars).map((scope) => {
					return (
						<Card key={scope}>
							<Card.Header>{scope}</Card.Header>
							<ListGroup>
								{Object.keys(userVars.vars[scope]).map((name) => {
									const current = userVars.current.getVar(`${scope}.${name}`);

									const currentRaw = userVars.current.getRawVar(
										`${scope}.${name}`
									);

									return (
										<ListGroup.Item
											key={name}
											action
											onClick={() => {
												const rawVar = userVars.current.getRawVar(
													`${scope}.${name}`
												);

												if (rawVar.scope === "global") rawVar.scope = "";

												setNewVal(rawVar);
											}}
										>
											{currentRaw.varType === "basic" &&
												currentRaw.value.type === "literal" &&
												`${name}: ${current}`}
											{currentRaw.varType === "basic" &&
												currentRaw.value.type !== "literal" &&
												`${name}: ${currentRaw.value.value} (${current})`}
											{currentRaw.varType === "list" &&
												`${name}: [${current.join(",\n")}]`}
										</ListGroup.Item>
									);
								})}
							</ListGroup>
						</Card>
					);
				})}
		</Container>
	);
}
