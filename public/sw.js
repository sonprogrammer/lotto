self.addEventListener("push", (event) => {
  let data = {
    title: "로또 알림",
    body: "저장한 번호의 당첨 결과가 있어요.",
    url: "/notifications",
  };
  try {
    data = { ...data, ...(event.data?.json() ?? {}) };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/notifications",
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => "focus" in client);
        return existing
          ? existing.navigate(target).then(() => existing.focus())
          : self.clients.openWindow(target);
      }),
  );
});
