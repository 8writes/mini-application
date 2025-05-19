"use client";

import UserDialog from "@/components/dialogs/userDialog";
import { useGlobalContext } from "@/context/GlobalContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { toast } from "react-toastify";

export default function Page() {
  const { user } = useGlobalContext();

  if (!user) {
    return;
  }
  
  return (
    <div>
      <section className="">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl">
            Welcome, {user?.last_name ?? "User"}
          </h1>
        </div>
      </section>
    </div>
  );
}
