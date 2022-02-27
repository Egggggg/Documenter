import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

export default function Docs() {
	return (
		<Container>
			<div id="basic">
				<h2>Basic Usage</h2>
				<Card className="mb-3">
					<Card.Header>List View</Card.Header>
					<Card.Body>
						The list view is where you can view all of your documents. Variables
						are rendered, and the documents are sorted lexicographically by sort
						key, either ascending or descending.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Filtering</Card.Header>
					<Card.Body>
						Documents can be filtered by entering one of their tags as a filter.
						If multiple filters are entered, all documents with at least one
						matching filter will be returned.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Markdown</Card.Header>
					<Card.Body>
						This application uses{" "}
						<a href="https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax">
							Github flavored markdown
						</a>{" "}
						for document formatting. You can use the buttons above the text
						editor to add formatting.
					</Card.Body>
				</Card>
			</div>
			<div id="vars">
				<h2>Variables</h2>
				<Card className="mb-3">
					<Card.Header>Basic Variables</Card.Header>
					<Card.Body>
						Variables can be set to any string, and will be evaluated to their
						assigned value when used in a document. This is done using{" "}
						<a href="https://handlebarsjs.com/">HandlebarsJS</a> with the
						default delimiter, so variables are used in documents by surrounding
						their name with <code>{"{{}}"}</code>, like{" "}
						<code>{"{{name}}"}</code>.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Scopes</Card.Header>
					<Card.Body>
						Variables and documents can be given scopes. Scoped variables will
						need to be accessed using their scope (eg.{" "}
						<code>{"{{scope.name}}"}</code>), unless the document they're used
						in is in the same scope. If a document and variable are in different
						scopes, the variable must be prepended with <code>../</code> to
						first return to the global scope.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Tables</Card.Header>
					<Card.Body>
						Tables (parameterized variables) take different values depending on
						their conditions. Each output has a value, and the variable takes
						that value if all of its conditions are true. If multiple outputs
						would be returned, it takes either the first or last one, depending
						on the priority that was set.
					</Card.Body>
				</Card>
			</div>
			<div id="save">
				<h2>Save Options</h2>
				<Card className="mb-3">
					<Card.Header>Manifest (Backup)</Card.Header>
					<Card.Body>
						This option adds a file called <code>manifest.json</code> to the
						served .zip file, which can later be loaded to restore the same
						state.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Human Readable</Card.Header>
					<Card.Body>
						This option adds .md files to the <code>docs</code> directory for
						each document. They have all of their metadata stored in the
						frontmatter at the top of the files
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Evaluate Templates</Card.Header>
					<Card.Body>
						This option replaces variable references in the human readable .md
						files with their values. This works for basic variables as well as
						tables.
					</Card.Body>
				</Card>
			</div>
			<div id="load">
				<h2>Load Options</h2>
				<Card className="mb-3">
					<Card.Header>Group One</Card.Header>
					<Card.Body>
						Choosing All will load both documents and variables from the given
						file. Choosing Documents will only load documents, and choosing
						Variables will only load variables.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Group Two</Card.Header>
					<Card.Body>
						Append will add the chosen items from the file without overwriting
						or deleting anything, adding a random string to the end of variable
						names if needed to avoid conflicts. Overwrite will overwrite
						variables with conflicting names and documents with conflicting{" "}
						<code>_id</code>s, and Replace All will delete all items of the
						selected types before loading.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>File Types</Card.Header>
					<Card.Body>
						It is possible to load documents and variables from a .json file,
						variables from a .csv file, documents from .md or .txt files, or a
						combination of these types in a .zip file.
					</Card.Body>
				</Card>
			</div>
			<div id="expressions">
				<h2>Expressions</h2>
				<small>
					Definitions for custom expressions can be found{" "}
					<a href="https://github.com/Egggggg/Documenter/blob/main/src/index.jsx">
						here
					</a>
					.
				</small>
				<Card className="mb-3">
					<Card.Header>Default Expressions</Card.Header>
					<Card.Body>
						All of the default HandlebarsJS expressions are left fully intact,
						and can be used normally. As usual, variables can be used in
						expressions.
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Comparisons</Card.Header>
					<Card.Body>
						There are three custom comparison expressions:
						<ListGroup className="mt-3">
							<ListGroup.Item>
								<h5>eq [args]</h5>
								<p>
									Returns <code>true</code> if all <code>args</code> are equal,
									using JS <code>==</code>.
								</p>
								<code>
									{"{{eq nice nice}} -> true"}
									<br />
									{"{{eq nice 'not nice'}} -> false"}
									<br />
									{"{{eq nice nice nice}} -> true"}
									<br />
									{"{{eq nice nice 'not nice'}} -> false"}
								</code>
							</ListGroup.Item>
							<ListGroup.Item>
								<h5>lt arg1 arg2</h5>
								<p>
									Returns <code>true</code> if <code>arg1</code> is less than{" "}
									<code>arg2</code> after both arguments are parsed to floats.
								</p>
								<code>
									{"{{lt 3 4}} -> true"}
									<br />
									{"{{lt 1.5 2.5}} -> true"}
									<br />
									{"{{lt -4 -3}} -> true"}
									<br />
									{"{{lt 4 3}} -> false"}
									<br />
									{"{{lt 3 1.5}} -> false"}
									<br />
									{"{{lt 3 -3}} -> false"}
									<br />
								</code>
							</ListGroup.Item>
							<ListGroup.Item>
								<h5>gt arg1 arg2</h5>
								<p>
									Returns <code>true</code> if <code>arg1</code> is greater than{" "}
									<code>arg2</code> after both arguments are parsed to floats.
								</p>
								<code>
									{"{{gt 4 3}} -> false"}
									<br />
									{"{{gt 3 1.5}} -> false"}
									<br />
									{"{{gt 3 -3}} -> false"}
									<br />
									{"{{gt 3 4}} -> true"}
									<br />
									{"{{gt 1.5 2.5}} -> true"}
									<br />
									{"{{gt -4 -3}} -> true"}
									<br />
								</code>
							</ListGroup.Item>
						</ListGroup>
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Conditionals</Card.Header>
					<Card.Body>
						Comparisons can be used with conditionals to only show a piece of
						text if the comparison returns <code>true</code>. This is done by
						putting the comparison in a subexpression within an <code>if</code>{" "}
						expression, like this:{" "}
						<code>{"{{#if (eq varName 3)}}It's true!{{/if}}"}</code>
					</Card.Body>
				</Card>
				<Card className="mb-3">
					<Card.Header>Math</Card.Header>
					<Card.Body>
						There are six custom math expressions. All of them parse the
						arguments into floats.
						<ListGroup className="mt-3">
							<ListGroup.Item>
								<h5>add [args]</h5>
								<p>
									Returns all elements of <code>args</code> added together.
								</p>
								<code>
									{"{{add 3 3}} -> 6"}
									<br />
									{"{{add 3 1.5}} -> 4.5"}
									<br />
									{"{{add 3 -3}} -> 0"}
									<br />
									{"{{add 3 3 3}} -> 9"}
								</code>
							</ListGroup.Item>
							<ListGroup.Item>
								<h5>sub arg1 arg2</h5>
								<p>
									Returns <code>arg2</code> subtracted from <code>arg1</code>.
								</p>
								<code>
									{"{{sub 3 3}} -> 0"}
									<br />
									{"{{sub 3 1.5}} -> 1.5"}
									<br />
									{"{{sub 3 -3}} -> 6"}
								</code>
							</ListGroup.Item>
							<ListGroup.Item>
								<h5>mul [args]]</h5>
								<p>
									Returns all elements of <code>args</code> multiplied together.
								</p>
								<code>
									{"{{mul 3 3}} -> 9"}
									<br />
									{"{{mul 3 1.5}} -> 4.5"}
									<br />
									{"{{mul 3 -3}} -> -9"}
									<br />
									{"{{mul 3 3 3}} -> 27"}
									<br />
								</code>
							</ListGroup.Item>
							<ListGroup.Item>
								<h5>div arg1 arg2</h5>
								<p>
									Returns <code>arg1</code> divided by <code>arg2</code>.
								</p>
								<code>
									{"{{div 3 3}} -> 1"}
									<br />
									{"{{div 3 1.5}} -> 2"}
									<br />
									{"{{div 3 -3}} -> -1"}
									<br />
								</code>
							</ListGroup.Item>
							<ListGroup.Item>
								<h5>floor arg</h5>
								<p>
									Returns <code>arg</code> rounded to the next lowest integer.
									This is done automatically with the other expressions when
									possible to avoid floating point errors.
								</p>
								<code>
									{"{{floor 1.1}} -> 1"}
									<br />
									{"{{floor 2.5}} -> 2"}
									<br />
									{"{{floor 3.9}} -> 3"}
								</code>
							</ListGroup.Item>
							<ListGroup.Item>
								<h5>ceil arg</h5>
								<p>
									Returns <code>arg</code> rounded to the next highest integer.
								</p>
								<code>
									{"{{ceil 1.1}} -> 2"}
									<br />
									{"{{ceil 2.5}} -> 3"}
									<br />
									{"{{ceil 3.9}} -> 4"}
								</code>
							</ListGroup.Item>
						</ListGroup>
					</Card.Body>
				</Card>
			</div>
		</Container>
	);
}
