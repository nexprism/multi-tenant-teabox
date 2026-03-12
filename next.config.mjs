import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Bundle analyzer (optional)
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? (await import("@next/bundle-analyzer")).default({ enabled: true })
    : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,

  output: "standalone",

  experimental: {
    optimizePackageImports: ["lucide-react", "react-toastify", "swiper"],
  },

  /**
   * 🔥 HEADERS (CRITICAL)
   * - Disable HTML / RSC caching
   * - Allow long cache ONLY for images/uploads
   */
  async headers() {
    return [
      // 🚫 Disable caching for ALL pages & layouts
      {
        source: "/((?!_next|images|uploads).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },

      // ✅ Images cache (safe)
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ✅ Uploads cache (safe)
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/uploads/invoices/:id.html",
          destination: "/api/invoice/:id",
        },
        // Serve uploaded files through API route for standalone mode compatibility
        // This ensures runtime-uploaded files in public/uploads/ are accessible
        {
          source: "/uploads/:path*",
          destination: "/api/uploads/:path*",
        },
      ],
    };
  },

  /**
   * 🔧 Webpack fixes (client side only)
   */
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
        assert: false,
        constants: false,
        events: false,
        net: false,
        tls: false,
        child_process: false,
        async_hooks: false,
      };

      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^fast-glob$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^@nodelib\/fs/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^mongoose$/ })
      );

      config.resolve.alias = {
        ...config.resolve.alias,
        "@nodelib/fs.scandir": resolve(__dirname, "./lib/empty-fs-module.js"),
        "@nodelib/fs.stat": resolve(__dirname, "./lib/empty-fs-module.js"),
        "@nodelib/fs.walk": resolve(__dirname, "./lib/empty-fs-module.js"),
        "fast-glob": resolve(__dirname, "./lib/empty-glob-module.js"),
      };
    }

    return config;
  },

  /**
   * 🖼 Image Optimization
   */
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "bharat.nexprism.in" },
      { protocol: "http", hostname: "localhost", port: "3000" },
      { protocol: "http", hostname: "localhost", port: "3001" },
      { protocol: "http", hostname: "bharat.localhost", port: "3001" },
      { protocol: "http", hostname: "bharat.localhost" },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  turbopack: {},
};

export default withBundleAnalyzer(nextConfig);
