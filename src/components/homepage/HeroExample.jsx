// Example of how to use the updated LandingBanner component with API data

import React, { useState, useEffect } from 'react';
import LandingBanner from './LandingBanner';

const HeroExample = () => {
  const [heroData, setHeroData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Example API call to fetch hero sections
    const fetchHeroSections = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('/api/sections/grouped');
        const data = await response.json();

        if (data.success && data.data.hero) {
          setHeroData(data.data.hero);
        }
      } catch (error) {
        // console.error('Error fetching hero sections:', error);
        // Fallback to empty array - component will show default content
        setHeroData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroSections();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <div className="text-lg">Loading hero content...</div>
      </div>
    );
  }

  return <LandingBanner heroSections={heroData} autoPlay={true} autoPlayInterval={4000} />;
};

export default HeroExample;

