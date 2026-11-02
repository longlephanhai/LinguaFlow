import { Body, Controller, Post } from '@nestjs/common';
import { GetTranscriptDto } from './dto/get-transcript.dto.js';
import { VideoService } from './video.service.js';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('transcript')
  async getTranscript(@Body() dto: GetTranscriptDto) {
    return this.videoService.getTranscript(dto);
  }
}
