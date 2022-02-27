import { NavLink } from "react-router-dom";

import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

export default function Guides() {
	return (
		<Container>
			<h3>Guides</h3>
			<ListGroup>
				<NavLink to="/create?guide=c1" className="text-decoration-none">
					<ListGroup.Item action>Creation</ListGroup.Item>
				</NavLink>
				<NavLink to="/vars?guide=v1" className="text-decoration-none">
					<ListGroup.Item action>Variables</ListGroup.Item>
				</NavLink>
				<NavLink to="/vars?guide=s1" className="text-decoration-none">
					<ListGroup.Item action>Scoped Variables</ListGroup.Item>
				</NavLink>
				<NavLink to="/create?guide=h1" className="text-decoration-none">
					<ListGroup.Item action>Conditionals</ListGroup.Item>
				</NavLink>
			</ListGroup>
		</Container>
	);
}
