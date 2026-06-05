const fallbackContactEmail = "techchimps@proton.me";
const fallbackContactPhone = {
  display: "07472 457653",
  e164: "+447472457653",
  telHref: "tel:+447472457653",
  whatsappHref: "https://wa.me/447472457653"
};

export function getContactEmail() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.EMAIL_FROM || fallbackContactEmail;
  return email.endsWith(".example") ? fallbackContactEmail : email;
}

export function getContactPhone() {
  return fallbackContactPhone;
}
