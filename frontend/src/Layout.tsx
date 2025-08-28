import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Layout() {
  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <Header />

      {/* Content */}
      <main className="flex-1 bg-background px-12 py-8">
        <Outlet /> {/* ini tempat render child route */}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
