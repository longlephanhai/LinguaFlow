import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoController } from './video.controller.js';
import { VideoService } from './video.service.js';
import {
  VideoTranscript,
  VideoTranscriptSchema,
} from './schemas/video-transcript.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideoTranscript.name, schema: VideoTranscriptSchema },
    ]),
  ],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
