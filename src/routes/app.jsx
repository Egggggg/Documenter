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
							<Nav.Link>
								<LinkContainer to="/">
									<Button>Home</Button>
								</LinkContainer>
							</Nav.Link>
							<Nav.Link>
								<LinkContainer to="/create">
									<Button>Create</Button>
								</LinkContainer>
							</Nav.Link>
							<Nav.Link>
								<LinkContainer to="/vars">
									<Button>Variables</Button>
								</LinkContainer>
							</Nav.Link>
							<Nav.Link>
								<LinkContainer to="/save-load">
									<Button>Save/Load</Button>
								</LinkContainer>
							</Nav.Link>
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
