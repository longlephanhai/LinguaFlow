import { Controller } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

// TODO: Implement GET /dashboard/stats
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
}
