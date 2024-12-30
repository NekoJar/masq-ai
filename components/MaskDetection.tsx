"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

export default function MaskDetection() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [counts, setCounts] = useState({ mask_count: 0, no_mask_count: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const startStream = () => {
    if (imageRef.current) {
      imageRef.current.src = `${process.env.NEXT_PUBLIC_VIDEO_FEED}`;
      setIsStreaming(true);
    }
  };

  const stopStream = () => {
    if (imageRef.current) {
      imageRef.current.src = "";
      setIsStreaming(false);
    }
  };

  // Fetch mask counts periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_MASK_COUNTS}`
          );
          const data = await response.json();
          setCounts(data);
        } catch (error) {
          console.error("Error fetching counts:", error);
        }
      }, 1000); // Update every second
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isStreaming]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <Button
          onClick={isStreaming ? stopStream : startStream}
          className={`px-4 py-2 rounded ${
            isStreaming
              ? "bg-black hover:bg-neutral-800 text-white"
              : "bg-neutral-400 hover:bg-neutral-300 text-white"
          }`}
        >
          {isStreaming ? "Stop Stream" : "Start Stream"}
        </Button>
      </div>

      <div className="relative">
        <img
          ref={imageRef}
          className={`rounded-lg shadow-lg max-w-full h-auto text-white ${
            !isStreaming ? "hidden" : ""
          }`}
          width={640}
          height={480}
          alt="Video stream"
        />
        {!isStreaming && (
          <div className="text-neutral-200 flex justify-center items-center w-[640px] h-[480px] bg-neutral-800 rounded-lg">
            <p>No stream</p>
          </div>
        )}

        {isStreaming && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded">
            <p>Wearing Masks: {counts.mask_count}</p>
            <p>No Masks: {counts.no_mask_count}</p>
          </div>
        )}
      </div>
    </div>
  );
}
