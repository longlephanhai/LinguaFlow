import { Controller } from '@nestjs/common';
import { ReviewService } from './review.service';

// TODO: Implement GET /review/due, POST /review/result
// See docs/API-CONTRACTS.md for full contract
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}
}
