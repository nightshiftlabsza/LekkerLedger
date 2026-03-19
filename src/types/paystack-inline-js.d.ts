declare module "@paystack/inline-js" {
    export default class PaystackPop {
        resumeTransaction(accessCode: string, callbacks: {
            key?: string;
            onSuccess?: (transaction: { reference?: string }) => void;
            onCancel?: () => void;
            onError?: (error: { message?: string }) => void;
        }): unknown;
    }
}
