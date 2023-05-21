/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  singleQuote: true,
  bracketSameLine: false,
  printWidth: 160,
  tabWidth: 2,
  singleAttributePerLine: true,
  useTabs: false,
  trailingComma: "all",
};

module.exports = config;
