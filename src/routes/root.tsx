import { Link, Outlet } from "react-router";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout() {
	return (
		<div className="min-h-screen">
			<nav className="py-4 px-6 border-b flex items-center justify-between">
				<div className="flex gap-4">
					<Link to="/">Home</Link>
					<Link to="/about">About</Link>
				</div>
				<div className="flex items-center gap-4">
					<a
						href="https://github.com/csh1668/gif-editor"
						target="_blank"
						rel="noopener noreferrer"
						title="Open repository on GitHub"
						aria-label="Open repository on GitHub"
					>
						<img
							src="https://cdn.simpleicons.org/github/000000"
							alt="GitHub"
							className="w-6 h-6"
						/>
					</a>
					<a
						href="https://github.com/csh1668"
						target="_blank"
						rel="noopener noreferrer"
						title="Open developer GitHub profile"
						aria-label="Open developer GitHub profile"
					>
						<img
							src="https://github.com/csh1668.png"
							alt="csh1668 avatar"
							className="w-6 h-6 rounded-full"
						/>
					</a>
				</div>
			</nav>
			<main className="p-4">
				<Outlet />
				<Analytics />
			</main>
		</div>
	);
}
