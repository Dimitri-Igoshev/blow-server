import { PartialType } from '@nestjs/mapped-types';
import { CreateActivitySchedulerDto } from './create-activity-scheduler.dto';

export class UpdateActivitySchedulerDto extends PartialType(CreateActivitySchedulerDto) {}
