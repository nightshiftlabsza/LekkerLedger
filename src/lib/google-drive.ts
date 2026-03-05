// lib/google-drive.ts
import { getEmployees, getAllPayslips, getAllLeaveRecords, getSettings } from "./storage";

export const MINIMAL_SCOPES = "openid email profile";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
export const GOOGLE_SCOPES = `${MINIMAL_SCOPES} ${DRIVE_SCOPE}`;
const FILE_NAME = "lekkerledger_data.json";

export async function syncDataToDrive(accessToken: string) {
    try {
        const [employees, payslips, leave, settings] = await Promise.all([
            getEmployees(),
            getAllPayslips(),
            getAllLeaveRecords(),
            getSettings()
        ]);

        const dataStr = JSON.stringify({
            version: 1,
            timestamp: new Date().toISOString(),
            employees,
            payslips,
            leave,
            settings
        });

        const mRes = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const mData = await mRes.json();
        const fileId = mData.files?.[0]?.id;

        const metadata = {
            name: FILE_NAME,
            parents: ["appDataFolder"]
        };

        const form = new FormData();

        if (fileId) {
            form.append("metadata", new Blob([JSON.stringify({ name: FILE_NAME })], { type: "application/json" }));
            form.append("file", new Blob([dataStr], { type: "application/json" }));
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: form
            });
        } else {
            form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
            form.append("file", new Blob([dataStr], { type: "application/json" }));
            await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: form
            });
        }
        return true;
    } catch (e) {
        console.error("Failed to sync to Drive", e);
        return false;
    }
}

export async function syncDataFromDrive(accessToken: string) {
    try {
        const mRes = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const mData = await mRes.json();
        const fileId = mData.files?.[0]?.id;

        if (!fileId) return false;

        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const json = await res.json();

        if (json && json.version >= 1) {
            const { importData } = await import("./storage");
            await importData(JSON.stringify(json));
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to sync from Drive", e);
        return false;
    }
}
export async function deleteDataFromDrive(accessToken: string) {
    try {
        const mRes = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const mData = await mRes.json();
        const fileId = mData.files?.[0]?.id;

        if (!fileId) return true; // Already deleted or doesn't exist

        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return res.ok;
    } catch (e) {
        console.error("Failed to delete from Drive", e);
        return false;
    }
}
