import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

// API Design Rule (spec 04 Section 9): validate all request bodies/query
// params server-side, return stable machine-readable error codes.
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Request failed validation.",
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
