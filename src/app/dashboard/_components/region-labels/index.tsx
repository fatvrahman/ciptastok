"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./map"), { ssr: false });

export function RegionLabels() {
  return (
    <div className="rounded-xl border border-stroke bg-white col-span-12 p-7.5 shadow-sm dark:border-strokedark dark:bg-boxdark xl:col-span-7">
      <h2 className="mb-7 text-body-2xlg font-bold text-dark dark:text-white">
        Region labels
      </h2>

      <Map />
    </div>
  );
}
