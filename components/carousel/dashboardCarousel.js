import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const banners = [
  {
    image: "/banners/banner-discount.png",
    link: "/data", // Link to data page
    alt: "Buy Affordable Data Plans",
  },
  
];

export default function BillzPaddiCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const startInterval = () => {
    intervalRef.current = setInterval(goToNext, 3000);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
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
                />
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              stopInterval();
              startInterval();
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
