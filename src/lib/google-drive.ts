import { exportData, importData } from "./storage";

export const MINIMAL_SCOPES = "openid email profile";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
export const GOOGLE_SCOPES = `${MINIMAL_SCOPES} ${DRIVE_SCOPE}`;

const BACKUP_FILE_NAME = "lekkerledger_data.json";

interface GoogleDriveFile {
    id: string;
    name?: string;
}

interface GoogleDriveListResponse {
    files?: GoogleDriveFile[];
}

interface GoogleDriveCreateResponse {
    id?: string;
}

function authorizedHeaders(accessToken: string): HeadersInit {
    return { Authorization: `Bearer ${accessToken}` };
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILE_NAME}'&fields=files(id,name)&orderBy=modifiedTime desc`,
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
            ? `https://www.googleapis.com/upload/drive/v3/files/${options.fileId}?uploadType=multipart&fields=id`
            : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
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

    const data = await response.json() as GoogleDriveCreateResponse;
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
        const fileId = await findBackupFileId(accessToken);
        if (!fileId) return { success: false, error: "No backup file found on Google Drive." };

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: authorizedHeaders(accessToken),
        });

        if (!response.ok) {
             const errorText = await response.text();
             return { success: false, error: `Failed to download backup: ${errorText || response.statusText}` };
        }

        const json = await response.text();
        const result = await importData(json);
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        console.error("Failed to sync from Drive:", message);
        return { success: false, error: message };
    }
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
