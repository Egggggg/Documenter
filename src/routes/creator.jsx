import MDEditor from "@uiw/react-md-editor";
import { useState } from "react";

export default function Creator() {
	const [value, setValue] = useState("**Boy howdy!**");

	return (
		<div className="md">
			<MDEditor value={value} onChange={setValue} />
		</div>
	);
}
