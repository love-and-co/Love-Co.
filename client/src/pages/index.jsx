import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Check, FlaskConical, Award, Clock } from 'lucide-react';
import HeroSlider from '../components/home/HeroSlider';
import ShopByConcern from '../components/home/ShopByConcern';
import BundlePromoBanner from '../components/home/BundlePromoBanner';
import WhyChooseUsSection from '../components/home/WhyChooseUsSection';
import HomeCustomerReviews from '../components/home/HomeCustomerReviews';
import ForYouCarousel from '../components/home/ForYouCarousel';
import { api } from '../lib/api';
import { mockProducts } from '../data/mockProducts';

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState(mockProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getBestSellers();
        if (res.data.products && res.data.products.length > 0) {
          setBestSellers(res.data.products);
        }
      } catch (err) {
        console.warn('Could not fetch bestsellers from API', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-brand-canvas">
      {/* 1. Narrative Hero Showcase */}
      <HeroSlider />

      {/* 2. Personalized "For You" Carousel */}
      <ForYouCarousel products={bestSellers} loading={loading} />

      {/* 5. Asymmetrical Diagnostic Matrix */}
      <ShopByConcern />

      {/* 6. Custom 2-Step Duo Engine */}
      <BundlePromoBanner />

      {/* 7. Why Choose Us? */}
      <WhyChooseUsSection />

      {/* 8. Concrete Customer Reviews (Mobile/Tablet Carousel + Desktop Grid) */}
      <HomeCustomerReviews />
    </div>
  );
}
