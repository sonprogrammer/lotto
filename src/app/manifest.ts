import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "로또 6/45",
    short_name: "로또 6/45",
    description: "저장한 번호의 당첨 결과를 확인하세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/lotto_icon.png",
        sizes: "627x627",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
