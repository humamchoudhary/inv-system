"use client";

import { BrainCog, FileText, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Navbar() {
  const links = [
    {
      name: "Dashboard",
      href: "/",
      Icon: Home,
    },
    { name: "Data", href: "/data", Icon: FileText },
  ];
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex flex-col w-56 h-screen bg-foreground px-6 py-6 fixed">
        <div className="flex flex-row gap-2 items-center">
          <BrainCog className="text-primary" />
          <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-sec font-bold">
            AI Inventory
          </h1>
        </div>

        <div className="flex flex-col items-center mt-12 gap-4">
          {links.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex bg-gradient-to-r w-full items-center gap-2 rounded-sm py-2 px-3 ${
                pathname == item.href
                  ? "from-primary to-primary-sec text-white"
                  : "text-gray-300 hover:text-white"
              } font-medium transition-colors`}
            >
              <item.Icon size={18} />
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
      <div className="lg:hidden fixed bottom-2 left-3 right-3 bg-foreground border-t border-gray-700 z-50 rounded-full">
        <div className="flex justify-around items-center  px-4">
          {/* Logo at the center */}

          {/* Navigation Links */}
          {links.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                pathname == item.href
                  ? "text-primary"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <item.Icon size={22} />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer for mobile bottom nav to prevent content from being hidden behind it */}
      <div className="lg:hidden h-20" />

      <div className="hidden lg:flex flex-col w-60 h-screen" />
    </>
  );
}

export default Navbar;
