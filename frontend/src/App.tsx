import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./components/Home";
import History from "./components/History";

function App() {
  return (
    <Router>
      <Routes>
        {/* Semua route yang menggunakan layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="riwayat" element={<History />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
