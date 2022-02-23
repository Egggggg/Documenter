import JSZip from "jszip";
import FileSaver from "file-saver";

import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";

export default function SaveLoad(props) {
	const save = () => {
		const vars = {};
		const docs = {};

		const zip = new JSZip();

		props.db
			.find({
				selector: { $or: [{ type: "document" }, { type: "var" }] }
			})
			.then((results) => {
				results.docs.forEach((doc) => {
					if (doc.type === "document") {
						zip.file(
							`${doc.name}--${doc._id}.md`,
							`${doc.text}\n--------\n### Tags\n${doc.tags.join("\n")}`
						);
					}
				});
			})
			.then(() => {
				zip.generateAsync({ type: "blob" }).then((content) => {
					FileSaver.saveAs(content, "documenter.zip");
				});
			});
	};

	return (
		<Container>
			<Button onClick={save}>Save As...</Button>{" "}
			<Form>
				<Form.Group className="mb-3" controlId="formBasicLoad">
					<Form.Label>Load from .zip</Form.Label>
					<Form.Control type="file" />
					<Button type="submit">Load</Button>
				</Form.Group>
			</Form>
		</Container>
	);
}
