import { SignUp } from "@clerk/nextjs";

export default function Page({
  params,
}: {
  params: { ["sign-up"]?: string[] };
}) {
  const seg = params?.["sign-up"]?.[0];
  const isInvestor = seg === "investor";
  const isPublisher = seg === "publisher";
  const afterUrl = isPublisher
    ? "/onboarding/publisher"
    : isInvestor
      ? "/investor"
      : "/user";

  return (
    <section className="container flex min-h-[70vh] items-center justify-center py-10">
      <SignUp
        appearance={{ elements: { formButtonPrimary: "bg-primary" } }}
        afterSignInUrl={afterUrl}
        afterSignUpUrl={afterUrl}
        routing="path"
        path={isPublisher ? "/sign-up/publisher" : isInvestor ? "/sign-up/investor" : "/sign-up"}
        signInUrl={isPublisher ? "/sign-in/publisher" : isInvestor ? "/sign-in/investor" : "/sign-in"}
      />
    </section>
  );
}
