import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Enables importing .mdx files as React components — used by the Notes
// section (T-017) to render versioned posts from content/notes/**. Posts are
// imported dynamically rather than used as page.mdx files, so
// `pageExtensions` doesn't need to change, only the MDX loader itself.
const withMDX = createMDX({
  options: {
    // Turbopack (the default bundler — see next.config docs) only supports
    // remark/rehype plugins passed as strings/tuples with serializable
    // options, not plugin function references directly.
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);
