import { exportData, importData, getSettings, saveSettings, hasMeaningfulLocalData } from "./storage";

export const MINIMAL_SCOPES = "openid email profile";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
export const GOOGLE_SCOPES = `${MINIMAL_SCOPES} ${DRIVE_SCOPE}`;

const BACKUP_FILE_NAME = "lekkerledger_data.json";

interface GoogleDriveFile {
    id: string;
    name?: string;
    modifiedTime?: string;
}

interface GoogleDriveListResponse {
    files?: GoogleDriveFile[];
}

interface GoogleDriveCreateResponse {
    id?: string;
}

export interface BackupMetadata {
    exists: boolean;
    fileId?: string;
    modifiedTime?: string;
    name?: string;
}

export type SmartSyncRecommendation = "BACKUP" | "RESTORE" | "UP_TO_DATE" | "CONFLICT" | "UNKNOWN";

function authorizedHeaders(accessToken: string): HeadersInit {
    return { Authorization: `Bearer ${accessToken}` };
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILE_NAME}'&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
            { headers: authorizedHeaders(accessToken) },
        );

        if (!response.ok) return null;
        const data = await response.json() as GoogleDriveListResponse;
        
        // Return most recent if multiple exist (Issue 72)
        return data.files?.[0]?.id ?? null;
    } catch (error) {
        console.error("Failed to find backup file on Drive", error);
        return null;
    }
}

export async function getBackupMetadata(accessToken: string): Promise<BackupMetadata> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILE_NAME}'&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
            { headers: authorizedHeaders(accessToken) },
        );

        if (!response.ok) return { exists: false };
        const data = await response.json() as GoogleDriveListResponse;
        const file = data.files?.[0];

        if (!file) return { exists: false };

        return {
            exists: true,
            fileId: file.id,
            modifiedTime: file.modifiedTime,
            name: file.name,
        };
    } catch (error) {
        console.error("Failed to fetch backup metadata from Drive", error);
        return { exists: false };
    }
}

async function uploadMultipartFile(
    accessToken: string,
    options: {
        metadata: Record<string, unknown>;
        body: Blob;
        fileId?: string | null;
    },
): Promise<string | null> {
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(options.metadata)], { type: "application/json" }));
    form.append("file", options.body);

    const response = await fetch(
        options.fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${options.fileId}?uploadType=multipart&fields=id,modifiedTime`
            : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime",
        {
            method: options.fileId ? "PATCH" : "POST",
            headers: authorizedHeaders(accessToken),
            body: form,
        },
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Google Drive upload failed.");
    }

    const data = await response.json() as { id: string; modifiedTime?: string };
    
    // If modifiedTime isn't in response, we might need to fetch it (Issue 170)
    if (!data.modifiedTime) {
        const meta = await getBackupMetadata(accessToken);
        return meta.fileId || data.id;
    }

    // Store the modification time locally so we know we are in sync (Issue 171)
    try {
        const settings = await getSettings();
        await saveSettings({
            ...settings,
            lastBackupTimestamp: data.modifiedTime
        });
    } catch (e) {
        console.warn("Failed to update lastBackupTimestamp after upload", e);
    }

    return data.id ?? null;
}

export async function syncDataToDrive(accessToken: string, options?: { generatedRecordsSince?: Date | null }) {
    try {
        const dataStr = await exportData(options);
        const fileId = await findBackupFileId(accessToken);
        const metadata = fileId
            ? { name: BACKUP_FILE_NAME }
            : { name: BACKUP_FILE_NAME, parents: ["appDataFolder"] };

        await uploadMultipartFile(accessToken, {
            metadata,
            body: new Blob([dataStr], { type: "application/json" }),
            fileId,
        });
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        console.error("Failed to sync to Drive:", message);
        return { success: false, error: message };
    }
}

export async function syncDataFromDrive(accessToken: string) {
    try {
        const remoteMeta = await getBackupMetadata(accessToken);
        if (!remoteMeta.exists || !remoteMeta.fileId) {
            return { success: false, error: "No backup file found on Google Drive." };
        }

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${remoteMeta.fileId}?alt=media`, {
            headers: authorizedHeaders(accessToken),
        });

        if (!response.ok) {
             const errorText = await response.text();
             return { success: false, error: `Failed to download backup: ${errorText || response.statusText}` };
        }

        const json = await response.text();
        const result = await importData(json);

        if (result.success && remoteMeta.modifiedTime) {
            // Ensure local timestamp reflects the remote file we just restored (Issue 172)
            try {
                const settings = await getSettings();
                await saveSettings({
                    ...settings,
                    lastBackupTimestamp: remoteMeta.modifiedTime
                });
            } catch (e) {
                console.warn("Failed to update lastBackupTimestamp after restore", e);
            }
        }

        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        console.error("Failed to sync from Drive:", message);
        return { success: false, error: message };
    }
}

export async function performSmartSyncCheck(accessToken: string): Promise<{
    recommendation: SmartSyncRecommendation;
    remoteMetadata?: BackupMetadata;
    localMetadata?: { lastBackupTimestamp?: string };
}> {
    const [remoteMetadata, settings, hasData] = await Promise.all([
        getBackupMetadata(accessToken),
        getSettings(),
        hasMeaningfulLocalData(),
    ]);

    const localTimestamp = settings.lastBackupTimestamp;
    const remoteTimestamp = remoteMetadata.modifiedTime;

    if (!remoteMetadata.exists) {
        // No remote backup. If we have local data, we should backup.
        return { 
            recommendation: hasData ? "BACKUP" : "UP_TO_DATE", 
            remoteMetadata,
            localMetadata: { lastBackupTimestamp: localTimestamp }
        };
    }

    if (!localTimestamp) {
        // Remote exists, but this device has never completed a sync.
        // Remote is authoritative — always restore, regardless of local data.
        // Local data without a backup timestamp is orphaned (e.g. stale free-plan
        // session data) and should not block the restore.
        return {
            recommendation: "RESTORE",
            remoteMetadata,
            localMetadata: { lastBackupTimestamp: localTimestamp }
        };
    }

    const localDate = new Date(localTimestamp);
    const remoteDate = new Date(remoteTimestamp!);

    // Threshold for comparison (Google Drive modifiedTime might have slight delays or precision differences)
    const DIFF_THRESHOLD_MS = 2000; 

    if (remoteDate.getTime() > localDate.getTime() + DIFF_THRESHOLD_MS) {
        return { 
            recommendation: "RESTORE", 
            remoteMetadata,
            localMetadata: { lastBackupTimestamp: localTimestamp }
        };
    }

    // Since we don't track a local "lastModified" for the whole DB, 
    // we can't easily tell if local is newer than localTimestamp without checking all stores.
    // For now, if remote is not newer, we assume we are up to date or might need a backup 
    // if the user just made changes (which auto-backup handles via timer).
    
    return { 
        recommendation: "UP_TO_DATE",
        remoteMetadata,
        localMetadata: { lastBackupTimestamp: localTimestamp }
    };
}

export async function deleteDriveFile(accessToken: string, fileId: string) {
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "DELETE",
            headers: authorizedHeaders(accessToken),
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to delete Google Drive file", error);
        return false;
    }
}

export async function deleteDataFromDrive(accessToken: string) {
    try {
        const fileId = await findBackupFileId(accessToken);
        if (!fileId) return true;
        return deleteDriveFile(accessToken, fileId);
    } catch (error) {
        console.error("Failed to delete from Drive", error);
        return false;
    }
}

function sanitizeIdentifier(input: string): string {
    return input.replace(/[^a-z0-9.]/gi, "_");
}

export async function uploadVaultFileToDrive(
    accessToken: string,
    file: Blob,
    options: {
        documentId: string;
        fileName: string;
        mimeType?: string;
    },
): Promise<string | null> {
    try {
        const safeName = sanitizeIdentifier(options.fileName);
        return await uploadMultipartFile(accessToken, {
            metadata: {
                name: `vault-${options.documentId}-${safeName}`,
                parents: ["appDataFolder"],
                appProperties: {
                    source: "lekkerledger-vault",
                    documentId: options.documentId,
                },
            },
            body: new Blob([file], { type: options.mimeType || file.type || "application/octet-stream" }),
        });
    } catch (error) {
        console.error("Failed to upload vault file to Drive", error);
        return null;
    }
}

export async function downloadVaultFileFromDrive(accessToken: string, fileId: string): Promise<Blob | null> {
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: authorizedHeaders(accessToken),
        });
        if (!response.ok) return null;
        return await response.blob();
    } catch (error) {
        console.error("Failed to download vault file from Drive", error);
        return null;
    }
}
