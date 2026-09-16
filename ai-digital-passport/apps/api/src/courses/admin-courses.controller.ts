import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { CourseStatus, UpsertCourseSchema, UpsertCourseTaskSchema, UserRole } from "@ai-digital-passport/shared-types";
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
      pointsValue: c.points_value,
      levelRequirement: c.level_requirement,
      status: c.status,
      taskCount: c.tasks.length,
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
      tasks: c.tasks.map(taskDto),
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

  @Post(":id/tasks")
  async createTask(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpsertCourseTaskSchema)) body: ReturnType<typeof UpsertCourseTaskSchema.parse>,
  ) {
    const task = await this.coursesService.createTask(user.userId, id, body);
    return taskDto(task);
  }

  @Put(":id/tasks/:taskId")
  async updateTask(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(UpsertCourseTaskSchema)) body: ReturnType<typeof UpsertCourseTaskSchema.parse>,
  ) {
    const task = await this.coursesService.updateTask(user.userId, id, taskId, body);
    return taskDto(task);
  }
}

function taskDto(t: { task_id: string; title: string; type: string; instructions: string | null; sequence_order: number; is_required: boolean }) {
  return {
    taskId: t.task_id,
    title: t.title,
    type: t.type,
    instructions: t.instructions,
    sequenceOrder: t.sequence_order,
    isRequired: t.is_required,
  };
}
