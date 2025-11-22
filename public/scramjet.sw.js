/// <reference lib="webworker" />
import { ScramjetController } from "https://cdn.jsdelivr.net/gh/MercuryWorkshop/scramjet@latest/mod.ts";

const controller = new ScramjetController({ prefix: "/~/" });

self.addEventListener("fetch", (event) => {
	event.respondWith(controller.fetch(event));
});
