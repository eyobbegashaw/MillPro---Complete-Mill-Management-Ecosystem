import React, { useState } from 'react';
import { Chrome, Github, Loader2 } from 'lucide-react';

const OAuthButtons = ({ onError, onSuccess }) => {
  const [loading, setLoading] = useState(null);
  const [providers, setProviders] = useState([]);

  React.useEffect(() => {
    fetchOAuthProviders();
  }, []);

  const fetchOAuthProviders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/oauth/providers`);
      const data = await response.json();
      setProviders(data.providers);
    } catch (error) {
      console.error('Failed to fetch OAuth providers:', error);
    }
  };

  const handleOAuthLogin = (provider) => {
    setLoading(provider.name);
    // Redirect to OAuth provider
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider.name}/login`;
  };

  const getProviderIcon = (providerName) => {
    switch (providerName) {
      case 'google':
        return <Chrome className="h-5 w-5" />;
      case 'github':
        return <Github className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => (
          <button
            key={provider.name}
            onClick={() => handleOAuthLogin(provider)}
            disabled={loading === provider.name}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: provider.color }}
          >
            {loading === provider.name ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              getProviderIcon(provider.name)
            )}
            <span className="text-sm font-medium text-gray-700">
              {provider.display_name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OAuthButtons;