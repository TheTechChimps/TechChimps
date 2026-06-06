const urlPattern = /(https?:\/\/[^\s]+)/g;

function linkLabel(url: string) {
  if (url.includes("checkout.stripe.com")) return "Open secure payment link";
  if (url.includes("/preview/")) return "Open watermarked preview";
  if (url.includes("/signoff/")) return "Open final acceptance";
  return "Open link";
}

export function MessageText({ body }: { body: string }) {
  return (
    <p>
      {body.split(urlPattern).map((part, index) =>
        part.startsWith("http://") || part.startsWith("https://") ? (
          <a className="message-link" href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
            {linkLabel(part)}
          </a>
        ) : (
          part
        )
      )}
    </p>
  );
}
