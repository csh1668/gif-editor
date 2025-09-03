import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import App from "./App.tsx";
import About from "./pages/About";
import RootLayout from "./routes/root";

const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{ index: true, element: <App /> },
			{ path: "about", element: <About /> },
		],
	},
]);

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
