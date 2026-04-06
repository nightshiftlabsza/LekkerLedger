# Railway Newsletter Drip Setup

This app does not use Buttondown anymore.

You only need to do 2 things:

1. Add `NEWSLETTER_DRIP_SECRET` in Railway
2. Set up one daily `POST` request to `/api/newsletter/drip`

## Step 1: Railway

1. Open Railway.
2. Open the `LekkerLedger` project.
3. Open the live service.
4. Go to `Variables`.
5. Delete these variables if they still exist:
   - `BUTTONDOWN_API_KEY`
   - `BUTTONDOWN_TAG`
6. Add a new variable:
   - Name: `NEWSLETTER_DRIP_SECRET`
   - Value: any long random secret
   - Example: `nld_9mK4xP2rT7vQ8sW1cY6hN3bL5zF0dJ`
7. Save and deploy.

## Step 2: cron-job.org

1. Go to [cron-job.org](https://cron-job.org).
2. Create a cron job.
3. Use these exact values:
   - Title: `LekkerLedger Newsletter Drip`
   - URL: `https://lekkerledger.co.za/api/newsletter/drip`
   - Method: `POST`
   - Time: `08:00` every day
4. Add this header:
   - Name: `Authorization`
   - Value: `Bearer YOUR_SECRET_HERE`
5. Replace `YOUR_SECRET_HERE` with the exact same secret you added in Railway.
6. Save the cron job.

## What Success Looks Like

The route only works when all 3 are true:

- The request is `POST`
- The request header is `Authorization: Bearer <same secret>`
- Railway has `NEWSLETTER_DRIP_SECRET` set

## Quick Test

After setup, run one manual request from cron-job.org.

- If it works, the endpoint returns JSON
- If it fails with `401 Not authorized`, the secret does not match

## Related Files

- [Newsletter drip route](../src/app/api/newsletter/drip/route.ts)
- [Environment example](../.env.example)
