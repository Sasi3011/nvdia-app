import { Controller, Get, Param, Query } from "@nestjs/common";
import { UserRole } from "@ai-digital-passport/shared-types";
import { z } from "zod";
import { Roles } from "../common/auth/roles.decorator";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { StudentProgressService } from "./student-progress.service";

const ListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  year: z.coerce.number().int().optional(),
  level: z.coerce.number().int().min(1).max(6).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Student Progress: read-only view of each student's whole record for mentors and admins.
@Controller("staff/students")
@Roles(UserRole.MENTOR, UserRole.ADMIN)
export class StudentProgressController {
  constructor(private readonly service: StudentProgressService) {}

  @Get()
  list(@Query(new ZodValidationPipe(ListQuerySchema)) query: z.infer<typeof ListQuerySchema>) {
    return this.service.list(query);
  }

  @Get(":userId/progress")
  progress(@Param("userId") userId: string) {
    return this.service.progress(userId);
  }
}
