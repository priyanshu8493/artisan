import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Artisan Market collects, uses and protects your personal data (GDPR & CCPA compliant).",
};

export default function PrivacyPage() {
  return (
    <article className="container-page max-w-3xl py-14">
      <h1 className="text-display-lg font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">Last updated: August 2026</p>

      <div className="rich-text mt-8 text-[15px]">
        <h2>What we collect</h2>
        <p>
          Account details you give us (name, email, addresses), order history, reviews you publish,
          and technical data such as device type and region for security and analytics.
        </p>

        <h2>How we use it</h2>
        <p>
          To fulfil orders, provide support, prevent fraud, improve the marketplace, and — only with
          your consent — send marketing emails. We never sell your personal data.
        </p>

        <h2>Your rights (GDPR / UK GDPR)</h2>
        <p>
          You may access, correct, export or erase your data at any time via account settings or by
          contacting privacy@artisanmarket.example. UK users have statutory rights to object and
          withdraw consent without affecting prior lawful processing.
        </p>

        <h2>Your rights (CCPA)</h2>
        <p>
          California residents may request disclosure of collected categories of personal information
          and deletion, without discrimination in price or service.
        </p>

        <h2>Cookies</h2>
        <p>
          Essential cookies keep you signed in and remember your currency/region. Analytics cookies are
          optional and can be declined. Your theme preference is stored locally on your device only.
        </p>

        <h2>Retention &amp; security</h2>
        <p>
          Data is encrypted in transit (TLS) and passwords are hashed. Records are retained only as long
          as needed for legal, tax and warranty purposes.
        </p>
      </div>
    </article>
  );
}
