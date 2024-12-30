import { GitHubLogoIcon } from "@radix-ui/react-icons";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="p-4 flex items-center justify-between">
      <h1 className="px-0 sm:px-4 font-bold text-4xl sm:text-8xl">
        masq.<span className="text-neutral-400">ai</span>
      </h1>
      <div className="px-0 sm:px-10 flex gap-4">
        <Button variant="outline">
          <Link href="mailto: jarrworkspace@gmail.com" target="_blank">
            Contact Us
          </Link>
        </Button>
        <Link href="https://github.com/NekoJar/shiru-ai" target="_blank">
          <GitHubLogoIcon width={40} height={40} />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
