import { Outlet } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { NotificationContainer } from "react-notifications";

import Button from "react-bootstrap/Button";
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
								<Button>Home</Button>
							</LinkContainer>
							<LinkContainer to="/create">
								<Button>Create</Button>
							</LinkContainer>
							<LinkContainer to="/vars">
								<Button>Variables</Button>
							</LinkContainer>
							<LinkContainer to="/save-load">
								<Button>Save/Load</Button>
							</LinkContainer>
						</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
			<NotificationContainer />
			<Outlet />
			<div style={{ height: "50px" }}></div>
		</div>
	);
}
