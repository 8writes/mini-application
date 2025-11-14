export default function manifest() {
    return {
      name: "BillzPaddi",
      short_name: "BillzPaddi",
      description: "Affordable Data Bundles, Game Top-ups and more",
      start_url: "dashboard",
      display: "standalone",
      background_color: "#1f2937",
      theme_color: "#000000",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };
  }