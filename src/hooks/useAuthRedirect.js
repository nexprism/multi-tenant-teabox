import React from "react";
import { useRouter } from "next/navigation";

const useAuthRedirect = () => {
  const router = useRouter();
  const redirectToLogin = () => {
    router.push("/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
  };
  const redirectToSignup = () => {
    router.push("/signup?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
  };
  return { redirectToLogin, redirectToSignup };
};

export default useAuthRedirect;
