import Sidebar from "./Sidebar";
import ProcessingStatus from "./ProcessingStatus";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-brutal-cream">
      <Sidebar />

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen p-6 lg:p-8">{children}</main>

      {/* Processing status notifications */}
      <ProcessingStatus />
    </div>
  );
};

export default Layout;
