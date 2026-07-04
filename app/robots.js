export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://dealxindia.com/sitemap.xml", // TODO: keep in sync with layout.js metadataBase
  };
}
