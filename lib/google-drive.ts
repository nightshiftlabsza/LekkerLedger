// lib/google-drive.ts
import { getEmployees, getAllPayslips, getAllLeaveRecords, getSettings, saveEmployee, savePayslip, saveLeaveRecord, saveSettings } from "./storage";

export const GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.appdata";
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
            if (json.employees) {
                for (const emp of json.employees) await saveEmployee(emp);
            }
            if (json.payslips) {
                for (const slip of json.payslips) await savePayslip(slip);
            }
            if (json.leave) {
                for (const l of json.leave) await saveLeaveRecord(l);
            }
            if (json.settings) {
                await saveSettings(json.settings);
            }
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to sync from Drive", e);
        return false;
    }
}
