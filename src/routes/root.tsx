import { Link, Outlet } from "react-router";

export default function RootLayout() {
	return (
		<div className="min-h-screen">
			<nav className="p-4 border-b flex gap-4">
				<Link to="/">Home</Link>
				<Link to="/about">About</Link>
			</nav>
			<main className="p-4">
				<Outlet />
			</main>
		</div>
	);
}

