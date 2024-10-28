/** @type {import('next').NextConfig} */
const config = {
    webpack: (config) => {
      if (!config.resolve) {
        config.resolve = {};
      }
      if (!config.resolve.alias) {
        config.resolve.alias = {};
      }
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
      return config;
    },
    // Add any other Next.js config options you need here
  };
  
  export default config;