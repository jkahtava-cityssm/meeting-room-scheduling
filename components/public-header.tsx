"use client";
import React, { useState } from "react";

interface HeaderProps {
  left?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function PublicHeader({ left, title, right, children }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      <header className="bg-background sticky top-0 z-50 w-full border-b">
        {/* Floating title behind */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
          <h1 className="truncate max-w-[200px] text-lg font-bold xs:text-2xl text-center pointer-events-auto xs:max-w-full">
            {title}
          </h1>
        </div>

        {/* Foreground layout */}
        <div className="relative flex h-[--header-height] w-full items-center px-4 py-2 z-10">
          {/* Left section */}
          <div className="hidden xs:flex items-center justify-start flex-[0_1_auto] min-w-0">{left}</div>

          {/* Spacer (optional, can be removed if title is floated) */}
          <div className="flex-1" />

          {/* Right section */}
          <div className="hidden xs:flex items-center justify-end gap-2 flex-[0_1_auto] min-w-0">{right}</div>

          <div className="xs:hidden relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="px-2 py-1 border rounded">
              Menu
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-50">
                <div className="flex flex-col p-2">{right}</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {children}
    </>
  );
}

/*
export function PublicHeader({ left, title, right, children }: HeaderProps) {
  return (
    <>
      <header className="bg-background sticky top-0 z-50 w-full border-b">
        <div className="relative flex h-[--header-height] w-full items-center px-4 py-2">

          <div className="absolute left-4 flex items-center">{left}</div>


          <div className="mx-auto min-w-0 text-center">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
          </div>


          <div className="absolute right-4 flex items-center gap-2">{right}</div>
        </div>
      </header>
      <div
        className="flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10"
        style={{ minHeight: "calc(100vh - var(--header-height) - 1px)" }}
      >
        {children}
      </div>
    </>
  );
}




<header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
        <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
          <Image
            src="/images/menu_logo.svg"
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={32}
            height={32}
            style={{ width: "32px", height: "32px" }}
            priority={true}
          />
          <div className="w-full sm:ml-auto sm:w-auto">
            <div className="flex gap-2">
              <ThemeButton />
              <Button>
                <Link href={"/"}>Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      */
