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
					<Navbar.Brand href="/#/">Documenter</Navbar.Brand>
					<Navbar.Toggle aria-controls="basic-navbar-nav" />
					<Navbar.Collapse id="basic-navbar-nav">
						<Nav className="me-auto">
							<div as={Nav.Link} className="me-3">
								<LinkContainer to="/">
									<Button>Home</Button>
								</LinkContainer>
							</div>
							<div as={Nav.Link} className="me-3">
								<LinkContainer to="/create">
									<Button>Create</Button>
								</LinkContainer>
							</div>
							<div as={Nav.Link} className="me-3">
								<LinkContainer to="/vars">
									<Button>Variables</Button>
								</LinkContainer>
							</div>
							<div as={Nav.Link} className="me-3">
								<LinkContainer to="/save-load">
									<Button>Save/Load</Button>
								</LinkContainer>
							</div>
							<div as={Nav.Link} className="me-3">
								<LinkContainer to="/guides">
									<Button>Guides</Button>
								</LinkContainer>
							</div>
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
