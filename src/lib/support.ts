/** Public support / feedback / optional giving — edit wallet details here. */

export type SupportWallet = {
  accountName: string;
  gcashNumber: string;
  gotymeNumber: string;
  /** Optional QR paths — Leave files out if you only want numbers. */
  gcashQrSrc: string;
  gotymeQrSrc: string;
};

function trimEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isPlaceholder(value: string): boolean {
  return /X{3,}|Your Name|09X{3,}/i.test(value) || !value.trim();
}

/** Google Form (or similar). Empty = feedback CTA hidden / “coming soon”. */
export function getFeedbackFormUrl(): string {
  const raw = trimEnv(import.meta.env.PUBLIC_FEEDBACK_FORM_URL as string | undefined);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.href;
  } catch {
    return "";
  }
}

export function hasFeedbackForm(): boolean {
  return getFeedbackFormUrl().length > 0;
}

/**
 * Public wallet details for Give / Support.
 * Numbers only are enough — QR images are optional.
 */
export const SUPPORT_WALLET: SupportWallet = {
  accountName: "Arjune Abayabay",
  gcashNumber: "09668873328",
  gotymeNumber: "018587187647",
  gcashQrSrc: "/images/support/gcash-qr.png",
  gotymeQrSrc: "/images/support/gotyme-qr.png",
};

/** True when at least one real wallet number + account name are set. */
export function hasWalletNumbers(): boolean {
  const { gcashNumber, gotymeNumber, accountName } = SUPPORT_WALLET;
  if (isPlaceholder(accountName)) return false;
  const gcashOk = !isPlaceholder(gcashNumber);
  const gotymeOk = !isPlaceholder(gotymeNumber);
  return gcashOk || gotymeOk;
}

export function getGiveMethods(): Array<{ id: "gcash" | "gotyme"; label: string; number: string }> {
  const methods: Array<{ id: "gcash" | "gotyme"; label: string; number: string }> = [];
  if (!isPlaceholder(SUPPORT_WALLET.gcashNumber)) {
    methods.push({ id: "gcash", label: "GCash", number: SUPPORT_WALLET.gcashNumber });
  }
  if (!isPlaceholder(SUPPORT_WALLET.gotymeNumber)) {
    methods.push({ id: "gotyme", label: "GoTyme", number: SUPPORT_WALLET.gotymeNumber });
  }
  return methods;
}
