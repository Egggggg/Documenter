import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { UserVars } from "uservars";

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
		value: "",
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
				output: "",
				conditions: [
					{
						val1: "",
						comparison: "eq",
						val2: ""
					}
				]
			}
		],
		varType: "table",
		default: "",
		priority: "first"
	},
	expression: {
		name: "",
		scope: "",
		value: "",
		varType: "expression",
		functions: [],
		vars: {}
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
		console.log(existing);
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

function submitVar(
	newValObject,
	setNewVal,
	userVars,
	vars,
	setVars,
	db,
	refState,
	setRefState
) {
	return async (e) => {
		e.preventDefault();

		const newVal = { ...newValObject };

		if (newVal.scope === "") newVal.scope = "global";
		if (newVal.value === "") newVal.value = { value: "!" };

		try {
			let success = userVars.current.setVar(newVal);

			console.log(success);
			console.log(userVars.current.vars);

			if (!success) {
				NotificationManager.error(
					"Couldn't create variable",
					"An error occurred"
				);
				return;
			}

			let evaluated = userVars.current.getVar(newVal.name);

			setVars({
				...vars,
				[newVal.scope]: {
					...vars[newVal.scope],
					[newVal.name]: evaluated
				}
			});

			await storeVar(newVal, db);
			setNewVal(defaultVals[newVal.varType]);

			NotificationManager.success("Variable created");
		} catch (err) {
			NotificationManager.error(err.toString(), "An error occurred");
		}
	};
}

function formatVars(evaluated) {
	const output = { global: {} };

	for (let i of Object.keys(evaluated)) {
		const current = evaluated[i];

		console.log(current);

		if (
			typeof current === "string" ||
			current instanceof Array ||
			("output" in current && typeof current.output === "string")
		) {
			output.global[i] = current;
		} else {
			output[i] = {};

			for (let e of Object.keys(current)) {
				const current2 = current[e];

				output[i][e] = current2;
			}
		}
	}

	return output;
}

function ValueType({ newVal, setNewVal, controlPlaceholder, controlProperty }) {
	return (
		<Form.Group className="mb-3" controlId="formVarValueString">
			<Form.Label>Value</Form.Label>
			<Form.Control
				value={newVal[controlProperty]}
				onChange={(e) => {
					const clone = { ...newVal };

					clone[controlProperty] = e.target.value;
					setNewVal(clone);
				}}
				type="text"
				placeholder={controlPlaceholder}
			/>
			<ToggleButtonGroup
				type="radio"
				value={refState.value}
				onChange={(e) => setRefState({ ...refState, value: e })}
				name="newValueType"
				className="mb-3"
			>
				<ToggleButton
					id="value-type-literal"
					variant="outline-primary"
					value="literal"
				>
					Literal
				</ToggleButton>
				<ToggleButton
					id="value-type-ref"
					variant="outline-primary"
					value="reference"
				>
					Reference
				</ToggleButton>
			</ToggleButtonGroup>
		</Form.Group>
	);
}

export default function Vars(props) {
	const userVars = useRef(new UserVars());
	const [{ search }] = useState(useLocation());
	const [newVal, setNewVal] = useState(defaultVals.basic);
	const [refState, setRefState] = useState({ value: "literal" });
	const [newListItem, setNewListItem] = useState("");
	const [vars, setVars] = useState({});

	useEffect(() => {
		props.db
			.find({ include_docs: true, selector: { type: "var" } })
			.then((results) => {
				userVars.current.setVarBulk(...results.docs);
				const evaluated = userVars.current.getAllVars(false, true);
				setVars(formatVars(evaluated));
			});
	}, [props.db]);

	return (
		<Container>
			<Form
				onSubmit={submitVar(
					newVal,
					setNewVal,
					userVars,
					vars,
					setVars,
					props.db,
					refState,
					setRefState
				)}
			>
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
					onChange={(val) => setNewVal({ ...newVal, varType: val })}
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
					<Form.Group className="mb-3" controlId="formVarValueString">
						<Form.Label>Value</Form.Label>
						<Form.Control
							value={newVal.value}
							onChange={(e) => setNewVal({ ...newVal, value: e.target.value })}
							type="text"
							placeholder="Value"
						/>
						<ToggleButtonGroup
							type="radio"
							value={refState.value}
							onChange={(e) => setRefState({ ...refState, value: e })}
							name="newValueType"
							className="mb-3"
						>
							<ToggleButton
								id="value-type-literal"
								variant="outline-primary"
								value="literal"
							>
								Literal
							</ToggleButton>
							<ToggleButton
								id="value-type-ref"
								variant="outline-primary"
								value="reference"
							>
								Reference
							</ToggleButton>
						</ToggleButtonGroup>
					</Form.Group>
				)}
				{newVal.varType !== "list" && (
					<Button className="my-3" type="submit">
						Create
					</Button>
				)}
			</Form>
			{newVal.varType === "list" && (
				<Form>
					<Form.Group controlId="newListItem">
						<Form.Label>New Item</Form.Label>
						<Form.Control
							value={newListItem}
							onChange={(e) => setNewListItem(e.target.value)}
							type="text"
							placeholder="Value"
						/>
						<ToggleButtonGroup
							type="radio"
							value={refState.value}
							onChange={(e) => setRefState({ ...refState, value: e })}
							name="newListItemType"
							className="mb-3"
						>
							<ToggleButton
								id="list-item-type-literal"
								variant="outline-primary"
								value="literal"
							>
								Literal
							</ToggleButton>
							<ToggleButton
								id="list-item-type-var"
								variant="outline-primary"
								value="var"
							>
								Variable
							</ToggleButton>
						</ToggleButtonGroup>
					</Form.Group>
				</Form>
			)}
			{Object.keys(vars).length > 0 &&
				Object.keys(vars).map((scope) => {
					return (
						<Card key={scope}>
							<Card.Header>{scope}</Card.Header>
							<ListGroup>
								{Object.keys(vars[scope]).map((name) => {
									const current = vars[scope][name];

									if (typeof current === "string") {
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
												{`${name}: ${current}`}
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
