import { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const message = first
        ? first.path.length > 0
          ? `${first.path.join(".")}: ${first.message}`
          : first.message
        : "Dados inválidos";
      return res.status(400).json({
        message,
        errors: Object.fromEntries(
          Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, (v as string[])?.[0]]),
        ),
      });
    }
    req.body = result.data;
    next();
  };
}
