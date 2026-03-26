import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomTabBar from "@/components/BottomTabBar";

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomTabBar />
    </>
  );
}
