import { S3Client } from "@aws-sdk/client-s3";
import { getRequiredEnvValue } from "./env";

export const R2_BUCKET_NAME = getRequiredEnvValue("CLOUDFLARE_R2_BUCKET_NAME");

export const r2 = new S3Client({
  region: "auto",
  endpoint: getRequiredEnvValue("CLOUDFLARE_R2_ENDPOINT"),
  credentials: {
    accessKeyId: getRequiredEnvValue("CLOUDFLARE_R2_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnvValue("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
  },
});
