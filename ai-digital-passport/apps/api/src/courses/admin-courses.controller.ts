import { Body, Controller, Get, Param, Post, Put, Delete } from "@nestjs/common";
import { CourseStatus, UpsertCourseSchema, UserRole } from "@ai-digital-passport/shared-types";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Roles } from "../common/auth/roles.decorator";
import type { RequestUser } from "../common/auth/types";
import { ZodValidationPipe } from "../common/validation/zod-validation.pipe";
import { CoursesService } from "./courses.service";

// Course Management (Admin page) — BR-13: only Admin or Mentor can
// create/edit/publish a course. GET is open to both so a Mentor can see
// what exists; only the roles above ever reach these routes at all
// (SEC-05, enforced server-side by RolesGuard regardless of frontend UI).
@Controller("admin/courses")
@Roles(UserRole.ADMIN, UserRole.MENTOR)
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list() {
    const courses = await this.coursesService.listAllForAdmin();
    return courses.map((c) => ({
      courseId: c.course_id,
      title: c.title,
      shortDescription: c.short_description,
      category: c.category,
      difficulty: c.difficulty,
      durationHours: c.duration_hours,
      durationWeeks: c.duration_weeks,
      deliveryMode: c.delivery_mode,
      enrollmentType: c.enrollment_type,
      certificateAvailable: c.certificate_available,
      isFeatured: c.is_featured,
      skillsCovered: c.skills_covered,
      provider: c.provider,
      externalUrl: c.external_url,
      pointsValue: c.points_value,
      levelRequirement: c.level_requirement,
      status: c.status,
      createdAt: c.created_at,
    }));
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const c = await this.coursesService.getForAdmin(id);
    return {
      courseId: c.course_id,
      title: c.title,
      description: c.description,
      shortDescription: c.short_description,
      category: c.category,
      difficulty: c.difficulty,
      durationHours: c.duration_hours,
      durationWeeks: c.duration_weeks,
      deliveryMode: c.delivery_mode,
      enrollmentType: c.enrollment_type,
      certificateAvailable: c.certificate_available,
      isFeatured: c.is_featured,
      skillsCovered: c.skills_covered,
      prerequisites: c.prerequisites,
      learningOutcomes: c.learning_outcomes,
      toolsRequired: c.tools_required,
      targetAudience: c.target_audience,
      provider: c.provider,
      externalUrl: c.external_url,
      pointsValue: c.points_value,
      levelRequirement: c.level_requirement,
      status: c.status,
      createdAt: c.created_at,
    };
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpsertCourseSchema)) body: ReturnType<typeof UpsertCourseSchema.parse>,
  ) {
    const course = await this.coursesService.create(user.userId, body);
    return { courseId: course.course_id };
  }

  @Put(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpsertCourseSchema)) body: ReturnType<typeof UpsertCourseSchema.parse>,
  ) {
    await this.coursesService.update(user.userId, id, body);
    return { courseId: id };
  }

  @Delete(":id")
  async deleteCourse(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    await this.coursesService.deleteCourse(user.userId, id);
    return { success: true };
  }

  @Post(":id/publish")
  async publish(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    await this.coursesService.setStatus(user.userId, id, CourseStatus.PUBLISHED);
    return { courseId: id, status: CourseStatus.PUBLISHED };
  }

  @Post(":id/archive")
  async archive(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    await this.coursesService.setStatus(user.userId, id, CourseStatus.ARCHIVED);
    return { courseId: id, status: CourseStatus.ARCHIVED };
  }
}
