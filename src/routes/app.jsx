import { Outlet } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { NotificationContainer } from "react-notifications";

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
							<LinkContainer to="/">
								<button>Home</button>
							</LinkContainer>
							<LinkContainer to="/create">
								<button>Create</button>
							</LinkContainer>
							<LinkContainer to="/vars">
								<button>Variables</button>
							</LinkContainer>
						</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
			<NotificationContainer />
			<Outlet />
		</div>
	);
}
