/// data/sliderData.js

export const ringStyles = [
  {
    id: 1,
    name: "BEZEL",
    image: "/images/home-slide-one/one.webp",
    backgroundPosition: "0% 0%"
  },
  {
    id: 2,
    name: "SOLITAIRE",
    image: "/images/home-slide-one/two.webp",
    backgroundPosition: "33.33% 0%"
  },
  {
    id: 3,
    name: "TRILOGY",
    image: "/images/home-slide-one/three.webp",
    backgroundPosition: "66.66% 0%"
  },
  {
    id: 4,
    name: "HALO",
    image: "/images/home-slide-one/four.webp",
    backgroundPosition: "100% 0%"
  },
  {
    id: 5,
    name: "TOI ET MOI",
    image: "/images/home-slide-one/five.webp"
  }
];


export const ringStylesTwo = [
  {
    id: 1,
    name: "LOUISE",
    image: "/images/home-slide-two/one.webp",
  },
  {
    id: 2,
    name: "FRANCESCA",
    image: "/images/home-slide-two/two.webp",
  },
  {
    id: 3,
    name: "EMMA",
    image: "/images/home-slide-two/three.webp",
  },
  {
    id: 4,
    name: "CANDICE",
    image: "/images/home-slide-two/four.webp",
  },
  {
    id: 5,
    name: "TOI ET MOI",
    image: "/images/home-slide-two/five.webp"
  }
];


// Slider configurations
export const sliderConfigs = {
  ringStyles: {
    title: "Shop Lab Diamond Engagement Rings by Style",
    subtitle: "Discover our signature setting styles, including solitaire, trilogy, halo, toi et moi and bezel.",
    itemsperviewconfig: {
      mobile: 1,
      tablet: 3,
      desktop: 4
    },
    aspectRatio: "aspect-[3/4] md:aspect-[4/5]"
  },
    ringStylesTwo: {
        title: "Featured Engagement Rings",
        subtitle: "Shop from our range of lab diamond, coloured sapphire and moissanite engagement rings.",
        itemsperviewconfig: {
        mobile: 1,
        tablet: 3,
        desktop: 4
        },
        aspectRatio: "aspect-[3/4] md:aspect-[4/5]"
    }
};