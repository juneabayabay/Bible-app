/** Public support / feedback / optional giving — edit wallet details here. */

export type SupportWallet = {
  accountName: string;
  gcashNumber: string;
  gotymeNumber: string;
  gcashQrSrc: string;
  gotymeQrSrc: string;
};

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Google Form (or similar). Empty = feedback CTA hidden / “coming soon”. */
export function getFeedbackFormUrl(): string {
  return trimEnv(import.meta.env.PUBLIC_FEEDBACK_FORM_URL as string | undefined);
}

export function hasFeedbackForm(): boolean {
  return getFeedbackFormUrl().length > 0;
}

/**
 * Replace placeholders with your real account name and numbers when ready.
 * Numbers are shown publicly so users can send gifts — keep them accurate.
 */
export const SUPPORT_WALLET: SupportWallet = {
  accountName: "Your Name",
  gcashNumber: "09XXXXXXXXX",
  gotymeNumber: "09XXXXXXXXX",
  gcashQrSrc: "/images/support/gcash-qr.png",
  gotymeQrSrc: "/images/support/gotyme-qr.png",
};

export function hasWalletNumbers(): boolean {
  const { gcashNumber, gotymeNumber, accountName } = SUPPORT_WALLET;
  const placeholder = /X{3,}|Your Name/i;
  return (
    Boolean(gcashNumber && gotymeNumber && accountName) &&
    !placeholder.test(accountName) &&
    !placeholder.test(gcashNumber) &&
    !placeholder.test(gotymeNumber)
  );
}
