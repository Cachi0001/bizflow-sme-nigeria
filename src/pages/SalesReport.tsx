
import { Navbar } from "@/components/Navbar";
import DailySalesReport from "@/components/DailySalesReport";

const SalesReport = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 pt-20">
        <DailySalesReport />
      </div>
    </div>
  );
};

export default SalesReport;
