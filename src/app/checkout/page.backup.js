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
import { usePathname, useRouter } from "next/navigation";
import { fetchProducts } from "@/app/store/slices/productSlice";
import { toast } from "react-toastify";
import { fetchSettings } from "@/app/store/slices/settingSlice";
import axiosInstance from "@/axiosConfig/axiosInstance";
import { LoadingSpinner } from "@/components/common/Loading";
import { useTrack } from "@/app/lib/tracking/useTrack";

export default function CheckoutPage() {
  // Removed checkoutOpen check - this is now a dedicated page
  const { addressData, addressAdded } = useSelector((state) => state.checkout);
  const { products } = useSelector((state) => state.product);
  const [paymentMethod, setPaymentMethod] = useState("prepaid");
  const [userAddresses, setUserAddresses] = useState([]);
  const [addressType, setAddressType] = useState("");
  const [pinCodeVerified, setPinCodeVerified] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const router = useRouter();
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
      toast.error(error.response.data.message);
    }
  };

  const handelPayment = async () => {
    console.log("payment function invoked");
    const check = await checkBeforePayment();
    console.log("check response ", check);
    if (!check.success && check.message !== "Order is valid") {
      toast.error(
        check.message || "Order validation failed. Please try again."
      );
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

              await dispatch(placeOrder(payload));
              // Mark that order was placed to avoid sending abandonment event
              orderPlacedRef.current = true;
              dispatch(clearCart());
              router.push("/order-success");
            } catch (error) {
              //console.error("Error booking slot:", error);
              toast.error("Booking failed. Please contact support.");
              router.push("/");
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

          await dispatch(placeOrder(payload));
          // Mark that order was placed to avoid sending abandonment event
          orderPlacedRef.current = true;
          dispatch(clearCart());
          router.push("/order-success");
        } catch (error) {
          //console.error("Error placing order:", error);
          toast.error("Order placement failed. Please try again.");
          router.push("/");
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

  useEffect(() => {
    if (formData.phone.length === 10) {
      dispatch(sendOtp(formData.phone));
    }
  }, [formData.phone, dispatch]);

  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      dispatch(verifyOtp({ phone: formData.phone, otp: otp.join("") }));
    }
  }, [otp, dispatch, formData.phone]);

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
    : cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

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

  // Redirect if no cart items and no buyNowProduct
  useEffect(() => {
    if (!buyNowProduct && (!cartItems || cartItems.length === 0)) {
      router.push('/');
    }
  }, [buyNowProduct, cartItems, router]);

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="bg-[#f5f6fb] max-w-full mx-auto min-h-screen">
        {/* Header */}
        <div className="px-4 py-3 bg-white sticky top-0 z-50 shadow-sm">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 text-black rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-center text-lg font-semibold">Tea box</h1>
        </div>

        {/* Offer Banner */}
        <div className="bg-green-100 text-black text-center py-1 px-4 text-xs font-medium">
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
                  : (total - (selectedCoupon?.discount || 0)).toFixed(2)}
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
                    <div className="w-4 h-4 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
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
                      <Image
                        src={buyNowProduct?.product?.image.url}
                        alt={buyNowProduct?.product?.image.alt || "Product"}
                        width={56}
                        height={64}
                        className="object-cover h-full w-full"
                      />
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
                      <div className="flex w-fit ml-auto -mt-3 items-center gap-1 font-medium rounded-sm px-1 py-[2px] border-[1.5px] border-blue-600 text-blue-600 text-xs">
                        <Plus className="h-3 w-3" />
                        <h3>3 options</h3>
                      </div>
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
                          <Image
                            src={
                              item?.product?.image?.url ||
                              item?.product?.image?.[0]?.url
                            }
                            alt={
                              item?.product?.image?.alt ||
                              item?.product?.image?.[0]?.alt ||
                              "Product"
                            }
                            width={56}
                            height={64}
                            className="object-cover h-full w-full"
                          />
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
                          <div className="flex w-fit ml-auto -mt-3 items-center gap-1 font-medium rounded-sm px-1 py-[2px] border-[1.5px] border-blue-600 text-blue-600 text-xs">
                            <Plus className="h-3 w-3" />
                            <h3>3 options</h3>
                          </div>
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
                    className="w-full mt-4 mb-4 text-sm bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors "
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
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="payment-method-2"
                    name="payment-method"
                    value="method2"
                    checked={paymentMethod === "prepaid"}
                    onChange={() => setPaymentMethod("prepaid")}
                    className="checked:greenOne h-4 w-4"
                  />
                  <label htmlFor="payment-method-2">Prepaid</label>
                </div>
                {/* Only show COD if not disabled for any cart category */}
                {!isCODDisabledForCart && (
                  <div
                    className={`flex items-center gap-2 ${cartItems.reduce(
                      (acc, item) => acc + item.price * item.quantity,
                      0
                    ) > settings?.codLimit && "opacity-50 cursor-not-allowed"
                      }`}
                  >
                    <input
                      type="radio"
                      id="payment-method-1"
                      name="payment-method"
                      value="method1"
                      disabled={
                        cartItems.reduce(
                          (acc, item) => acc + item.price * item.quantity,
                          0
                        ) > settings?.codLimit
                      }
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className={`checked:greenOne h-4 w-4 `}
                    />
                    <label htmlFor="payment-method-1">Cash on delivery</label>
                  </div>
                )}
                {/* Show message if COD is disabled for category */}
                {isCODDisabledForCart && (
                  <h2 className="text-red-500 text-xs">
                    Cash on delivery is not available for one or more items in your cart.
                  </h2>
                )}
                {!isCODDisabledForCart &&
                  cartItems.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                  ) > settings?.codLimit && (
                    <h2 className="text-red-500 text-xs">
                      COD not available for orders above ₹{settings.codLimit}
                    </h2>
                  )}
              </div>
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
                    <h2 className="font-semibold">-₹{couponDiscount}</h2>
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
              onClick={pinCodeVerified?.success ? handelPayment : checkPincode}
              className={`w-full mt-4  text-sm ${pinCodeVerified?.success
                ? "bg-blue-600 hover:bg-blue-700"
                : " greenOne hover:bg-green-700"
                } text-white py-3 rounded-md  transition-colors`}
            >
              {pincodeChecking
                ? "Checking..."
                : pinCodeVerified?.success
                  ? `  Place Order (₹${total?.toFixed(2)})`
                  : "Check Pincode"}
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
          className={`px-8 pb-4 ${!isAuthenticated && "mt-[32vh]"
            } text-xs flex justify-between mb-4 text-gray-500 text-center`}
        >
          T&C | Privacy Policy | IGAZC5
          <br />
          <span className="text-gray-400">Powered by Shiprocket</span>
        </div>
      </div>
    </div>
  );
}
