// Ambient declarations for CSS side-effect and CSS-module imports.
// `global.css` is the Tailwind/NativeWind entry; `.module.css` files are used
// by the template's web-only components. Metro/NativeWind handle these at build
// time — TypeScript just needs to know the modules exist.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
