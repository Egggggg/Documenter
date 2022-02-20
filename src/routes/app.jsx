import { Outlet } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

export default function App() {
	return (
		<div className="app">
			<Navbar expand="md">
				<Container>
					<Navbar.Toggle aria-controls="basic-navbar-nav" />
					<Navbar.Collapse id="basic-navbar-nav">
						<Nav className="me-auto">
							<LinkContainer to="/list">
								<button>List</button>
							</LinkContainer>
							<LinkContainer to="/create">
								<button>Create</button>
							</LinkContainer>
						</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
			<Outlet />
		</div>
	);
}
