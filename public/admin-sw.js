self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      body: event.data ? event.data.text() : "Open the TechChimps admin app.",
      title: "TechChimps admin"
    };
  }

  const title = payload.title || "TechChimps admin";
  const options = {
    badge: payload.badge || "/images/techchimps-logo-square-favicon.png",
    body: payload.body || "Open the admin app for the latest update.",
    data: {
      kind: payload.kind || "system",
      url: payload.url || "/admin"
    },
    icon: payload.icon || "/images/techchimps-logo-square-small.png",
    tag: payload.tag || "techchimps-admin",
    timestamp: payload.timestamp || Date.now(),
    vibrate: [80, 40, 80]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/admin", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && client.url.startsWith(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
