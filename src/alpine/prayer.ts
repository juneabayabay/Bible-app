import type { Alpine } from "alpinejs";
import { VERSIONS } from "../lib/versions";
import { addPrayer, loadPrayers, removePrayer, type PrayerEntry } from "../lib/prayers";
import {
  addWallComment,
  checkWallLive,
  createWallRequest,
  isWallLive,
  listWallRequests,
  removeOwnComment,
  removeOwnRequest,
  toggleReaction,
  type ReactionType,
  type WallComment,
  type WallRequest,
} from "../lib/prayerWall";
import { getDeviceId } from "../lib/deviceId";

/** Register prayer Alpine components (lazy-loaded on home + /prayer). */
export function registerPrayer(Alpine: Alpine) {
  Alpine.data("homePrayerWall", () => ({
    items: [] as WallRequest[],
    loading: true,
    busy: false,
    status: "",
    version: "",

    async boot() {
      try {
        const path = window.location.pathname.replace(/\/+$/, "") || "/";
        const seg = path.split("/").filter(Boolean)[0];
        if (seg && seg in VERSIONS) this.version = seg;
      } catch {
        /* ignore */
      }
      this.loading = true;
      try {
        const all = await listWallRequests();
        this.items = all.slice(0, 3).map((item) => ({
          ...item,
          commentsOpen: false,
        }));
      } catch {
        this.items = [];
        this.status = "Couldn’t load the wall right now.";
      } finally {
        this.loading = false;
      }
    },

    formatDate(iso: string) {
      try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      } catch {
        return "";
      }
    },

    hasReaction(item: WallRequest, type: ReactionType) {
      return item.myReactions.includes(type);
    },

    async react(requestId: string, type: ReactionType) {
      if (this.busy) return;
      this.busy = true;
      this.status = "";
      try {
        const all = await toggleReaction(requestId, type);
        const openMap = new Map(this.items.map((i) => [i.id, Boolean(i.commentsOpen)]));
        this.items = all.slice(0, 3).map((item) => ({
          ...item,
          commentsOpen: openMap.get(item.id) ?? false,
        }));
      } catch {
        this.status = "Couldn’t update that reaction. Try again.";
      } finally {
        this.busy = false;
      }
    },
  }));

  Alpine.data("prayerHub", () => ({
    tab: "wall" as "wall" | "journal",
    wallLive: false,
    wallLiveDetail: "" as string,
    wallItems: [] as WallRequest[],
    wallName: "",
    wallBody: "",
    wallStatus: "" as string,
    wallLoading: false,
    wallBusy: false,
    wallReactBusy: false,
    wallError: "" as string,
    deviceId: "",
    items: [] as PrayerEntry[],
    forWhom: "",
    note: "",
    status: "" as string,
    _statusTimer: null as ReturnType<typeof setTimeout> | null,
    _wallStatusTimer: null as ReturnType<typeof setTimeout> | null,
    _wallPoll: null as ReturnType<typeof setInterval> | null,

    setTab(next: "wall" | "journal") {
      this.tab = next;
      try {
        const url = new URL(window.location.href);
        url.hash = next === "journal" ? "journal" : "wall";
        history.replaceState(null, "", url);
      } catch {
        /* ignore */
      }
    },

    async init() {
      const hash = window.location.hash.replace(/^#/, "").toLowerCase();
      if (hash === "journal") this.tab = "journal";
      else if (hash === "wall") this.tab = "wall";
      // Optimistic: env present → show live until probe says otherwise (avoids flicker).
      this.wallLive = isWallLive();
      this.deviceId = getDeviceId();
      this.items = loadPrayers();
      await this.verifyWall();
      await this.refreshWall();
      this.startWallPoll();
    },

    destroy() {
      if (this._wallPoll) {
        clearInterval(this._wallPoll);
        this._wallPoll = null;
      }
      if (this._statusTimer) clearTimeout(this._statusTimer);
      if (this._wallStatusTimer) clearTimeout(this._wallStatusTimer);
    },

    async verifyWall() {
      const check = await checkWallLive();
      this.wallLive = check.live;
      this.wallLiveDetail = check.detail ?? "";
      if (!check.live && isWallLive()) {
        // Configured in env but DB unreachable — do not pretend it is shared.
        this.wallError =
          check.detail ||
          "Prayer wall couldn’t connect. Please try again in a moment.";
      }
    },

    startWallPoll() {
      if (this._wallPoll) clearInterval(this._wallPoll);
      if (!this.wallLive) return;
      this._wallPoll = setInterval(() => {
        if (this.tab === "wall" && !this.wallBusy && document.visibilityState === "visible") {
          void this.refreshWall(true);
        }
      }, 12_000);
    },

    flash(message: string) {
      this.status = message;
      if (this._statusTimer) clearTimeout(this._statusTimer);
      this._statusTimer = setTimeout(() => {
        this.status = "";
      }, 2200);
    },

    flashWall(message: string) {
      this.wallStatus = message;
      if (this._wallStatusTimer) clearTimeout(this._wallStatusTimer);
      this._wallStatusTimer = setTimeout(() => {
        this.wallStatus = "";
      }, 2200);
    },

    formatDate(iso: string) {
      try {
        return new Date(iso).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        return iso;
      }
    },

    isMine(item: WallRequest) {
      return item.deviceId === this.deviceId;
    },

    isMyComment(comment: WallComment) {
      return Boolean(comment.deviceId) && comment.deviceId === this.deviceId;
    },

    hasReaction(item: WallRequest, type: ReactionType) {
      return item.myReactions.includes(type);
    },

    mergeWallUi(next: WallRequest[]) {
      const prev = new Map(this.wallItems.map((item) => [item.id, item]));
      return next.map((item) => {
        const old = prev.get(item.id);
        return {
          ...item,
          commentsOpen: old?.commentsOpen ?? false,
          commentDraft: old?.commentDraft ?? "",
          commentName: old?.commentName ?? "",
        };
      });
    },

    async refreshWall(quiet = false) {
      if (!quiet) this.wallLoading = true;
      if (!quiet) this.wallError = "";
      try {
        this.wallItems = this.mergeWallUi(await listWallRequests());
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not load the prayer wall.";
        if (!quiet) this.wallItems = [];
      } finally {
        if (!quiet) this.wallLoading = false;
      }
    },

    async submitRequest() {
      if (!this.wallBody.trim() || this.wallBusy) return;
      this.wallBusy = true;
      this.wallError = "";
      try {
        if (!this.wallLive) await this.verifyWall();
        this.wallItems = this.mergeWallUi(
          await createWallRequest(this.wallName, this.wallBody),
        );
        this.wallBody = "";
        this.wallBody = "";
        if (isWallLive()) {
          this.wallLive = true;
          this.wallLiveDetail = "";
          this.startWallPoll();
          this.flashWall("Shared with everyone");
        } else {
          this.flashWall("Saved on this device only");
        }
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not share your request.";
      } finally {
        this.wallBusy = false;
      }
    },

    async react(requestId: string, type: ReactionType) {
      if (this.wallReactBusy) return;
      this.wallReactBusy = true;
      try {
        this.wallItems = this.mergeWallUi(await toggleReaction(requestId, type));
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not save reaction.";
      } finally {
        this.wallReactBusy = false;
      }
    },

    async submitComment(item: WallRequest) {
      const draft = (item.commentDraft ?? "").trim();
      if (!draft) return;
      try {
        const openId = item.id;
        this.wallItems = this.mergeWallUi(
          await addWallComment(item.id, item.commentName ?? "", draft),
        );
        const next = this.wallItems.find((r) => r.id === openId);
        if (next) next.commentsOpen = true;
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not post comment.";
      }
    },

    async removeRequest(id: string) {
      try {
        this.wallItems = this.mergeWallUi(await removeOwnRequest(id));
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not remove request.";
      }
    },

    async removeComment(commentId: string, requestId: string) {
      try {
        this.wallItems = this.mergeWallUi(await removeOwnComment(commentId));
        const next = this.wallItems.find((r) => r.id === requestId);
        if (next) next.commentsOpen = true;
      } catch (err) {
        this.wallError =
          err instanceof Error ? err.message : "Could not remove comment.";
      }
    },

    addJournal() {
      if (!this.forWhom.trim()) return;
      this.items = addPrayer(this.forWhom, this.note);
      this.forWhom = "";
      this.note = "";
      this.flash("Saved");
    },

    removeJournal(id: string) {
      this.items = removePrayer(id);
    },

    exportList() {
      if (!this.items.length) {
        this.flash("Nothing to export");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const lines = this.items.map((item) => {
        const when = this.formatDate(item.createdAt);
        const note = item.note.trim() ? `\n${item.note.trim()}` : "";
        return `${item.forWhom}\n${when}${note}`;
      });
      const blob = new Blob(
        [`Prayer journal · ${stamp}\n\n${lines.join("\n\n---\n\n")}\n`],
        { type: "text/plain;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prayer-journal-${stamp}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      this.flash("Exported");
    },
  }));

}
