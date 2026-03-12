"use client";

import React, { use, useEffect, useRef, useState } from "react";
import {
  X,
  Plus,
  Minus,
  MapPin,
  Phone,
  ArrowBigLeft,
  ArrowLeft,
  PencilLine,
  PhoneCall,
  Mail,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAddressFormLocalStorage,
  placeOrder,
  resetAddress,
  setAddress,
  setCheckoutClose,
  setCheckoutOpen,
} from "@/app/store/slices/checkOutSlice";
import {
  createUserAddress,
  getuserAddresses,
  sendOtp,
  setAuthenticated,
  setOtpSended,
  updateUserAddress,
  verifyOtp,
} from "@/app/store/slices/authSlice";
import Loading from "@/components/Loading";
import Image from "next/image";
import {
  applyCoupon,
  clearSelectedCoupon,
} from "@/app/store/slices/couponSlice";
import { addToCart, clearCart } from "@/app/store/slices/cartSlice";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { initializeBuyNowFromQuery, getCartItems, restoreCartState, setBuyNowProduct } from "@/app/store/slices/cartSlice";
import { fetchProducts, fetchAddons } from "@/app/store/slices/productSlice";
import { toast } from "react-toastify";
import { fetchSettings } from "@/app/store/slices/settingSlice";
import axiosInstance from "@/axiosConfig/axiosInstance";
import { LoadingSpinner } from "./common/Loading";
import { useTrack } from "@/app/lib/tracking/useTrack";
import { fetchPages } from "@/app/store/slices/pagesSlice";
import { getImageUrl } from "@/app/utils/imageHelper";

export default function CheckoutPopup() {
  const checkoutOpen = useSelector((state) => state.checkout.checkoutOpen);
  const { addressData, addressAdded } = useSelector((state) => state.checkout);
  const { products } = useSelector((state) => state.product);
  const [paymentMethod, setPaymentMethod] = useState("prepaid");
  const [userAddresses, setUserAddresses] = useState([]);
  const [addressType, setAddressType] = useState("");
  const [pinCodeVerified, setPinCodeVerified] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = usePathname();
  const { isAuthenticated, otpSended, loading, user } = useSelector(
    (state) => state.auth
  );
  const { cartItems, buyNowProduct } = useSelector((state) => state.cart);
  const { selectedCoupon } = useSelector((state) => state.coupon);
  const { settings } = useSelector((state) => state.setting);
  const { list: pagesList } = useSelector((state) => state.pages);
  //console.log("Settings:", settings);
  const [couponCode, setCouponCode] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRefs = useRef([]); // Array of refs for each input field
  const [SelectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(null); // Track which product's variants to show
  const dispatch = useDispatch();
  const { trackCheckout } = useTrack();

  // Hydrate buy-now from localStorage into Redux when popup mounts
  useEffect(() => {
    if (!buyNowProduct) {
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("dnd_ecommerce_buy_now");
          if (stored) {
            const parsed = JSON.parse(stored);
            dispatch(setBuyNowProduct(parsed));
          }
        }
      } catch (err) {
        console.error("Failed to hydrate buyNowProduct", err);
      }
    }
  }, [buyNowProduct, dispatch]);

  // Track whether an order was placed while checkout was open
  const orderPlacedRef = useRef(false);
  // initialize prev as false so we only detect actual true->false transitions
  const prevCheckoutOpen = useRef(false);

  const [formData, setFormData] = useState({
    pincode: "",
    firstName: "",
    lastName: "",
    flatNumber: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    email: "",
    addressType: "Home",
    phone: "",
  });
  const [otp, setOtp] = useState(Array(6).fill("")); // Array with 6 empty strings
  const GOOGLE_MAPS_API_KEY = "AIzaSyApJRbaVZNuthc2Mi72xifDbdk8b-3WI9Q";
  const [addressSearch, setAddressSearch] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Add new state for landmark suggestions
  const [landmarkSuggestions, setLandmarkSuggestions] = useState([]);
  const [loadingLandmarks, setLoadingLandmarks] = useState(false);
  const [landmarkSearch, setLandmarkSearch] = useState("");

  const handleSelectAddress = async (selectedIndex) => {
    if (selectedIndex === "" || selectedIndex === "default") return;

    const selectedAddress = userAddresses[parseInt(selectedIndex)];
    //console.log("Selected Address:", JSON.stringify({ ...selectedAddress }));
    //console.log("Selected Address Phone:", selectedAddress.address?.phone);
    setFormData({
      pincode: selectedAddress.address?.pincode || "",
      firstName: selectedAddress.address?.firstName || "",
      lastName: selectedAddress.address?.lastName || "",
      flatNumber: selectedAddress.address?.line1 || "",
      area: selectedAddress.address?.area || "",
      landmark: selectedAddress.address?.line2 || "",
      city: selectedAddress.address?.city || "",
      state: selectedAddress.address?.state || "",
      email: selectedAddress.address?.email || "",
      addressType: selectedAddress.title || "Home",
      phone: selectedAddress.address?.phone || user?.phone || "",
    });
    setAddressType(selectedAddress.title || "Home");
    // Dispatch with correct structure matching what setAddress expects
    const addressStructure = {
      title: selectedAddress.title || "Home",
      address: {
        ...selectedAddress.address,
        phone: selectedAddress.address?.phone || user?.phone || "",
      },
    };
    dispatch(setAddress(addressStructure));
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleKeyDown = (e) => {
    if (
      !/^[0-9]{1}$/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      !e.metaKey
    ) {
      e.preventDefault();
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      const index = inputRefs.current.indexOf(e.target);
      if (index > 0) {
        setOtp((prevOtp) => [
          ...prevOtp.slice(0, index - 1),
          "",
          ...prevOtp.slice(index),
        ]);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleInput = (e) => {
    const { target } = e;
    const index = inputRefs.current.indexOf(target);
    if (target.value) {
      setOtp((prevOtp) => [
        ...prevOtp.slice(0, index),
        target.value,
        ...prevOtp.slice(index + 1),
      ]);
      if (index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!new RegExp(`^[0-9]{${otp.length}}$`).test(text)) {
      return;
    }
    const digits = text.split("");
    setOtp(digits);
  };

  const handleAddAddress = async () => {
    //console.log("Adding address:", formData);
    // Trim and validate pincode
    const trimmedPincode = formData.pincode?.trim() || "";
    if (
      trimmedPincode === "" ||
      formData.firstName?.trim() === "" ||
      formData.lastName?.trim() === "" ||
      formData.flatNumber?.trim() === "" ||
      formData.landmark?.trim() === ""
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const data =
        localStorage.getItem("address") &&
        JSON.parse(localStorage.getItem("address"));
      //console.log("checking addressData", data);

      const addressPayload = {
        user: user?._id,
        title: addressType?.trim() || "Home",
        address: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email?.trim() || "",
          phone: formData.phone?.trim() || user?.phone || "",
          pincode: trimmedPincode,
          line1: formData.flatNumber.trim(),
          line2: formData.landmark.trim(),
          landmark: formData.landmark.trim(),
          area: formData.area?.trim() || "",
          city: formData.city?.trim() || "",
          state: formData.state?.trim() || "",
        },
      };

      if (data && data._id) {
        //console.log("Updating existing address:", data._id);
        const result = await dispatch(
          updateUserAddress({
            addressId: data._id,
            addressData: addressPayload,
          })
        );
        if (result.type?.endsWith('/rejected')) {
          toast.error(result.payload?.message || "Failed to update address");
          return;
        }
        toast.success("Address updated successfully");
      } else {
        const result = await dispatch(createUserAddress(addressPayload));
        if (result.type?.endsWith('/rejected')) {
          toast.error(result.payload?.message || "Failed to create address");
          return;
        }
        toast.success("Address added successfully");
      }

      // Structure the address data to match the expected format for display
      const addressStructure = {
        title: addressType?.trim() || "Home",
        address: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email?.trim() || "",
          phone: formData.phone?.trim() || user?.phone || "",
          pincode: trimmedPincode,
          line1: formData.flatNumber.trim(),
          line2: formData.landmark.trim(),
          landmark: formData.landmark.trim(),
          area: formData.area?.trim() || "",
          city: formData.city?.trim() || "",
          state: formData.state?.trim() || "",
        },
      };
      await dispatch(setAddress(addressStructure));

      // Refresh user addresses after adding/updating
      if (isAuthenticated && user?._id) {
        try {
          const response = await dispatch(getuserAddresses(user._id));
          setUserAddresses(response.payload || []);
        } catch (error) {
          //console.error("Error fetching user addresses:", error);
        }
      }
    } catch (error) {
      console.error("Error in handleAddAddress:", error);
      toast.error("An error occurred while saving the address");
    }
  };

  const handleSelectVariant = async (productId, variantId, quantity, price) => {
    await dispatch(
      addToCart({ product: productId, variant: variantId, quantity, price })
    );
    setSelectedProduct(null);
  };

  const checkBeforePayment = async () => {
    // Validate postal code before checking
    if (!formData.pincode || formData.pincode.trim() === "") {
      toast.error("Please enter a valid postal code");
      return { success: false, message: "Postal code is required" };
    }

    try {
      const payload = {
        userId: user._id,
        paymentMode: paymentMethod === "cod" ? "COD" : "Prepaid",
        items: buyNowProduct
          ? [
            {
              product:
                buyNowProduct.product?._id || buyNowProduct.product?.id,
              quantity: buyNowProduct.quantity,
              price: buyNowProduct.price,
              variant: buyNowProduct.variant,
            },
          ]
          : cartItems.map((item) => ({
            product: item.product?._id || item.product?.id,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant,
          })),
        total: buyNowProduct?.price || total,
        shippingAddress: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          addressLine1: formData.flatNumber,
          addressLine2: formData.landmark,
          city: formData.city,
          state: formData.state,
          postalCode: formData.pincode.trim(),
          country: formData.country || "India",
          phoneNumber: formData.phone,
        },
        billingAddress: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          addressLine1: formData.flatNumber,
          addressLine2: formData.landmark,
          city: formData.city,
          state: formData.state,
          postalCode: formData.pincode.trim(),
          country: formData.country || "India",
          phoneNumber: formData.phone,
        },
        deliveryOption: "standard_delivery",
      };

      // Calculate items total for backend (which expects 'total' as subtotal/itemsTotal)
      const currentItemsTotal = buyNowProduct
        ? buyNowProduct.price * buyNowProduct.quantity
        : cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      payload.total = currentItemsTotal;

      selectedCoupon && (payload.coupon = selectedCoupon.coupon._id);
      selectedCoupon && (payload.discount = selectedCoupon.discount);
      const response = await axiosInstance.post("/orders/check", payload);
      //console.log("check response");
      //console.log(response.data);

      return response.data;
    } catch (error) {
      //console.log("Error checking payment status:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to validate order. Please check your address details.";
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const handelPayment = async () => {
    console.log("payment function invoked");

    // Set loading state immediately when user clicks Place Order
    setPlacingOrder(true);

    // Validate postal code first
    if (!formData.pincode || formData.pincode.trim() === "") {
      toast.error("Please enter a valid postal code before placing order");
      setPlacingOrder(false);
      return;
    }

    const check = await checkBeforePayment();
    console.log("check response ", check);

    // Check if check returned an error
    if (!check || !check.success) {
      const errorMessage = check?.message || "Order validation failed. Please check your address and try again.";
      toast.error(errorMessage);
      setPlacingOrder(false);
      return;
    }

    // Additional check for the specific message
    if (check.message && check.message !== "Order is valid" && !check.success) {
      // Note: toast is already shown by checking (!check || !check.success) above if checkBeforePayment didn't show it.
      // However, to be extra safe and avoid duplicates, we only show it IF it's not handled.
      setPlacingOrder(false);
      return;
    }

    console.log("check completed");
    try {
      if (paymentMethod === "prepaid") {
        const options = {
          key: "rzp_test_1DP5mmOlF5G5ag",
          amount: Math.round(total * 100), // Use the calculated total which includes everything
          currency: "INR",
          currency: "INR",
          name: "Checkout",
          description: "Slot Booking Fee",
          handler: async (response) => {
            try {
              const payload = {
                userId: user._id,
                paymentMode: paymentMethod === "cod" ? "COD" : "Prepaid",

                items: buyNowProduct
                  ? [
                    {
                      product:
                        buyNowProduct.product?._id ||
                        buyNowProduct.product?.id,
                      quantity: buyNowProduct.quantity,
                      price: buyNowProduct.price,
                      variant: buyNowProduct.variant,
                    },
                  ]
                  : cartItems.map((item) => ({
                    product: item.product?._id || item.product?.id,
                    quantity: item.quantity,
                    price: item.price,
                    variant: item.variant,
                  })),
                total: buyNowProduct?.price || total,
                paymentId: response.razorpay_payment_id,
                shippingAddress: {
                  fullName: `${formData.firstName} ${formData.lastName}`,
                  addressLine1: formData.flatNumber,
                  addressLine2: formData.landmark,
                  city: formData.city,
                  state: formData.state,
                  postalCode: formData.pincode,
                  country: formData.country || "India",
                  phoneNumber: formData.phone,
                },
                billingAddress: {
                  fullName: `${formData.firstName} ${formData.lastName}`,
                  addressLine1: formData.flatNumber,
                  addressLine2: formData.landmark,
                  city: formData.city,
                  state: formData.state,
                  postalCode: formData.pincode,
                  country: formData.country || "India",
                  phoneNumber: formData.phone,
                },
                paymentDetails: response.razorpay_payment_id,
                deliveryOption: "standard_delivery",
              };

              // Calculate items total for backend
              const currentItemsTotal = buyNowProduct
                ? buyNowProduct.price * buyNowProduct.quantity
                : cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
              payload.total = currentItemsTotal;

              selectedCoupon && (payload.coupon = selectedCoupon.coupon._id);
              selectedCoupon && (payload.discount = selectedCoupon.discount);

              console.log("Placing order with payload:", payload);
              // Loading state is already set at the start of handelPayment
              const orderResult = await dispatch(placeOrder(payload));
              console.log("Order placement result:", orderResult);

              // Check if order placement failed
              if (orderResult.type?.endsWith('/rejected') || orderResult.error) {
                console.error("Order placement rejected:", orderResult);
                const errorMessage = orderResult.payload?.message || orderResult.error?.message || "Order placement failed. Please check your address details and try again.";
                toast.error(errorMessage);
                setPlacingOrder(false);
                return;
              }

              // Check if the API returned an error response
              if (orderResult.payload && !orderResult.payload.success) {
                console.error("Order placement API error:", orderResult.payload);
                const errorMessage = orderResult.payload.message || "Order placement failed. Please check your address details and try again.";
                toast.error(errorMessage);
                setPlacingOrder(false);
                return;
              }

              // Verify order was created successfully
              if (!orderResult.payload || !orderResult.payload.success) {
                console.error("Unexpected order result format:", orderResult);
                toast.error("Order placement failed. Please try again or contact support.");
                setPlacingOrder(false);
                return;
              }

              console.log("Order placed successfully:", orderResult.payload);
              // Mark that order was placed to avoid sending abandonment event
              orderPlacedRef.current = true;

              const orderId = orderResult.payload?.data?.order?._id;
              // Redirect first to prevent page refresh issues
              router.replace(`/order-success?Order_status=success${orderId ? `&orderId=${orderId}` : ""}`);

              // Clear cart and close checkout after redirect
              setTimeout(() => {
                dispatch(setCheckoutClose());
                dispatch(clearCart());
              }, 100);
            } catch (error) {
              console.error("Error placing order:", error);
              const errorMessage = error?.response?.data?.message || error?.message || "Order placement failed. Please check your address details and try again.";
              toast.error(errorMessage);
              setPlacingOrder(false);
              // Don't redirect on error, let user fix the issue
            }
          },
          prefill: {
            email: localStorage.getItem("userEmail") || "",
            contact: "",
          },
          theme: {
            color: "#3c950d",
          },
          modal: {
            ondismiss: function () {
              toast.info("Payment cancelled");
              setPlacingOrder(false);
            },
          },
        };

        if (
          typeof window === "undefined" ||
          typeof window.Razorpay !== "function"
        ) {
          try {
            await loadRazorpayScript();
          } catch (err) {
            toast.error(
              "Payment gateway failed to load. Please try again later."
            );
            console.error("Razorpay load error", err);
            setPlacingOrder(false);
            return;
          }
        }

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        // Loading state is already set at the start of handelPayment
      } else {
        // Validate postal code for COD orders (already validated above, but keeping for safety)
        if (!formData.pincode || formData.pincode.trim() === "") {
          toast.error("Please enter a valid postal code before placing order");
          setPlacingOrder(false);
          return;
        }

        try {
          const payload = {
            userId: user._id,
            paymentMode: paymentMethod === "cod" ? "COD" : "Prepaid",
            items: buyNowProduct
              ? [
                {
                  product:
                    buyNowProduct.product?._id || buyNowProduct.product?.id,
                  quantity: buyNowProduct.quantity,
                  price: buyNowProduct.price,
                  variant: buyNowProduct.variant,
                },
              ]
              : cartItems.map((item) => ({
                product: item.product?._id || item.product?.id,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant,
              })),
            total: buyNowProduct?.price || total,
            shippingAddress: {
              fullName: `${formData.firstName} ${formData.lastName}`,
              addressLine1: formData.flatNumber,
              addressLine2: formData.landmark,
              city: formData.city,
              state: formData.state,
              postalCode: formData.pincode.trim(),
              country: formData.country || "India",
              phoneNumber: formData.phone,
            },
            billingAddress: {
              fullName: `${formData.firstName} ${formData.lastName}`,
              addressLine1: formData.flatNumber,
              addressLine2: formData.landmark,
              city: formData.city,
              state: formData.state,
              postalCode: formData.pincode.trim(),
              country: formData.country || "India",
              phoneNumber: formData.phone,
            },
            deliveryOption: "standard_delivery",
          };

          // Calculate items total for backend
          const currentItemsTotal = buyNowProduct
            ? buyNowProduct.price * buyNowProduct.quantity
            : cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
          payload.total = currentItemsTotal;

          selectedCoupon && (payload.coupon = selectedCoupon.coupon._id);
          selectedCoupon && (payload.discount = selectedCoupon.discount);

          console.log("Placing COD order with payload:", payload);
          // Loading state is already set at the start of handelPayment
          const orderResult = await dispatch(placeOrder(payload));
          console.log("COD order placement result:", orderResult);

          // Check if order placement failed
          if (orderResult.type?.endsWith('/rejected') || orderResult.error) {
            console.error("COD order placement rejected:", orderResult);
            const errorMessage = orderResult.payload?.message || orderResult.error?.message || "Order placement failed. Please check your address details and try again.";
            toast.error(errorMessage);
            setPlacingOrder(false);
            return;
          }

          // Check if the API returned an error response
          if (orderResult.payload && !orderResult.payload.success) {
            console.error("COD order placement API error:", orderResult.payload);
            const errorMessage = orderResult.payload.message || "Order placement failed. Please check your address details and try again.";
            toast.error(errorMessage);
            setPlacingOrder(false);
            return;
          }

          // Verify order was created successfully
          if (!orderResult.payload || !orderResult.payload.success) {
            console.error("Unexpected COD order result format:", orderResult);
            toast.error("Order placement failed. Please try again or contact support.");
            setPlacingOrder(false);
            return;
          }

          console.log("COD order placed successfully:", orderResult.payload);
          // Mark that order was placed to avoid sending abandonment event
          orderPlacedRef.current = true;

          const orderId = orderResult.payload?.data?.order?._id;
          // Redirect first to prevent page refresh issues
          router.replace(`/order-success?Order_status=success${orderId ? `&orderId=${orderId}` : ""}`);

          // Clear cart and close checkout after redirect
          setTimeout(() => {
            dispatch(setCheckoutClose());
            dispatch(clearCart());
          }, 100);
        } catch (error) {
          console.error("Error placing order:", error);
          const errorMessage = error?.response?.data?.message || error?.message || "Order placement failed. Please check your address details and try again.";
          toast.error(errorMessage);
          setPlacingOrder(false);
          // Don't redirect on error, let user fix the issue
        }
      }
    } catch (error) {
      console.error("Error in payment process:", error);
      setPlacingOrder(false);
    }
  };

  const checkPincode = async () => {
    setPincodeChecking(true);
    try {
      const response = await axiosInstance.post("/delivery/check-pincode", {
        orgPincode: "110001",
        desPincode: formData.pincode,
      });

      const data = await response.data;
      console.log("checkPincode response:", data);
      if (data.success) {
        toast.success("Pincode is deliverable");
        setPinCodeVerified(data);
      } else {
        toast.error("Pincode is not deliverable");
      }
    } catch (error) {
      //console.error("Error checking pincode:", error);
    } finally {
      setPincodeChecking(false);
    }
  };

  const prevPhoneRef = useRef("");

  useEffect(() => {
    // Only request OTP when phone transitions to a complete 10-digit number,
    // user is not already authenticated, and OTP hasn't been sent yet.
    if (!checkoutOpen || isAuthenticated || otpSended || loading) return;

    if (formData.phone && formData.phone.length === 10) {
      if (prevPhoneRef.current !== formData.phone) {
        dispatch(sendOtp(formData.phone));
        prevPhoneRef.current = formData.phone;
      }
    } else {
      // Reset tracker if user changes the phone number to something else or deletes a digit
      prevPhoneRef.current = "";
    }
  }, [formData.phone, dispatch, checkoutOpen, isAuthenticated, otpSended, loading]);

  // Reset tracker when OTP is cleared
  useEffect(() => {
    if (!otpSended) {
      prevPhoneRef.current = "";
    }
  }, [otpSended]);

  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      dispatch(verifyOtp({ phone: formData.phone, otp: otp.join("") }));
    }
  }, [otp, dispatch, formData.phone]);

  // Automatically sync phone from user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.phone) {
      setFormData(prev => ({
        ...prev,
        phone: user.phone
      }));
    } else if (!isAuthenticated) {
      // Optional: Clear phone if logged out, but keeping might be safer for UX if they re-login
      // setFormData(prev => ({ ...prev, phone: "" }));
    }
  }, [isAuthenticated, user?.phone]);

  useEffect(() => {
    // Only set form data from addressData if it exists and has actual data
    if (addressData && Object.keys(addressData).length > 0) {
      setFormData({
        pincode: addressData?.address?.pincode || "",
        firstName: addressData?.address?.firstName || "",
        lastName: addressData?.address?.lastName || "",
        flatNumber: addressData?.address?.line1 || "",
        area: addressData?.address?.area || "",
        landmark: addressData?.address?.line2 || "",
        city: addressData?.address?.city || "",
        state: addressData?.address?.state || "",
        email: addressData?.address?.email || "",
        addressType: addressData?.address?.addressType || "Home",
        phone: addressData?.address?.phone || "",
      });
      setAddressType(addressData?.title || "");
    }

    const fetchUserAddresses = async () => {
      if (isAuthenticated && user?._id) {
        try {
          const response = await dispatch(getuserAddresses(user._id));
          //console.log("User addresses response:", response);

          setUserAddresses(response.payload || []);
        } catch (error) {
          //console.error("Error fetching user addresses:", error);
        }
      }
    };

    fetchUserAddresses();
    loadRazorpayScript().catch((err) => {
      console.error("Failed to load Razorpay script on init:", err);
    });
  }, [addressData, isAuthenticated, user?._id, dispatch]);

  // Fetch address suggestions from Google Places API
  const fetchAddressSuggestions = async (input) => {
    if (!input) {
      setAddressSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/maps-autocomplete?type=autocomplete&input=${encodeURIComponent(
          input
        )}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        setAddressSuggestions(data.predictions);
      } else {
        setAddressSuggestions([]);
      }
    } catch (err) {
      setAddressSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  // Enhanced fetchPlaceDetails function with better address parsing
  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `/api/maps-autocomplete?type=details&placeid=${placeId}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        const comp = data.result.address_components;
        const geometry = data.result.geometry;

        // Initialize address components
        let pincode = "";
        let city = "";
        let state = "";
        let country = "";
        let area = "";
        let subarea = "";
        let route = ""; // Street name
        let streetNumber = "";
        let landmark = "";
        let formattedAddress = data.result.formatted_address || "";

        // Enhanced address component parsing
        comp.forEach((c) => {
          const types = c.types;
          if (types.includes("postal_code")) pincode = c.long_name;
          if (types.includes("locality")) city = c.long_name;
          if (types.includes("administrative_area_level_1"))
            state = c.long_name;
          if (types.includes("country")) country = c.long_name;
          if (
            types.includes("sublocality_level_1") ||
            types.includes("sublocality")
          )
            area = c.long_name;
          if (types.includes("sublocality_level_2")) subarea = c.long_name;
          if (types.includes("route")) route = c.long_name;
          if (types.includes("street_number")) streetNumber = c.long_name;
          if (
            types.includes("establishment") ||
            types.includes("point_of_interest")
          )
            landmark = c.long_name;
        });

        // Create a comprehensive address for line1 (flatNumber field)
        const addressParts = [streetNumber, route, subarea, area].filter(
          Boolean
        );

        const fullAddress = addressParts.join(", ");

        // Update form data with parsed information
        setFormData((prev) => ({
          ...prev,
          pincode,
          city,
          state,
          country,
          area: area || subarea,
          flatNumber: fullAddress,
          landmark: landmark || route || "",
        }));

        setAddressSearch(formattedAddress);
        setAddressSuggestions([]);
      }
    } catch (err) {
      //console.error("Error fetching place details:", err);
    }
  };

  const calculateShipping = () => {
    const totalValue = buyNowProduct
      ? buyNowProduct.price * buyNowProduct.quantity
      : cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    //console?.log("totalValue", totalValue);

    // Return 0 if cart is empty or totalValue is 0
    if (!totalValue || totalValue === 0) return 0;

    if (totalValue > 500) return 0;

    if (paymentMethod === "cod") {
      return settings?.codShippingChargeBelowThreshold || 80;
    } else {
      return settings?.prepaidShippingChargeBelowThreshold || 50;
    }
  };

  // Loads Razorpay SDK and returns a promise that resolves when loaded
  const loadRazorpayScript = () => {
    if (typeof window === "undefined")
      return Promise.reject(new Error("Window is undefined"));
    if (document.getElementById("razorpay-sdk")) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => {
        console.error("Failed to load Razorpay script", err);
        reject(err);
      };
      document.body.appendChild(script);
    });
  };

  // Enhanced landmarks fetching function
  const fetchLandmarkSuggestions = async (input, location = null) => {
    if (!input || input.length < 2) {
      setLandmarkSuggestions([]);
      return;
    }
    setLoadingLandmarks(true);
    try {
      const locationBias = location
        ? `&location=${location.lat},${location.lng}&radius=2000`
        : "";
      const response = await fetch(
        `/api/maps-autocomplete?type=autocomplete&input=${encodeURIComponent(
          input
        )}&types=establishment|point_of_interest${locationBias}`
      );
      const data = await response.json();
      if (data.status === "OK") {
        const landmarks = data.predictions.filter((prediction) =>
          prediction.types.some((type) =>
            [
              "establishment",
              "point_of_interest",
              "store",
              "hospital",
              "school",
              "bank",
            ].includes(type)
          )
        );
        setLandmarkSuggestions(landmarks);
      } else {
        setLandmarkSuggestions([]);
      }
    } catch (err) {
      //console.error("Error fetching landmark suggestions:", err);
      setLandmarkSuggestions([]);
    }
    setLoadingLandmarks(false);
  };

  useEffect(() => {
    setMounted(true);
    dispatch(restoreCartState());
    dispatch(fetchAddons());
    dispatch(fetchPages());
    // Settings are already fetched and cached by ClientLayout - no need to fetch again

    // Refresh cart items from server/localStorage on mount to prevent 0 cart value on refresh
    dispatch(getCartItems());

    // Handle Buy Now query params if present and redux state is empty
    const isBuyNow = searchParams.get("buyNow") === "true";
    const qProductId = searchParams.get("productId");
    const qVariantId = searchParams.get("variantId");
    const qQuantity = searchParams.get("quantity");

    if (isBuyNow && qProductId && qVariantId) {
      dispatch(initializeBuyNowFromQuery({
        productId: qProductId,
        variantId: qVariantId,
        quantity: qQuantity || 1
      }));
    }
  }, [dispatch, searchParams]);

  // Calculate bill values
  const itemsTotal = buyNowProduct
    ? (Number(buyNowProduct.price || 0) * Number(buyNowProduct.quantity || 1))
    : (cartItems?.length > 0 ? cartItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0) : 0);



  // Calculate product discount (original price - sale price)
  const productDiscount = buyNowProduct
    ? 0 // For buy now, we'll need the original price if available
    : cartItems.reduce((acc, item) => {
      // Assuming item has originalPrice or we calculate from product data
      const originalPrice = item.product?.variants?.find(v => v._id == item.variant)?.price || item.price;
      const salePrice = item.product?.variants?.find(v => v._id == item.variant)?.salePrice || item.price;
      const itemDiscount = originalPrice > salePrice ? (originalPrice - salePrice) * item.quantity : 0;
      return acc + itemDiscount;
    }, 0);

  const shipping = calculateShipping();
  const couponDiscount = selectedCoupon?.discount || 0;

  // GST & PG
  const gstPercent = settings?.gstCharge || 0;
  const pgPercent = settings?.paymentGatewayCharge || 0;

  // Calculate Prepaid Discount
  let prepaidDiscount = 0;
  if (paymentMethod === 'prepaid' && settings?.prepaidDiscountEnabled) {
    if (settings.prepaidDiscountType === 'percentage') {
      prepaidDiscount = (itemsTotal * settings.prepaidDiscountValue) / 100;
    } else if (settings.prepaidDiscountType === 'amount') {
      prepaidDiscount = settings.prepaidDiscountValue;
    }
  }

  const taxableAmount = Math.max(0, itemsTotal - couponDiscount - prepaidDiscount);
  const gstAmount = (taxableAmount * gstPercent) / 100;

  let pgAmount = 0;
  if (paymentMethod === 'prepaid') {
    pgAmount = ((taxableAmount + shipping + gstAmount) * pgPercent) / 100;
  }

  const subtotal = itemsTotal - couponDiscount - prepaidDiscount;
  const total = taxableAmount + shipping + gstAmount;

  // --- COD disable logic based on category ---
  // Helper to get all category IDs from cart/buyNowProduct
  const getCartCategoryIds = () => {
    if (buyNowProduct) {
      return [buyNowProduct.product?.category?._id || buyNowProduct.product?.category];
    }
    return (cartItems || []).map(
      (item) => item.product?.category?._id || item.product?.category
    );
  };

  // Check if any category in cart is disabled for COD
  const isCODDisabledForCart = (() => {
    if (!settings?.categoryPaymentSettings?.length) return false;
    const cartCategoryIds = getCartCategoryIds().filter(Boolean);
    return cartCategoryIds.some((catId) =>
      settings.categoryPaymentSettings.some(
        (cps) =>
          cps.categoryId?.toString() === catId?.toString() && cps.disableCOD
      )
    );
  })();

  // Only run when checkoutOpen changes so we don't accidentally send on unrelated updates
  useEffect(() => {
    // If popup just opened, reset the placed flag for the new session
    if (checkoutOpen) {
      orderPlacedRef.current = false;
      // If we're on the /checkout page, redirect to home to avoid showing checkout page in background
      if (location === "/checkout") {
        router.push("/");
      }
      // Prevent body scroll when popup is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll when popup closes
      document.body.style.overflow = "";

      // If we're on checkout-popup page and popup closes, redirect to home
      // Only redirect if an order wasn't just placed to avoid race conditions during redirect to success page
      if (location === "/checkout-popup" && !orderPlacedRef.current) {
        router.push("/");
      }
    }

    // detect true -> false transition (popup closing)
    if (prevCheckoutOpen.current && !checkoutOpen) {
      if (!orderPlacedRef.current) {
        const productIds = buyNowProduct
          ? [buyNowProduct.product.id]
          : (cartItems || []).map((it) => it.product.id);

        const eventPayload = {
          type: "CHECKOUT_ABANDONED",
          productIds,
          user: isAuthenticated
            ? {
              _id: user?._id,
              email: user?.email,
              phone: user?.phone,
              name: user?.name,
            }
            : null,
          timestamp: new Date().toISOString(),
        };

        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        }).catch((err) => {
          //console.error("Failed to send checkout abandoned event:", err);
        });
      }
      // Note: We DO NOT reset orderPlacedRef.current = false here because it needs to persist 
      // until the next time checkoutOpen becomes true. This prevents the "redirect to home" logic 
      // in the layout's instance from firing during navigation to the success page.
    }

    prevCheckoutOpen.current = checkoutOpen;

    // Cleanup: restore body scroll on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [checkoutOpen, location, router]);

  // Helper to extract error message from rejectWithValue / thrown Error
  const extractErrorMessage = (err) => {
    if (!err) return "Something went wrong";
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (err?.data?.message) return err.data.message;
    if (err?.payload?.message) return err.payload.message;
    return JSON.stringify(err);
  };

  // Helper to find Terms and Conditions page
  const getTermsPageUrl = () => {
    if (!pagesList || !Array.isArray(pagesList)) return null;

    for (const group of pagesList) {
      if (group.pages && Array.isArray(group.pages)) {
        const termsPage = group.pages.find(
          (page) =>
            page.title &&
            (page.title.toLowerCase().includes("terms") ||
              page.title.toLowerCase().includes("t&c") ||
              page.title.toLowerCase().includes("terms and conditions"))
        );

        if (termsPage) {
          return termsPage.redirectBySlug
            ? `/${termsPage.slug}`
            : `/pages/${termsPage._id}`;
        }
      }
    }
    return null;
  };

  // If we're on the checkout-popup page, always show the popup (don't check checkoutOpen)
  const isCheckoutPopupPage = location === "/checkout-popup";

  if (!checkoutOpen && !isCheckoutPopupPage) return null;

  return (
    <div className={`fixed inset-0 text-black bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4`} onClick={(e) => {
      if (e.target === e.currentTarget) {
        dispatch(setCheckoutClose());
        if (isCheckoutPopupPage) {
          router.push("/");
        }
      }
    }}>
      <div className={`bg-[#f5f6fb] shadow-xl w-full max-w-lg h-[90vh] max-h-[90vh] overflow-y-auto rounded-lg`}>
        {/* Header */}
        <div className="px-4 py-3 bg-white rounded-t-lg relative">
          <button
            onClick={() => {
              dispatch(setCheckoutClose());
              if (isCheckoutPopupPage) {
                router.push("/");
              }
            }}
            className="absolute left-4 top-4 text-black rounded-full p-1"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-center text-lg font-semibold">Checkout</h1>
        </div>

        {/* Offer Banner */}
        <div className="bg-green-100 text-black text-center py-2 px-4 text-xs font-medium rounded-b-lg">
          Get Flat 5% Off On All Prepaid Orders
        </div>

        <div className="p-4 space-y-4">
          {/* Order Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center rounded-xl bg-white py-3 px-4">
              <h2 className="text-md font-medium">
                Order summary{" "}
                <span className="text-gray-600">
                  ({buyNowProduct ? 1 : cartItems?.length} item)
                </span>
              </h2>
              <span className="text-sm font-medium">
                ₹
                {buyNowProduct
                  ? buyNowProduct.price * buyNowProduct.quantity
                  : (cartItems?.length > 0 ? (total - (selectedCoupon?.discount || 0)).toFixed(2) : "0.00")}
              </span>
            </div>

            {/* Coupon Code */}
            {selectedCoupon ? (
              <div className="flex gap-2  justify-between items-center rounded-xl bg-white py-3 px-4">
                <div className="flex-1 relative ">
                  <h2 className="text-xs">
                    Code :{" "}
                    <span className="font-semibold">
                      {selectedCoupon.coupon?.code}
                    </span>
                  </h2>
                  <h2>
                    Discount :{" "}
                    <span className="font-semibold">
                      ₹{selectedCoupon?.discount}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => {
                    dispatch(clearSelectedCoupon());
                    toast.info("Coupon removed");
                  }}
                  className="px-2 py-2 text-blue-600 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2  justify-between items-center rounded-xl bg-white py-3 px-4">
                <div className="flex-1 relative ">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 greenOne rounded-full text-white text-xs flex items-center justify-center">
                      %
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border-black/5 border-2 outline-none"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!couponCode || couponCode.trim() === "") {
                      toast.error("Please enter a coupon code");
                      return;
                    }

                    // Build cartItems payload expected by CouponService — prefer product._id
                    const itemsToSend = buyNowProduct
                      ? [
                        {
                          productId:
                            buyNowProduct.product?._id ||
                            buyNowProduct.product?.id,
                          price: Number(buyNowProduct.price || 0),
                          quantity: Number(buyNowProduct.quantity || 1),
                        },
                      ]
                      : (cartItems || []).map((item) => ({
                        productId: item.product?._id || item.product?.id,
                        price: Number(item.price || 0),
                        quantity: Number(item.quantity || 1),
                        actualPrice:
                          item.actualPrice !== undefined
                            ? Number(item.actualPrice)
                            : undefined,
                      }));

                    try {
                      const action = await dispatch(
                        applyCoupon({
                          code: couponCode.trim(),
                          total,
                          cartItems: itemsToSend,
                          paymentMethod,
                        })
                      ).unwrap();
                      toast.success("Coupon applied");
                      setCouponCode("");
                    } catch (err) {
                      const msg = extractErrorMessage(err);
                      toast.error(msg);
                    }
                  }}
                  className="px-2 py-2 text-blue-600 text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Items You May Like */}

          {!isAuthenticated && (
            <div className="flex  mt-6 flex-col justify-center gap-1 px-6">
              <h2 className="font-semibold text-center">
                {otpSended ? "Verify phone number" : "Enter mobile number"}
              </h2>
              <div className="text-xs text-center mb-2">
                {otpSended ? (
                  <div className="flex items-center justify-center gap-2">
                    Enter OTP sent to{" "}
                    <span className="font-semibold">
                      {formData.phone || "+91 9725398484"}
                    </span>
                    <div
                      onClick={() => {
                        setFormData({ ...formData, phone: "" });
                        setOtp(Array(6).fill(""));
                        dispatch(setOtpSended(false));
                      }}
                      className="h-fit ml-4  w-fit border-[1.2px] border-gray-300 rounded-md flex items-center justify-center"
                    >
                      <PencilLine size={12} className="m-1 text-blue-500" />
                    </div>
                  </div>
                ) : (
                  <h2>An OTP has been sent to your mobile number</h2>
                )}
              </div>

              {otpSended ? (
                <div>
                  <div
                    className={`${loading && "opacity-40"
                      } mt-2 flex justify-center items-center gap-2`}
                  >
                    <form id="otp-form" className="flex gap-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={handleInput}
                          onKeyDown={handleKeyDown}
                          onFocus={handleFocus}
                          onPaste={handlePaste}
                          disabled={loading}
                          ref={(el) => (inputRefs.current[index] = el)}
                          className="shadow-xs flex w-[50px] h-[50px] items-center justify-center rounded-lg border-[1px] border-gray-300 border-stroke bg-white p-2 text-center text-xl font-medium text-gray-5 outline-none sm:text-4xl dark:border-dark-3 dark:bg-white/5"
                        />
                      ))}
                      {/* You can conditionally render a submit button here based on otp length */}
                    </form>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm mt-4">
                    <span>OTP sent to</span>
                    <span className="font-semibold">{formData.phone}</span>
                    <button
                      onClick={() => {
                        dispatch(setOtpSended(false));
                      }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit Number
                    </button>
                  </div>

                  <h2 className="text-xs mt-4 text-center">
                    Resend OTP via{" "}
                    <span
                      onClick={() => {
                        dispatch(sendOtp(formData.phone));
                      }}
                      className="ml-2 rounded-sm font-semibold cursor-pointer text-blue-500 px-1 border-1 border-blue-500"
                    >
                      SMS
                    </span>
                  </h2>

                  <div className=" flex items-center justify-center mt-4">
                    <input
                      type="checkbox"
                      id="keepLoggedIn"
                      className="mr-2 h-4 w-4"
                      onChange={() => setIsLogged(!isLogged)}
                    />

                    <label
                      htmlFor="keepLoggedIn"
                      className="text-xs font-medium"
                    >
                      Keep me logged in on this device.
                    </label>
                  </div>

                  {loading && (
                    <div className="mt-4">
                      <Loading />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    className={`relative  group w-full flex bg-white  py-0 h-11 border-[1px] ${activeField === "phone"
                      ? "border-blue-600"
                      : "border-gray-300"
                      } rounded-md`}
                  >
                    <div
                      className={`${loading && "opacity-40"
                        } border-r-[1px] w-fit px-4 h-full flex justify-center items-center border-gray-2400`}
                    >
                      +91
                    </div>

                    <input
                      type="text"
                      name="phone"
                      placeholder="10 digit mobile number"
                      value={formData.phone}
                      disabled={loading}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("phone")}
                      onBlur={() => setActiveField(null)}
                      className={`${loading && "opacity-40"
                        } outline-none text-md  px-4 w-full border-0 h-full `}
                    />
                  </div>
                  {formData.phone.length === 10 && !loading && !otpSended && (
                    <button
                      onClick={() => dispatch(sendOtp(formData.phone))}
                      className="mt-2 w-full text-xs text-blue-600 font-medium hover:underline text-center animate-pulse"
                    >
                      Wait for OTP OR Click here to send manually
                    </button>
                  )}
                  {loading && (
                    <div className="mt-4">
                      <Loading />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {isAuthenticated && (
            <div className="space-y-3 rounded-xl bg-white py-3 px-4">
              <h3 className="font-semibold text-md">Items </h3>
              {buyNowProduct ? (
                <div className="flex gap-3 w-full overflow-x-scroll">
                  <div className="rel flex border-[1px] border-black/10 gap-2 rounded-lg p-3">
                    <div className="w-14 h-full  rounded-sm overflow-hidden mb-2 flex items-center justify-center">
                      {(() => {
                        // Find the selected variant to check if it has its own image
                        const selectedVariant = buyNowProduct?.product?.variants?.find(
                          (v) => v._id === buyNowProduct?.variant || v.id === buyNowProduct?.variant
                        );

                        // Prioritize variant image, then product images
                        const imageSource =
                          (selectedVariant?.images?.[0]) ||
                          buyNowProduct?.product?.image ||
                          buyNowProduct?.product?.thumbnail ||
                          buyNowProduct?.product?.images?.[0] ||
                          "/Image-not-found.png";

                        const imageAlt =
                          buyNowProduct?.product?.name ||
                          "Product";

                        return (
                          <Image
                            src={getImageUrl(imageSource)}
                            alt={imageAlt}
                            width={56}
                            height={64}
                            className="object-cover h-full w-full"
                          />
                        );
                      })()}
                    </div>
                    <div className="w-fit">
                      <p className="text-xs w-40 text-gray-600 mb-1">
                        {buyNowProduct?.product?.name} X{" "}
                        {buyNowProduct?.quantity}
                      </p>
                      <span className="font-extrabold text-sm ">
                        ₹
                        {parseFloat(buyNowProduct?.price) *
                          parseFloat(buyNowProduct?.quantity).toFixed(2)}
                      </span>
                      {buyNowProduct?.product?.variants?.length > 0 && (
                        <button
                          onClick={() => setShowVariantModal({ type: 'buyNow', product: buyNowProduct.product, selectedVariant: buyNowProduct.variant })}
                          className="flex w-fit ml-auto -mt-3 items-center gap-1 font-medium rounded-sm px-1 py-[2px] border-[1.5px] border-blue-600 text-blue-600 text-xs cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          <h3>{buyNowProduct.product.variants.length} {buyNowProduct.product.variants.length === 1 ? 'option' : 'options'}</h3>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 w-full overflow-x-scroll">
                  {/* Product 1 */}
                  {cartItems?.length > 0 &&
                    cartItems.map((item, index) => (
                      <div
                        key={index}
                        className="rel flex border-[1px] border-black/10 gap-2 rounded-lg p-3"
                      >
                        <div className="w-14 h-full  rounded-sm overflow-hidden mb-2 flex items-center justify-center">
                          {(() => {
                            // Find the selected variant to check if it has its own image
                            const selectedVariant = item?.product?.variants?.find(
                              (v) => v._id === item?.variant || v.id === item?.variant
                            );

                            // Prioritize variant image, then product images
                            const imageSource =
                              (selectedVariant?.images?.[0]) ||
                              item?.product?.thumbnail ||
                              item?.product?.images?.[0] ||
                              item?.product?.image ||
                              "/Image-not-found.png";

                            const imageAlt =
                              item?.product?.name ||
                              "Product";

                            return (
                              <Image
                                src={getImageUrl(imageSource)}
                                alt={imageAlt}
                                width={56}
                                height={64}
                                className="object-cover h-full w-full"
                              />
                            );
                          })()}
                        </div>
                        <div className="w-fit">
                          <p className="text-xs w-40 text-gray-600 mb-1">
                            {item?.product?.name} X {item?.quantity}
                          </p>
                          <span className="font-extrabold text-sm ">
                            ₹
                            {parseFloat(item?.price) *
                              parseFloat(item?.quantity).toFixed(2)}
                          </span>
                          {item?.product?.variants?.length > 0 && (
                            <button
                              onClick={() => setShowVariantModal({ type: 'cart', product: item.product, selectedVariant: item.variant, cartItem: item, index: index })}
                              className="flex w-fit ml-auto -mt-3 items-center gap-1 font-medium rounded-sm px-1 py-[2px] border-[1.5px] border-blue-600 text-blue-600 text-xs cursor-pointer hover:bg-blue-50 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              <h3>{item.product.variants.length} {item.product.variants.length === 1 ? 'option' : 'options'}</h3>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {/* Add Shipping Address */}
          {isAuthenticated && (
            <div>
              {addressAdded ? (
                <div className="space-y-4 rounded-xl bg-white py-3 px-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold mb-4">Delivery details</h3>
                    <h2
                      className="text-blue-600 text-sm font-medium cursor-pointer"
                      onClick={() => {
                        dispatch(resetAddress());
                        // localStorage.removeItem("address");
                        // setFormData({
                        //   pincode: "",
                        //   firstName: "",
                        //   lastName: "",
                        //   flatNumber: "",
                        //   area: "",
                        //   landmark: "",
                        //   city: "",
                        //   state: "",
                        //   email: "",
                        //   addressType: "Home",
                        //   phone: user?.phone || "",
                        // });
                      }}
                    >
                      Change
                    </h2>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="font-semibold">
                        {(addressData?.address?.firstName || "") +
                          " " +
                          (addressData?.address?.lastName || "")}
                      </h2>
                      <h2 className="bg-blue-300 px-1 text-xs rounded-full font-medium">
                        {addressData?.title || "Home"}
                      </h2>
                    </div>
                    <p>
                      {[
                        addressData?.address?.line1,
                        addressData?.address?.line2,
                        addressData?.address?.city,
                        addressData?.address?.state,
                        addressData?.address?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <div className="flex items-center gap-4 mt-2  text-black/80">
                      <div className="flex items-center gap-2 mb-2">
                        <PhoneCall className="h-3 w-3" />
                        <h2>
                          {addressData?.address?.phone || user?.phone || ""}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-3 w-3" />
                        <h2>{addressData?.address?.email || ""}</h2>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl bg-white py-3 px-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold ">Add shipping address</h3>
                    <select
                      onChange={(e) => handleSelectAddress(e.target.value)}
                      className="text-sm w-1/3 font-medium text-black px-2 py-1 border rounded-md cursor-pointer outline-none"
                      defaultValue="default"
                    >
                      <option value="default" disabled>
                        Select Address
                      </option>
                      {userAddresses?.length > 0 &&
                        userAddresses.map((address, index) => (
                          <option
                            key={index}
                            className="outline-none border-none"
                            value={index}
                          >
                            {address.title || `Address ${index + 1}`}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div
                    className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "firstName"
                      ? "border-blue-600"
                      : "border-gray-300"
                      } rounded-md`}
                  >
                    <h2
                      className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "firstName" || formData.firstName !== ""
                        ? "-translate-y-6"
                        : "translate-y-0"
                        }`}
                    >
                      First Name{" "}
                      <span
                        className={
                          activeField === "firstName"
                            ? "text-red-500"
                            : "text-black"
                        }
                      >
                        *
                      </span>
                    </h2>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("firstName")}
                      onBlur={() => setActiveField(null)}
                      className="outline-none text-md   w-full border-0 h-full "
                    />
                  </div>

                  <div
                    className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "lastName"
                      ? "border-blue-600"
                      : "border-gray-300"
                      } rounded-md`}
                  >
                    <h2
                      className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "lastName" || formData.lastName !== ""
                        ? "-translate-y-6"
                        : "translate-y-0"
                        }`}
                    >
                      Last Name{" "}
                      <span
                        className={
                          activeField === "lastName"
                            ? "text-red-500"
                            : "text-black"
                        }
                      >
                        *
                      </span>
                    </h2>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("lastName")}
                      onBlur={() => setActiveField(null)}
                      className="outline-none text-md   w-full border-0 h-full "
                    />
                  </div>

                  <div
                    className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "flatNumber"
                      ? "border-blue-600"
                      : "border-gray-300"
                      } rounded-md`}
                  >
                    <h2
                      className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "flatNumber" ||
                        formData.flatNumber !== ""
                        ? "-translate-y-6"
                        : "translate-y-0"
                        }`}
                    >
                      Flat, house number, floor, building{" "}
                      <span
                        className={
                          activeField === "flatNumber"
                            ? "text-red-500"
                            : "text-black"
                        }
                      >
                        *
                      </span>
                    </h2>
                    <input
                      type="text"
                      name="flatNumber"
                      value={formData.flatNumber}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("flatNumber")}
                      onBlur={() => setActiveField(null)}
                      className="outline-none text-md   w-full border-0 h-full "
                    />
                  </div>

                  <div
                    className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "area"
                      ? "border-blue-600"
                      : "border-gray-300"
                      } rounded-md`}
                  >
                    <h2
                      className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "area" || addressSearch !== ""
                        ? "-translate-y-6"
                        : "translate-y-0"
                        }`}
                    >
                      Search Full Address (Google Maps)
                      <span
                        className={
                          activeField === "area" ? "text-red-500" : "text-black"
                        }
                      >
                        *
                      </span>
                    </h2>
                    <input
                      type="text"
                      value={addressSearch}
                      onChange={(e) => {
                        setAddressSearch(e.target.value);
                        fetchAddressSuggestions(e.target.value);
                      }}
                      onFocus={() => setActiveField("area")}
                      onBlur={() => {
                        setTimeout(() => setActiveField(null), 200);
                      }}
                      className="outline-none text-md w-full border-0 h-full"
                      placeholder="Search your complete address..."
                      autoComplete="off"
                    />
                    {loadingSuggestions && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-200 z-20 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-500">
                            Searching addresses...
                          </span>
                        </div>
                      </div>
                    )}
                    {addressSuggestions.length > 0 && (
                      <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                        {addressSuggestions.map((sugg) => (
                          <li
                            key={sugg.place_id}
                            className="px-3 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              fetchPlaceDetails(sugg.place_id);
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <MapPin
                                size={16}
                                className="text-gray-400 mt-1 flex-shrink-0"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {sugg.structured_formatting?.main_text}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {sugg.structured_formatting?.secondary_text}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div
                    className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "landmark"
                      ? "border-blue-600"
                      : "border-gray-300"
                      } rounded-md`}
                  >
                    <h2
                      className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "landmark" || formData.landmark !== ""
                        ? "-translate-y-6"
                        : "translate-y-0"
                        }`}
                    >
                      Nearby Landmark
                      <span
                        className={
                          activeField === "landmark"
                            ? "text-red-500"
                            : "text-black"
                        }
                      >
                        *
                      </span>
                    </h2>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Fetch landmark suggestions based on current location
                        if (formData.city && formData.state) {
                          fetchLandmarkSuggestions(e.target.value, {
                            lat: 21.1702, // Replace with actual lat/lng from selected address if available
                            lng: 72.8311,
                          });
                        }
                      }}
                      onFocus={() => setActiveField("landmark")}
                      onBlur={() => {
                        setTimeout(() => setActiveField(null), 200);
                      }}
                      className="outline-none text-md z-10 w-full border-0 h-full"
                      placeholder="e.g., Near City Mall, Behind School"
                    />
                    {loadingLandmarks && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-200 z-20 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-500">
                            Finding landmarks...
                          </span>
                        </div>
                      </div>
                    )}
                    {landmarkSuggestions.length > 0 &&
                      activeField === "landmark" && (
                        <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-md shadow-lg z-20 max-h-48 overflow-y-auto">
                          {landmarkSuggestions.map((landmark) => (
                            <li
                              key={landmark.place_id}
                              className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData((prev) => ({
                                  ...prev,
                                  landmark:
                                    landmark.structured_formatting?.main_text ||
                                    landmark.description,
                                }));
                                setLandmarkSuggestions([]);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {landmark.structured_formatting?.main_text}
                                  </p>
                                  {landmark.structured_formatting
                                    ?.secondary_text && (
                                      <p className="text-xs text-gray-500">
                                        {
                                          landmark.structured_formatting
                                            .secondary_text
                                        }
                                      </p>
                                    )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "city"
                        ? "border-blue-600"
                        : "border-gray-300"
                        } rounded-md`}
                    >
                      <h2
                        className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "city" || formData.city !== ""
                          ? "-translate-y-6"
                          : "translate-y-0"
                          }`}
                      >
                        City{" "}
                        <span
                          className={
                            activeField === "city"
                              ? "text-red-500"
                              : "text-black"
                          }
                        >
                          *
                        </span>
                      </h2>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("city")}
                        onBlur={() => setActiveField(null)}
                        className="outline-none text-md   w-full border-0 h-full "
                      />
                    </div>

                    <div
                      className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "state"
                        ? "border-blue-600"
                        : "border-gray-300"
                        } rounded-md`}
                    >
                      <h2
                        className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "state" || formData.state !== ""
                          ? "-translate-y-6"
                          : "translate-y-0"
                          }`}
                      >
                        State{" "}
                        <span
                          className={
                            activeField === "state"
                              ? "text-red-500"
                              : "text-black"
                          }
                        >
                          *
                        </span>
                      </h2>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("state")}
                        onBlur={() => setActiveField(null)}
                        className="outline-none text-md   w-full border-0 h-full "
                      />
                    </div>
                    <div
                      className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "pincode"
                        ? "border-blue-600"
                        : "border-gray-300"
                        } rounded-md`}
                    >
                      <h2
                        className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "pincode" || formData.pincode !== ""
                          ? "-translate-y-6"
                          : "translate-y-0"
                          }`}
                      >
                        Pincode{" "}
                        <span
                          className={
                            activeField === "pincode"
                              ? "text-red-500"
                              : "text-black"
                          }
                        >
                          *
                        </span>
                      </h2>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("pincode")}
                        onBlur={() => setActiveField(null)}
                        maxLength={10}
                        className="outline-none text-md   w-full border-0 h-full "
                      />
                    </div>
                  </div>



                  <div
                    className={`relative group w-full px-3 py-0 h-11 border-[1px] ${activeField === "email"
                      ? "border-blue-600"
                      : "border-gray-300"
                      } rounded-md`}
                  >
                    <h2
                      className={`absolute top-3 text-[14px]  transition-all duration-200 bg-white px-2 ${activeField === "email" || formData.email !== ""
                        ? "-translate-y-6"
                        : "translate-y-0"
                        }`}
                    >
                      Email (optional){" "}
                    </h2>
                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("email")}
                      onBlur={() => setActiveField(null)}
                      className="outline-none text-md   w-full border-0 h-full "
                    />
                    <p className="text-xs mt-1 -ml-3 text-gray-500">
                      Order delivery details will be sent here
                    </p>
                  </div>

                  {/* Address Type */}
                  <div className="space-y-2 text-sm font-medium mt-10">
                    <h4 className="font-medium text-xs">Address type</h4>
                    <div>
                      <input
                        type="text"
                        value={addressType}
                        onChange={(e) => setAddressType(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300  rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddAddress}
                    className="w-full mt-4 mb-4 text-sm greenTwo text-white py-3 rounded-md hover:opacity-90 transition-colors "
                  >
                    Add address
                  </button>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && (
            <div className="space-y-4 rounded-xl bg-white py-3 px-4">
              <h3 className="font-semibold mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* UPI/Card Option */}
                <div
                  onClick={() => setPaymentMethod("prepaid")}
                  className={`border-2 ${paymentMethod === "prepaid" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"} rounded-lg p-3 cursor-pointer relative transition-all hover:border-gray-300`}
                >
                  <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 ${paymentMethod === "prepaid" ? "border-green-500" : "border-gray-300"} bg-white flex items-center justify-center`}>
                    {paymentMethod === "prepaid" && <div className="w-3 h-3 rounded-full greenOne"></div>}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    ⚡ UPI / Card
                  </div>
                  <div className="text-xs text-gray-600 leading-tight mb-2">
                    Pay securely with UPI, Credit/Debit Card, or Netbanking
                  </div>
                  {settings?.prepaidDiscountEnabled && settings?.prepaidDiscountValue > 0 && (
                    <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-300 text-green-800 text-xs px-2 py-1.5 rounded mb-2 font-semibold flex items-center gap-1">
                      <span className="text-base">🎉</span>
                      <span>Save ₹{(settings.prepaidDiscountType === 'percentage'
                        ? ((itemsTotal * settings.prepaidDiscountValue) / 100)
                        : settings.prepaidDiscountValue
                      ).toFixed(0)} ({settings.prepaidDiscountType === 'percentage' ? `${settings.prepaidDiscountValue}% OFF` : 'Flat OFF'})</span>
                    </div>
                  )}
                  <div className="mt-2">
                    {settings?.prepaidDiscountEnabled && settings?.prepaidDiscountValue > 0 ? (
                      <div>
                        <div className="text-xs text-gray-500 line-through">
                          ₹{(itemsTotal - couponDiscount + shipping + gstAmount).toFixed(2)}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{total.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-green-600">
                        ₹{total.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                {!isCODDisabledForCart && (
                  <div
                    onClick={() => {
                      if (cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0) <= settings?.codLimit) {
                        setPaymentMethod("cod");
                      }
                    }}
                    className={`border-2 ${paymentMethod === "cod" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"} rounded-lg p-3 cursor-pointer relative transition-all hover:border-gray-300 ${cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0) > settings?.codLimit && "opacity-50 cursor-not-allowed"
                      }`}
                  >
                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 ${paymentMethod === "cod" ? "border-green-500" : "border-gray-300"} bg-white flex items-center justify-center`}>
                      {paymentMethod === "cod" && <div className="w-3 h-3 rounded-full greenOne"></div>}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      💵 Cash on Delivery
                    </div>
                    <div className="text-xs text-gray-600 leading-tight mb-2">
                      Pay with cash when your order is delivered to you
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-2">
                      ₹{(itemsTotal - couponDiscount + shipping + gstAmount).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Messages */}
              {isCODDisabledForCart && (
                <h2 className="text-red-500 text-xs mt-2">
                  Cash on delivery is not available for one or more items in your cart.
                </h2>
              )}
              {!isCODDisabledForCart &&
                cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0) > settings?.codLimit && (
                  <h2 className="text-red-500 text-xs mt-2">
                    COD not available for orders above ₹{settings.codLimit}
                  </h2>
                )}
            </div>
          )}


          {isAuthenticated && (
            <div className="space-y-4 rounded-xl bg-white py-3 px-4">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <h2>Items ({buyNowProduct ? 1 : cartItems.length})</h2>
                  <h2>₹{itemsTotal}</h2>
                </div>

                <div className="flex justify-between text-sm">
                  <h2>Product Discount</h2>
                  <h2 className="font-semibold text-green-600">-₹{productDiscount.toFixed(2)}</h2>
                </div>

                <div className="flex justify-between text-sm">
                  <h2>Shipping</h2>
                  {shipping === 0 ? (
                    <h2 className="text-green-600 font-medium">Free</h2>
                  ) : (
                    "₹ " + shipping
                  )}
                </div>
                {selectedCoupon && (
                  <div className="flex justify-between text-sm">
                    <h2>
                      Coupon{" "}
                      {selectedCoupon?.code ? `(${selectedCoupon.code})` : ""}
                    </h2>
                    <h2 className="font-semibold text-green-600">-₹{couponDiscount}</h2>
                  </div>
                )}
                {prepaidDiscount > 0 && paymentMethod === 'prepaid' && (
                  <div className="flex justify-between text-sm">
                    <h2 className="flex items-center gap-1">
                      Prepaid Discount
                      {settings?.prepaidDiscountType === 'percentage' && (
                        <span className="text-green-600 font-medium">({settings.prepaidDiscountValue}%)</span>
                      )}
                    </h2>
                    <h2 className="font-semibold text-green-600">-₹{prepaidDiscount.toFixed(2)}</h2>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <h2>Subtotal</h2>
                  <h2>₹{subtotal.toFixed(2)}</h2>
                </div>
                {gstAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <h2>GST ({settings?.gstCharge}%)</h2>
                    <h2>₹{gstAmount.toFixed(2)}</h2>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t-[1.5px] border-black pt-1">
                  <h2>Total</h2>
                  <h2>₹{total.toFixed(2)}</h2>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && addressAdded && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (pinCodeVerified?.success) {
                  handelPayment();
                } else {
                  checkPincode();
                }
              }}
              disabled={placingOrder || pincodeChecking}
              className={`w-full mt-4  text-sm greenTwo text-white py-3 rounded-md  transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {placingOrder ? (
                <>
                  <LoadingSpinner />
                  <span>Placing Order...</span>
                </>
              ) : pincodeChecking ? (
                "Checking..."
              ) : pinCodeVerified?.success ? (
                `  Place Order (₹${total?.toFixed(2)})`
              ) : (
                "Check Pincode"
              )}
            </button>
          )}

          {/* Contact Info */}
          {isAuthenticated && (
            <div className="flex justify-between items-center gap-2 bg-white rounded-xl text-gray-600 py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="h-fit  w-fit border-[1.2px] border-gray-300 rounded-md flex items-center justify-center">
                  <Phone size={12} className="m-2" />
                </div>
                <span className="text-sm">+91 {user?.phone}</span>
              </div>
              <div
                onClick={() => {
                  dispatch(setAuthenticated(false));
                  dispatch(setOtpSended(false));
                }}
                className="h-fit  w-fit border-[1.2px] border-gray-300 rounded-md flex items-center justify-center"
              >
                <PencilLine size={12} className="m-1 text-blue-500" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-8 pb-4 rounded-b-lg ${!isAuthenticated && "mt-[32vh]"
            } text-xs flex justify-between mb-4 text-gray-500 text-center`}
        >
          {getTermsPageUrl() && getTermsPageUrl() !== "#" ? (
            <>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Close popup state
                  dispatch(setCheckoutClose());
                  // Navigate to terms page - this will change route and hide popup if on checkout-popup
                  const termsUrl = getTermsPageUrl();
                  if (isCheckoutPopupPage) {
                    // If on checkout-popup route, replace it with terms page
                    router.replace(termsUrl);
                  } else {
                    // Otherwise, push to terms page
                    router.push(termsUrl);
                  }
                }}
                className="hover:text-gray-700 hover:underline cursor-pointer"
              >
                T&C
              </span>
              {" | "}
            </>
          ) : (
            "T&C | "
          )}
          Privacy Policy | IGAZC5
          <br />

        </div>
      </div>

      {/* Variant Options Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowVariantModal(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Variant</h3>
              <button
                onClick={() => setShowVariantModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {showVariantModal.product?.variants?.map((variant, index) => {
                const isSelected = variant._id === showVariantModal.selectedVariant || variant._id?.toString() === showVariantModal.selectedVariant?.toString();
                const variantPrice = variant.salePrice || variant.price;
                const originalPrice = variant.salePrice ? variant.price : null;

                return (
                  <div
                    key={variant._id || index}
                    onClick={async () => {
                      if (showVariantModal.type === 'buyNow') {
                        // Update buyNowProduct variant
                        const newPrice = variant.salePrice || variant.price;
                        await dispatch(
                          addToCart({
                            product: showVariantModal.product._id,
                            variant: variant._id,
                            quantity: 1,
                            price: newPrice,
                          })
                        );
                        toast.success("Variant updated");
                      } else if (showVariantModal.type === 'cart') {
                        // Update cart item variant
                        const newPrice = variant.salePrice || variant.price;
                        await dispatch(
                          addToCart({
                            product: showVariantModal.product._id,
                            variant: variant._id,
                            quantity: showVariantModal.cartItem?.quantity || 1,
                            price: newPrice,
                          })
                        );
                        toast.success("Variant updated");
                      }
                      setShowVariantModal(null);
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm capitalize">
                          {variant.title || variant.name || `Variant ${index + 1}`}
                        </h4>
                        {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            {Object.entries(variant.attributes).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-sm text-blue-600">
                          ₹{variantPrice}
                        </div>
                        {originalPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            ₹{originalPrice}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ✓ Currently Selected
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {showVariantModal.product?.variants?.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No variants available for this product
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
