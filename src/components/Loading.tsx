import { useEffect, useState } from "react";

const Loading = () => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 30;
      });
    }, 200);

    // Complete the bar after 1.5 seconds
    const completeTimeout = setTimeout(() => {
      setProgress(100);
    }, 1500);

    // Hide loading screen after 2.5-3 seconds
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 2800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated logo/spinner */}
        <div className="flex justify-center items-center">
          <div className="relative w-24 h-24">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 border-r-purple-400 animate-spin"></div>
            {/* Middle spinning ring with delay */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-400 border-l-blue-400 animate-spin animation-delay-150 opacity-60"></div>
            {/* Inner static circle */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
              <span className="text-white text-lg font-bold">GS</span>
            </div>
          </div>
        </div>

        {/* Loading text with fade animation */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2 animate-fade-in-out">
            Loading
          </h2>
          <p className="text-gray-400 text-sm tracking-widest animate-pulse">
            Please wait while we prepare everything
          </p>
        </div>

        {/* Progress bar container */}
        <div className="w-64 space-y-3">
          {/* Main progress bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden shadow-lg">
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300 ease-out shadow-lg shadow-blue-500/50"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {/* Progress percentage */}
          <div className="text-center text-gray-400 text-sm font-medium">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 justify-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fade-in-out {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-150 { animation-delay: 150ms; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in-out { animation: fade-in-out 2s ease-in-out infinite; }
      ` }} />
    </div>
  );
};

export default Loading;
