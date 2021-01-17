module.exports = {
  "*.{ts,tsx,js,jsx,css,md,json}": ["prettier --write"],
  "{api,lib}/**/*.{ts,tsx,js,jsx}": ["eslint"],
  "*.{ts,tsx}": () => "tsc -p tsconfig.json",
};
