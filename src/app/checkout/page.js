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
  IndianRupee,
  CreditCard,
  Banknote,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAddressFormLocalStorage,
  placeOrder,
  resetAddress,
  setAddress,
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
import { initializeBuyNowFromQuery, getCartItems, restoreCartState } from "@/app/store/slices/cartSlice";
import { fetchProducts } from "@/app/store/slices/productSlice";
import { toast } from "react-toastify";
import { fetchSettings } from "@/app/store/slices/settingSlice";
import axiosInstance from "@/axiosConfig/axiosInstance";
import { LoadingSpinner } from "@/components/common/Loading";
import { useTrack } from "@/app/lib/tracking/useTrack";

function CheckoutPageContent() {
  // Removed checkoutOpen check - this is now a dedicated page
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
  //console.log("Settings:", settings);
  const [couponCode, setCouponCode] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const inputRefs = useRef([]); // Array of refs for each input field
  const [SelectedProduct, setSelectedProduct] = useState(null);
  const dispatch = useDispatch();
  const { trackCheckout } = useTrack();

  // Track whether an order was placed
  const orderPlacedRef = useRef(false);

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
    //console.log("Selected Address Phone:", selectedAddress.phone);
    setFormData({
      pincode: selectedAddress.pincode || "",
      firstName: selectedAddress.firstName || "",
      lastName: selectedAddress.lastName || "",
      flatNumber: selectedAddress.line1 || "",
      area: selectedAddress.area || "",
      landmark: selectedAddress.line2 || "",
      city: selectedAddress.city || "",
      state: selectedAddress.state || "",
      email: selectedAddress.email || "",
      addressType: selectedAddress.addressType || "Home",
      phone: selectedAddress.phone || user?.phone || "",
    });
    dispatch(setAddress({ ...selectedAddress, phone: user?.phone }));
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
    if (
      formData.pincode === "" ||
      formData.firstName === "" ||
      formData.lastName === "" ||
      formData.flatNumber === "" ||
      formData.landmark === ""
    ) {
      alert("Please fill all required fields");
      return;
    }
    const data =
      localStorage.getItem("address") &&
      JSON.parse(localStorage.getItem("address"));
    //console.log("checking addressData", data);
    if (data && data._id) {
      //console.log("Updating existing address:", data._id);
      await dispatch(
        updateUserAddress({
          addressId: data._id,
          addressData: {
            user: user?._id,
            title: addressType || "Home",
            address: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              pincode: formData.pincode,
              line1: formData.flatNumber,
              line2: formData.landmark,
              landmark: formData.landmark,
              city: formData.city,
              state: formData.state,
            },
          },
        })
      );
    } else {
      await dispatch(
        createUserAddress({
          user: user?._id,
          title: addressType || "Home",
          address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || user?.phone,
            pincode: formData.pincode,
            line1: formData.flatNumber,
            line2: formData.landmark,
            landmark: formData.landmark,
            city: formData.city,
            state: formData.state,
          },
        })
      );
    }
    // Structure the address data to match the expected format for display
    const addressStructure = {
      title: addressType || "Home",
      address: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || user?.phone,
        pincode: formData.pincode,
        line1: formData.flatNumber,
        line2: formData.landmark,
        landmark: formData.landmark,
        area: formData.area,
        city: formData.city,
        state: formData.state,
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
  };

  const handleSelectVariant = async (productId, variantId, quantity, price) => {
    await dispatch(
      addToCart({ product: productId, variant: variantId, quantity, price })
    );
    setSelectedProduct(null);
  };

  const checkBeforePayment = async () => {
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
      const errorMessage = error.response?.data?.message || error.message || "Order validation failed";
      return { success: false, message: errorMessage };
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
    if (!check || !check.success) {
      const errorMessage = check?.message || "Order validation failed. Please check your address and try again.";
      toast.error(errorMessage);
      setPlacingOrder(false);
      return;
    }

    // Additional check for the specific message
    if (check.message && check.message !== "Order is valid" && !check.success) {
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
          name: "Tea Box",
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
              const result = await dispatch(placeOrder(payload));
              console.log("Place order result:", result);

              // Check if order placement failed
              if (result.type?.endsWith('/rejected') || result.error) {
                console.error("Order placement failed:", result.error || result.payload);
                const errorMessage = result.payload?.message || result.error?.message || "Order placement failed. Please contact support.";
                toast.error(errorMessage);
                setPlacingOrder(false);
                return;
              }

              // Check if the API returned an error response
              if (result.payload && !result.payload.success) {
                console.error("Order placement failed:", result.payload);
                const errorMessage = result.payload.message || "Order placement failed. Please contact support.";
                toast.error(errorMessage);
                setPlacingOrder(false);
                return;
              }

              // Mark that order was placed to avoid sending abandonment event
              orderPlacedRef.current = true;

              const orderId = result.payload?.data?.order?._id;
              // Redirect first to prevent page refresh issues
              router.replace(`/order-success?Order_status=success${orderId ? `&orderId=${orderId}` : ""}`);

              // Clear cart after redirect
              setTimeout(() => {
                dispatch(clearCart());
              }, 100);
            } catch (error) {
              console.error("Error in payment handler:", error);
              toast.error(error?.message || "Order placement failed. Please contact support.");
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
      } else {
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
          setPlacingOrder(true);
          const result = await dispatch(placeOrder(payload));
          console.log("Place COD order result:", result);

          // Check if order placement failed
          if (result.type?.endsWith('/rejected') || result.error) {
            console.error("COD order placement failed:", result.error || result.payload);
            const errorMessage = result.payload?.message || result.error?.message || "Order placement failed. Please try again.";
            toast.error(errorMessage);
            setPlacingOrder(false);
            return;
          }

          // Check if the API returned an error response
          if (result.payload && !result.payload.success) {
            console.error("COD order placement failed:", result.payload);
            const errorMessage = result.payload.message || "Order placement failed. Please try again.";
            toast.error(errorMessage);
            setPlacingOrder(false);
            return;
          }

          // Mark that order was placed to avoid sending abandonment event
          orderPlacedRef.current = true;

          const orderId = result.payload?.data?.order?._id;
          // Redirect first to prevent page refresh issues
          router.replace(`/order-success?Order_status=success${orderId ? `&orderId=${orderId}` : ""}`);

          // Clear cart after redirect
          setTimeout(() => {
            dispatch(clearCart());
          }, 100);
        } catch (error) {
          console.error("Error placing COD order:", error);
          toast.error(error?.message || "Order placement failed. Please try again.");
          setPlacingOrder(false);
        }
      }
    } catch (error) {
      console.error("Error initializing Razorpay:", error);
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

  // Track previous phone to detect manual changes
  const previousPhoneRef = useRef("");
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount to avoid triggering when formData is populated from saved data
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousPhoneRef.current = formData.phone || "";
      return;
    }

    // Only send OTP if:
    // 1. User is NOT authenticated (guest checkout)
    // 2. Phone number is exactly 10 digits
    // 3. Phone number was manually changed (different from previous)
    // 4. OTP hasn't been sent already
    // 5. Phone doesn't match logged-in user's phone (if user exists)
    const phoneChanged = formData.phone !== previousPhoneRef.current;
    const isValidLength = formData.phone.length === 10;
    const isUserPhone = isAuthenticated && user?.phone === formData.phone;

    // Update previous phone reference
    previousPhoneRef.current = formData.phone || "";

    if (
      !isAuthenticated && // Only for guest users
      phoneChanged && // Phone was manually changed
      isValidLength && // Valid phone length
      !otpSended && // OTP hasn't been sent yet
      !isUserPhone // Not the logged-in user's phone
    ) {
      dispatch(sendOtp(formData.phone));
    } else if (isAuthenticated && isUserPhone) {
      // If logged-in user's phone matches, clear OTP state
      if (otpSended) {
        dispatch(setOtpSended(false));
      }
    }
  }, [formData.phone, dispatch, isAuthenticated, otpSended, user?.phone]);

  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      dispatch(verifyOtp({ phone: formData.phone, otp: otp.join("") }));
    }
  }, [otp, dispatch, formData.phone]);

  // Reset OTP state when user is authenticated (logged-in users don't need OTP)
  useEffect(() => {
    if (isAuthenticated && otpSended) {
      dispatch(setOtpSended(false));
    }
  }, [isAuthenticated, otpSended, dispatch]);

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
        phone: addressData?.address?.phone || user?.phone || "",
      });
      setAddressType(addressData?.title || "");
    }

    // If user is authenticated, populate phone from user data if not in addressData
    if (isAuthenticated && user?.phone && !formData.phone) {
      setFormData((prev) => ({
        ...prev,
        phone: user.phone || prev.phone,
      }));
    }

    const fetchUserAddresses = async () => {
      dispatch(restoreCartState());
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
  }, [addressData, isAuthenticated, user?._id, dispatch, searchParams]);

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
    dispatch(
      fetchProducts({
        isAddon: true,
      })
    );
    // Load settings only if not already present to avoid duplicate calls
    if (!settings || !settings.activeHomepageLayout) {
      dispatch(fetchSettings());
    }
  }, []);

  // Calculate bill values
  const itemsTotal = buyNowProduct
    ? buyNowProduct.price * buyNowProduct.quantity
    : (cartItems?.length > 0 ? cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0) : 0);

  const shipping = calculateShipping();
  const couponDiscount = selectedCoupon?.discount || 0;

  // GST & PG
  const gstPercent = settings?.gstCharge || 0;
  const pgPercent = settings?.paymentGatewayCharge || 0;

  const taxableAmount = Math.max(0, itemsTotal - couponDiscount);
  const gstAmount = (taxableAmount * gstPercent) / 100;

  let pgAmount = 0;
  if (paymentMethod === 'prepaid') {
    pgAmount = ((taxableAmount + shipping + gstAmount) * pgPercent) / 100;
  }

  const subtotal = itemsTotal - couponDiscount;
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

  // Helper to extract error message from rejectWithValue / thrown Error
  const extractErrorMessage = (err) => {
    if (!err) return "Something went wrong";
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (err?.data?.message) return err.data.message;
    if (err?.payload?.message) return err.payload.message;
    return JSON.stringify(err);
  };

  // Redirect to checkout-popup page instead of showing this page
  useEffect(() => {
    router.push('/checkout-popup');
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Modern Header */}
      <div className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-black hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Checkout</h1>
          </div>
          <div className="text-sm font-medium px-4 py-2 bg-black text-white rounded-md">
            Tea Box
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT COLUMN - Contact & Shipping */}
          <div className="space-y-6 order-2 lg:order-1">

            {/* 1. Contact / OTP Section */}
            {!isAuthenticated && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Enter Contact Details</h3>

                {otpSended ? (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span>Enter OTP sent to</span>
                      <span className="font-semibold">{formData.phone}</span>
                      <button
                        onClick={() => {
                          setFormData({ ...formData, phone: "" });
                          setOtp(Array(6).fill(""));
                          dispatch(setOtpSended(false));
                        }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="flex gap-2 justify-center my-4">
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
                          className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => dispatch(sendOtp(formData.phone))}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Resend OTP via SMS
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="keepLoggedIn"
                        onChange={() => setIsLogged(!isLogged)}
                        className="w-4 h-4 accent-green-600"
                      />
                      <label htmlFor="keepLoggedIn" className="text-sm text-gray-600">
                        Keep me logged in on this device
                      </label>
                    </div>

                    {loading && <Loading />}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-green-600 transition-colors">
                      <div className="px-4 py-3 bg-gray-50 border-r-2 border-gray-300 font-medium text-gray-600">
                        +91
                      </div>
                      <input
                        type="text"
                        name="phone"
                        placeholder="10 digit mobile number"
                        value={formData.phone}
                        disabled={loading}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 outline-none"
                      />
                    </div>
                    {loading && <Loading />}
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User Info */}
            {isAuthenticated && (
              <div className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Hi {user?.name || "User"},</h3>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone size={14} />
                      <span>{user?.phone}</span>
                      {user?.email && (
                        <>
                          <span>â€¢</span>
                          <span>{user.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      dispatch(setAuthenticated(false));
                      dispatch(setOtpSended(false));
                    }}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* 2. Shipping Address */}
            {isAuthenticated && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Shipping Address</h3>

                {addressAdded ? (
                  <div className="border-2 border-green-100 bg-green-50/30 rounded-lg p-4 relative">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {(addressData?.address?.firstName || "") + " " + (addressData?.address?.lastName || "")}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                            {addressData?.title || "HOME"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pr-8">
                          {[
                            addressData?.address?.line1,
                            addressData?.address?.line2,
                            addressData?.address?.city,
                            addressData?.address?.state,
                            addressData?.address?.pincode,
                          ].filter(Boolean).join(", ")}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-2">
                          <span>{addressData?.address?.phone}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => dispatch(resetAddress())}
                        className="text-blue-600 text-sm font-medium hover:underline absolute top-4 right-4"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                    {/* Address Selection Dropdown */}
                    {userAddresses?.length > 0 && (
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">SAVED ADDRESSES</label>
                        <select
                          onChange={(e) => handleSelectAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                          defaultValue="default"
                        >
                          <option value="default" disabled>Select from saved addresses</option>
                          {userAddresses.map((address, index) => (
                            <option key={index} value={index}>
                              {address.title || `Address ${index + 1}`} - {address.pincode}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Address Form */}
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name *"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none w-full"
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name *"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none w-full"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={addressSearch}
                        onChange={(e) => {
                          setAddressSearch(e.target.value);
                          fetchAddressSuggestions(e.target.value);
                        }}
                        placeholder="Search Address (Google Maps) *"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                        autoComplete="off"
                      />
                      {/* Address Suggestions Dropdown */}
                      {addressSuggestions.length > 0 && (
                        <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                          {addressSuggestions.map((sugg) => (
                            <li
                              key={sugg.place_id}
                              className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                fetchPlaceDetails(sugg.place_id);
                              }}
                            >
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{sugg.structured_formatting?.main_text}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{sugg.structured_formatting?.secondary_text}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <input
                      type="text"
                      name="flatNumber"
                      placeholder="Flat / House No / Floor *"
                      value={formData.flatNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode *"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none w-full"
                      />
                      <input
                        type="text"
                        name="landmark"
                        placeholder="Landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="city"
                        placeholder="City *"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none w-full"
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State *"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none w-full"
                      />
                    </div>

                    <input
                      type="text"
                      value={addressType}
                      onChange={(e) => setAddressType(e.target.value)}
                      placeholder="Address Type (e.g. Home, Office)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                    />

                    <button
                      onClick={handleAddAddress}
                      className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Save Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. Payment Method */}
            {isAuthenticated && addressAdded && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Payment Method</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod("prepaid")}
                    className={`p-4 border-2 rounded-xl text-left transition-all relative overflow-hidden ${paymentMethod === "prepaid"
                      ? "border-green-600 bg-green-50/50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl"><CreditCard size={24} /></span>
                      <span className="font-semibold">UPI / Card</span>
                    </div>
                    <p className="text-xs text-gray-500">Pay securely with UPI, Credit/Debit Card, or Netbanking</p>
                    {paymentMethod === "prepaid" && (
                      <div className="absolute top-4 right-4 w-4 h-4 greenOne rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>

                  <button
                    disabled={isCODDisabledForCart}
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-4 border-2 rounded-xl text-left transition-all relative overflow-hidden ${paymentMethod === "cod"
                      ? "border-green-600 bg-green-50/50"
                      : "border-gray-200 hover:border-gray-300"
                      } ${isCODDisabledForCart ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl"><Banknote size={24} /></span>
                      <span className="font-semibold">Cash on Delivery</span>
                    </div>
                    <p className="text-xs text-gray-500">Pay with cash when your order is delivered to you</p>
                    {paymentMethod === "cod" && (
                      <div className="absolute top-4 right-4 w-4 h-4 greenOne rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                </div>

                {isCODDisabledForCart && (
                  <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex gap-2 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    COD is not available for this order
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-lg">Order Summary</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Items List */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {buyNowProduct ? (
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                        <Image
                          src={buyNowProduct?.product?.image?.url || buyNowProduct?.product?.thumbnail?.url || buyNowProduct?.product?.images?.[0]?.url || "/Image-not-found.png"}
                          width={64} height={64}
                          className="object-cover w-full h-full"
                          alt={buyNowProduct?.product?.image?.alt || buyNowProduct?.product?.thumbnail?.alt || buyNowProduct?.product?.images?.[0]?.alt || buyNowProduct?.product?.name || "Product"}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium line-clamp-2">{buyNowProduct?.product?.name || "Product"}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">Qty: {buyNowProduct.quantity}</span>
                          <span className="font-semibold text-sm flex items-center"><IndianRupee size={14} strokeWidth={2.5} />{(buyNowProduct.price * buyNowProduct.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    cartItems?.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                          <Image
                            src={item?.product?.thumbnail?.url || item?.product?.images?.[0]?.url || item?.product?.image?.url || "/Image-not-found.png"}
                            width={64} height={64}
                            className="object-cover w-full h-full"
                            alt={item?.product?.thumbnail?.alt || item?.product?.images?.[0]?.alt || item?.product?.image?.alt || item?.product?.name || "Product"}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-2">{item?.product?.name}</h4>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            <span className="font-semibold text-sm flex items-center"><IndianRupee size={14} strokeWidth={2.5} />{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Coupons */}
                <div className="pt-4 border-t border-dashed">
                  <h4 className="text-sm font-medium mb-3">Coupons & Offers</h4>
                  {selectedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-green-700">{selectedCoupon.coupon?.code}</p>
                        <div className="text-xs text-green-600 flex items-center gap-0.5">Saved <IndianRupee size={12} strokeWidth={2} />{selectedCoupon.discount}</div>
                      </div>
                      <button onClick={() => dispatch(clearSelectedCoupon())} className="text-xs text-red-500 font-medium hover:underline">REMOVE</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-green-600"
                      />
                      <button
                        onClick={async () => {
                          if (!couponCode) return toast.error("Enter a code");
                          // ... (copy existing apply logic if needed, or keeping it concise) ...
                          const itemsToSend = buyNowProduct ? [{
                            productId: buyNowProduct.product?._id || buyNowProduct.product?.id,
                            price: Number(buyNowProduct.price || 0),
                            quantity: Number(buyNowProduct.quantity || 1),
                          }] : cartItems.map((item) => ({
                            productId: item.product?._id || item.product?.id,
                            price: Number(item.price || 0),
                            quantity: Number(item.quantity || 1),
                            actualPrice: item.actualPrice ? Number(item.actualPrice) : undefined
                          }));
                          try {
                            await dispatch(applyCoupon({ code: couponCode, total, cartItems: itemsToSend, paymentMethod })).unwrap();
                            toast.success("Applied!");
                          } catch (e) { toast.error(extractErrorMessage(e)); }
                        }}
                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800"
                      >
                        APPLY
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Total MRP</span>
                    <span className="flex items-center"><IndianRupee size={14} />{cartItems?.length > 0 ? itemsTotal.toFixed(2) : "0.00"}</span>
                  </div>
                  {selectedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span className="flex items-center">-<IndianRupee size={14} />{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-green-600" : ""}>
                      {shipping === 0 ? "FREE" : <div className="flex items-center"><IndianRupee size={14} />{shipping.toFixed(2)}</div>}
                    </span>
                  </div>
                  {gstAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>GST ({settings?.gstCharge}%)</span>
                      <span className="flex items-center"><IndianRupee size={14} />{gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <span>Grand Total</span>
                    <span className="flex items-center"><IndianRupee size={18} />{cartItems?.length > 0 ? total.toFixed(2) : "0.00"}</span>
                  </div>

                  {/* Savings Badge */}
                  {(itemsTotal > total) && (
                    <div className="mt-2 text-center bg-green-100 text-green-800 text-xs font-semibold py-1 rounded">
                      <span className="flex items-center justify-center gap-1">You saved <IndianRupee size={12} strokeWidth={2.5} />{(itemsTotal - total).toFixed(2)} on this order</span>
                    </div>
                  )}
                </div>

                {/* Place Order Button */}
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
                    className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${pinCodeVerified?.success
                      ? "greenTwo hover:opacity-90 shadow-green-200"
                      : "greenTwo hover:opacity-90 shadow-blue-200"
                      }`}
                  >
                    {placingOrder ? (
                      <>
                        <LoadingSpinner />
                        <span>Placing Order...</span>
                      </>
                    ) : pincodeChecking ? (
                      "Checking..."
                    ) : pinCodeVerified?.success ? (
                      <span className="flex items-center justify-center gap-1">PLACE ORDER &bull; <IndianRupee size={18} strokeWidth={3} /> {total.toFixed(2)}</span>
                    ) : (
                      "CHECK PINCODE"
                    )}
                  </button>
                )}
              </div>

              <div className="bg-gray-50 p-3 text-center text-[10px] text-gray-500 border-t">
                <p>100% SECURE PAYMENTS &bull; TRUSTED BY 50L+ USERS</p>
                <div className="flex justify-center gap-2 mt-2 opacity-60 grayscale">
                  <span>VISA</span><span>MasterCard</span><span>UPI</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </React.Suspense>
  );
}
