/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        /*
         * Never let a browser cache the HTML document.
         *
         * Static assets are content-hashed and safe to cache forever, but a
         * cached *document* pins you to the old asset filenames — so a rebuilt
         * app keeps rendering the previous version and hard-refresh doesn't
         * always clear it. That cost real confusion during this build: changes
         * were live on the server and invisible in the browser.
         */
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
        missing: [{ type: "header", key: "next-router-prefetch" }],
      },
    ];
  },
};

export default nextConfig;
