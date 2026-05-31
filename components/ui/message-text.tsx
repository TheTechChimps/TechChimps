const urlPattern = /(https?:\/\/[^\s]+)/g;

export function MessageText({ body }: { body: string }) {
  return (
    <p>
      {body.split(urlPattern).map((part, index) =>
        part.startsWith("http://") || part.startsWith("https://") ? (
          <a className="message-link" href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
            {part.includes("checkout.stripe.com") ? "Open secure payment link" : "Open link"}
          </a>
        ) : (
          part
        )
      )}
    </p>
  );
}
