import Image from "next/image";
import { VideoBox } from "@/components/VideoBox";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MaskDetection from "@/components/MaskDetection";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="w-full h-screen">
      <Dashboard />
    </main>
  );
}
