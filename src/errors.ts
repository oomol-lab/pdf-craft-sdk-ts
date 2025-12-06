export class PDFCraftError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PDFCraftError';
    }
}

export class APIError extends PDFCraftError {
    constructor(message: string) {
        super(message);
        this.name = 'APIError';
    }
}

export class TimeoutError extends PDFCraftError {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}
