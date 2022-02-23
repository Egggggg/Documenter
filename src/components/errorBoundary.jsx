import React from "react";

export default class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { error: null, errorInfo: null };
	}

	render() {
		if (this.state.errorInfo) {
			return (
				<div>
					<h2></h2>
				</div>
			);
		}
	}
}
