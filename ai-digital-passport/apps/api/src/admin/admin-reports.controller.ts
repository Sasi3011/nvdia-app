import { Controller, Get, Query } from "@nestjs/common";
import { UserRole } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { Roles } from "../common/auth/roles.decorator";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { AdminReportsService } from "./admin-reports.service";

const ReportQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
  department: z.string().trim().min(1).max(100).optional(),
});

// Reports & Analytics (Page 29) — view-only, nothing is exported or downloaded.
@Controller("admin/reports")
@Roles(UserRole.ADMIN)
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  @Get("summary")
  summary(@Query(new ZodValidationPipe(ReportQuerySchema)) query: z.infer<typeof ReportQuerySchema>) {
    return this.reports.summary(query.range, query.department);
  }
}
