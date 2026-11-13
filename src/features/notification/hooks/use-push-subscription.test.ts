import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePushSubscription } from "./use-push-subscription";

const fetchMock = vi.fn();
const permissionMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

class NotificationMock {
  static permission = "default";
  static requestPermission = permissionMock;
}

const subscription = {
  endpoint: "https://push.example/device",
  toJSON: () => ({
    endpoint: "https://push.example/device",
    keys: { p256dh: "public", auth: "secret" },
  }),
  unsubscribe: vi.fn().mockResolvedValue(true),
};
const pushManager = { getSubscription: vi.fn(), subscribe: vi.fn() };
const registration = { pushManager };

beforeEach(() => {
  fetchMock.mockReset();
  permissionMock.mockReset();
  pushManager.getSubscription.mockReset().mockResolvedValue(null);
  pushManager.subscribe.mockReset().mockResolvedValue(subscription);
  subscription.unsubscribe.mockReset().mockResolvedValue(true);
  vi.stubGlobal("Notification", NotificationMock);
  Object.defineProperty(window, "PushManager", {
    configurable: true,
    value: class {},
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: vi.fn().mockResolvedValue(registration) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, "PushManager");
  Reflect.deleteProperty(navigator, "serviceWorker");
});

it("requests permission only through enable and registers the resulting device", async () => {
  permissionMock.mockResolvedValue("granted");
  fetchMock
    .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey: "AQID" })))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const { result } = renderHook(() => usePushSubscription());
  expect(permissionMock).not.toHaveBeenCalled();
  await act(async () => expect(await result.current.enable()).toBe(true));
  expect(permissionMock).toHaveBeenCalledOnce();
  expect(pushManager.subscribe).toHaveBeenCalledWith(
    expect.objectContaining({ userVisibleOnly: true }),
  );
  expect(fetchMock).toHaveBeenLastCalledWith(
    "/api/push-subscriptions",
    expect.objectContaining({ method: "POST" }),
  );
});

it("does not create a server subscription when browser permission is denied", async () => {
  permissionMock.mockResolvedValue("denied");
  const { result } = renderHook(() => usePushSubscription());
  await act(async () => expect(await result.current.enable()).toBe(false));
  expect(result.current.error).toContain("권한");
  expect(fetchMock).not.toHaveBeenCalled();
});
