import {useRef, useState, useEffect, useMemo} from "react";
import { useLocation } from "react-router-dom";
import { UserVars } from "uservars";
import { get, set } from "lodash";

import copy from "../img/copy.svg";
import "../css/style.css";

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
	},
	reference: {
		value: "",
		type: "reference"
	},
	inlineExpression: {
		value: "",
		vars: {},
		type: "expression"
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

	if (!value.value.value && existing.docs.length > 0) {
		db.remove(existing.docs[0]);
		return;
	}

	const data = {
		...value,
		type: "var"
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

		try {
			let success = userVars.setVar(newVal);

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
			throw err;
		}
	};
}

function ValueInput({
	newVal,
	setNewVal,
	controlPlaceholder,
	valuePath,
	idPrefix,
	titleText,
	includeExpr = true
}) {
	return (
		<Form.Group className="mb-3" controlId={`formVar${idPrefix}`}>
			{Boolean(titleText) && <Form.Label>{titleText}</Form.Label>}
			<Form.Control
				value={get(newVal, `${valuePath}.value`)}
				onChange={(e) => {
					const clone = structuredClone(newVal);

					set(clone, `${valuePath}.value`, e.target.value);
					setNewVal(clone);
				}}
				type="text"
				placeholder={controlPlaceholder}
			/>
			<ToggleButtonGroup
				type="radio"
				value={get(newVal, `${valuePath}.type`, "literal")}
				onChange={(e) => {
					const clone = structuredClone(newVal);

					if (e === "expression") {
						set(clone, `${valuePath}.vars`, {});
					} else {
						set(clone, `${valuePath}.vars`, null);
					}

					set(clone, `${valuePath}.type`, e);
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
				{includeExpr &&
					<ToggleButton
						id={`${idPrefix}-type-expr`}
						variant="outline-primary"
						value="expression"
					>
						Expression
					</ToggleButton>
				}
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

function VarDisplay({ raw, evaluated, setCopied }) {
	if (raw.varType === "basic") {
		if (raw.value.type === "literal") {
			return (
				<>
					<PathDisplay path={raw.name} setCopied={setCopied} />:{" "}
					<ValueDisplay value={evaluated} setCopied={setCopied}>{evaluated}</ValueDisplay>
				</>
			);
		} else {
			if (typeof evaluated === "string") {
				return (
					<>
						<PathDisplay path={raw.name} setCopied={setCopied} />:{" "}
						<ValueDisplay value={evaluated} setCopied={setCopied}>{raw.value.value} ({evaluated})</ValueDisplay>
					</>
				);
			} else {
				return `${raw.name}: ${raw.value.value} ([${evaluated.join(", ")}])`;
			}
		}
	} else if (raw.varType === "list") {

	}
}

function PathDisplay({ path, setCopied }) {
	const [showCopy, setShowCopy] = useState(false);

	return (
		<span
			tabIndex={0}
			onFocus={() => setShowCopy(true)}
			onBlur={() => setShowCopy(false)}
			className={"value-path"}
		>
			<img
				src={copy}
				className={"copy"}
				onClick={() => copyPath(path, setCopied)}
				hidden={!showCopy}
				alt={"Copy"}
			/>
			{" "}{path}
		</span>
	);
}

function ValueDisplay({ evaluated, children, setCopied }) {
	const [showCopy, setShowCopy] = useState(false);

	return (
		<span
			tabIndex={0}
			onFocus={() => { setShowCopy(true)}}
			onBlur={() => setShowCopy(false)}
			className={"pe-5 value-path"}
		>
			{children}{" "}
			<img
				src={copy}
				className={"copy"}
				onClick={() => copyValue(evaluated, setCopied)}
				hidden={!showCopy}
				alt={"Copy"}
			/>
		</span>
	)
}

function copyPath(path, setCopied) {
	setCopied({type: "path", value: path});
}

function copyValue(value, setCopied) {
	setCopied({type: "value", value: value});
}

export default function Vars(props) {
	const userVars = useUserVars();
	const [{ search }] = useState(useLocation());
	const [newVal, setNewVal] = useState(structuredClone(defaultVals.basic));
	const initialized = useRef(false);
	let [copied, setCopied] = useState({});

	useEffect(() => {
		if (!initialized.current) {
			props.db
				.find({ include_docs: true, selector: { type: "var" } })
				.then((results) => {
					userVars.setVar(...results.docs);
				});

			initialized.current = true;
		}
	}, [props.db, userVars]);

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
						onChange={(e) => {
							setNewVal({ ...newVal, scope: e.target.value })
						}}
						type="text"
						placeholder="global"
					/>
				</Form.Group>
				<Form.Label>Type</Form.Label>
				<br />
				<ToggleButtonGroup
					type="radio"
					value={newVal.varType}
					onChange={(val) => setNewVal({ ...structuredClone(defaultVals[val]), name: newVal.name, scope: newVal.scope})}
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
					<ValueInput
						newVal={newVal}
						setNewVal={setNewVal}
						controlPlaceholder={"Value"}
						valuePath={"value"}
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
						return (
							<ValueInput
								key={i}
								newVal={newVal}
								setNewVal={setNewVal}
								controlPlaceholder={"Value"}
								valuePath={`value[${i}]`}
								idPrefix={`value${i}`}
							/>
						);
					})}
					<Button
						className="my-3"
						onClick={() => {
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
				Object.keys(userVars.vars).sort((a, b) => {
					if (a === "global") {
						return -1;
					} else {
						a = a.toLowerCase();
						b = b.toLowerCase();

						if (a > b) {
							return 1;
						} else {
							return -1;
						}
					}
				}).map((scope) => {
					return (
						<Card key={scope} className={"my-3"}>
							<Card.Header>{scope}</Card.Header>
							<ListGroup>
								{Object.keys(userVars.vars[scope]).sort().map((name) => {
									const current = userVars.vars[scope][name];

									const currentRaw = userVars.current.getRawVar(
										`${scope}.${name}`
									);

									return (
										<ListGroup.Item
											key={`${name}-${currentRaw.value.value}-${current}`}
											action
											onClick={() => {
												const rawVar = userVars.current.getRawVar(
													`${scope}.${name}`
												);

												if (rawVar.scope === "global") rawVar.scope = "";

												setNewVal(rawVar);
											}}
										>
											<VarDisplay raw={currentRaw} evaluated={current} setCopied={setCopied}/>
										</ListGroup.Item>
									);
								})}
							</ListGroup>
						</Card>
					);
				})}
			<small>Copy by Derrick Snider from NounProject.com</small>
		</Container>
	);
}
