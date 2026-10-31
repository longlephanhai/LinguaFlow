import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetTranscriptDto } from './dto/get-transcript.dto.js';
import { VideoService } from './video.service.js';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('transcript')
  async getTranscript(@Body() dto: GetTranscriptDto) {
    return this.videoService.getTranscript(dto);
  }
}
