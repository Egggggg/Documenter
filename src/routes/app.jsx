import { Outlet } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import "../styles/app.css";

function App() {
	return (
		<div className="app">
			<Navbar expand="md">
				<Container>
					<Navbar.Toggle aria-controls="basic-navbar-nav" />
					<Navbar.Collapse id="basic-navbar-nav">
						<Nav className="me-auto">
							<LinkContainer to="/">Home</LinkContainer>
							<LinkContainer to="/list">List</LinkContainer>
							<LinkContainer to="/create">Create</LinkContainer>
						</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
			<Outlet />
		</div>
	);
}

export default App;
