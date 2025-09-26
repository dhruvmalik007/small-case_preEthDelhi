// "use client";

// import { PrivyProvider } from "@privy-io/react-auth";
// import React from "react";

// export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
//   const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string | undefined;
//   if (!appId) {
//     // Render children without Privy to avoid runtime crash if not configured
//     return <>{children}</>;
//   }
//   return (
//     <PrivyProvider
//       appId={appId}
//       config={{
//         loginMethods: ["wallet"],
//         appearance: {
//           theme: "light",
//         },
//         // Disable email/social; only wallets are allowed
//         embeddedWallets: { createOnLogin: "users-choice" },
//       }}
//     >
//       {children}
//     </PrivyProvider>
//   );
// }
