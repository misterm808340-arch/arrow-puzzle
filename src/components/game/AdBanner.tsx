'use client';

export default function AdBanner() {
  return (
    <div className="w-full px-4 py-2">
      <div className="bg-gray-50 rounded-lg py-2 px-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 12h10M12 7v10" />
        </svg>
        AdMob Banner
      </div>
    </div>
  );
}

export function InterstitialAd({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M7 12h10M12 7v10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Ad Interstitial</h3>
          <p className="text-gray-500 text-sm">This is a placeholder for an AdMob interstitial ad</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 rounded-xl text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
        >
          Close Ad
        </button>
      </div>
    </div>
  );
}

export function RewardedAdPlaceholder({ onReward, onClose }: { onReward: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Watch Ad for +1 Life</h3>
          <p className="text-gray-500 text-sm">Watch a short ad to continue playing with 1 life remaining</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 rounded-xl text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
          >
            No Thanks
          </button>
          <button
            onClick={onReward}
            className="flex-1 py-3 rounded-xl text-white font-semibold shadow-md"
            style={{ background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)' }}
          >
            Watch Ad
          </button>
        </div>
      </div>
    </div>
  );
}
