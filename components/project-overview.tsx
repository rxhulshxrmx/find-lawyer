import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { InformationIcon, VercelIcon } from "./icons";

const ProjectOverview = () => {
  return (
    <motion.div
      className="w-full max-w-[600px] my-4"
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="border rounded-lg p-6 flex flex-col gap-4 text-neutral-500 text-sm dark:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-center text-neutral-900 dark:text-neutral-50">
          Find the Right Lawyer for Your Needs
        </h2>
        <p>
          Search for experienced lawyers by practice area, location, or specific legal needs.
          Our AI-powered search helps you find the best legal representation.
        </p>
        <p className="text-sm">
          Try searching for: &quot;divorce lawyer in Mumbai&quot;, &quot;corporate lawyer&quot;, or &quot;property dispute attorney&quot;
        </p>
      </div>
    </motion.div>
  );
};

export default ProjectOverview;
