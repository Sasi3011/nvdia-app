import { Module } from "@nestjs/common";
import { UsersController, UsersListController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController, UsersListController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
