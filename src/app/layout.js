// src/app/layout.js
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import Providers from "./store/Providers"; // ✅ Updated path
import ClientLayout from "./ClientLayout";
import ClientOnly from "../components/ClientOnly.jsx";
import { ToastContainer } from "react-toastify";
import CheckoutPopup from "../components/CheckoutPopup";
// import OrderPopup from "../components/OrderPopup";
export const metadata = {
  title: "E-Commerce Platform",
  description: "Find the perfect good",
  icons: {
    icon: '/logo.webp',
  },
};

export default function RootLayout({ children }) {
  // console.log = () => {};

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.webp" type="image/webp" />
        <link rel="shortcut icon" href="/logo.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/logo.webp" />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        {/* Preload critical fonts for faster First Contentful Paint */}
        <link
          rel="preload"
          href="/fonts/Poppins-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/BebasNeue-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers>
          <ClientOnly>
            <ClientLayout>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              className="!z-[9999999]"
            />
            <CheckoutPopup />
            {/* <OrderPopup /> */}
              {children ?? null}
            </ClientLayout>
          </ClientOnly>
        </Providers>
      </body>
    </html>
  );
}
