import pkg from "../../package.json" with { type: "json" };

export const APP_VERSION: string = process.env.NEXT_PUBLIC_APP_VERSION || pkg.version;
