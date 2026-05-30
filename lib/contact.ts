const fallbackContactEmail = "techchimps@proton.me";

export function getContactEmail() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.EMAIL_FROM || fallbackContactEmail;
  return email.endsWith(".example") ? fallbackContactEmail : email;
}
