import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymPlate",
    short_name: "GymPlate",
    description: "训练、饮食和身体数据记录工具",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5f8",
    theme_color: "#111318",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
