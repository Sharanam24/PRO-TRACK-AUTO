import { Request, Response, NextFunction } from 'express';
import {
    validationResult,
    ValidationChain,
    ValidationError,
} from 'express-validator';

/**
 * Runs a list of express-validator chains and returns HTTP 422 if any fail.
 * Also strips any body fields not covered by the schema (manual filtering).
 */
export function validateBody(chains: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Run all validation chains
        for (const chain of chains) {
            await chain.run(req);
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array().map((e: ValidationError) => ({
                    field: e.type === 'field' ? (e as { path: string }).path : 'unknown',
                    message: e.msg,
                })),
                timestamp: new Date().toISOString(),
                path: req.path,
            });
            return;
        }

        // Strip fields not covered by the schema (fields that were validated)
        const allowedFields = new Set(
            chains
                .map((c) => {
                    // express-validator chains expose their field name via builder internals
                    const builder = c as unknown as { builder?: { fields?: string[] } };
                    return builder.builder?.fields ?? [];
                })
                .flat()
        );

        if (allowedFields.size > 0 && req.body && typeof req.body === 'object') {
            for (const key of Object.keys(req.body)) {
                if (!allowedFields.has(key)) {
                    delete req.body[key];
                }
            }
        }

        next();
    };
}
