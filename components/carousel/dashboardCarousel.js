import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const banners = [
  
  {
    image: "/banners/banner-funding.png",
    link: "/wallet",
    alt: "Easy Wallet Funding",
  },
];

export default function BillzPaddiCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  // Minimum swipe distance to trigger slide change
  const minSwipeDistance = 50;

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    resetInterval();
  };

  const startInterval = () => {
    intervalRef.current = setInterval(goToNext, 4000);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetInterval = () => {
    stopInterval();
    startInterval();
  };

  // Touch event handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    stopInterval();
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }

    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
    startInterval();
  };

  useEffect(() => {
    startInterval();
    return () => stopInterval();
  }, []);

  return (
    <div
      className="relative overflow-hidden w-full bg-transparent"
      onMouseEnter={stopInterval}
      onMouseLeave={startInterval}
    >
      <div
        ref={carouselRef}
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner, index) => (
          <div key={index} className="min-w-full h-full relative">
            <Link href={banner.link} passHref>
              <span className="block h-full md:w-[30rem] md:mx-auto">
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  width={800}
                  height={800}
                  className="w-full h-32 object-fill cursor-pointer"
                  priority={index === 0} // Only prioritize loading first image
                />
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation dots
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div> */}

    </div>
  );
}
