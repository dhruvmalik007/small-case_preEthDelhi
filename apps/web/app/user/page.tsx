import { UserProfile } from "@clerk/nextjs";

export default function UserPage() {
  return (
    <section className="container py-10">
      <UserProfile
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary",
          },
        }}
      />
    </section>
  );
}
