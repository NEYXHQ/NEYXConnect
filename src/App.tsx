import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import TokenDiscovery from "./components/TokenDiscovery";

const App: React.FC = () => {
  return (
    <div>
      {/* Navigation Links */}
      <nav>
        <Link to="/">Home</Link> | <Link to="/token-discovery">Token Discovery</Link>
      </nav>

      {/* Define Routes */}
      <Routes>
        <Route path="/" element={<h1>Welcome to NEYXT App</h1>} />
        <Route path="/token-discovery" element={<TokenDiscovery />} />
      </Routes>
    </div>
  );
};

export default App;